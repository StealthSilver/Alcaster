/**
 * Phase 5 — Physical condition, defects/findings, soiling, vegetation.
 * Condition is separate from Phase 4 operational status.
 */

import type { AssetModel, AssetType } from "@/lib/assetModel";
import type { InspectionCondition } from "@/lib/inspectionModel";

export type ConditionStatus = InspectionCondition;

export type DefectCategory =
  | "MODULE"
  | "STRUCTURE"
  | "ELECTRICAL"
  | "INVERTER"
  | "TRANSFORMER"
  | "CIVIL"
  | "VEGETATION"
  | "FENCE"
  | "ROAD"
  | "BUILDING"
  | "OTHER";

export type DefectSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type DefectStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export type DefectDetectedBy =
  | "INSPECTION"
  | "OPERATOR"
  | "TELEMETRY"
  | "MANUAL";

export type AssetDefect = {
  defectId: string;
  assetId: string;
  category: DefectCategory;
  defectType: string;
  severity: DefectSeverity;
  status: DefectStatus;
  description?: string;
  detectedAt: string;
  detectedBy: DefectDetectedBy;
  inspectionId?: string;
  evidenceIds?: string[];
  location?: {
    latitude?: number;
    longitude?: number;
    x?: number;
    y?: number;
    z?: number;
  };
  recommendedAction?: string;
  resolvedAt?: string;
};

export type ConditionSource =
  | "INSPECTION"
  | "MANUAL"
  | "TELEMETRY"
  | "SYSTEM";

export type ConditionRecord = {
  conditionId: string;
  assetId: string;
  timestamp: string;
  condition: ConditionStatus;
  score: number;
  source: ConditionSource;
  inspectionId?: string;
  notes?: string;
};

export type VegetationCondition = {
  assetId?: string;
  coveragePercent?: number;
  height?: number;
  severity: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  lastObserved?: string;
};

export type SoilingCondition = {
  assetId: string;
  severity: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  estimatedCoverage?: number;
  observedAt?: string;
};

export type ConditionCounts = {
  good: number;
  minorIssue: number;
  degraded: number;
  critical: number;
  unknown: number;
};

export type PlantConditionSummary = {
  score: number;
  condition: ConditionStatus;
  counts: ConditionCounts;
  openFindings: number;
  criticalFindings: number;
  lastInspectionAt: string | null;
};

/** Module / structural / electrical / civil finding type vocabularies (data values). */
export const MODULE_DEFECT_TYPES = [
  "HOTSPOT",
  "CRACK",
  "CELL_DAMAGE",
  "DELAMINATION",
  "DISCOLORATION",
  "BURN_MARK",
  "JUNCTION_BOX_DAMAGE",
  "CABLE_DAMAGE",
  "GLASS_DAMAGE",
  "SOILING",
  "SHADING",
  "VEGETATION",
  "MISSING_MODULE",
  "BROKEN_MODULE",
] as const;

export const STRUCTURAL_DEFECT_TYPES = [
  "CORROSION",
  "LOOSE_BOLT",
  "BENT_STRUCTURE",
  "FOUNDATION_DAMAGE",
  "TRACKER_ALIGNMENT",
  "TRACKER_MALFUNCTION",
  "STRUCTURAL_DEFORMATION",
  "MISSING_FASTENER",
] as const;

export const ELECTRICAL_DEFECT_TYPES = [
  "CABLE_DAMAGE",
  "CONNECTOR_DAMAGE",
  "INSULATION_DAMAGE",
  "GROUNDING_ISSUE",
  "FUSE_ISSUE",
  "COMBINER_ISSUE",
  "BREAKER_ISSUE",
  "TERMINAL_DAMAGE",
] as const;

export const CIVIL_DEFECT_TYPES = [
  "EROSION",
  "DRAINAGE_ISSUE",
  "ROAD_DAMAGE",
  "FENCE_DAMAGE",
  "GATE_DAMAGE",
  "FOUNDATION_DAMAGE",
  "WATER_ACCUMULATION",
  "VEGETATION_OVERGROWTH",
] as const;

export const CONDITION_SCORE_BANDS = [
  { min: 90, label: "Excellent", status: "GOOD" as ConditionStatus },
  { min: 75, label: "Good", status: "GOOD" as ConditionStatus },
  { min: 60, label: "Fair", status: "MINOR_ISSUE" as ConditionStatus },
  { min: 40, label: "Degraded", status: "DEGRADED" as ConditionStatus },
  { min: 0, label: "Critical", status: "CRITICAL" as ConditionStatus },
];

