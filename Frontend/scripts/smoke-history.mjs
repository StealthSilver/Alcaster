/**
 * Phase 6 historical twin smoke test (Vite SSR loader for path aliases).
 * Run: node scripts/smoke-history.mjs
 */

import { createServer } from "vite";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const server = await createServer({
  root,
  configFile: path.join(root, "vite.config.ts"),
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

try {
  const { buildMockHistoryMeta, buildMockHistoricalSeries, buildMockSnapshotAt } =
    await server.ssrLoadModule("/src/lib/mockHistoricalData.ts");
  const { buildPlantTwinModel } = await server.ssrLoadModule(
    "/src/lib/plantTwin.ts",
  );
  const { snapshotToTelemetryStore } = await server.ssrLoadModule(
    "/src/lib/historicalBridge.ts",
  );
  const { MockHistoricalDataProvider } = await server.ssrLoadModule(
    "/src/lib/historicalProvider.ts",
  );
  const { DEMO_HISTORY_DAY } = await server.ssrLoadModule(
    "/src/lib/historyModel.ts",
  );
  const { getPlantPowerKw } = await server.ssrLoadModule(
    "/src/lib/telemetry/index.ts",
  );

  const twin = {
    id: "twin-smoke-p6",
    projectId: "proj-smoke-p6",
    organizationId: "org",
    createdBy: "smoke",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    spec: {
      capacityMw: 20,
      landAreaAcres: 100,
      usableLandPct: 80,
      latitude: 28.6,
      longitude: 77.2,
      dcAcRatio: 1.3,
      moduleWattageW: 550,
      moduleTech: "mono_perc",
      tiltDeg: 20,
      azimuthDeg: 180,
      mountingType: "single_axis",
      groundCoverageRatio: 0.45,
      modulesPerString: 28,
      inverterType: "string",
      inverterRatingKw: 1000,
      transformerMva: 5,
      mvVoltageKv: 33,
      gridVoltageKv: 33,
      includeBuilding: true,
      includeWeatherStation: true,
      includeFence: true,
      includeRoads: true,
      intake: {
        plantAcCapacity: "20",
        plantDcCapacity: "26",
        numberOfInverters: "10",
        numberOfBlocks: "4",
        gridVoltageKv: "33",
      },
    },
    derived: {
      dcCapacityMwp: 26,
      moduleCount: 4480,
      stringCount: 160,
      inverterCount: 10,
      combinerCount: 40,
      tableCount: 160,
      siteWidthM: 800,
      siteDepthM: 600,
    },
  };

  function assert(cond, message) {
    if (!cond) throw new Error(message);
  }

  const model = buildPlantTwinModel(twin);
  const ctx = { twin, model };
  const meta = buildMockHistoryMeta(ctx);
  const seriesA = buildMockHistoricalSeries(meta);
  const seriesB = buildMockHistoricalSeries(meta);

  assert(seriesA.length === 1440, "expected 1440 series points");
  assert(
    seriesA[100].powerKw === seriesB[100].powerKw,
    "historical data must be deterministic",
  );

  const noon = buildMockSnapshotAt(ctx, meta, 12 * 60, seriesA[12 * 60].energyTodayKwh);
  assert(noon.plant.plantPowerKw > 1000, "noon plant power should generate");

  const faultMin = 14 * 60 + 37;
  const fault = buildMockSnapshotAt(
    ctx,
    meta,
    faultMin,
    seriesA[faultMin].energyTodayKwh,
  );
  const focus =
    fault.assets.find((a) => a.assetId === "INV-005") ??
    fault.assets.find((a) => a.operationalStatus === "FAULT");
  assert(Boolean(focus), "focus inverter fault missing at 14:37");
  assert(focus.operationalStatus === "FAULT", "INV should be FAULT at 14:37");
  assert(
    fault.plant.plantPowerKw < noon.plant.plantPowerKw,
    "plant power should drop after inverter fault",
  );

  const maintMin = 15 * 60 + 30;
  const maint = buildMockSnapshotAt(
    ctx,
    meta,
    maintMin,
    seriesA[maintMin].energyTodayKwh,
  );
  const maintAsset = maint.assets.find((a) => a.assetId === focus.assetId);
  assert(
    maintAsset.operationalStatus === "MAINTENANCE",
    "inverter should be MAINTENANCE at 15:30",
  );
  assert(maintAsset.power === 0, "maintenance power must be 0");

  const restoredMin = 16 * 60 + 35;
  const restored = buildMockSnapshotAt(
    ctx,
    meta,
    restoredMin,
    seriesA[restoredMin].energyTodayKwh,
  );
  const restoredAsset = restored.assets.find(
    (a) => a.assetId === focus.assetId,
  );
  assert(
    restoredAsset.operationalStatus === "RUNNING",
    "inverter should return RUNNING at 16:35",
  );

  assert(
    seriesA[16 * 60].energyTodayKwh > seriesA[10 * 60].energyTodayKwh,
    "energy must increase through the day",
  );

  const telem = snapshotToTelemetryStore(fault, model);
  const summed = getPlantPowerKw(telem.byAssetId, model);
  assert(
    Math.abs(summed - fault.plant.plantPowerKw) < 1,
    "plant power must equal sum of inverter powers",
  );

  const provider = new MockHistoricalDataProvider();
  await provider.ensure({ twin, model, plantId: model.plantId });
  const snap = await provider.getPlantState(
    model.plantId,
    `${DEMO_HISTORY_DAY}T14:37:00.000Z`,
  );
  assert(snap.simulated, "mock history must be labelled simulated");
  assert(snap.alarms.some((a) => a.active), "active alarms expected at fault");

  const events = await provider.getEvents(model.plantId);
  assert(events.some((e) => e.type === "FAULT"), "fault event expected");
  assert(
    events.some((e) => e.type === "MAINTENANCE_START"),
    "maintenance start event expected",
  );

  console.log("Phase 6 historical smoke OK");
  console.log(
    `  day=${DEMO_HISTORY_DAY} series=${seriesA.length} events=${events.length}`,
  );
  console.log(
    `  14:37 power=${fault.plant.plantPowerKw.toFixed(1)} kW status=${focus.operationalStatus} asset=${focus.assetId}`,
  );
} finally {
  await server.close();
}
