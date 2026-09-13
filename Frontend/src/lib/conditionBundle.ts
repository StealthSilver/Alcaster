/**
 * Phase 5 — Deterministic mock inspection / condition bundle for a plant.
 * Demo narrative targets INV-005, BLK-004, and a few supporting findings.
 */

import type { TwinRecord } from "@/lib/api";
import type { AssetModel } from "@/lib/assetModel";
import {
  computePlantConditionSummary,
  conditionToScore,
  deriveConditionFromDefects,
  type AssetDefect,
  type ConditionRecord,
  type PlantConditionSummary,
  type SoilingCondition,
  type VegetationCondition,
} from "@/lib/conditionModel";
import type { InspectionRecord } from "@/lib/inspectionModel";
import { buildTerrainModel, type TerrainModel } from "@/lib/terrainModel";
import { resolveTwinPlant } from "@/lib/twinPlant";

export type ConditionBundle = {
  inspections: InspectionRecord[];
  defects: AssetDefect[];
  latestByAsset: Record<string, ConditionRecord>;
  vegetation: VegetationCondition[];
  soiling: SoilingCondition[];
  plant: PlantConditionSummary;
  terrain: TerrainModel;
  generatedAt: string;
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

function pickId(
  ids: string[],
  prefer: string | null,
  fallbackIndex: number,
): string | null {
  if (prefer && ids.includes(prefer)) return prefer;
  if (ids.length === 0) return null;
  return ids[Math.min(fallbackIndex, ids.length - 1)] ?? ids[0] ?? null;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 30, 0, 0);
  return d.toISOString();
}