export function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function scoreToCondition(score: number): ConditionStatus {
  const s = clampScore(score);
  if (s >= 75) return "GOOD";
  if (s >= 60) return "MINOR_ISSUE";
  if (s >= 40) return "DEGRADED";
  return "CRITICAL";
}

export function conditionToScore(condition: ConditionStatus): number {
  switch (condition) {
    case "GOOD":
      return 92;
    case "MINOR_ISSUE":
      return 68;
    case "DEGRADED":
      return 52;
    case "CRITICAL":
      return 28;
    default:
      return 50;
  }
}

export function conditionLabel(condition: ConditionStatus): string {
  switch (condition) {
    case "GOOD":
      return "Good";
    case "MINOR_ISSUE":
      return "Minor Issue";
    case "DEGRADED":
      return "Degraded";
    case "CRITICAL":
      return "Critical";
    default:
      return "Unknown";
  }
}

export const CONDITION_COLORS: Record<ConditionStatus, string> = {
  GOOD: "rgba(120, 180, 140, 0.95)",
  MINOR_ISSUE: "#c4a35a",
  DEGRADED: "#e6740a",
  CRITICAL: "#f07167",
  UNKNOWN: "#94a3b8",
};

export const CONDITION_MESH_COLORS: Record<ConditionStatus, string> = {
  GOOD: "#86a892",
  MINOR_ISSUE: "#c4a35a",
  DEGRADED: "#e6740a",
  CRITICAL: "#f07167",
  UNKNOWN: "#9ca3af",
};

export function openDefects(defects: AssetDefect[]): AssetDefect[] {
  return defects.filter(
    (d) =>
      d.status === "OPEN" ||
      d.status === "ACKNOWLEDGED" ||
      d.status === "IN_PROGRESS",
  );
}

export function defectsForAsset(
  defects: AssetDefect[],
  assetId: string,
): AssetDefect[] {
  return openDefects(defects)
    .filter((d) => d.assetId === assetId)
    .sort(
      (a, b) =>
        severityRank(b.severity) - severityRank(a.severity) ||
        b.detectedAt.localeCompare(a.detectedAt),
    );
}

export function severityRank(s: DefectSeverity): number {
  switch (s) {
    case "CRITICAL":
      return 5;
    case "HIGH":
      return 4;
    case "MEDIUM":
      return 3;
    case "LOW":
      return 2;
    default:
      return 1;
  }
}

export function validateDefect(
  defect: Partial<AssetDefect>,
  knownAssetIds: Set<string>,
): Array<{ code: string; message: string }> {
  const issues: Array<{ code: string; message: string }> = [];
  if (!defect.assetId) {
    issues.push({ code: "MISSING_ASSET", message: "Finding requires assetId" });
  } else if (!knownAssetIds.has(defect.assetId)) {
    issues.push({
      code: "UNKNOWN_ASSET",
      message: `Unknown asset ${defect.assetId}`,
    });
  }
  if (!defect.defectType) {
    issues.push({ code: "MISSING_TYPE", message: "Defect type is required" });
  }
  if (!defect.severity) {
    issues.push({ code: "MISSING_SEVERITY", message: "Severity is required" });
  }
  return issues;
}

