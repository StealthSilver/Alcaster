/**
 * Phase 6 — Deterministic mock historical day for Sunrise Ridge Solar.
 * Series is precomputed lightly; full snapshots are built on demand.
 */

import type { TwinRecord } from "@/lib/api";
import type { AssetModel } from "@/lib/assetModel";
import type { ConditionStatus } from "@/lib/conditionModel";
import {
  DEMO_HISTORY_DAY,
  DEMO_HISTORY_LABEL,
  type HistoricalAlarmState,
  type HistoricalAssetState,
  type HistoricalDayBundle,
  type HistoricalElectricalState,
  type HistoricalEvent,
  type HistoricalPlantState,
  type HistoricalSeriesPoint,
  type HistoricalSnapshot,
  type HistoricalWeatherState,
} from "@/lib/historyModel";
import type { InspectionRecord } from "@/lib/inspectionModel";
import type { MaintenanceRecord } from "@/lib/maintenanceModel";
import {
  computeAvailabilityPct,
  getBlockPowerKw,
  getFeederPowerKw,
  getPlantPowerKw,
  getTransformerPowerKw,
  plantHealthFromAlarms,
  ratedInverterKw,
  type AssetOperationalStatus,
  type TelemetrySnapshot,
} from "@/lib/telemetry";
import { resolveTwinPlant } from "@/lib/twinPlant";

const MINUTE = 60_000;

function atMinutes(dayStartMs: number, minutesFromMidnight: number): number {
  return dayStartMs + minutesFromMidnight * MINUTE;
}

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

