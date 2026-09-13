/**
 * Phase 6 historical twin smoke test.
 * Run: npx --yes tsx scripts/smoke-history-runner.ts
 */

import type { TwinRecord } from "../src/lib/api";
import { snapshotToTelemetryStore } from "../src/lib/historicalBridge";
import { MockHistoricalDataProvider } from "../src/lib/historicalProvider";
import { DEMO_HISTORY_DAY } from "../src/lib/historyModel";
import { buildMockHistoricalDay } from "../src/lib/mockHistoricalData";
import { buildPlantTwinModel } from "../src/lib/plantTwin";
import { getPlantPowerKw } from "../src/lib/telemetry";

function sampleTwin(inverterCount: number): TwinRecord {
  return {
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
        numberOfInverters: String(inverterCount),
        numberOfBlocks: "4",
        gridVoltageKv: "33",
      },
    },
    derived: {
      dcCapacityMwp: 26,
      moduleCount: 4480,
      stringCount: 160,
      inverterCount,
      combinerCount: 40,
      tableCount: 160,
      siteWidthM: 800,
      siteDepthM: 600,
    },
  };
}

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

async function main() {
  const twin = sampleTwin(10);
  const model = buildPlantTwinModel(twin);
  const bundleA = buildMockHistoricalDay({ twin, model });
  const bundleB = buildMockHistoricalDay({ twin, model });

  assert(bundleA.snapshots.length === 1440, "expected 1440 minute snapshots");
  assert(
    bundleA.snapshots[100]!.plant.plantPowerKw ===
      bundleB.snapshots[100]!.plant.plantPowerKw,
    "historical data must be deterministic",
  );

  const noon = bundleA.snapshots.find((s) =>
    s.timestamp.includes("T12:00:00"),
  );
  assert(Boolean(noon), "noon snapshot missing");
  assert(
    (noon?.plant.plantPowerKw ?? 0) > 1000,
    "noon plant power should be generating",
  );

  const fault = bundleA.snapshots.find((s) =>
    s.timestamp.includes("T14:37:00"),
  );
  assert(Boolean(fault), "14:37 snapshot missing");
  const focus =
    fault?.assets.find((a) => a.assetId === "INV-005") ??
    fault?.assets.find((a) => a.operationalStatus === "FAULT");
  assert(Boolean(focus), "focus inverter fault missing at 14:37");
  assert(focus?.operationalStatus === "FAULT", "INV should be FAULT at 14:37");
  assert(
    (fault?.plant.plantPowerKw ?? 0) < (noon?.plant.plantPowerKw ?? 0),
    "plant power should drop after inverter fault",
  );

  const maint = bundleA.snapshots.find((s) =>
    s.timestamp.includes("T15:30:00"),
  );
  const maintAsset = maint?.assets.find(
    (a) => a.assetId === focus?.assetId,
  );
  assert(
    maintAsset?.operationalStatus === "MAINTENANCE",
    "inverter should be MAINTENANCE at 15:30",
  );
  assert((maintAsset?.power ?? 1) === 0, "maintenance power must be 0");

  const restored = bundleA.snapshots.find((s) =>
    s.timestamp.includes("T16:35:00"),
  );
  const restoredAsset = restored?.assets.find(
    (a) => a.assetId === focus?.assetId,
  );
  assert(
    restoredAsset?.operationalStatus === "RUNNING",
    "inverter should return RUNNING at 16:35",
  );

  // Energy must accumulate
  const morning = bundleA.snapshots.find((s) =>
    s.timestamp.includes("T10:00:00"),
  );
  const afternoon = bundleA.snapshots.find((s) =>
    s.timestamp.includes("T16:00:00"),
  );
  assert(
    (afternoon?.plant.energyTodayKwh ?? 0) >
      (morning?.plant.energyTodayKwh ?? 0),
    "energy must increase through the day",
  );

  // Topology-consistent plant power
  if (fault) {
    const telem = snapshotToTelemetryStore(fault, model);
    const summed = getPlantPowerKw(telem.byAssetId, model);
    assert(
      Math.abs(summed - fault.plant.plantPowerKw) < 1,
      "plant power must equal sum of inverter powers",
    );
  }

  const provider = new MockHistoricalDataProvider();
  await provider.ensure({
    twin,
    model,
    plantId: model.plantId,
  });
  const snap = await provider.getPlantState(
    model.plantId,
    `${DEMO_HISTORY_DAY}T14:37:00.000Z`,
  );
  assert(snap.simulated, "mock history must be labelled simulated");
  assert(snap.alarms.some((a) => a.active), "active alarms expected at fault");

  const events = await provider.getEvents(model.plantId);
  assert(
    events.some((e) => e.type === "FAULT"),
    "fault event expected on timeline",
  );
  assert(
    events.some((e) => e.type === "MAINTENANCE_START"),
    "maintenance start event expected",
  );

  console.log("Phase 6 historical smoke OK");
  console.log(
    `  day=${DEMO_HISTORY_DAY} snapshots=${bundleA.snapshots.length} events=${events.length}`,
  );
  console.log(
    `  14:37 power=${fault?.plant.plantPowerKw.toFixed(1)} kW status=${focus?.operationalStatus}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
