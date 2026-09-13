/**
 * Phase 4 — Live Operational Digital Twin telemetry contract.
 * UI consumes normalized snapshots; source (mock / SCADA / MQTT) is swappable.
 */

import type { AssetStatus } from "@/lib/assetModel";

export type AssetOperationalStatus =
  | "RUNNING"
  | "IDLE"
  | "WARNING"
  | "FAULT"
  | "OFFLINE"
  | "STARTING"
  | "STOPPING"
  | "UNKNOWN";

export type TelemetryQuality = "GOOD" | "STALE" | "BAD" | "UNKNOWN";

export type TelemetryFreshness = "fresh" | "stale" | "offline";

export type AlarmSeverity = "INFO" | "WARNING" | "CRITICAL";

export type TelemetryMeasurements = {
  /** Active AC power in kW */
  activePower?: number;
  reactivePower?: number;
  /** DC power in kW */
  dcPower?: number;
  voltage?: number;
  current?: number;
  dcVoltage?: number;
  dcCurrent?: number;
  acVoltage?: number;
  acCurrent?: number;
  temperature?: number;
  /** GHI W/m² */
  irradiance?: number;
  /** POA W/m² */
  poaIrradiance?: number;
  windSpeed?: number;
  windDirection?: number;
  humidity?: number;
  moduleTemperature?: number;
  /** Efficiency 0–100 */
  efficiency?: number;
  /** Energy today in kWh */
  energyToday?: number;
  frequency?: number;
  powerFactor?: number;
  loadPercent?: number;
  gridConnected?: boolean;
  breakerClosed?: boolean;
  /** Export power kW */
  exportPower?: number;
  importPower?: number;
};

export type Alarm = {
  alarmId: string;
  assetId: string;
  severity: AlarmSeverity;
  code: string;
  message: string;
  timestamp: string;
  createdAt: string;
  clearedAt?: string;
  active: boolean;
  acknowledged?: boolean;
  /** Phase 5: distinguish telemetry vs inspection-driven alarms */
  source?: "TELEMETRY" | "INSPECTION" | "SYSTEM" | "MANUAL";
};

export type TelemetrySnapshot = {
  assetId: string;
  timestamp: string;
  status: AssetOperationalStatus;
  measurements: TelemetryMeasurements;
  quality: TelemetryQuality;
  alarms: Alarm[];
};

export type PlantHealth = "HEALTHY" | "ATTENTION" | "CRITICAL";

export type PlantKpis = {
  currentPowerKw: number;
  energyTodayKwh: number;
  availabilityPct: number;
  efficiencyPct: number;
  irradianceWm2: number;
  ambientTempC: number;
  windSpeedMs: number;
  gridConnected: boolean;
  gridVoltageKv: number;
  gridFrequencyHz: number;
  activeAlarmCount: number;
  health: PlantHealth;
  timestamp: string;
};

export type StatusCounts = {
  running: number;
  idle: number;
  warning: number;
  fault: number;
  offline: number;
  unknown: number;
  starting: number;
  stopping: number;
};

export type SimulationScenario =
  | "normal"
  | "inverter_fault"
  | "inverter_offline"
  | "high_temperature"
  | "grid_disconnect"
  | "low_irradiance"
  | "communication_loss";

export type TelemetryConnectionState =
  | "simulated"
  | "connected"
  | "disconnected"
  | "error";

export type TelemetryStoreSnapshot = {
  byAssetId: Record<string, TelemetrySnapshot>;
  plant: PlantKpis;
  alarms: Alarm[];
  statusCounts: StatusCounts;
  inverterCounts: StatusCounts;
  blockCounts: StatusCounts;
  connection: TelemetryConnectionState;
  scenario: SimulationScenario;
  paused: boolean;
  lastUpdated: string | null;
  providerId: string;
  error: string | null;
};

export type TelemetryProviderId = "mock" | "scada";

/** Map operational status → existing AssetStatus visual language. */
export function operationalToAssetStatus(
  status: AssetOperationalStatus,
): AssetStatus {
  switch (status) {
    case "RUNNING":
    case "IDLE":
    case "STARTING":
    case "STOPPING":
      return "operational";
    case "WARNING":
      return "warning";
    case "FAULT":
      return "fault";
    case "OFFLINE":
      return "offline";
    case "UNKNOWN":
    default:
      return "unknown";
  }
}

export function operationalToSitemapStatus(
  status: AssetOperationalStatus,
): "ONLINE" | "WARNING" | "OFFLINE" {
  if (status === "FAULT" || status === "OFFLINE") return "OFFLINE";
  if (status === "WARNING" || status === "UNKNOWN") return "WARNING";
  return "ONLINE";
}

/** Visual priority: FAULT > WARNING > OFFLINE > UNKNOWN > IDLE > RUNNING */
export function statusPriority(status: AssetOperationalStatus): number {
  switch (status) {
    case "FAULT":
      return 100;
    case "WARNING":
      return 80;
    case "OFFLINE":
      return 60;
    case "UNKNOWN":
      return 50;
    case "STOPPING":
      return 40;
    case "STARTING":
      return 30;
    case "IDLE":
      return 20;
    case "RUNNING":
    default:
      return 10;
  }
}

export function worstStatus(
  statuses: AssetOperationalStatus[],
): AssetOperationalStatus {
  if (statuses.length === 0) return "UNKNOWN";
  return statuses.reduce((best, next) =>
    statusPriority(next) > statusPriority(best) ? next : best,
  );
}