export function searchDefects(
  defects: AssetDefect[],
  query: string,
  limit = 8,
): AssetDefect[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const out: AssetDefect[] = [];
  for (const d of defects) {
    if (
      d.defectId.toLowerCase().includes(q) ||
      d.assetId.toLowerCase().includes(q) ||
      d.defectType.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.severity.toLowerCase().includes(q)
    ) {
      out.push(d);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** Weight by asset importance so one module cannot destroy plant score. */
export function assetConditionWeight(type: AssetType): number {
  switch (type) {
    case "INVERTER":
      return 8;
    case "TRANSFORMER":
      return 7;
    case "SUBSTATION":
    case "GRID_INTERCONNECTION":
      return 6;
    case "FEEDER":
      return 4;
    case "BLOCK":
      return 5;
    case "COMBINER":
      return 2;
    case "WEATHER_STATION":
      return 1;
    case "TABLE":
      return 0.5;
    case "MODULE":
      return 0.15;
    default:
      return 1;
  }
}

export function computePlantConditionSummary(
  model: AssetModel,
  latestByAsset: Record<string, ConditionRecord>,
  defects: AssetDefect[],
  lastInspectionAt: string | null,
): PlantConditionSummary {
  const counts: ConditionCounts = {
    good: 0,
    minorIssue: 0,
    degraded: 0,
    critical: 0,
    unknown: 0,
  };

  let weighted = 0;
  let weightSum = 0;

  const priorityTypes = new Set<AssetType>([
    "INVERTER",
    "TRANSFORMER",
    "SUBSTATION",
    "GRID_INTERCONNECTION",
    "FEEDER",
    "BLOCK",
    "COMBINER",
    "WEATHER_STATION",
  ]);

  for (const id of model.order) {
    const asset = model.assets[id];
    if (!asset) continue;
    // Count only equipment-level + any asset with an explicit condition record
    const hasRecord = Boolean(latestByAsset[id]);
    if (!priorityTypes.has(asset.assetType) && !hasRecord) continue;

    const record = latestByAsset[id];
    const condition = record?.condition ?? "GOOD";
    const score = record?.score ?? 95;
    bumpConditionCount(counts, condition);

    const w = assetConditionWeight(asset.assetType);
    weighted += score * w;
    weightSum += w;
  }

  const open = openDefects(defects);
  const criticalFindings = open.filter(
    (d) => d.severity === "CRITICAL" || d.severity === "HIGH",
  ).length;

  const score = weightSum > 0 ? clampScore(weighted / weightSum) : 95;
  return {
    score,
    condition: scoreToCondition(score),
    counts,
    openFindings: open.length,
    criticalFindings,
    lastInspectionAt,
  };
}

function bumpConditionCount(counts: ConditionCounts, c: ConditionStatus) {
  switch (c) {
    case "GOOD":
      counts.good += 1;
      break;
    case "MINOR_ISSUE":
      counts.minorIssue += 1;
      break;
    case "DEGRADED":
      counts.degraded += 1;
      break;
    case "CRITICAL":
      counts.critical += 1;
      break;
    default:
      counts.unknown += 1;
  }
}

export function deriveConditionFromDefects(
  defects: AssetDefect[],
  assetId: string,
  baseScore = 95,
): { condition: ConditionStatus; score: number } {
  const open = defectsForAsset(defects, assetId);
  if (open.length === 0) {
    return { condition: "GOOD", score: clampScore(baseScore) };
  }
  let score = baseScore;
  for (const d of open) {
    if (d.severity === "CRITICAL") score -= 35;
    else if (d.severity === "HIGH") score -= 22;
    else if (d.severity === "MEDIUM") score -= 12;
    else if (d.severity === "LOW") score -= 5;
    else score -= 2;
  }
  score = clampScore(score);
  return { condition: scoreToCondition(score), score };
}

export function blockConditionRollup(
  model: AssetModel,
  blockId: string,
  latestByAsset: Record<string, ConditionRecord>,
  defects: AssetDefect[],
): {
  condition: ConditionStatus;
  score: number;
  openFindings: number;
  criticalFindings: number;
} {
  const childIds: string[] = [];
  for (const id of model.order) {
    const asset = model.assets[id];
    if (!asset) continue;
    if (asset.parentId === blockId) childIds.push(id);
    // Inverters often parented to plant — match by round-robin assignment isn't reliable;
    // include defects that reference the block itself.
  }
  childIds.push(blockId);

  let scoreSum = 0;
  let n = 0;
  let worst: ConditionStatus = "GOOD";
  for (const id of childIds) {
    const rec = latestByAsset[id];
    if (!rec) continue;
    scoreSum += rec.score;
    n += 1;
    if (conditionPriority(rec.condition) > conditionPriority(worst)) {
      worst = rec.condition;
    }
  }

  const relatedDefects = openDefects(defects).filter(
    (d) => d.assetId === blockId || childIds.includes(d.assetId),
  );
  // Also include inverters assigned to this block index when present
  const block = model.assets[blockId];
  const blockIndex = Number(block?.metadata.index);
  if (Number.isFinite(blockIndex)) {
    for (const id of model.order) {
      const a = model.assets[id];
      if (a?.assetType !== "INVERTER") continue;
      // Prefer explicit defect assets that are INV under plant — counted via plant demo seed
    }
  }

  const score = n > 0 ? clampScore(scoreSum / n) : (latestByAsset[blockId]?.score ?? 90);
  const condition =
    n > 0
      ? worst
      : latestByAsset[blockId]?.condition ?? scoreToCondition(score);

  return {
    condition,
    score,
    openFindings: relatedDefects.length,
    criticalFindings: relatedDefects.filter(
      (d) => d.severity === "CRITICAL" || d.severity === "HIGH",
    ).length,
  };
}

function conditionPriority(c: ConditionStatus): number {
  switch (c) {
    case "CRITICAL":
      return 5;
    case "DEGRADED":
      return 4;
    case "MINOR_ISSUE":
      return 3;
    case "UNKNOWN":
      return 2;
    default:
      return 1;
  }
}