export function buildConditionBundle(
  twin: TwinRecord,
  model: AssetModel,
): ConditionBundle {
  const plant = resolveTwinPlant(twin.spec, twin.derived);
  const terrain = buildTerrainModel(twin, plant);
  const seed = `${twin.projectId}|${model.plantId}|phase5`;
  const now = new Date().toISOString();

  const inverters = model.order.filter(
    (id) => model.assets[id]?.assetType === "INVERTER",
  );
  const transformers = model.order.filter(
    (id) => model.assets[id]?.assetType === "TRANSFORMER",
  );
  const blocks = model.order.filter(
    (id) => model.assets[id]?.assetType === "BLOCK",
  );
  const modules = model.order.filter(
    (id) => model.assets[id]?.assetType === "MODULE",
  );
  const combiners = model.order.filter(
    (id) => model.assets[id]?.assetType === "COMBINER",
  );

  const inv005 = pickId(inverters, "INV-005", 4);
  const inv001 = pickId(inverters, "INV-001", 0);
  const trf002 = pickId(transformers, "TRF-002", 1);
  const blk004 = pickId(blocks, "BLK-004", 3);
  const modSample =
    modules.find((id) => id.includes("247")) ??
    pickId(modules, null, Math.floor(modules.length * 0.15));

  const inspections: InspectionRecord[] = [];
  const defects: AssetDefect[] = [];

  if (inv005) {
    const inspId = `INSP-${inv005}-001`;
    inspections.push({
      inspectionId: inspId,
      assetId: inv005,
      inspectionType: "VISUAL",
      inspectionDate: daysAgo(1),
      inspector: "A. Sharma",
      status: "COMPLETED",
      condition: "DEGRADED",
      notes: "Cabinet inspection — cooling path restricted, surface corrosion.",
      findings: ["Cooling system issue", "Cabinet corrosion"],
      evidence: [
        {
          evidenceId: `EV-${inv005}-1`,
          type: "IMAGE",
          fileName: `${inv005}-cabinet.jpg`,
          capturedAt: daysAgo(1),
          notes: "Cabinet interior — metadata only (no upload required)",
        },
      ],
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    });
    defects.push({
      defectId: `DEF-${inv005}-COOLING`,
      assetId: inv005,
      category: "INVERTER",
      defectType: "COOLING_SYSTEM_ISSUE",
      severity: "HIGH",
      status: "OPEN",
      description: "Cooling system issue — reduced airflow / elevated cabinet temp risk",
      detectedAt: daysAgo(1),
      detectedBy: "INSPECTION",
      inspectionId: inspId,
      evidenceIds: [`EV-${inv005}-1`],
      recommendedAction: "Clean filters; verify fan operation; schedule follow-up thermal scan",
      location: model.assets[inv005]?.position,
    });
    defects.push({
      defectId: `DEF-${inv005}-CORROSION`,
      assetId: inv005,
      category: "INVERTER",
      defectType: "CORROSION",
      severity: "MEDIUM",
      status: "OPEN",
      description: "Cabinet corrosion on lower panel seams",
      detectedAt: daysAgo(1),
      detectedBy: "INSPECTION",
      inspectionId: inspId,
      recommendedAction: "Treat corrosion; reseal panel edges",
    });
  }

  if (blk004) {
    const inspId = `INSP-${blk004}-001`;
    inspections.push({
      inspectionId: inspId,
      assetId: blk004,
      inspectionType: "VEGETATION",
      inspectionDate: daysAgo(3),
      inspector: "Field Ops",
      status: "COMPLETED",
      condition: "DEGRADED",
      notes: "Vegetation encroachment along southern row access.",
      findings: ["Vegetation encroachment"],
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    });
    defects.push({
      defectId: `DEF-${blk004}-VEG`,
      assetId: blk004,
      category: "VEGETATION",
      defectType: "VEGETATION_OVERGROWTH",
      severity: "MEDIUM",
      status: "OPEN",
      description: "Vegetation encroachment near array edges",
      detectedAt: daysAgo(3),
      detectedBy: "INSPECTION",
      inspectionId: inspId,
      recommendedAction: "Schedule vegetation management",
    });
  }

  if (modSample) {
    const inspId = `INSP-${modSample}-001`;
    inspections.push({
      inspectionId: inspId,
      assetId: modSample,
      inspectionType: "DRONE",
      inspectionDate: daysAgo(5),
      inspector: "Drone Survey",
      status: "COMPLETED",
      condition: "MINOR_ISSUE",
      notes: "Minor soiling observed on module face.",
      findings: ["Minor soiling"],
      evidence: [
        {
          evidenceId: `EV-${modSample}-1`,
          type: "DRONE_IMAGE",
          fileName: `${modSample}-soiling.jpg`,
          capturedAt: daysAgo(5),
        },
      ],
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    });
    defects.push({
      defectId: `DEF-${modSample}-SOIL`,
      assetId: modSample,
      category: "MODULE",
      defectType: "SOILING",
      severity: "LOW",
      status: "OPEN",
      description: "Minor soiling",
      detectedAt: daysAgo(5),
      detectedBy: "INSPECTION",
      inspectionId: inspId,
    });
  }

  if (trf002) {
    inspections.push({
      inspectionId: `INSP-${trf002}-001`,
      assetId: trf002,
      inspectionType: "THERMAL",
      inspectionDate: daysAgo(7),
      inspector: "A. Sharma",
      status: "COMPLETED",
      condition: "GOOD",
      notes: "No thermal anomalies.",
      findings: [],
      createdAt: daysAgo(7),
      updatedAt: daysAgo(7),
    });
  }

  if (inv001 && inv001 !== inv005) {
    inspections.push({
      inspectionId: `INSP-${inv001}-001`,
      assetId: inv001,
      inspectionType: "ELECTRICAL",
      inspectionDate: daysAgo(10),
      inspector: "O&M",
      status: "COMPLETED",
      condition: "GOOD",
      notes: "Routine electrical check — OK.",
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
    });
  }

  // Sparse deterministic extras on a few combiners / inverters (not every module)
  for (const id of [...combiners.slice(0, 3), ...inverters.slice(6, 9)]) {
    if (id === inv005) continue;
    const roll = unit(`${seed}:${id}:extra`);
    if (roll > 0.55) continue;
    const severity = roll < 0.15 ? "MEDIUM" : "LOW";
    const condition = severity === "MEDIUM" ? "MINOR_ISSUE" : "GOOD";
    inspections.push({
      inspectionId: `INSP-${id}-X`,
      assetId: id,
      inspectionType: "VISUAL",
      inspectionDate: daysAgo(8 + Math.floor(unit(`${seed}:${id}:d`) * 20)),
      status: "COMPLETED",
      condition,
      notes: "Routine visual",
      createdAt: daysAgo(8),
      updatedAt: daysAgo(8),
    });
    if (severity !== "LOW" || roll < 0.35) {
      defects.push({
        defectId: `DEF-${id}-X`,
        assetId: id,
        category: model.assets[id]?.assetType === "INVERTER" ? "INVERTER" : "ELECTRICAL",
        defectType: roll < 0.25 ? "CONNECTOR_DAMAGE" : "CORROSION",
        severity,
        status: "OPEN",
        description: "Minor field finding from routine inspection",
        detectedAt: daysAgo(8),
        detectedBy: "INSPECTION",
      });
    }
  }

  const latestByAsset: Record<string, ConditionRecord> = {};

  // Default GOOD for priority equipment
  for (const id of model.order) {
    const asset = model.assets[id];
    if (!asset) continue;
    if (
      asset.assetType !== "INVERTER" &&
      asset.assetType !== "TRANSFORMER" &&
      asset.assetType !== "SUBSTATION" &&
      asset.assetType !== "BLOCK" &&
      asset.assetType !== "FEEDER" &&
      asset.assetType !== "COMBINER" &&
      asset.assetType !== "GRID_INTERCONNECTION" &&
      asset.assetType !== "WEATHER_STATION"
    ) {
      continue;
    }
    latestByAsset[id] = {
      conditionId: `COND-${id}`,
      assetId: id,
      timestamp: now,
      condition: "GOOD",
      score: 94 + Math.floor(unit(`${seed}:${id}:score`) * 5),
      source: "SYSTEM",
    };
  }

  // Apply defect-derived conditions
  for (const id of new Set(defects.map((d) => d.assetId))) {
    const derived = deriveConditionFromDefects(defects, id, 95);
    latestByAsset[id] = {
      conditionId: `COND-${id}`,
      assetId: id,
      timestamp: now,
      condition: derived.condition,
      score: derived.score,
      source: "INSPECTION",
      notes: "Derived from open inspection findings",
    };
  }

  // Explicit overrides matching demo narrative
  if (inv005 && latestByAsset[inv005]) {
    latestByAsset[inv005] = {
      ...latestByAsset[inv005],
      condition: "DEGRADED",
      score: 67,
      source: "INSPECTION",
      inspectionId: `INSP-${inv005}-001`,
      notes: "Cooling system issue + cabinet corrosion",
    };
  }
  if (blk004) {
    latestByAsset[blk004] = {
      conditionId: `COND-${blk004}`,
      assetId: blk004,
      timestamp: now,
      condition: "DEGRADED",
      score: 71,
      source: "INSPECTION",
      inspectionId: `INSP-${blk004}-001`,
      notes: "Vegetation encroachment",
    };
  }
  if (modSample) {
    latestByAsset[modSample] = {
      conditionId: `COND-${modSample}`,
      assetId: modSample,
      timestamp: now,
      condition: "MINOR_ISSUE",
      score: conditionToScore("MINOR_ISSUE"),
      source: "INSPECTION",
    };
  }
  if (trf002 && !defects.some((d) => d.assetId === trf002)) {
    latestByAsset[trf002] = {
      conditionId: `COND-${trf002}`,
      assetId: trf002,
      timestamp: now,
      condition: "GOOD",
      score: 96,
      source: "INSPECTION",
      inspectionId: `INSP-${trf002}-001`,
    };
  }

  const vegetation: VegetationCondition[] = blk004
    ? [
        {
          assetId: blk004,
          coveragePercent: 18,
          height: 0.6,
          severity: "MEDIUM",
          lastObserved: daysAgo(3),
        },
      ]
    : [];

  const soiling: SoilingCondition[] = modSample
    ? [
        {
          assetId: modSample,
          severity: "LOW",
          estimatedCoverage: 12,
          observedAt: daysAgo(5),
        },
      ]
    : [];

  const lastInspectionAt =
    inspections
      .map((i) => i.inspectionDate)
      .sort()
      .at(-1) ?? null;

  const plantSummary = computePlantConditionSummary(
    model,
    latestByAsset,
    defects,
    lastInspectionAt,
  );

  return {
    inspections,
    defects,
    latestByAsset,
    vegetation,
    soiling,
    plant: plantSummary,
    terrain,
    generatedAt: now,
  };
}
