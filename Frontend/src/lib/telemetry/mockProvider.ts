/**
 * MockTelemetryProvider — realistic solar plant simulation.
 * Single update loop → normalized TelemetrySnapshot store.
 */

import type { Asset, AssetModel, AssetType } from "@/lib/assetModel";
import {
  computeAvailabilityPct,
  countStatuses,
  countStatusesForTypes,
  getFeederPowerKw,
  getPlantPowerKw,
  getTransformerPowerKw,
  ratedInverterKw,
} from "./aggregation";
import { activeAlarms, plantHealthFromAlarms, upsertAlarm } from "./alarms";
import {
  DEFAULT_SIMULATION_CONFIG,
  type SimulationConfig,
} from "./config";
import type { TelemetryPlantContext, TelemetryProvider } from "./provider";
import type {
  AssetOperationalStatus,
  PlantKpis,
  SimulationScenario,
  StatusCounts,
  TelemetryQuality,
  TelemetrySnapshot,
  TelemetryStoreSnapshot,
} from "./types";
import { emptyStatusCounts } from "./aggregation";

const TELEMETRY_TYPES = new Set<AssetType>([
  "PLANT",
  "BLOCK",
  "INVERTER",
  "TRANSFORMER",
  "FEEDER",
  "SUBSTATION",
  "GRID_INTERCONNECTION",
  "WEATHER_STATION",
  "COMBINER",
]);

type ForcedCondition =
  | "fault"
  | "offline"
  | "high_temperature"
  | "communication_loss"
  | "clear";

type InternalState = {
  energyByAsset: Record<string, number>;
  energyDayKey: string;
  cloudPhase: number;
  ambientBase: number;
  forced: Record<string, ForcedCondition>;
  scenarioTargetAsset: string | null;
  lastTickMs: number;
};

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
  return Math.min(hi, Math.max(lo, n));
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Smooth solar irradiance factor 0–1 from local solar time. */
function solarFactor(date: Date): number {
  const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  // Approximate sunrise 6:00, peak 12:30, sunset 18:30
  const sunrise = 6;
  const sunset = 18.5;
  const peak = 12.5;
  if (hours <= sunrise || hours >= sunset) return 0;
  if (hours <= peak) {
    const t = (hours - sunrise) / (peak - sunrise);
    return Math.sin((t * Math.PI) / 2);
  }
  const t = (sunset - hours) / (sunset - peak);
  return Math.sin((t * Math.PI) / 2);
}

function emptyPlantKpis(now: string): PlantKpis {
  return {
    currentPowerKw: 0,
    energyTodayKwh: 0,
    availabilityPct: 100,
    efficiencyPct: 0,
    irradianceWm2: 0,
    ambientTempC: 25,
    windSpeedMs: 2,
    gridConnected: true,
    gridVoltageKv: 33,
    gridFrequencyHz: 50,
    activeAlarmCount: 0,
    health: "HEALTHY",
    timestamp: now,
  };
}

function emptyStore(providerId: string): TelemetryStoreSnapshot {
  return {
    byAssetId: {},
    plant: emptyPlantKpis(new Date().toISOString()),
    alarms: [],
    statusCounts: emptyStatusCounts(),
    inverterCounts: emptyStatusCounts(),
    blockCounts: emptyStatusCounts(),
    connection: "disconnected",
    scenario: "normal",
    paused: false,
    lastUpdated: null,
    providerId,
    error: null,
  };
}

export class MockTelemetryProvider implements TelemetryProvider {
  readonly id = "mock";

