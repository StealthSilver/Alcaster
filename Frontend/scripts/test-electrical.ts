/**
 * Quick Phase 3 electrical topology smoke test.
 * Run: npx vite-node scripts/test-electrical.ts
 */
import { buildPlantAssets } from "../src/lib/plantTwin";
import {
  getElectricalPath,
  getImmediateDownstream,
  getImmediateUpstream,
} from "../src/lib/electricalModel";
import type { TwinRecord } from "../src/lib/api";

function twin(overrides: Record<string, unknown> = {}): TwinRecord {
  const capacityMw = Number(overrides.capacityMw ?? 20);
  const moduleWattageW = 550;
  const dcAcRatio = 1.3;
  const modulesPerString = Number(overrides.modulesPerString ?? 28);
  const intake: Record<string, string> = {
    projectName: "Test Plant",
    plantAcCapacity: String(capacityMw),
    plantDcCapacity: String(capacityMw * dcAcRatio),
    totalModules: String(
      overrides.totalModules ??
        Math.round((capacityMw * dcAcRatio * 1e6) / moduleWattageW),
    ),
    modulesPerTable: String(overrides.modulesPerTable ?? 26),
    numberOfSolarBlocks: String(overrides.blocks ?? 2),
    numberOfInverters: String(overrides.inverters ?? 4),
    numberOfTransformers: String(overrides.transformers ?? 1),
    modulesPerString: String(modulesPerString),
    stringsPerCombiner: String(overrides.stringsPerCombiner ?? 16),
    invertersPerTransformer: String(overrides.invertersPerTransformer ?? 4),
    transformersPerFeeder: String(overrides.transformersPerFeeder ?? 2),
    numberOfMvFeeders: String(overrides.feeders ?? 1),
    substationPresent: "yes",
    numberOfSubstations: "1",
  };
  return {
    id: "twin-test",
    organizationId: "org",
    projectId: "proj",
    createdBy: "u",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    spec: {
      capacityMw,
      landAreaAcres: capacityMw * 4.5,
      usableLandPct: 85,
      latitude: 28,
      longitude: 77,
      dcAcRatio,
      moduleWattageW,
      moduleTech: "mono_perc",
      tiltDeg: 22,
      azimuthDeg: 180,
      mountingType: "fixed_tilt",
      groundCoverageRatio: 0.4,
      modulesPerString,
      inverterType: "central",
      inverterRatingKw: Math.round(
        (capacityMw * 1000) / Number(intake.numberOfInverters),
      ),
      transformerMva: 25,
      mvVoltageKv: 33,
      gridVoltageKv: 132,
      includeBuilding: true,
      includeWeatherStation: true,
      includeFence: true,
      includeRoads: true,
      intake,
    },
    derived: {
      dcCapacityMwp: capacityMw * dcAcRatio,
      moduleCount: Number(intake.totalModules),
      stringCount: Math.ceil(Number(intake.totalModules) / modulesPerString),
      inverterCount: Number(intake.numberOfInverters),
      combinerCount: 8,
      tableCount: Math.ceil(
        Number(intake.totalModules) / Number(intake.modulesPerTable),
      ),
      siteWidthM: 400,
      siteDepthM: 300,
    },
  };
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const small = twin({
  capacityMw: 1,
  totalModules: 52,
  modulesPerTable: 26,
  blocks: 1,
  inverters: 1,
  transformers: 1,
  modulesPerString: 13,
  stringsPerCombiner: 4,
  feeders: 1,
});
const smallModel = buildPlantAssets(small);
const e = smallModel.electrical!;
console.log(
  "SMALL",
  e.counts,
  "conns",
  e.connections.length,
  "err",
  e.error,
  "val",
  e.validation.errors.length,
  e.validation.warnings.length,
);
assert(!e.error, "no electrical error: " + e.error);
assert(e.counts.strings >= 4, "expected strings got " + e.counts.strings);
assert(e.counts.inverters === 1, "1 inverter got " + e.counts.inverters);
assert(e.counts.feeders >= 1, "feeder");
assert(e.counts.gridConnections >= 1, "grid");
assert(smallModel.assets["STR-001"], "STR-001 exists");
assert(smallModel.assets["FDR-001"], "FDR-001 exists");

const modPath = getElectricalPath(e, "MOD-001");
console.log("MOD-001 path", modPath.fullPath.join(" → "));
assert(modPath.fullPath.includes("MOD-001"), "mod in path");
assert(modPath.fullPath.includes("STR-001"), "string after module");
assert(modPath.fullPath.includes("INV-001"), "inv in path");
assert(modPath.fullPath.includes("TRF-001"), "trf in path");
assert(modPath.fullPath.includes("FDR-001"), "fdr in path");
assert(
  modPath.fullPath.some((x) => x.startsWith("SUB")),
  "sub in path",
);
assert(modPath.fullPath.includes("GRID-001"), "grid in path");

const invUp = getImmediateUpstream(e, "INV-001");
const invDown = getImmediateDownstream(e, "INV-001");
console.log("INV-001 up", invUp, "down", invDown);
assert(
  invUp.some((id) => id.startsWith("CB-")),
  "combiner upstream of inv",
);
assert(
  invDown.some((id) => id.startsWith("TRF-")),
  "trf downstream of inv",
);

const trfPath = getElectricalPath(e, "TRF-001");
console.log("TRF-001 up", trfPath.upstream.slice(0, 8), "down", trfPath.downstream);

const med = twin({
  capacityMw: 20,
  inverters: 8,
  transformers: 2,
  blocks: 4,
  modulesPerString: 28,
});
const medModel = buildPlantAssets(med);
console.log(
  "MED",
  medModel.electrical!.counts,
  "conns",
  medModel.electrical!.connections.length,
);

const med2 = twin({ capacityMw: 20, inverters: 20, transformers: 5, blocks: 4 });
const med2Model = buildPlantAssets(med2);
console.log(
  "REBUILD 20 INV",
  med2Model.electrical!.counts,
  "layout inv",
  med2Model.counts.inverters,
);
assert(med2Model.counts.inverters === 20, "20 inverter assets");

console.log("ALL TESTS PASSED");
