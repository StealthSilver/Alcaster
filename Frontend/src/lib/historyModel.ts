/**
 * Phase 6 — Historical & Maintenance Digital Twin contracts.
 * One canonical timestamp drives the entire reconstructed plant state.
 */

import type { ConditionStatus } from "@/lib/conditionModel";
import type { InspectionRecord } from "@/lib/inspectionModel";
import type { MaintenanceRecord } from "@/lib/maintenanceModel";
import type {
  Alarm,
  AssetOperationalStatus,
  PlantHealth,
  TelemetryMeasurements,
} from "@/lib/telemetry";

export type HistoricalTimestamp = {
  timestamp: string;
  isLive: boolean;
};

export type HistoricalRangePreset =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "custom";

export type HistoricalTimeScale = "day" | "week" | "month";

export type HistoricalPlaybackSpeed = 0.5 | 1 | 2 | 5 | 10 | 50;

export type HistoricalResolution =
  | "1s"
  | "5s"
  | "30s"
  | "1m"
  | "5m"
  | "15m"
  | "1h"
  | "1d";

export type HistoricalEventType =
  | "FAULT"
  | "WARNING"
  | "INSPECTION"
  | "MAINTENANCE_START"
  | "MAINTENANCE_END"
  | "REPAIR"
  | "REPLACEMENT"
  | "GRID_EVENT"
  | "CONDITION_CHANGE"
  | "STATUS_CHANGE";

export type HistoricalEventSeverity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type HistoricalEvent = {
  eventId: string;
  timestamp: string;
  assetId?: string;
  type: HistoricalEventType;
  severity?: HistoricalEventSeverity;
  title: string;
  description?: string;
};

export type HistoricalWeatherState = {
  timestamp: string;
  ghi?: number;
  dni?: number;
  dhi?: number;
  poaIrradiance?: number;
  ambientTemperature?: number;
  moduleTemperature?: number;
  windSpeed?: number;
  windDirection?: number;
  humidity?: number;
  rainfall?: number;
  cloudCover?: number;
  simulated: boolean;
};

export type HistoricalPlantState = {
  timestamp: string;
  plantPowerKw: number;
  energyTodayKwh: number;
  availabilityPct: number;
  efficiencyPct: number;
  ghi?: number;
  poaIrradiance?: number;
  ambientTempC?: number;
  moduleTempC?: number;
  windSpeedMs?: number;
  gridStatus: "CONNECTED" | "DISCONNECTED" | "UNKNOWN";
  gridExportKw: number;
  gridImportKw: number;
  health: PlantHealth;
  activeAlarmCount: number;
  simulated: boolean;
};

export type HistoricalAssetState = {
  assetId: string;
  timestamp: string;
  operationalStatus: AssetOperationalStatus | "MAINTENANCE";
  condition: ConditionStatus;
  conditionScore?: number;
  power?: number;
  voltage?: number;
  current?: number;
  temperature?: number;
  efficiency?: number;
  energy?: number;
  dcPower?: number;
  loadPercent?: number;
  alarmIds?: string[];
  measurements?: TelemetryMeasurements;
};

export type HistoricalAlarmState = Alarm;

export type HistoricalInspectionState = InspectionRecord;

export type HistoricalMaintenanceState = MaintenanceRecord;

export type HistoricalElectricalState = {
  timestamp: string;
  /** Asset breaker / online flags keyed by assetId */
  breakerClosedByAssetId: Record<string, boolean>;
  gridConnected: boolean;
  feederOpenIds: string[];
};

export type HistoricalSnapshot = {
  timestamp: string;
  plant: HistoricalPlantState;
  assets: HistoricalAssetState[];
  weather?: HistoricalWeatherState;
  alarms: HistoricalAlarmState[];
  inspections: HistoricalInspectionState[];
  maintenance: HistoricalMaintenanceState[];
  electrical?: HistoricalElectricalState;
  events: HistoricalEvent[];
  simulated: boolean;
};

export type HistoricalSeriesPoint = {
  timestamp: string;
  powerKw: number;
  energyTodayKwh: number;
  irradianceWm2: number;
  ambientTempC: number;
  availabilityPct: number;
  efficiencyPct: number;
};

export type HistoricalDayBundle = {
  plantId: string;
  dayStartIso: string;
  dayEndIso: string;
  resolutionMs: number;
  /** Minute-indexed snapshots for the demo day (or range). */
  snapshots: HistoricalSnapshot[];
  events: HistoricalEvent[];
  maintenance: MaintenanceRecord[];
  inspections: InspectionRecord[];
  series: HistoricalSeriesPoint[];
  simulated: true;
  label: string;
};

export const DEMO_HISTORY_DAY = "2026-09-12";
export const DEMO_HISTORY_LABEL = "SIMULATED HISTORICAL DATA";

export const PLAYBACK_SPEEDS: HistoricalPlaybackSpeed[] = [
  0.5, 1, 2, 5, 10, 50,
];

export function parseHistoryParam(value: string | null): string | null {
  if (!value) return null;
  const t = Date.parse(value);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

export function formatHistoricalStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${date} — ${time}`;
}

export function formatHistoricalDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function nearestSnapshotIndex(
  timestamps: number[],
  targetMs: number,
): number {
  if (timestamps.length === 0) return -1;
  let lo = 0;
  let hi = timestamps.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (timestamps[mid]! < targetMs) lo = mid + 1;
    else hi = mid;
  }
  if (lo === 0) return 0;
  const prev = timestamps[lo - 1]!;
  const next = timestamps[lo]!;
  return Math.abs(prev - targetMs) <= Math.abs(next - targetMs) ? lo - 1 : lo;
}

export function resolutionToMs(resolution: HistoricalResolution): number {
  switch (resolution) {
    case "1s":
      return 1000;
    case "5s":
      return 5000;
    case "30s":
      return 30_000;
    case "1m":
      return 60_000;
    case "5m":
      return 5 * 60_000;
    case "15m":
      return 15 * 60_000;
    case "1h":
      return 60 * 60_000;
    case "1d":
      return 24 * 60 * 60_000;
    default:
      return 60_000;
  }
}

export function scaleForRangeMs(rangeMs: number): HistoricalTimeScale {
  const day = 24 * 60 * 60_000;
  if (rangeMs <= day * 1.5) return "day";
  if (rangeMs <= day * 10) return "week";
  return "month";
}

export function downsampleStepMs(
  rangeMs: number,
  preferred: HistoricalResolution = "1m",
): number {
  const preferredMs = resolutionToMs(preferred);
  const day = 24 * 60 * 60_000;
  if (rangeMs <= day * 1.5) return preferredMs;
  if (rangeMs <= day * 8) return resolutionToMs("15m");
  return resolutionToMs("1h");
}