function hash32(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function unit(seed: string): number {
  return hash32(seed) / 4294967296;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function pickInv(
  ids: string[],
  prefer: string,
  fallbackIndex: number,
): string | null {
  if (prefer && ids.includes(prefer)) return prefer;
  if (ids.length === 0) return null;
  return ids[Math.min(fallbackIndex, ids.length - 1)] ?? ids[0] ?? null;
}

function solarFactor(minutes: number, seed: string): number {
  const sunrise = 6.5 * 60;
  const sunset = 18.5 * 60;
  if (minutes < sunrise || minutes > sunset) return 0;
  const x = (minutes - sunrise) / (sunset - sunrise);
  const bell = Math.sin(Math.PI * x);
  const cloud =
    0.88 +
    0.12 *
      Math.sin(minutes / 37 + unit(seed) * 6) *
      Math.cos(minutes / 19 + unit(`${seed}|c`) * 4);
  const middayBoost =
    minutes >= 12 * 60 + 10 && minutes <= 12 * 60 + 25 ? 1.06 : 1;
  return clamp(bell * cloud * middayBoost, 0, 1.08);
}

type InvPhase =
  | "RUNNING"
  | "WARNING"
  | "FAULT"
  | "MAINTENANCE"
  | "IDLE"
  | "OFFLINE";

function inv005Phase(minutes: number): InvPhase {
  if (minutes < 6.5 * 60) return "IDLE";
  if (minutes >= 15 * 60 && minutes < 16 * 60 + 30) return "MAINTENANCE";
  if (minutes >= 14 * 60 + 37 && minutes < 15 * 60) return "FAULT";
  if (minutes >= 14 * 60 + 10 && minutes < 14 * 60 + 37) return "WARNING";
  if (minutes >= 18.5 * 60) return "IDLE";
  return "RUNNING";
}

function operationalFromPhase(
  phase: InvPhase,
): AssetOperationalStatus | "MAINTENANCE" {
  if (phase === "MAINTENANCE") return "MAINTENANCE";
  return phase;
}

function conditionAt(
  minutes: number,
  assetId: string,
  focusInv: string | null,
): { condition: ConditionStatus; score: number } {
  if (focusInv && assetId === focusInv) {
    if (minutes >= 10 * 60 + 30) return { condition: "DEGRADED", score: 67 };
    return { condition: "GOOD", score: 92 };
  }
  return { condition: "GOOD", score: 90 + Math.floor(unit(assetId) * 8) };
}

export type MockHistoryContext = {
  twin: TwinRecord;
  model: AssetModel;
  dayIso?: string;
};

export type MockHistoryMeta = {
  dayIso: string;
  dayStartMs: number;
  dayEndMs: number;
  seed: string;
  capacityMw: number;
  ratedKw: number;
  focusInv: string | null;
  focusTrf: string | null;
  inverters: string[];
  transformers: string[];
  feeders: string[];
  blocks: string[];
  weatherIds: string[];
  gridIds: string[];
  substations: string[];
  events: HistoricalEvent[];
  maintenance: MaintenanceRecord[];
  inspections: InspectionRecord[];
};

export function buildMockHistoryMeta(ctx: MockHistoryContext): MockHistoryMeta {
  const dayIso = ctx.dayIso ?? DEMO_HISTORY_DAY;
  const dayStartMs = Date.parse(`${dayIso}T00:00:00.000Z`);
  const dayEndMs = dayStartMs + 24 * 60 * 60_000 - MINUTE;
  const plant = resolveTwinPlant(ctx.twin.spec, ctx.twin.derived);
  const capacityMw = plant.capacityMw || 20;
  const seed = `${ctx.twin.projectId}|${ctx.model.plantId}|phase6|${dayIso}`;
  const ratedKw = ratedInverterKw(ctx.model, capacityMw);

  const inverters = ctx.model.order.filter(
    (id) => ctx.model.assets[id]?.assetType === "INVERTER",
  );
  const transformers = ctx.model.order.filter(
    (id) => ctx.model.assets[id]?.assetType === "TRANSFORMER",
  );
  const feeders = ctx.model.order.filter(
    (id) => ctx.model.assets[id]?.assetType === "FEEDER",
  );
  const blocks = ctx.model.order.filter(
    (id) => ctx.model.assets[id]?.assetType === "BLOCK",
  );
  const weatherIds = ctx.model.order.filter(
    (id) => ctx.model.assets[id]?.assetType === "WEATHER_STATION",
  );
  const gridIds = ctx.model.order.filter(
    (id) => ctx.model.assets[id]?.assetType === "GRID_INTERCONNECTION",
  );
  const substations = ctx.model.order.filter(
    (id) => ctx.model.assets[id]?.assetType === "SUBSTATION",
  );

  const focusInv = pickInv(inverters, "INV-005", 4);
  const focusTrf = pickInv(transformers, "TRF-002", 1);

  const inspections: InspectionRecord[] = [];
  if (focusInv) {
    const inspAt = iso(atMinutes(dayStartMs, 10 * 60 + 30));
    inspections.push({
      inspectionId: `INSP-HIST-${focusInv}`,
      assetId: focusInv,
      inspectionType: "VISUAL",
      inspectionDate: inspAt,
      inspector: "A. Sharma",
      status: "COMPLETED",
      condition: "DEGRADED",
      notes: "Cooling system issue identified during morning walkdown.",
      findings: ["Cooling system issue", "Elevated cabinet temperature risk"],
      createdAt: inspAt,
      updatedAt: inspAt,
    });
  }

  const maintenance: MaintenanceRecord[] = [];
  if (focusInv) {
    maintenance.push({
      maintenanceId: `MNT-${focusInv}-001`,
      assetId: focusInv,
      type: "CORRECTIVE",
      status: "COMPLETED",
      startTime: iso(atMinutes(dayStartMs, 15 * 60)),
      endTime: iso(atMinutes(dayStartMs, 16 * 60 + 30)),
      description: "Corrective service — cooling system",
      technician: "R. Patel",
      cause: "Cooling issue / restricted airflow",
      resolution: "Cooling system serviced; filters cleaned; fans verified",
      partsReplaced: ["Air filter cartridge"],
      downtimeMinutes: 90,
      notes: "Return to service after thermal check",
    });
  }

  const events: HistoricalEvent[] = [];
  if (focusInv) {
    events.push(
      {
        eventId: "EVT-INSP-1030",
        timestamp: iso(atMinutes(dayStartMs, 10 * 60 + 30)),
        assetId: focusInv,
        type: "INSPECTION",
        severity: "MEDIUM",
        title: "Inspection completed",
        description: "Visual inspection — cooling system issue",
      },
      {
        eventId: "EVT-WARN-1410",
        timestamp: iso(atMinutes(dayStartMs, 14 * 60 + 10)),
        assetId: focusInv,
        type: "WARNING",
        severity: "HIGH",
        title: `${focusInv} high temperature warning`,
        description: "Cabinet temperature rising above warning threshold",
      },
      {
        eventId: "EVT-FAULT-1437",
        timestamp: iso(atMinutes(dayStartMs, 14 * 60 + 37)),
        assetId: focusInv,
        type: "FAULT",
        severity: "CRITICAL",
        title: `${focusInv} inverter fault`,
        description: "Inverter tripped — cooling / overtemperature fault",
      },
      {
        eventId: "EVT-GRID-1455",
        timestamp: iso(atMinutes(dayStartMs, 14 * 60 + 55)),
        type: "GRID_EVENT",
        severity: "HIGH",
        title: "Grid disconnect",
        description: "Brief grid disconnect — export forced to 0",
      },
      {
        eventId: "EVT-GRID-1458",
        timestamp: iso(atMinutes(dayStartMs, 14 * 60 + 58)),
        type: "GRID_EVENT",
        severity: "INFO",
        title: "Grid reconnected",
        description: "Grid connection restored",
      },
      {
        eventId: "EVT-MNT-START",
        timestamp: iso(atMinutes(dayStartMs, 15 * 60)),
        assetId: focusInv,
        type: "MAINTENANCE_START",
        severity: "MEDIUM",
        title: "Maintenance started",
        description: "Corrective maintenance on cooling system",
      },
      {
        eventId: "EVT-MNT-END",
        timestamp: iso(atMinutes(dayStartMs, 16 * 60 + 30)),
        assetId: focusInv,
        type: "MAINTENANCE_END",
        severity: "INFO",
        title: "Maintenance completed",
        description: "Cooling system serviced",
      },
      {
        eventId: "EVT-REPAIR",
        timestamp: iso(atMinutes(dayStartMs, 16 * 60 + 35)),
        assetId: focusInv,
        type: "REPAIR",
        severity: "INFO",
        title: `${focusInv} returned to service`,
        description: "Inverter back in operation",
      },
    );
  }

  return {
    dayIso,
    dayStartMs,
    dayEndMs,
    seed,
    capacityMw,
    ratedKw,
    focusInv,
    focusTrf,
    inverters,
    transformers,
    feeders,
    blocks,
    weatherIds,
    gridIds,
    substations,
    events,
    maintenance,
    inspections,
  };
}

/** Lightweight inverter power at minute — used for series + snapshot. */
function inverterPowerAt(
  meta: MockHistoryMeta,
  id: string,
  minutes: number,
  sf: number,
  moduleTemp: number,
  gridDisconnected: boolean,
): { powerKw: number; phase: InvPhase; status: AssetOperationalStatus | "MAINTENANCE"; temperature: number } {
  const isFocus = meta.focusInv === id;
  const phase: InvPhase = isFocus
    ? inv005Phase(minutes)
    : sf <= 0.02
      ? "IDLE"
      : "RUNNING";
  const status = operationalFromPhase(phase);
  let powerKw = 0;
  let temperature = 30;
  if (phase === "RUNNING" || phase === "WARNING") {
    const warnDerate = phase === "WARNING" ? 0.82 : 1;
    const tempDerate = 1 - Math.max(0, moduleTemp - 45) * 0.0015;
    powerKw =
      meta.ratedKw *
      sf *
      warnDerate *
      tempDerate *
      (0.97 + unit(`${meta.seed}|inv|${id}`) * 0.06);
    if (gridDisconnected) powerKw = 0;
    temperature =
      phase === "WARNING"
        ? 52 + (minutes - (14 * 60 + 10)) * 0.15
        : 35 + sf * 12 + unit(`${meta.seed}|t|${id}`) * 3;
  } else if (phase === "FAULT") {
    temperature = 54;
  } else if (phase === "MAINTENANCE") {
    temperature = 26;
  }
  return { powerKw, phase, status, temperature };
}

function weatherAt(meta: MockHistoryMeta, minutes: number) {
  const sf = solarFactor(minutes, meta.seed);
  const ghi = Math.round(980 * sf);
  const poa = Math.round(ghi * 1.06);
  const ambient = 22 + sf * 12 + Math.sin(minutes / 40) * 0.8;
  const moduleTemp = ambient + sf * 18;
  const windSpeed = 2.2 + unit(`${meta.seed}|w|${minutes}`) * 3.5 + sf * 1.2;
  const gridDisconnected =
    minutes >= 14 * 60 + 55 && minutes < 14 * 60 + 58;
  return {
    sf,
    ghi,
    poa,
    ambient,
    moduleTemp,
    windSpeed,
    windDir: (120 + minutes * 0.15 + unit(`${meta.seed}|wd`) * 40) % 360,
    humidity: clamp(55 - sf * 18 + unit(`${meta.seed}|h|${minutes}`) * 6, 20, 90),
    cloudCover: clamp(100 - sf * 95 + unit(`${meta.seed}|cloud|${minutes}`) * 8, 0, 100),
    gridDisconnected,
  };
}

function plantPowerAt(meta: MockHistoryMeta, minutes: number): number {
  const w = weatherAt(meta, minutes);
  let sum = 0;
  for (const id of meta.inverters) {
    sum += inverterPowerAt(
      meta,
      id,
      minutes,
      w.sf,
      w.moduleTemp,
      w.gridDisconnected,
    ).powerKw;
  }
  return w.gridDisconnected ? 0 : sum;
}

/** Precompute chart series (scalar only) — fast & small. */
export function buildMockHistoricalSeries(
  meta: MockHistoryMeta,
): HistoricalSeriesPoint[] {
  const series: HistoricalSeriesPoint[] = [];
  let energyTodayKwh = 0;
  let prevPower = 0;
  for (let m = 0; m < 24 * 60; m += 1) {
    const w = weatherAt(meta, m);
    const plantPowerKw = plantPowerAt(meta, m);
    energyTodayKwh += ((prevPower + plantPowerKw) / 2) * (MINUTE / 3_600_000);
    prevPower = plantPowerKw;

    let available = 0;
    for (const id of meta.inverters) {
      const { status } = inverterPowerAt(
        meta,
        id,
        m,
        w.sf,
        w.moduleTemp,
        w.gridDisconnected,
      );
      if (
        status === "RUNNING" ||
        status === "IDLE" ||
        status === "WARNING" ||
        status === "STARTING" ||
        status === "STOPPING"
      ) {
        available += meta.ratedKw;
      }
    }
    const availabilityPct =
      meta.inverters.length === 0
        ? 100
        : Math.min(
            100,
            (available / (meta.inverters.length * meta.ratedKw)) * 100,
          );
    const efficiencyPct =
      w.poa > 50 && plantPowerKw > 0
        ? clamp(
            (plantPowerKw /
              (meta.capacityMw * 1000 * Math.max(w.sf, 0.05))) *
              100,
            0,
            98,
          )
        : 0;

    series.push({
      timestamp: iso(atMinutes(meta.dayStartMs, m)),
      powerKw: Number(plantPowerKw.toFixed(2)),
      energyTodayKwh: Number(energyTodayKwh.toFixed(2)),
      irradianceWm2: w.ghi,
      ambientTempC: Number(w.ambient.toFixed(1)),
      availabilityPct: Number(availabilityPct.toFixed(1)),
      efficiencyPct: Number(efficiencyPct.toFixed(1)),
    });
  }
  return series;
}

/** Full plant snapshot at a minute index (0–1439). */
export function buildMockSnapshotAt(
  ctx: MockHistoryContext,
  meta: MockHistoryMeta,
  minutes: number,
  energyTodayKwh: number,
): HistoricalSnapshot {
  const m = clamp(Math.round(minutes), 0, 24 * 60 - 1);
  const tsMs = atMinutes(meta.dayStartMs, m);
  const timestamp = iso(tsMs);
  const w = weatherAt(meta, m);

  const byAssetId: Record<string, TelemetrySnapshot> = {};
  const assetStates: HistoricalAssetState[] = [];
  const alarms: HistoricalAlarmState[] = [];

  const weather: HistoricalWeatherState = {
    timestamp,
    ghi: w.ghi,
    dni: Math.round(w.ghi * 0.72),
    dhi: Math.round(w.ghi * 0.28),
    poaIrradiance: w.poa,
    ambientTemperature: Number(w.ambient.toFixed(1)),
    moduleTemperature: Number(w.moduleTemp.toFixed(1)),
    windSpeed: Number(w.windSpeed.toFixed(1)),
    windDirection: Math.round(w.windDir),
    humidity: Number(w.humidity.toFixed(0)),
    rainfall: 0,
    cloudCover: Number(w.cloudCover.toFixed(0)),
    simulated: true,
  };

  for (const id of meta.inverters) {
    const inv = inverterPowerAt(
      meta,
      id,
      m,
      w.sf,
      w.moduleTemp,
      w.gridDisconnected,
    );
    const telemStatus: AssetOperationalStatus =
      inv.status === "MAINTENANCE" ? "OFFLINE" : inv.status;
    const dcPower = inv.powerKw > 0 ? inv.powerKw / 0.975 : 0;
    const efficiency =
      inv.powerKw > 0
        ? clamp((inv.powerKw / Math.max(dcPower, 1)) * 100, 0, 99)
        : 0;
    const cond = conditionAt(m, id, meta.focusInv);
    const measurements = {
      activePower: Number(inv.powerKw.toFixed(2)),
      dcPower: Number(dcPower.toFixed(2)),
      temperature: Number(inv.temperature.toFixed(1)),
      efficiency: Number(efficiency.toFixed(1)),
      energyToday: 0,
      voltage: inv.powerKw > 0 ? 400 : 0,
      current: inv.powerKw > 0 ? inv.powerKw / 0.4 : 0,
      acVoltage: inv.powerKw > 0 ? 400 : 0,
      irradiance: w.ghi,
      poaIrradiance: w.poa,
      moduleTemperature: weather.moduleTemperature,
    };
    byAssetId[id] = {
      assetId: id,
      timestamp,
      status: telemStatus,
      measurements,
      quality: "GOOD",
      alarms: [],
    };
    assetStates.push({
      assetId: id,
      timestamp,
      operationalStatus: inv.status,
      condition: cond.condition,
      conditionScore: cond.score,
      power: measurements.activePower,
      dcPower: measurements.dcPower,
      temperature: measurements.temperature,
      efficiency: measurements.efficiency,
      voltage: measurements.voltage,
      current: measurements.current,
      measurements,
      alarmIds: [],
    });
  }

  if (meta.focusInv) {
    if (m >= 14 * 60 + 10 && m < 14 * 60 + 37) {
      const alarm: HistoricalAlarmState = {
        alarmId: `ALM-${meta.focusInv}-TEMP`,
        assetId: meta.focusInv,
        severity: "WARNING",
        code: "INV_TEMP_HIGH",
        message: "Inverter high temperature",
        timestamp: iso(atMinutes(meta.dayStartMs, 14 * 60 + 10)),
        createdAt: iso(atMinutes(meta.dayStartMs, 14 * 60 + 10)),
        active: true,
        source: "TELEMETRY",
      };
      alarms.push(alarm);
      const st = assetStates.find((a) => a.assetId === meta.focusInv);
      if (st) st.alarmIds = [alarm.alarmId];
    }
    if (m >= 14 * 60 + 37 && m < 16 * 60 + 35) {
      const alarm: HistoricalAlarmState = {
        alarmId: `ALM-${meta.focusInv}-FAULT`,
        assetId: meta.focusInv,
        severity: "CRITICAL",
        code: "INV_FAULT",
        message: "Inverter fault",
        timestamp: iso(atMinutes(meta.dayStartMs, 14 * 60 + 37)),
        createdAt: iso(atMinutes(meta.dayStartMs, 14 * 60 + 37)),
        active: true,
        source: "TELEMETRY",
      };
      alarms.push(alarm);
      const st = assetStates.find((a) => a.assetId === meta.focusInv);
      if (st) st.alarmIds = [alarm.alarmId];
    }
    if (meta.focusTrf && m >= 14 * 60 + 20 && m < 15 * 60) {
      alarms.push({
        alarmId: `ALM-${meta.focusTrf}-TEMP`,
        assetId: meta.focusTrf,
        severity: "WARNING",
        code: "TRF_TEMP_HIGH",
        message: "High temperature",
        timestamp: iso(atMinutes(meta.dayStartMs, 14 * 60 + 20)),
        createdAt: iso(atMinutes(meta.dayStartMs, 14 * 60 + 20)),
        active: true,
        source: "TELEMETRY",
      });
    }
  }

  let plantPowerKw = getPlantPowerKw(byAssetId, ctx.model);
  if (w.gridDisconnected) plantPowerKw = 0;

  const availabilityPct = computeAvailabilityPct(
    byAssetId,
    ctx.model,
    meta.ratedKw,
  );
  const efficiencyPct =
    w.poa > 50 && plantPowerKw > 0
      ? clamp(
          (plantPowerKw / (meta.capacityMw * 1000 * Math.max(w.sf, 0.05))) *
            100,
          0,
          98,
        )
      : 0;
  const gridExportKw = w.gridDisconnected ? 0 : plantPowerKw * 0.985;
  const health = plantHealthFromAlarms(alarms);

  for (const id of [
    ...meta.transformers,
    ...meta.feeders,
    ...meta.blocks,
    ...meta.substations,
    ...meta.gridIds,
  ]) {
    const asset = ctx.model.assets[id];
    if (!asset) continue;
    let power = 0;
    if (asset.assetType === "TRANSFORMER") {
      power = getTransformerPowerKw(byAssetId, ctx.model, id);
    } else if (asset.assetType === "FEEDER") {
      power = getFeederPowerKw(byAssetId, ctx.model, id);
    } else if (asset.assetType === "BLOCK") {
      power = getBlockPowerKw(byAssetId, ctx.model, id);
    } else if (asset.assetType === "GRID_INTERCONNECTION") {
      power = gridExportKw;
    } else if (asset.assetType === "SUBSTATION") {
      power = plantPowerKw;
    }
    if (w.gridDisconnected && asset.assetType !== "BLOCK") power = 0;

    const status: AssetOperationalStatus = w.gridDisconnected
      ? asset.assetType === "GRID_INTERCONNECTION"
        ? "OFFLINE"
        : "IDLE"
      : plantPowerKw > 10
        ? "RUNNING"
        : "IDLE";

    byAssetId[id] = {
      assetId: id,
      timestamp,
      status,
      measurements: {
        activePower: Number(power.toFixed(2)),
        exportPower:
          asset.assetType === "GRID_INTERCONNECTION"
            ? Number(gridExportKw.toFixed(2))
            : undefined,
        importPower: 0,
        loadPercent:
          asset.assetType === "TRANSFORMER"
            ? clamp((power / Math.max(meta.ratedKw * 2, 1)) * 100, 0, 110)
            : undefined,
        gridConnected: !w.gridDisconnected,
        breakerClosed: !w.gridDisconnected,
        temperature: w.ambient + 10,
      },
      quality: "GOOD",
      alarms: [],
    };
    const cond = conditionAt(m, id, null);
    assetStates.push({
      assetId: id,
      timestamp,
      operationalStatus: status,
      condition: cond.condition,
      conditionScore: cond.score,
      power: Number(power.toFixed(2)),
      measurements: byAssetId[id]!.measurements,
    });
  }

  for (const id of meta.weatherIds) {
    byAssetId[id] = {
      assetId: id,
      timestamp,
      status: "RUNNING",
      measurements: {
        irradiance: w.ghi,
        poaIrradiance: w.poa,
        temperature: weather.ambientTemperature,
        moduleTemperature: weather.moduleTemperature,
        windSpeed: weather.windSpeed,
        windDirection: weather.windDirection,
        humidity: weather.humidity,
      },
      quality: "GOOD",
      alarms: [],
    };
    assetStates.push({
      assetId: id,
      timestamp,
      operationalStatus: "RUNNING",
      condition: "GOOD",
      conditionScore: 95,
      measurements: byAssetId[id]!.measurements,
    });
  }

  for (const id of meta.inverters) {
    const snap = byAssetId[id];
    if (!snap) continue;
    const share =
      plantPowerKw > 0
        ? (snap.measurements.activePower ?? 0) / plantPowerKw
        : 1 / Math.max(meta.inverters.length, 1);
    snap.measurements.energyToday = Number((energyTodayKwh * share).toFixed(2));
    const st = assetStates.find((a) => a.assetId === id);
    if (st) st.energy = snap.measurements.energyToday;
  }

  const plantState: HistoricalPlantState = {
    timestamp,
    plantPowerKw: Number(plantPowerKw.toFixed(2)),
    energyTodayKwh: Number(energyTodayKwh.toFixed(2)),
    availabilityPct: Number(availabilityPct.toFixed(1)),
    efficiencyPct: Number(efficiencyPct.toFixed(1)),
    ghi: w.ghi,
    poaIrradiance: w.poa,
    ambientTempC: weather.ambientTemperature,
    moduleTempC: weather.moduleTemperature,
    windSpeedMs: weather.windSpeed,
    gridStatus: w.gridDisconnected ? "DISCONNECTED" : "CONNECTED",
    gridExportKw: Number(gridExportKw.toFixed(2)),
    gridImportKw: 0,
    health,
    activeAlarmCount: alarms.filter((a) => a.active).length,
    simulated: true,
  };

  const electrical: HistoricalElectricalState = {
    timestamp,
    breakerClosedByAssetId: Object.fromEntries(
      [...meta.feeders, ...meta.gridIds].map((id) => [id, !w.gridDisconnected]),
    ),
    gridConnected: !w.gridDisconnected,
    feederOpenIds: w.gridDisconnected ? [...meta.feeders] : [],
  };

  return {
    timestamp,
    plant: plantState,
    assets: assetStates,
    weather,
    alarms,
    inspections: meta.inspections.filter(
      (i) => Date.parse(i.inspectionDate) <= tsMs,
    ),
    maintenance: meta.maintenance.map((rec) => ({
      ...rec,
      status:
        tsMs < Date.parse(rec.startTime)
          ? "PLANNED"
          : rec.endTime && tsMs >= Date.parse(rec.endTime)
            ? "COMPLETED"
            : tsMs >= Date.parse(rec.startTime)
              ? "IN_PROGRESS"
              : rec.status,
    })),
    electrical,
    events: meta.events.filter((e) => Date.parse(e.timestamp) <= tsMs),
    simulated: true,
  };
}

/**
 * Bundle used by the provider. Snapshots are not eagerly materialized —
 * use `buildMockSnapshotAt` / provider.getPlantState instead.
 */
export function buildMockHistoricalDay(
  ctx: MockHistoryContext,
): HistoricalDayBundle {
  const meta = buildMockHistoryMeta(ctx);
  const series = buildMockHistoricalSeries(meta);
  // Materialize only key demo timestamps for smoke / tests (not full day).
  const keyMinutes = [
    0, 8 * 60, 10 * 60 + 30, 12 * 60, 14 * 60 + 10, 14 * 60 + 37, 14 * 60 + 55,
    15 * 60, 15 * 60 + 30, 16 * 60 + 30, 16 * 60 + 35, 17 * 60 + 30, 23 * 60 + 59,
  ];
  const snapshots = keyMinutes.map((m) =>
    buildMockSnapshotAt(ctx, meta, m, series[m]?.energyTodayKwh ?? 0),
  );

  return {
    plantId: ctx.model.plantId,
    dayStartIso: iso(meta.dayStartMs),
    dayEndIso: iso(meta.dayEndMs),
    resolutionMs: MINUTE,
    snapshots,
    events: meta.events,
    maintenance: meta.maintenance,
    inspections: meta.inspections,
    series,
    simulated: true,
    label: DEMO_HISTORY_LABEL,
  };
}

export function demoHistoryDefaultTimestamp(): string {
  return `${DEMO_HISTORY_DAY}T14:37:00.000Z`;
}

export function minuteIndexFromTimestamp(
  meta: MockHistoryMeta,
  timestamp: string,
): number {
  const t = Date.parse(timestamp);
  if (!Number.isFinite(t)) return 0;
  const m = Math.round((t - meta.dayStartMs) / MINUTE);
  return clamp(m, 0, 24 * 60 - 1);
}
