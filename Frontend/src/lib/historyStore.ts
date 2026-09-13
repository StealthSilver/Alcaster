/**
 * Phase 6 — Centralized historical store.
 * One timestamp drives 3D, KPIs, weather, alarms, condition, SLD, sitemap.
 */

import type { TwinRecord } from "@/lib/api";
import type { AssetModel } from "@/lib/assetModel";
import {
  DEMO_HISTORY_DAY,
  DEMO_HISTORY_LABEL,
  PLAYBACK_SPEEDS,
  type HistoricalEvent,
  type HistoricalPlaybackSpeed,
  type HistoricalRangePreset,
  type HistoricalSeriesPoint,
  type HistoricalSnapshot,
  type HistoricalTimeScale,
} from "@/lib/historyModel";
import {
  snapshotToTelemetryStore,
} from "@/lib/historicalBridge";
import {
  createHistoricalDataProvider,
  type HistoricalDataProvider,
} from "@/lib/historicalProvider";
import { demoHistoryDefaultTimestamp } from "@/lib/mockHistoricalData";
import type { TelemetryStoreSnapshot } from "@/lib/telemetry";

export type HistoryStoreSnapshot = {
  isHistorical: boolean;
  timestamp: string;
  isLive: boolean;
  playing: boolean;
  speed: HistoricalPlaybackSpeed;
  rangePreset: HistoricalRangePreset;
  rangeStart: string;
  rangeEnd: string;
  timeScale: HistoricalTimeScale;
  snapshot: HistoricalSnapshot | null;
  telemetry: TelemetryStoreSnapshot | null;
  series: HistoricalSeriesPoint[];
  events: HistoricalEvent[];
  selectedEventId: string | null;
  label: string;
  simulated: boolean;
  ready: boolean;
  error: string | null;
};

type Listener = () => void;

const EMPTY: HistoryStoreSnapshot = {
  isHistorical: false,
  timestamp: new Date(0).toISOString(),
  isLive: true,
  playing: false,
  speed: 1,
  rangePreset: "today",
  rangeStart: `${DEMO_HISTORY_DAY}T00:00:00.000Z`,
  rangeEnd: `${DEMO_HISTORY_DAY}T23:59:00.000Z`,
  timeScale: "day",
  snapshot: null,
  telemetry: null,
  series: [],
  events: [],
  selectedEventId: null,
  label: DEMO_HISTORY_LABEL,
  simulated: true,
  ready: false,
  error: null,
};

export class HistoryStore {
  private provider: HistoricalDataProvider;
  private twin: TwinRecord | null = null;
  private model: AssetModel | null = null;
  private plantId = "";
  private listeners = new Set<Listener>();
  private state: HistoryStoreSnapshot = { ...EMPTY };
  private playTimer: ReturnType<typeof setInterval> | null = null;
  private cache = new Map<string, HistoricalSnapshot>();

  constructor(provider?: HistoricalDataProvider) {
    this.provider = provider ?? createHistoricalDataProvider();
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): HistoryStoreSnapshot => this.state;

  async ensure(twin: TwinRecord, model: AssetModel) {
    this.twin = twin;
    this.model = model;
    this.plantId = model.plantId;
    try {
      await this.provider.ensure({
        twin,
        model,
        plantId: model.plantId,
      });
      const bundle = this.provider.getBundle(model.plantId);
      const rangeStart =
        bundle?.dayStartIso ?? `${DEMO_HISTORY_DAY}T00:00:00.000Z`;
      const rangeEnd =
        bundle?.dayEndIso ?? `${DEMO_HISTORY_DAY}T23:59:00.000Z`;
      const events = bundle?.events ?? [];
      this.state = {
        ...this.state,
        rangeStart,
        rangeEnd,
        rangePreset: "today",
        timeScale: "day",
        events,
        label: bundle?.label ?? DEMO_HISTORY_LABEL,
        simulated: true,
        ready: true,
        error: null,
      };
      if (this.state.isHistorical) {
        await this.seek(this.state.timestamp);
        await this.refreshSeries();
      }
      this.emit();
    } catch (err) {
      this.state = {
        ...this.state,
        ready: false,
        error: err instanceof Error ? err.message : "History load failed",
      };
      this.emit();
    }
  }

  async enterHistorical(at?: string) {
    if (this.twin && this.model && !this.state.ready) {
      await this.ensure(this.twin, this.model);
    }
    if (!this.model) return;
    const target = at ?? demoHistoryDefaultTimestamp();
    this.stopPlayback();
    this.state = {
      ...this.state,
      isHistorical: true,
      isLive: false,
      playing: false,
      selectedEventId: null,
    };
    await this.seek(target);
    await this.refreshSeries();
    this.emit();
  }

  exitHistorical() {
    this.stopPlayback();
    this.state = {
      ...this.state,
      isHistorical: false,
      isLive: true,
      playing: false,
      snapshot: null,
      telemetry: null,
      selectedEventId: null,
    };
    this.emit();
  }

  async seek(timestamp: string) {
    if (!this.model || !this.plantId) return;
    const cached = this.cache.get(timestamp);
    let snap = cached ?? null;
    if (!snap) {
      snap = await this.provider.getPlantState(this.plantId, timestamp);
      this.cache.set(snap.timestamp, snap);
      if (this.cache.size > 400) {
        const first = this.cache.keys().next().value;
        if (first) this.cache.delete(first);
      }
    }
    this.state = {
      ...this.state,
      timestamp: snap.timestamp,
      snapshot: snap,
      telemetry: snapshotToTelemetryStore(snap, this.model),
    };
    this.emit();
  }

