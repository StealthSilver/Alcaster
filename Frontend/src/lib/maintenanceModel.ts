/**
 * Phase 6 — Maintenance records linked to the historical timeline.
 * Records reference canonical Asset Model assetIds.
 */

export type MaintenanceType =
  | "PREVENTIVE"
  | "CORRECTIVE"
  | "EMERGENCY"
  | "INSPECTION"
  | "CLEANING"
  | "REPLACEMENT"
  | "CALIBRATION"
  | "OTHER";

export type MaintenanceStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type MaintenanceRecord = {
  maintenanceId: string;
  assetId: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  startTime: string;
  endTime?: string;
  description?: string;
  technician?: string;
  cause?: string;
  resolution?: string;
  partsReplaced?: string[];
  cost?: number;
  downtimeMinutes?: number;
  notes?: string;
};

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  PREVENTIVE: "Preventive",
  CORRECTIVE: "Corrective",
  EMERGENCY: "Emergency",
  INSPECTION: "Inspection",
  CLEANING: "Cleaning",
  REPLACEMENT: "Replacement",
  CALIBRATION: "Calibration",
  OTHER: "Other",
};

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

/** Active at timestamp if start ≤ t and (no end or end > t). */
export function maintenanceActiveAt(
  record: MaintenanceRecord,
  timestampIso: string,
): boolean {
  const t = Date.parse(timestampIso);
  const start = Date.parse(record.startTime);
  if (!Number.isFinite(t) || !Number.isFinite(start) || t < start) return false;
  if (!record.endTime) {
    return record.status === "IN_PROGRESS" || record.status === "PLANNED";
  }
  const end = Date.parse(record.endTime);
  return Number.isFinite(end) && t < end;
}

export function maintenanceForAsset(
  records: MaintenanceRecord[],
  assetId: string,
): MaintenanceRecord[] {
  return records.filter((r) => r.assetId === assetId);
}

export function activeMaintenanceAt(
  records: MaintenanceRecord[],
  timestampIso: string,
  assetId?: string,
): MaintenanceRecord[] {
  return records.filter(
    (r) =>
      (!assetId || r.assetId === assetId) &&
      maintenanceActiveAt(r, timestampIso),
  );
}