  private config: SimulationConfig;
  private context: TelemetryPlantContext | null = null;
  private subscribed = new Set<string>();
  private store: TelemetryStoreSnapshot = emptyStore("mock");
  private listeners = new Set<(state: TelemetryStoreSnapshot) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private internal: InternalState = {
    energyByAsset: {},
    energyDayKey: dayKey(new Date()),
    cloudPhase: 0,
    ambientBase: 28,
    forced: {},
    scenarioTargetAsset: null,
    lastTickMs: 0,
  };

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = { ...DEFAULT_SIMULATION_CONFIG, ...config };
    this.store.scenario = this.config.defaultScenario;
  }

  async connect(context: TelemetryPlantContext): Promise<void> {
    this.context = context;
    this.autoSubscribe(context.model);
    this.store = {
      ...this.store,
      connection: "simulated",
      error: null,
    };
    this.tick(true);
    this.startLoop();
    this.emit();
  }

  async disconnect(): Promise<void> {
    this.stopLoop();
    this.store = {
      ...this.store,
      connection: "disconnected",
    };
    this.emit();
  }

  setContext(context: TelemetryPlantContext): void {
    const prevIds = new Set(
      this.context
        ? Object.keys(this.context.model.assets)
        : [],
    );
    this.context = context;
    // Drop telemetry for removed assets
    const nextBy: Record<string, TelemetrySnapshot> = {};
    for (const [id, snap] of Object.entries(this.store.byAssetId)) {
      if (context.model.assets[id]) nextBy[id] = snap;
    }
    this.store = { ...this.store, byAssetId: nextBy };
    for (const id of Object.keys(this.internal.energyByAsset)) {
      if (!context.model.assets[id]) delete this.internal.energyByAsset[id];
    }
    this.autoSubscribe(context.model);
    // Clear forced conditions on deleted assets
    for (const id of Object.keys(this.internal.forced)) {
      if (!context.model.assets[id]) delete this.internal.forced[id];
    }
    // If plant grew, ensure new assets get energy slots
    for (const id of context.model.order) {
      if (!prevIds.has(id) && TELEMETRY_TYPES.has(context.model.assets[id]!.assetType)) {
        this.internal.energyByAsset[id] = this.internal.energyByAsset[id] ?? 0;
      }
    }
    this.tick(true);
  }

  subscribe(assetIds: string[]): void {
    for (const id of assetIds) this.subscribed.add(id);
  }

  unsubscribe(assetIds: string[]): void {
    for (const id of assetIds) this.subscribed.delete(id);
  }

  getLatest(assetId: string): TelemetrySnapshot | null {
    return this.store.byAssetId[assetId] ?? null;
  }

  getState(): TelemetryStoreSnapshot {
    return this.store;
  }

  onUpdate(listener: (state: TelemetryStoreSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setScenario(scenario: SimulationScenario): void {
    this.store = { ...this.store, scenario };
    this.internal.scenarioTargetAsset = this.pickScenarioTarget(
      this.context?.model ?? null,
      scenario,
    );
    // Clear previous forced from scenario when switching to normal
    if (scenario === "normal") {
      this.internal.forced = {};
    }
    this.tick(true);
  }

  setPaused(paused: boolean): void {
    this.store = { ...this.store, paused };
    if (paused) this.stopLoop();
    else this.startLoop();
    this.emit();
  }

  resetSimulation(): void {
    this.internal.forced = {};
    this.internal.scenarioTargetAsset = null;
    this.store = {
      ...this.store,
      scenario: "normal",
      paused: false,
      alarms: [],
      error: null,
    };
    this.startLoop();
    this.tick(true);
  }

  forceAssetCondition(assetId: string, condition: ForcedCondition): void {
    if (condition === "clear") {
      delete this.internal.forced[assetId];
    } else {
      this.internal.forced[assetId] = condition;
    }
    this.tick(true);
  }

  private autoSubscribe(model: AssetModel) {
    this.subscribed.clear();
    for (const id of model.order) {
      const asset = model.assets[id];
      if (asset && TELEMETRY_TYPES.has(asset.assetType)) {
        this.subscribed.add(id);
      }
    }
  }

  private startLoop() {
    this.stopLoop();
    if (this.store.paused) return;
    this.timer = setInterval(() => this.tick(false), this.config.updateIntervalMs);
  }

  private stopLoop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private emit() {
    const snapshot = this.store;
    for (const listener of this.listeners) listener(snapshot);
  }

  private pickScenarioTarget(
    model: AssetModel | null,
    scenario: SimulationScenario,
  ): string | null {
    if (!model) return null;
    const inverters = model.order.filter(
      (id) => model.assets[id]?.assetType === "INVERTER",
    );
    if (inverters.length === 0) return null;
    // Prefer INV-001 / first for demos; use 5th when available for "INV-005" demos
    if (
      scenario === "inverter_fault" ||
      scenario === "inverter_offline" ||
      scenario === "high_temperature" ||
      scenario === "communication_loss"
    ) {
      return inverters[Math.min(4, inverters.length - 1)] ?? inverters[0] ?? null;
    }
    return null;
  }

  private tick(force: boolean) {
    const ctx = this.context;
    if (!ctx) return;
    if (this.store.paused && !force) return;

    const nowDate = this.config.now?.() ?? new Date();
    const nowIso = nowDate.toISOString();
    const nowMs = nowDate.getTime();
    const dtHours =
      this.internal.lastTickMs > 0
        ? clamp((nowMs - this.internal.lastTickMs) / 3_600_000, 0, 0.01)
        : this.config.updateIntervalMs / 3_600_000;
    this.internal.lastTickMs = nowMs;

    const today = dayKey(nowDate);
    if (today !== this.internal.energyDayKey) {
      this.internal.energyDayKey = today;
      this.internal.energyByAsset = {};
    }

    // Advance cloud phase smoothly
    this.internal.cloudPhase += 0.08 + unit(`${nowIso}:cloudstep`) * 0.04;
    const cloud =
      1 -
      this.config.cloudVariation *
        (0.5 + 0.5 * Math.sin(this.internal.cloudPhase));

    let irradianceFactor = solarFactor(nowDate) * cloud;
    if (this.store.scenario === "low_irradiance") {
      irradianceFactor *= 0.25;
    }

    const peakGhi = 1000;
    const ghi = clamp(peakGhi * irradianceFactor, 0, 1100);
    const poa = ghi * (0.95 + 0.03 * Math.sin(this.internal.cloudPhase * 0.7));
    const isDay = ghi > 15;

    const ambient =
      this.internal.ambientBase +
      8 * irradianceFactor +
      (unit(`${nowIso}:amb`) - 0.5) * 0.4;
    const wind =
      2.5 +
      3 * (0.5 + 0.5 * Math.sin(this.internal.cloudPhase * 0.35)) +
      (unit(`${nowIso}:wind`) - 0.5) * 0.3;

    const gridDisconnected = this.store.scenario === "grid_disconnect";
    const ratedKw = this.context
      ? ratedInverterKw(ctx.model, ctx.capacityMw)
      : 1000;
    const invRating =
      ctx.inverterRatingKw && ctx.inverterRatingKw > 0
        ? ctx.inverterRatingKw
        : ratedKw;

    let alarms = [...this.store.alarms];
    const byAssetId: Record<string, TelemetrySnapshot> = {
      ...this.store.byAssetId,
    };

    const scenarioTarget =
      this.internal.scenarioTargetAsset ??
      this.pickScenarioTarget(ctx.model, this.store.scenario);
    this.internal.scenarioTargetAsset = scenarioTarget;

    // --- Weather ---
    for (const asset of assetsOfType(ctx.model, "WEATHER_STATION")) {
      if (!this.subscribed.has(asset.assetId)) continue;
      byAssetId[asset.assetId] = {
        assetId: asset.assetId,
        timestamp: nowIso,
        status: "RUNNING",
        quality: "GOOD",
        measurements: {
          irradiance: round(ghi, 1),
          poaIrradiance: round(poa, 1),
          temperature: round(ambient, 1),
          moduleTemperature: round(ambient + 18 * irradianceFactor, 1),
          windSpeed: round(wind, 1),
          windDirection: round(
            (hash32(asset.assetId) % 360) +
              20 * Math.sin(this.internal.cloudPhase * 0.2),
            0,
          ),
          humidity: round(45 + 20 * (1 - irradianceFactor), 0),
        },
        alarms: [],
      };
    }

    // --- Inverters (primary power source) ---
    for (const asset of assetsOfType(ctx.model, "INVERTER")) {
      if (!this.subscribed.has(asset.assetId)) continue;
      const snap = this.simulateInverter({
        asset,
        nowIso,
        ghi,
        poa,
        isDay,
        ambient,
        invRating,
        dtHours,
        gridDisconnected,
        scenarioTarget,
        previous: byAssetId[asset.assetId],
      });
      byAssetId[asset.assetId] = snap.snapshot;
      alarms = snap.alarms.reduce(
        (acc, a) =>
          upsertAlarm(acc, {
            assetId: a.assetId,
            code: a.code,
            severity: a.severity,
            message: a.message,
            active: a.active,
            now: nowIso,
          }),
        alarms,
      );
    }

    // Plant AC from inverters
    const plantPowerKw = gridDisconnected
      ? 0
      : getPlantPowerKw(byAssetId, ctx.model);

    // --- Transformers ---
    for (const asset of assetsOfType(ctx.model, "TRANSFORMER")) {
      if (!this.subscribed.has(asset.assetId)) continue;
      const powerKw = gridDisconnected
        ? 0
        : getTransformerPowerKw(byAssetId, ctx.model, asset.assetId);
      const ratingMva =
        Number(asset.metadata.ratingMva) ||
        Math.max(1, (ctx.capacityMw / Math.max(1, ctx.model.counts.transformers)) * 1.1);
      const ratingKw = ratingMva * 1000;
      const loadPct = clamp((powerKw / ratingKw) * 100, 0, 120);
      const temp = ambient + 12 + loadPct * 0.25;
      let status: AssetOperationalStatus = gridDisconnected
        ? "IDLE"
        : powerKw > 1
          ? "RUNNING"
          : isDay
            ? "IDLE"
            : "IDLE";
      if (temp > this.config.tempWarningC) status = "WARNING";
      if (temp > this.config.tempCriticalC) status = "FAULT";
      if (loadPct > this.config.transformerLoadWarningPct && status === "RUNNING") {
        status = "WARNING";
      }

      this.internal.energyByAsset[asset.assetId] =
        (this.internal.energyByAsset[asset.assetId] ?? 0) + powerKw * dtHours;

      byAssetId[asset.assetId] = {
        assetId: asset.assetId,
        timestamp: nowIso,
        status,
        quality: "GOOD",
        measurements: {
          activePower: round(powerKw, 2),
          voltage: (ctx.gridVoltageKv || 33) * 1000,
          current: powerKw > 0 ? round((powerKw * 1000) / ((ctx.gridVoltageKv || 33) * 1000 * 1.732), 1) : 0,
          temperature: round(temp, 1),
          loadPercent: round(loadPct, 1),
          frequency: 50 + (unit(`${nowIso}:${asset.assetId}:f`) - 0.5) * 0.04,
          energyToday: round(this.internal.energyByAsset[asset.assetId], 2),
        },
        alarms: [],
      };

      alarms = upsertAlarm(alarms, {
        assetId: asset.assetId,
        code: "TRF_HIGH_TEMP",
        severity: temp > this.config.tempCriticalC ? "CRITICAL" : "WARNING",
        message:
          temp > this.config.tempCriticalC
            ? "Transformer overtemperature"
            : "High transformer temperature",
        active: temp > this.config.tempWarningC,
        now: nowIso,
      });
    }

    // --- Feeders ---
    for (const asset of assetsOfType(ctx.model, "FEEDER")) {
      if (!this.subscribed.has(asset.assetId)) continue;
      const powerKw = gridDisconnected
        ? 0
        : getFeederPowerKw(byAssetId, ctx.model, asset.assetId);
      this.internal.energyByAsset[asset.assetId] =
        (this.internal.energyByAsset[asset.assetId] ?? 0) + powerKw * dtHours;
      byAssetId[asset.assetId] = {
        assetId: asset.assetId,
        timestamp: nowIso,
        status: gridDisconnected ? "IDLE" : powerKw > 1 ? "RUNNING" : "IDLE",
        quality: "GOOD",
        measurements: {
          activePower: round(powerKw, 2),
          voltage: (ctx.gridVoltageKv || 33) * 1000,
          energyToday: round(this.internal.energyByAsset[asset.assetId], 2),
        },
        alarms: [],
      };
    }

    // --- Substation / Grid ---
    const gridVoltageKv = ctx.gridVoltageKv || 33;
    const frequency =
      50 + (unit(`${nowIso}:gridf`) - 0.5) * (gridDisconnected ? 0 : 0.04);
    const exportKw = gridDisconnected ? 0 : plantPowerKw;
    const pf = exportKw > 0 ? 0.98 + (unit(`${nowIso}:pf`) - 0.5) * 0.01 : 1;

    for (const asset of assetsOfType(ctx.model, "SUBSTATION")) {
      if (!this.subscribed.has(asset.assetId)) continue;
      byAssetId[asset.assetId] = {
        assetId: asset.assetId,
        timestamp: nowIso,
        status: gridDisconnected ? "WARNING" : exportKw > 1 ? "RUNNING" : "IDLE",
        quality: "GOOD",
        measurements: {
          activePower: round(exportKw, 2),
          reactivePower: round(exportKw * Math.tan(Math.acos(clamp(pf, 0.9, 1))), 2),
          voltage: gridVoltageKv * 1000,
          frequency: round(frequency, 3),
          powerFactor: round(pf, 3),
          current:
            exportKw > 0
              ? round((exportKw * 1000) / (gridVoltageKv * 1000 * 1.732), 1)
              : 0,
          gridConnected: !gridDisconnected,
          breakerClosed: !gridDisconnected,
          exportPower: round(exportKw, 2),
          importPower: 0,
          energyToday: round(
            (this.internal.energyByAsset[asset.assetId] =
              (this.internal.energyByAsset[asset.assetId] ?? 0) +
              exportKw * dtHours),
            2,
          ),
        },
        alarms: [],
      };
    }

    for (const asset of assetsOfType(ctx.model, "GRID_INTERCONNECTION")) {
      if (!this.subscribed.has(asset.assetId)) continue;
      byAssetId[asset.assetId] = {
        assetId: asset.assetId,
        timestamp: nowIso,
        status: gridDisconnected ? "FAULT" : "RUNNING",
        quality: "GOOD",
        measurements: {
          activePower: round(exportKw, 2),
          voltage: gridVoltageKv * 1000,
          frequency: round(frequency, 3),
          powerFactor: round(pf, 3),
          gridConnected: !gridDisconnected,
          breakerClosed: !gridDisconnected,
          exportPower: round(exportKw, 2),
          importPower: 0,
        },
        alarms: [],
      };
    }

    alarms = upsertAlarm(alarms, {
      assetId:
        assetsOfType(ctx.model, "GRID_INTERCONNECTION")[0]?.assetId ??
        assetsOfType(ctx.model, "SUBSTATION")[0]?.assetId ??
        "GRID-001",
      code: "GRID_DISCONNECT",
      severity: "CRITICAL",
      message: "Grid disconnected",
      active: gridDisconnected,
      now: nowIso,
    });

    // --- Blocks (aggregated) ---
    const blockAssets = assetsOfType(ctx.model, "BLOCK");
    const invs = assetsOfType(ctx.model, "INVERTER");
    for (let bi = 0; bi < blockAssets.length; bi += 1) {
      const block = blockAssets[bi]!;
      if (!this.subscribed.has(block.assetId)) continue;
      // Assign inverters round-robin to blocks when no explicit mapping
      const assigned = invs.filter((_, i) => i % Math.max(1, blockAssets.length) === bi);
      const power = assigned.reduce(
        (s, inv) => s + (byAssetId[inv.assetId]?.measurements.activePower ?? 0),
        0,
      );
      const statuses = assigned.map(
        (inv) => byAssetId[inv.assetId]?.status ?? "UNKNOWN",
      );
      const status = statuses.length
        ? statuses.reduce((a, b) =>
            statusRank(b) > statusRank(a) ? b : a,
          )
        : "IDLE";
      const active = assigned.filter(
        (inv) =>
          byAssetId[inv.assetId]?.status === "RUNNING" ||
          byAssetId[inv.assetId]?.status === "WARNING",
      ).length;

      this.internal.energyByAsset[block.assetId] =
        (this.internal.energyByAsset[block.assetId] ?? 0) + power * dtHours;

      byAssetId[block.assetId] = {
        assetId: block.assetId,
        timestamp: nowIso,
        status,
        quality: "GOOD",
        measurements: {
          activePower: round(power, 2),
          energyToday: round(this.internal.energyByAsset[block.assetId], 2),
          efficiency: round(
            assigned.length
              ? assigned.reduce(
                  (s, inv) =>
                    s + (byAssetId[inv.assetId]?.measurements.efficiency ?? 0),
                  0,
                ) / assigned.length
              : 0,
            1,
          ),
          loadPercent: round(
            assigned.length ? (active / assigned.length) * 100 : 0,
            1,
          ),
        },
        alarms: [],
      };
      // Annotate active inverter fraction in measurements via loadPercent
      void active;
    }

    // --- Combiners (light aggregate from downstream inverter if known) ---
    for (const asset of assetsOfType(ctx.model, "COMBINER")) {
      if (!this.subscribed.has(asset.assetId)) continue;
      const prev = byAssetId[asset.assetId];
      const share = (ghi / 1000) * (invRating * 0.15) * (0.9 + unit(asset.assetId) * 0.1);
      const power = gridDisconnected || !isDay ? 0 : share;
      byAssetId[asset.assetId] = {
        assetId: asset.assetId,
        timestamp: nowIso,
        status: power > 0.5 ? "RUNNING" : "IDLE",
        quality: prev?.quality === "BAD" ? "BAD" : "GOOD",
        measurements: {
          activePower: round(power, 2),
          dcPower: round(power / 0.98, 2),
          voltage: round(600 + unit(`${asset.assetId}:v`) * 40, 0),
        },
        alarms: [],
      };
    }

    // --- Plant root ---
    for (const asset of assetsOfType(ctx.model, "PLANT")) {
      if (!this.subscribed.has(asset.assetId)) continue;
      this.internal.energyByAsset[asset.assetId] =
        (this.internal.energyByAsset[asset.assetId] ?? 0) + plantPowerKw * dtHours;
      byAssetId[asset.assetId] = {
        assetId: asset.assetId,
        timestamp: nowIso,
        status: gridDisconnected
          ? "WARNING"
          : plantPowerKw > 1
            ? "RUNNING"
            : "IDLE",
        quality: "GOOD",
        measurements: {
          activePower: round(plantPowerKw, 2),
          energyToday: round(this.internal.energyByAsset[asset.assetId], 2),
          irradiance: round(ghi, 1),
          temperature: round(ambient, 1),
          windSpeed: round(wind, 1),
          gridConnected: !gridDisconnected,
          exportPower: round(exportKw, 2),
        },
        alarms: [],
      };
    }

    // Attach per-asset active alarms onto snapshots
    for (const id of Object.keys(byAssetId)) {
      const snap = byAssetId[id]!;
      byAssetId[id] = {
        ...snap,
        alarms: alarms.filter((a) => a.active && a.assetId === id),
      };
    }

    const availability = computeAvailabilityPct(byAssetId, ctx.model, invRating);
    const expectedDc =
      (ctx.dcCapacityMwp * 1000) * (ghi / 1000) * (isDay ? 1 : 0);
    const efficiency =
      expectedDc > 10
        ? clamp((plantPowerKw / expectedDc) * 100, 0, 99.5)
        : isDay
          ? this.config.plantEfficiencyNominal * 100
          : 0;

    const active = activeAlarms(alarms);
    const plant: PlantKpis = {
      currentPowerKw: round(plantPowerKw, 2),
      energyTodayKwh: round(
        this.internal.energyByAsset[
          assetsOfType(ctx.model, "PLANT")[0]?.assetId ?? "__plant__"
        ] ??
          Object.values(byAssetId)
            .filter((s) => ctx.model.assets[s.assetId]?.assetType === "INVERTER")
            .reduce((s, x) => s + (x.measurements.energyToday ?? 0), 0),
        2,
      ),
      availabilityPct: round(availability, 1),
      efficiencyPct: round(efficiency, 1),
      irradianceWm2: round(ghi, 1),
      ambientTempC: round(ambient, 1),
      windSpeedMs: round(wind, 1),
      gridConnected: !gridDisconnected,
      gridVoltageKv,
      gridFrequencyHz: round(frequency, 3),
      activeAlarmCount: active.length,
      health: plantHealthFromAlarms(alarms),
      timestamp: nowIso,
    };

    // Ensure plant energy accumulates even without PLANT asset
    if (!assetsOfType(ctx.model, "PLANT")[0]) {
      this.internal.energyByAsset["__plant__"] =
        (this.internal.energyByAsset["__plant__"] ?? 0) + plantPowerKw * dtHours;
      plant.energyTodayKwh = round(this.internal.energyByAsset["__plant__"], 2);
    }

    const statusCounts = countStatuses(Object.values(byAssetId));
    const inverterCounts = countStatusesForTypes(byAssetId, ctx.model, [
      "INVERTER",
    ]);
    const blockCounts = countStatusesForTypes(byAssetId, ctx.model, ["BLOCK"]);

    this.store = {
      ...this.store,
      byAssetId,
      plant,
      alarms,
      statusCounts,
      inverterCounts,
      blockCounts,
      lastUpdated: nowIso,
      connection: "simulated",
      error: null,
    };
    this.emit();
  }

  private simulateInverter(args: {
    asset: Asset;
    nowIso: string;
    ghi: number;
    poa: number;
    isDay: boolean;
    ambient: number;
    invRating: number;
    dtHours: number;
    gridDisconnected: boolean;
    scenarioTarget: string | null;
    previous?: TelemetrySnapshot;
  }): {
    snapshot: TelemetrySnapshot;
    alarms: Array<{
      assetId: string;
      code: string;
      severity: "INFO" | "WARNING" | "CRITICAL";
      message: string;
      active: boolean;
    }>;
  } {
    const {
      asset,
      nowIso,
      ghi,
      poa,
      isDay,
      ambient,
      invRating,
      dtHours,
      gridDisconnected,
      scenarioTarget,
      previous,
    } = args;
    const id = asset.assetId;
    const alarms: Array<{
      assetId: string;
      code: string;
      severity: "INFO" | "WARNING" | "CRITICAL";
      message: string;
      active: boolean;
    }> = [];

    const bias = 0.92 + unit(id) * 0.08;
    const noise =
      1 +
      (unit(`${nowIso}:${id}:n`) - 0.5) * this.config.noiseAmplitude * 2;

    let forced = this.internal.forced[id];
    if (!forced && scenarioTarget === id) {
      if (this.store.scenario === "inverter_fault") forced = "fault";
      else if (this.store.scenario === "inverter_offline") forced = "offline";
      else if (this.store.scenario === "high_temperature")
        forced = "high_temperature";
      else if (this.store.scenario === "communication_loss")
        forced = "communication_loss";
    }

    let quality: TelemetryQuality = "GOOD";
    let status: AssetOperationalStatus = "RUNNING";
    let temperature =
      ambient +
      12 +
      (ghi / 1000) * 22 +
      (unit(`${nowIso}:${id}:t`) - 0.5) * 1.2;

    if (forced === "high_temperature") {
      temperature = this.config.tempWarningC + 8 + unit(`${nowIso}:ht`) * 6;
    }
    if (forced === "communication_loss") {
      quality = "BAD";
      // Retain last known measurements
      const retained = previous
        ? {
            ...previous,
            timestamp: previous.timestamp,
            status: "UNKNOWN" as AssetOperationalStatus,
            quality: "BAD" as TelemetryQuality,
            alarms: [],
          }
        : null;
      alarms.push({
        assetId: id,
        code: "COMM_LOSS",
        severity: "WARNING",
        message: "Communication lost",
        active: true,
      });
      if (retained) {
        return {
          snapshot: {
            ...retained,
            status: "UNKNOWN",
            quality: "BAD",
            // Keep last known values; do not advance energy
            measurements: { ...retained.measurements },
          },
          alarms,
        };
      }
      status = "UNKNOWN";
    }

    let dcPower = 0;
    let acPower = 0;
    const efficiency =
      this.config.inverterEfficiency * 100 -
      (temperature > 50 ? (temperature - 50) * 0.05 : 0) +
      (unit(`${nowIso}:${id}:eff`) - 0.5) * 0.4;

    if (forced === "fault") {
      status = "FAULT";
      dcPower = 0;
      acPower = 0;
      alarms.push({
        assetId: id,
        code: "INV_FAULT",
        severity: "CRITICAL",
        message: "Inverter fault",
        active: true,
      });
    } else if (forced === "offline") {
      status = "OFFLINE";
      dcPower = 0;
      acPower = 0;
      alarms.push({
        assetId: id,
        code: "INV_OFFLINE",
        severity: "WARNING",
        message: "Inverter offline",
        active: true,
      });
    } else if (gridDisconnected) {
      status = "IDLE";
      dcPower = 0;
      acPower = 0;
    } else if (!isDay) {
      status = "IDLE";
      dcPower = 0;
      acPower = 0;
    } else {
      dcPower = clamp(invRating * (poa / 1000) * bias * noise * 1.05, 0, invRating * 1.15);
      acPower = clamp(dcPower * (efficiency / 100), 0, invRating * 1.05);
      status = acPower > invRating * 0.02 ? "RUNNING" : "IDLE";
    }

    // Temperature-derived status (unless already fault/offline)
    if (status !== "FAULT" && status !== "OFFLINE") {
      if (temperature >= this.config.tempCriticalC) {
        status = "FAULT";
        acPower = 0;
        dcPower = 0;
        alarms.push({
          assetId: id,
          code: "INV_OVERTEMP",
          severity: "CRITICAL",
          message: "Inverter overtemperature",
          active: true,
        });
      } else if (temperature >= this.config.tempWarningC) {
        status = "WARNING";
        alarms.push({
          assetId: id,
          code: "INV_HIGH_TEMP",
          severity: "WARNING",
          message: "High inverter temperature",
          active: true,
        });
      } else {
        alarms.push({
          assetId: id,
          code: "INV_HIGH_TEMP",
          severity: "WARNING",
          message: "High inverter temperature",
          active: false,
        });
        alarms.push({
          assetId: id,
          code: "INV_OVERTEMP",
          severity: "CRITICAL",
          message: "Inverter overtemperature",
          active: false,
        });
      }
    }

    // Clear fault/offline alarms when not forced
    if (forced !== "fault") {
      alarms.push({
        assetId: id,
        code: "INV_FAULT",
        severity: "CRITICAL",
        message: "Inverter fault",
        active: false,
      });
    }
    if (forced !== "offline") {
      alarms.push({
        assetId: id,
        code: "INV_OFFLINE",
        severity: "WARNING",
        message: "Inverter offline",
        active: false,
      });
    }
    if (forced !== "communication_loss") {
      alarms.push({
        assetId: id,
        code: "COMM_LOSS",
        severity: "WARNING",
        message: "Communication lost",
        active: false,
      });
    }

    this.internal.energyByAsset[id] =
      (this.internal.energyByAsset[id] ?? 0) + acPower * dtHours;

    const dcVoltage = isDay && acPower > 0 ? 920 + unit(`${id}:vd`) * 80 : 0;
    const dcCurrent = dcVoltage > 0 ? (dcPower * 1000) / dcVoltage : 0;
    const acVoltage = acPower > 0 ? 790 + unit(`${id}:va`) * 20 : 0;
    const acCurrent = acVoltage > 0 ? (acPower * 1000) / (acVoltage * 1.732) : 0;

    return {
      snapshot: {
        assetId: id,
        timestamp: nowIso,
        status,
        quality,
        measurements: {
          activePower: round(acPower, 2),
          dcPower: round(dcPower, 2),
          dcVoltage: round(dcVoltage, 0),
          dcCurrent: round(dcCurrent, 1),
          acVoltage: round(acVoltage, 0),
          acCurrent: round(acCurrent, 1),
          voltage: round(acVoltage, 0),
          current: round(acCurrent, 1),
          temperature: round(temperature, 1),
          efficiency: round(clamp(efficiency, 0, 99.5), 1),
          energyToday: round(this.internal.energyByAsset[id], 2),
          irradiance: round(ghi, 1),
          poaIrradiance: round(poa, 1),
        },
        alarms: [],
      },
      alarms,
    };
  }
}

function assetsOfType(model: AssetModel, type: AssetType): Asset[] {
  const out: Asset[] = [];
  for (const id of model.order) {
    const a = model.assets[id];
    if (a?.assetType === type) out.push(a);
  }
  return out;
}

function round(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function statusRank(status: AssetOperationalStatus): number {
  switch (status) {
    case "FAULT":
      return 100;
    case "WARNING":
      return 80;
    case "OFFLINE":
      return 60;
    case "UNKNOWN":
      return 50;
    case "IDLE":
      return 20;
    case "RUNNING":
    default:
      return 10;
  }
}

export function createEmptyStatusCounts(): StatusCounts {
  return emptyStatusCounts();
}
