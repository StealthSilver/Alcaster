/**
 * Phase 5 condition / inspection smoke test.
 * Run: npx vite-node scripts/smoke-condition-runner.ts
 */

import type { TwinRecord } from "../src/lib/api";
import { buildConditionBundle } from "../src/lib/conditionBundle";
import { getConditionStore } from "../src/lib/conditionStore";
import { buildPlantTwinModel } from "../src/lib/plantTwin";

function sampleTwin(inverterCount: number): TwinRecord {
  return {
    id: "twin-smoke-p5",
    projectId: "proj-smoke-p5",
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
        terrainType: "hilly",
        averageSiteElevation: "420",
        averageSlopeDeg: "6",
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

function main() {
  const twin = sampleTwin(10);
  const model = buildPlantTwinModel(twin);
  const bundle = buildConditionBundle(twin, model);

  if (bundle.inspections.length < 2) {
    throw new Error("Expected mock inspections");
  }
  if (bundle.defects.length < 1) {
    throw new Error("Expected mock defects");
  }
  if (bundle.terrain.terrainType !== "HILLY") {
    throw new Error(`Expected HILLY terrain, got ${bundle.terrain.terrainType}`);
  }
  if (bundle.terrain.seed === 0) {
    throw new Error("Terrain seed should be deterministic non-zero");
  }

  const invs = model.order.filter(
    (id) => model.assets[id]?.assetType === "INVERTER",
  );
  const inv005 = invs.includes("INV-005")
    ? "INV-005"
    : invs[Math.min(4, invs.length - 1)]!;
  const cond = bundle.latestByAsset[inv005];
  if (!cond || cond.condition !== "DEGRADED") {
    throw new Error(`Expected ${inv005} DEGRADED, got ${cond?.condition}`);
  }
  if (cond.score !== 67) {
    throw new Error(`Expected score 67 for demo inverter, got ${cond.score}`);
  }

  const store = getConditionStore(twin.projectId);
  store.ensure(twin, model, "smoke");
  const state = store.getState()!;
  if (state.alarms.length < 1) {
    throw new Error("Expected inspection alarms from HIGH findings");
  }
  if (!state.alarms.every((a) => a.source === "INSPECTION")) {
    throw new Error("Inspection alarms must source=INSPECTION");
  }

  // Operational vs condition remain separate concepts in store
  const added = store.addInspection({
    assetId: invs[0]!,
    inspectionType: "VISUAL",
    inspectionDate: new Date().toISOString(),
    condition: "MINOR_ISSUE",
    finding: "Test finding",
    notes: "smoke",
  });
  if (!added.ok) throw new Error(added.error);

  // Determinism: same seed → same terrain
  const again = buildConditionBundle(twin, model);
  if (again.terrain.seed !== bundle.terrain.seed) {
    throw new Error("Terrain seed not deterministic");
  }

  console.log("Phase 5 condition smoke OK");
  console.log(
    JSON.stringify(
      {
        inspections: bundle.inspections.length,
        defects: bundle.defects.length,
        plantScore: bundle.plant.score,
        invDemo: inv005,
        invCondition: cond.condition,
        alarms: state.alarms.length,
        terrain: bundle.terrain.terrainType,
      },
      null,
      2,
    ),
  );
}

main();
