/**
 * Phase 6 — React hook for historical digital twin mode.
 * Shared per projectId with Sitemap / Twin.
 */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import type { TwinRecord } from "@/lib/api";
import type { AssetModel } from "@/lib/assetModel";
import {
  conditionMapFromHistorical,
  statusMapFromHistorical,
} from "@/lib/historicalBridge";
import type {
  HistoricalEvent,
  HistoricalPlaybackSpeed,
  HistoricalRangePreset,
} from "@/lib/historyModel";
import {
  acquireHistoryStore,
  releaseHistoryStore,
  type HistoryStoreSnapshot,
} from "@/lib/historyStore";

const EMPTY: HistoryStoreSnapshot = {
  isHistorical: false,
  timestamp: new Date(0).toISOString(),
  isLive: true,
  playing: false,
  speed: 1,
  rangePreset: "today",
  rangeStart: new Date(0).toISOString(),
  rangeEnd: new Date(0).toISOString(),
  timeScale: "day",
  snapshot: null,
  telemetry: null,
  series: [],
  events: [],
  selectedEventId: null,
  label: "SIMULATED HISTORICAL DATA",
  simulated: true,
  ready: false,
  error: null,
};

export function useHistoricalTwin(
  twin: TwinRecord | null,
  model: AssetModel | null,
  enabled = true,
) {
  const projectId = twin?.projectId ?? "";
  const [store, setStore] = useState(() =>
    projectId ? acquireHistoryStore(projectId) : null,
  );

  const modelKey = useMemo(() => {
    if (!model) return "";
    return [
      model.plantId,
      model.counts.inverters,
      model.order.length,
      model.generatedAt,
    ].join("|");
  }, [model]);

  useEffect(() => {
    if (!enabled || !projectId) {
      setStore(null);
      return;
    }
    const next = acquireHistoryStore(projectId);
    setStore(next);
    return () => {
      releaseHistoryStore(projectId);
      setStore((current) => (current === next ? null : current));
    };
  }, [enabled, projectId]);

  useEffect(() => {
    if (!enabled || !store || !twin || !model) return;
    void store.ensure(twin, model);
  }, [enabled, store, twin, model, modelKey]);

  const state = useSyncExternalStore(
    (onStoreChange) => {
      if (!store) return () => undefined;
      return store.subscribe(onStoreChange);
    },
    () => store?.getSnapshot() ?? EMPTY,
    () => EMPTY,
  );

  const controls = useMemo(
    () => ({
      enterHistorical: (at?: string) => store?.enterHistorical(at),
      exitHistorical: () => store?.exitHistorical(),
      seek: (timestamp: string) => store?.seek(timestamp),
      play: () => store?.play(),
      pause: () => store?.pause(),
      step: (deltaMinutes: number) => store?.step(deltaMinutes),
      setSpeed: (speed: HistoricalPlaybackSpeed) => store?.setSpeed(speed),
      setRangePreset: (
        preset: HistoricalRangePreset,
        custom?: { start: string; end: string },
      ) => store?.setRangePreset(preset, custom),
      selectEvent: (eventId: string | null) => store?.selectEvent(eventId),
      jumpToEvent: (event: HistoricalEvent) => store?.jumpToEvent(event),
    }),
    [store],
  );

  const statusByAssetId = useMemo(
    () =>
      state.isHistorical
        ? statusMapFromHistorical(state.snapshot)
        : ({} as Record<string, string>),
    [state.isHistorical, state.snapshot],
  );

  const conditionByAssetId = useMemo(
    () =>
      state.isHistorical
        ? conditionMapFromHistorical(state.snapshot)
        : ({} as Record<string, string>),
    [state.isHistorical, state.snapshot],
  );

  return {
    state,
    controls,
    statusByAssetId,
    conditionByAssetId,
  };
}