  async setRangePreset(preset: HistoricalRangePreset, custom?: {
    start: string;
    end: string;
  }) {
    const bundle = this.provider.getBundle(this.plantId);
    const dayStart = bundle?.dayStartIso ?? this.state.rangeStart;
    const dayEnd = bundle?.dayEndIso ?? this.state.rangeEnd;
    const dayMs = 24 * 60 * 60_000;
    let start = dayStart;
    let end = dayEnd;
    let scale: HistoricalTimeScale = "day";

    if (preset === "yesterday") {
      // Demo only has one day — keep same day but label yesterday as day view
      start = dayStart;
      end = dayEnd;
      scale = "day";
    } else if (preset === "last_7_days") {
      start = new Date(Date.parse(dayEnd) - 7 * dayMs).toISOString();
      end = dayEnd;
      scale = "week";
    } else if (preset === "last_30_days") {
      start = new Date(Date.parse(dayEnd) - 30 * dayMs).toISOString();
      end = dayEnd;
      scale = "month";
    } else if (preset === "custom" && custom) {
      start = custom.start;
      end = custom.end;
      const span = Date.parse(end) - Date.parse(start);
      scale =
        span <= dayMs * 1.5 ? "day" : span <= dayMs * 10 ? "week" : "month";
    } else {
      start = dayStart;
      end = dayEnd;
      scale = "day";
    }

    // Clamp to available demo day for mock provider
    if (bundle) {
      start = bundle.dayStartIso;
      end = bundle.dayEndIso;
      if (preset === "last_7_days" || preset === "last_30_days") {
        // Still show the demo day; scale label reflects user intent for ticks
        scale = preset === "last_7_days" ? "week" : "month";
      }
    }

    this.state = {
      ...this.state,
      rangePreset: preset,
      rangeStart: start,
      rangeEnd: end,
      timeScale: scale,
    };
    await this.refreshSeries();
    const t = Date.parse(this.state.timestamp);
    const lo = Date.parse(start);
    const hi = Date.parse(end);
    if (t < lo || t > hi) {
      await this.seek(start);
    }
    this.emit();
  }

  setSpeed(speed: HistoricalPlaybackSpeed) {
    if (!PLAYBACK_SPEEDS.includes(speed)) return;
    this.state = { ...this.state, speed };
    if (this.state.playing) {
      this.stopPlayback();
      this.startPlayback();
    }
    this.emit();
  }

  play() {
    if (!this.state.isHistorical) return;
    this.state = { ...this.state, playing: true };
    this.startPlayback();
    this.emit();
  }

  pause() {
    this.stopPlayback();
    this.state = { ...this.state, playing: false };
    this.emit();
  }

  async step(deltaMinutes: number) {
    const t =
      Date.parse(this.state.timestamp) + deltaMinutes * 60_000;
    const lo = Date.parse(this.state.rangeStart);
    const hi = Date.parse(this.state.rangeEnd);
    const clamped = Math.max(lo, Math.min(hi, t));
    await this.seek(new Date(clamped).toISOString());
  }

  selectEvent(eventId: string | null) {
    this.state = { ...this.state, selectedEventId: eventId };
    this.emit();
  }

  async jumpToEvent(event: HistoricalEvent) {
    this.selectEvent(event.eventId);
    await this.seek(event.timestamp);
  }

  private async refreshSeries() {
    if (!this.plantId) return;
    const series = await this.provider.getSeries(
      this.plantId,
      this.state.rangeStart,
      this.state.rangeEnd,
    );
    this.state = { ...this.state, series };
  }

  private startPlayback() {
    this.stopPlayback();
    const tickMs = Math.max(40, 1000 / this.state.speed);
    this.playTimer = setInterval(() => {
      void this.advancePlayback();
    }, tickMs);
  }

  private async advancePlayback() {
    if (!this.state.playing) return;
    const nextTs = this.provider.nextTimestamp?.(this.state.timestamp) ?? null;
    if (!nextTs || Date.parse(nextTs) > Date.parse(this.state.rangeEnd)) {
      this.pause();
      return;
    }
    await this.seek(nextTs);
  }

  private stopPlayback() {
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
  }

  private emit() {
    for (const listener of this.listeners) listener();
  }
}

/** Shared per-project so Digital Twin + Sitemap stay in sync. */
const stores = new Map<
  string,
  { store: HistoryStore; refs: number }
>();

export function acquireHistoryStore(projectId: string): HistoryStore {
  const existing = stores.get(projectId);
  if (existing) {
    existing.refs += 1;
    return existing.store;
  }
  const store = new HistoryStore();
  stores.set(projectId, { store, refs: 1 });
  return store;
}

export function releaseHistoryStore(projectId: string) {
  const existing = stores.get(projectId);
  if (!existing) return;
  existing.refs -= 1;
  if (existing.refs <= 0) {
    existing.store.exitHistorical();
    stores.delete(projectId);
  }
}

export function getHistoryStore(projectId: string): HistoryStore | null {
  return stores.get(projectId)?.store ?? null;
}
