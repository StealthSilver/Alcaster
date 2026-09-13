import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import type { TwinRecord } from "@/lib/api";
import type { AssetModel } from "@/lib/assetModel";
import {
  buildTelemetryContext,
  createTelemetryProvider,
  type SimulationScenario,
  type TelemetryProvider,
  type TelemetrySnapshot,
  type TelemetryStoreSnapshot,
} from "@/lib/telemetry";

const EMPTY: TelemetryStoreSnapshot = {
  byAssetId: {},
  plant: {
    currentPowerKw: 0,
    energyTodayKwh: 0,
    availabilityPct: 100,
    efficiencyPct: 0,
    irradianceWm2: 0,
    ambientTempC: 0,
    windSpeedMs: 0,
    gridConnected: true,
    gridVoltageKv: 33,
    gridFrequencyHz: 50,
    activeAlarmCount: 0,
    health: "HEALTHY",
    timestamp: new Date(0).toISOString(),
  },
  alarms: [],
  statusCounts: {
    running: 0,
    idle: 0,
    warning: 0,
    fault: 0,
    offline: 0,
    unknown: 0,
    starting: 0,
    stopping: 0,
  },
  inverterCounts: {
    running: 0,
    idle: 0,
    warning: 0,
    fault: 0,
    offline: 0,
    unknown: 0,
    starting: 0,
    stopping: 0,
  },
  blockCounts: {
    running: 0,
    idle: 0,
    warning: 0,
    fault: 0,
    offline: 0,
    unknown: 0,
    starting: 0,
    stopping: 0,
  },
  connection: "disconnected",
  scenario: "normal",
  paused: false,
  lastUpdated: null,
  providerId: "mock",
  error: null,
};

/** One provider per project so Digital Twin + Sitemap share identical live state. */
const providers = new Map<
  string,
  { provider: TelemetryProvider; refs: number; modelKey: string }
>();

function acquireProvider(projectId: string): TelemetryProvider {
  const existing = providers.get(projectId);
  if (existing) {
    existing.refs += 1;
    return existing.provider;
  }
  const provider = createTelemetryProvider();
  providers.set(projectId, { provider, refs: 1, modelKey: "" });
  return provider;
}

function releaseProvider(projectId: string) {
  const existing = providers.get(projectId);
  if (!existing) return;
  existing.refs -= 1;
  if (existing.refs <= 0) {
    void existing.provider.disconnect();
    providers.delete(projectId);
  }
}

/**
 * Connects views to a shared telemetry provider/store for the project.
 * Rebinds when the asset model identity (plant config) changes.
 */
export function useLiveTelemetry(
  twin: TwinRecord | null,
  model: AssetModel | null,
  enabled = true,
) {
  const projectId = twin?.projectId ?? "";
  const [provider, setProvider] = useState<TelemetryProvider | null>(null);

  const modelKey = useMemo(() => {
    if (!model) return "";
    return [
      model.plantId,
      model.rootId,
      model.counts.inverters,
      model.counts.transformers,
      model.counts.blocks,
      model.counts.feeders,
      model.order.length,
      model.generatedAt,
    ].join("|");
  }, [model]);

  useEffect(() => {
    if (!enabled || !projectId) {
      setProvider(null);
      return;
    }
    const next = acquireProvider(projectId);
    setProvider(next);
    return () => {
      releaseProvider(projectId);
      setProvider((current) => (current === next ? null : current));
    };
  }, [enabled, projectId]);

  useEffect(() => {
    if (!enabled || !provider || !twin || !model || !projectId) return;
    let cancelled = false;
    const ctx = buildTelemetryContext(twin, model);
    const entry = providers.get(projectId);

    void (async () => {
      try {
        const state = provider.getState();
        if (state.connection === "disconnected") {
          await provider.connect(ctx);
        } else if (!entry || entry.modelKey !== modelKey) {
          provider.setContext(ctx);
        }
        if (entry) entry.modelKey = modelKey;
      } catch (err) {
        if (!cancelled) {
          console.error("Telemetry connect failed", err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, provider, twin, model, modelKey, projectId]);

  const state = useSyncExternalStore(
    (onStoreChange) => {
      if (!provider) return () => undefined;
      return provider.onUpdate(onStoreChange);
    },
    () => provider?.getState() ?? EMPTY,
    () => EMPTY,
  );

  const controls = useMemo(
    () => ({
      setScenario: (scenario: SimulationScenario) =>
        provider?.setScenario?.(scenario),
      setPaused: (paused: boolean) => provider?.setPaused?.(paused),
      resetSimulation: () => provider?.resetSimulation?.(),
      forceAssetCondition: (
        assetId: string,
        condition:
          | "fault"
          | "offline"
          | "high_temperature"
          | "communication_loss"
          | "clear",
      ) => provider?.forceAssetCondition?.(assetId, condition),
      getLatest: (assetId: string): TelemetrySnapshot | null =>
        provider?.getLatest(assetId) ?? null,
    }),
    [provider],
  );

  return { state, controls, providerId: provider?.id ?? "mock" };
}

/** Compact status map for 3D mesh coloring (equipment only). */
export function statusMapFromTelemetry(
  state: TelemetryStoreSnapshot,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [id, snap] of Object.entries(state.byAssetId)) {
    map[id] = snap.status;
  }
  return map;
}
