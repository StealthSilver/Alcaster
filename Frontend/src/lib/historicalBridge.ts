/**
 * Phase 6 — Bridge historical snapshots into the live telemetry store shape
 * so 3D / HUD / SLD / Sitemap keep consuming one status contract.
 */

import type { AssetModel } from "@/lib/assetModel";
import type { HistoricalSnapshot } from "@/lib/historyModel";
import {
  countStatuses,
  countStatusesForTypes,
  type AssetOperationalStatus,
  type TelemetrySnapshot,
  type TelemetryStoreSnapshot,
} from "@/lib/telemetry";

export function historicalStatusToOperational(
  status: HistoricalSnapshot["assets"][number]["operationalStatus"],
): AssetOperationalStatus {
  if (status === "MAINTENANCE") return "OFFLINE";
  return status;
}

export function snapshotToTelemetryStore(
  snap: HistoricalSnapshot,
  model: AssetModel,
): TelemetryStoreSnapshot {
  const byAssetId: Record<string, TelemetrySnapshot> = {};
  for (const asset of snap.assets) {
    const status = historicalStatusToOperational(asset.operationalStatus);
    byAssetId[asset.assetId] = {
      assetId: asset.assetId,
      timestamp: asset.timestamp,
      status,
      measurements: asset.measurements ?? {
        activePower: asset.power,
        dcPower: asset.dcPower,
        temperature: asset.temperature,
        efficiency: asset.efficiency,
        energyToday: asset.energy,
        voltage: asset.voltage,
        current: asset.current,
      },
      quality: "GOOD",
      alarms: snap.alarms.filter((a) => a.assetId === asset.assetId && a.active),
    };
  }

  const alarms = snap.alarms.filter((a) => a.active);

  return {
    byAssetId,
    plant: {
      currentPowerKw: snap.plant.plantPowerKw,
      energyTodayKwh: snap.plant.energyTodayKwh,
      availabilityPct: snap.plant.availabilityPct,
      efficiencyPct: snap.plant.efficiencyPct,
      irradianceWm2: snap.plant.ghi ?? snap.weather?.ghi ?? 0,
      ambientTempC:
        snap.plant.ambientTempC ?? snap.weather?.ambientTemperature ?? 0,
      windSpeedMs: snap.plant.windSpeedMs ?? snap.weather?.windSpeed ?? 0,
      gridConnected: snap.plant.gridStatus === "CONNECTED",
      gridVoltageKv: 33,
      gridFrequencyHz: snap.plant.gridStatus === "CONNECTED" ? 50 : 0,
      activeAlarmCount: snap.plant.activeAlarmCount,
      health: snap.plant.health,
      timestamp: snap.timestamp,
    },
    alarms,
    statusCounts: countStatuses(Object.values(byAssetId)),
    inverterCounts: countStatusesForTypes(byAssetId, model, ["INVERTER"]),
    blockCounts: countStatusesForTypes(byAssetId, model, ["BLOCK"]),
    connection: "simulated",
    scenario: "normal",
    paused: true,
    lastUpdated: snap.timestamp,
    providerId: "mock-history",
    error: null,
  };
}

/** Status map that preserves MAINTENANCE for 3D coloring. */
export function statusMapFromHistorical(
  snap: HistoricalSnapshot | null,
): Record<string, string> {
  if (!snap) return {};
  const map: Record<string, string> = {};
  for (const asset of snap.assets) {
    map[asset.assetId] = asset.operationalStatus;
  }
  return map;
}

export function conditionMapFromHistorical(
  snap: HistoricalSnapshot | null,
): Record<string, string> {
  if (!snap) return {};
  const map: Record<string, string> = {};
  for (const asset of snap.assets) {
    map[asset.assetId] = asset.condition;
  }
  return map;
}
