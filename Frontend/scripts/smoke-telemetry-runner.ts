/**
 * Phase 4 telemetry smoke test.
 * Run: npx --yes tsx scripts/smoke-telemetry-runner.ts
 */

import type { TwinRecord } from "../src/lib/api";
import { buildPlantTwinModel } from "../src/lib/plantTwin";
import {
  buildTelemetryContext,
  MockTelemetryProvider,
  getPlantPowerKw,
} from "../src/lib/telemetry";

function sampleTwin(inverterCount: number): TwinRecord {
  return {
    id: "twin-smoke",
    projectId: "proj-smoke",
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

async function main() {
  // Force solar noon so day/night does not flake the smoke test.
  const noon = () => {
    const d = new Date();
    d.setHours(12, 30, 0, 0);
    return d;
  };

  const twin = sampleTwin(10);
  const model = buildPlantTwinModel(twin);
  const provider = new MockTelemetryProvider({
    updateIntervalMs: 50,
    now: noon,
  });
  await provider.connect(buildTelemetryContext(twin, model));

  await new Promise((r) => setTimeout(r, 180));
  const s1 = provider.getState();
  if (!s1.lastUpdated) throw new Error("No telemetry update");
  if (Object.keys(s1.byAssetId).length < 5) {
    throw new Error("Expected telemetry for key assets");
  }

  const invs = model.order.filter(
    (id) => model.assets[id]?.assetType === "INVERTER",
  );
  if (invs.length !== 10) {
    throw new Error(`Expected 10 inverters, got ${invs.length}`);
  }

  const plantFromSum = getPlantPowerKw(s1.byAssetId, model);
  if (Math.abs(plantFromSum - s1.plant.currentPowerKw) > 0.5) {
    throw new Error(
      `Plant power mismatch: sum=${plantFromSum} kpi=${s1.plant.currentPowerKw}`,
    );
  }
  if (s1.plant.currentPowerKw <= 0) {
    throw new Error("Expected daytime plant generation > 0");
  }

  const target = invs[0]!;
  const before = s1.plant.currentPowerKw;
  provider.forceAssetCondition?.(target, "fault");
  await new Promise((r) => setTimeout(r, 80));
  const s2 = provider.getState();
  if (s2.byAssetId[target]?.status !== "FAULT") {
    throw new Error("Fault scenario failed");
  }
  if ((s2.byAssetId[target]?.measurements.activePower ?? 1) !== 0) {
    throw new Error("Faulted inverter should have 0 power");
  }
  if (s2.plant.currentPowerKw >= before) {
    throw new Error("Plant power should decrease after inverter fault");
  }
  const activeFault = s2.alarms.some(
    (a) => a.active && a.assetId === target && a.code === "INV_FAULT",
  );
  if (!activeFault) throw new Error("Expected INV_FAULT alarm");

  provider.resetSimulation?.();
  await new Promise((r) => setTimeout(r, 80));
  const s3 = provider.getState();
  if (s3.scenario !== "normal") {
    throw new Error("Reset should restore normal scenario");
  }

  provider.setScenario?.("grid_disconnect");
  await new Promise((r) => setTimeout(r, 80));
  const s4 = provider.getState();
  if (s4.plant.gridConnected) throw new Error("Grid should be disconnected");
  if (s4.plant.currentPowerKw !== 0) {
    throw new Error("Export should be 0 on disconnect");
  }

  await provider.disconnect();
  const twin20 = sampleTwin(20);
  const model20 = buildPlantTwinModel(twin20);
  await provider.connect(buildTelemetryContext(twin20, model20));
  await new Promise((r) => setTimeout(r, 100));
  const s5 = provider.getState();
  const inv20 = Object.values(s5.byAssetId).filter(
    (snap) => model20.assets[snap.assetId]?.assetType === "INVERTER",
  );
  if (inv20.length !== 20) {
    throw new Error(
      `Expected 20 inverter telemetry states, got ${inv20.length}`,
    );
  }

  await provider.disconnect();
  console.log("Phase 4 telemetry smoke OK");
  console.log(
    JSON.stringify(
      {
        inverters10: invs.length,
        plantPowerKw: s1.plant.currentPowerKw,
        afterFaultKw: s2.plant.currentPowerKw,
        gridDisconnect: !s4.plant.gridConnected,
        inverters20: inv20.length,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
