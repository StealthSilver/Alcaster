/**
 * Phase 6 — Historical data provider abstraction.
 * UI talks to this contract; mock / SCADA historian / TSDB can swap underneath.
 */

import type { TwinRecord } from "@/lib/api";
import type { AssetModel } from "@/lib/assetModel";
import {
  downsampleStepMs,
  nearestSnapshotIndex,
  type HistoricalDayBundle,
  type HistoricalSeriesPoint,
  type HistoricalSnapshot,
} from "@/lib/historyModel";
import {
  buildMockHistoricalSeries,
  buildMockHistoryMeta,
  buildMockSnapshotAt,
  minuteIndexFromTimestamp,
  type MockHistoryContext,
  type MockHistoryMeta,
} from "@/lib/mockHistoricalData";

export type HistoricalPlantContext = {
  twin: TwinRecord;
  model: AssetModel;
  plantId: string;
};

export interface HistoricalDataProvider {
  readonly id: string;
  ensure(context: HistoricalPlantContext): Promise<void>;
  getPlantState(
    plantId: string,
    timestamp: string,
  ): Promise<HistoricalSnapshot>;
  getRange(
    plantId: string,
    start: string,
    end: string,
  ): Promise<HistoricalSnapshot[]>;
  getSeries(
    plantId: string,
    start: string,
    end: string,
  ): Promise<HistoricalSeriesPoint[]>;
  getEvents(plantId: string): Promise<HistoricalDayBundle["events"]>;
  getBundle(plantId: string): HistoricalDayBundle | null;
  nextTimestamp?(timestamp: string): string | null;
}

export class MockHistoricalDataProvider implements HistoricalDataProvider {
  readonly id = "mock-history";
  private ctx: MockHistoryContext | null = null;
  private meta: MockHistoryMeta | null = null;
  private series: HistoricalSeriesPoint[] = [];
  private seriesTimestamps: number[] = [];
  private plantId: string | null = null;
  private snapshotCache = new Map<number, HistoricalSnapshot>();

  async ensure(context: HistoricalPlantContext): Promise<void> {
    if (this.meta && this.plantId === context.plantId && this.ctx) return;
    this.ctx = { twin: context.twin, model: context.model };
    this.meta = buildMockHistoryMeta(this.ctx);
    this.series = buildMockHistoricalSeries(this.meta);
    this.seriesTimestamps = this.series.map((s) => Date.parse(s.timestamp));
    this.plantId = context.plantId;
    this.snapshotCache.clear();
  }

  getBundle(plantId: string): HistoricalDayBundle | null {
    if (!this.meta || !this.ctx || this.plantId !== plantId) return null;
    return {
      plantId,
      dayStartIso: new Date(this.meta.dayStartMs).toISOString(),
      dayEndIso: new Date(this.meta.dayEndMs).toISOString(),
      resolutionMs: 60_000,
      snapshots: [],
      events: this.meta.events,
      maintenance: this.meta.maintenance,
      inspections: this.meta.inspections,
      series: this.series,
      simulated: true,
      label: "SIMULATED HISTORICAL DATA",
    };
  }

  async getPlantState(
    plantId: string,
    timestamp: string,
  ): Promise<HistoricalSnapshot> {
    if (!this.meta || !this.ctx || this.plantId !== plantId) {
      throw new Error(`No historical data for plant ${plantId}`);
    }
    const minute = minuteIndexFromTimestamp(this.meta, timestamp);
    const cached = this.snapshotCache.get(minute);
    if (cached) return cached;
    const energy = this.series[minute]?.energyTodayKwh ?? 0;
    const snap = buildMockSnapshotAt(this.ctx, this.meta, minute, energy);
    this.snapshotCache.set(minute, snap);
    if (this.snapshotCache.size > 240) {
      const first = this.snapshotCache.keys().next().value;
      if (first != null) this.snapshotCache.delete(first);
    }
    return snap;
  }

  async getRange(
    plantId: string,
    start: string,
    end: string,
  ): Promise<HistoricalSnapshot[]> {
    if (!this.meta || !this.ctx || this.plantId !== plantId) return [];
    const startMs = Date.parse(start);
    const endMs = Date.parse(end);
    const step = downsampleStepMs(endMs - startMs, "1m");
    const out: HistoricalSnapshot[] = [];
    let lastKept = -Infinity;
    for (let i = 0; i < this.series.length; i += 1) {
      const t = this.seriesTimestamps[i]!;
      if (t < startMs || t > endMs) continue;
      if (t - lastKept >= step || i === this.series.length - 1) {
        out.push(await this.getPlantState(plantId, this.series[i]!.timestamp));
        lastKept = t;
      }
    }
    return out;
  }

  async getSeries(
    plantId: string,
    start: string,
    end: string,
  ): Promise<HistoricalSeriesPoint[]> {
    if (!this.meta || this.plantId !== plantId) return [];
    const startMs = Date.parse(start);
    const endMs = Date.parse(end);
    const step = downsampleStepMs(endMs - startMs, "1m");
    const out: HistoricalSeriesPoint[] = [];
    let lastKept = -Infinity;
    for (let i = 0; i < this.series.length; i += 1) {
      const point = this.series[i]!;
      const t = this.seriesTimestamps[i]!;
      if (t < startMs || t > endMs) continue;
      if (t - lastKept >= step || i === this.series.length - 1) {
        out.push(point);
        lastKept = t;
      }
    }
    return out;
  }

  async getEvents(plantId: string) {
    if (!this.meta || this.plantId !== plantId) return [];
    return this.meta.events;
  }

  /** Resolve nearest series minute for playback stepping. */
  nearestTimestamp(timestamp: string): string | null {
    if (!this.seriesTimestamps.length) return null;
    const idx = nearestSnapshotIndex(
      this.seriesTimestamps,
      Date.parse(timestamp),
    );
    return this.series[idx]?.timestamp ?? null;
  }

  nextTimestamp(timestamp: string): string | null {
    if (!this.seriesTimestamps.length) return null;
    const idx = nearestSnapshotIndex(
      this.seriesTimestamps,
      Date.parse(timestamp),
    );
    return this.series[idx + 1]?.timestamp ?? null;
  }
}

export function createHistoricalDataProvider(): HistoricalDataProvider {
  return new MockHistoricalDataProvider();
}
