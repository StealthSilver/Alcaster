/**
 * Phase 5 — Inspection records & evidence.
 * All records reference canonical Asset Model assetIds.
 */

export type InspectionType =
  | "VISUAL"
  | "THERMAL"
  | "ELECTROLUMINESCENCE"
  | "DRONE"
  | "GROUND"
  | "ELECTRICAL"
  | "STRUCTURAL"
  | "VEGETATION"
  | "CIVIL"
  | "OTHER";

export type InspectionWorkflowStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REVIEW_REQUIRED";

export type InspectionCondition =
  | "GOOD"
  | "MINOR_ISSUE"
  | "DEGRADED"
  | "CRITICAL"
  | "UNKNOWN";

export type EvidenceType =
  | "IMAGE"
  | "THERMAL_IMAGE"
  | "VIDEO"
  | "DOCUMENT"
  | "REPORT"
  | "DRONE_IMAGE"
  | "OTHER";

export type InspectionEvidence = {
  evidenceId: string;
  type: EvidenceType;
  fileName?: string;
  fileUrl?: string;
  capturedAt?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
};

export type InspectionRecord = {
  inspectionId: string;
  assetId: string;
  inspectionType: InspectionType;
  inspectionDate: string;
  inspector?: string;
  status: InspectionWorkflowStatus;
  condition: InspectionCondition;
  notes?: string;
  evidence?: InspectionEvidence[];
  findings?: string[];
  createdAt: string;
  updatedAt: string;
};

export type InspectionValidationIssue = {
  code: string;
  message: string;
  field?: string;
};

export function validateInspection(
  record: Partial<InspectionRecord>,
  knownAssetIds: Set<string>,
): InspectionValidationIssue[] {
  const issues: InspectionValidationIssue[] = [];
  if (!record.assetId) {
    issues.push({
      code: "MISSING_ASSET",
      message: "Inspection requires an assetId",
      field: "assetId",
    });
  } else if (!knownAssetIds.has(record.assetId)) {
    issues.push({
      code: "UNKNOWN_ASSET",
      message: `Unknown asset ${record.assetId}`,
      field: "assetId",
    });
  }
  if (!record.inspectionType) {
    issues.push({
      code: "MISSING_TYPE",
      message: "Inspection type is required",
      field: "inspectionType",
    });
  }
  if (!record.inspectionDate || Number.isNaN(Date.parse(record.inspectionDate))) {
    issues.push({
      code: "INVALID_DATE",
      message: "Inspection date must be valid",
      field: "inspectionDate",
    });
  }
  return issues;
}

export function inspectionsForAsset(
  records: InspectionRecord[],
  assetId: string,
): InspectionRecord[] {
  return records
    .filter((r) => r.assetId === assetId)
    .sort((a, b) => b.inspectionDate.localeCompare(a.inspectionDate));
}

export function latestInspection(
  records: InspectionRecord[],
  assetId: string,
): InspectionRecord | null {
  return inspectionsForAsset(records, assetId)[0] ?? null;
}

export function searchInspections(
  records: InspectionRecord[],
  query: string,
  limit = 8,
): InspectionRecord[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const out: InspectionRecord[] = [];
  for (const r of records) {
    if (
      r.inspectionId.toLowerCase().includes(q) ||
      r.assetId.toLowerCase().includes(q) ||
      r.inspectionType.toLowerCase().includes(q) ||
      r.condition.toLowerCase().includes(q) ||
      r.notes?.toLowerCase().includes(q) ||
      r.findings?.some((f) => f.toLowerCase().includes(q))
    ) {
      out.push(r);
      if (out.length >= limit) break;
    }
  }
  return out;
}

export const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  VISUAL: "Visual",
  THERMAL: "Thermal",
  ELECTROLUMINESCENCE: "EL",
  DRONE: "Drone",
  GROUND: "Ground",
  ELECTRICAL: "Electrical",
  STRUCTURAL: "Structural",
  VEGETATION: "Vegetation",
  CIVIL: "Civil",
  OTHER: "Other",
};
