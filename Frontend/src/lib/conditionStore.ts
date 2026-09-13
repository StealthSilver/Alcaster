/**
 * Phase 5 — In-memory condition / inspection store (shared per project).
 */

import type { AssetModel } from "@/lib/assetModel";
import type { TwinRecord } from "@/lib/api";
import {
  buildConditionBundle,
  type ConditionBundle,
} from "@/lib/conditionBundle";
import {
  clampScore,
  computePlantConditionSummary,
  deriveConditionFromDefects,
  openDefects,
  validateDefect,
  type AssetDefect,
  type ConditionRecord,
  type ConditionStatus,
  type DefectSeverity,
} from "@/lib/conditionModel";
import {
  validateInspection,
  type InspectionCondition,
  type InspectionRecord,
  type InspectionType,
} from "@/lib/inspectionModel";
import type { Alarm } from "@/lib/telemetry";

export type ConditionStoreState = ConditionBundle & {
  alarms: Alarm[];
  error: string | null;
};

type Listener = (state: ConditionStoreState) => void;

function rebuildAlarms(defects: AssetDefect[]): Alarm[] {
  const alarms: Alarm[] = [];
  for (const d of openDefects(defects)) {
    if (d.severity !== "CRITICAL" && d.severity !== "HIGH") continue;
    const severity = d.severity === "CRITICAL" ? "CRITICAL" : "WARNING";
    const now = d.detectedAt;
    alarms.push({
      alarmId: `ALM-INSP-${d.defectId}`,
      assetId: d.assetId,
      severity,
      code: `INSP_${d.defectType}`,
      message: d.description || `${d.defectType} (${d.severity})`,
      timestamp: now,
      createdAt: now,
      active: true,
      acknowledged: false,
      source: "INSPECTION",
    });
  }
  return alarms;
}

function withAlarms(bundle: ConditionBundle): ConditionStoreState {
  return {
    ...bundle,
    alarms: rebuildAlarms(bundle.defects),
    error: null,
  };
}

function recomputePlant(
  state: ConditionStoreState,
  model: AssetModel,
): ConditionStoreState {
  const lastInspectionAt =
    state.inspections
      .map((i) => i.inspectionDate)
      .sort()
      .at(-1) ?? null;
  return {
    ...state,
    plant: computePlantConditionSummary(
      model,
      state.latestByAsset,
      state.defects,
      lastInspectionAt,
    ),
    alarms: rebuildAlarms(state.defects),
  };
}

export class ConditionStore {
  private state: ConditionStoreState | null = null;
  private listeners = new Set<Listener>();
  private model: AssetModel | null = null;
  private twin: TwinRecord | null = null;
  private modelKey = "";

  getState(): ConditionStoreState | null {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    if (!this.state) return;
    for (const l of this.listeners) l(this.state);
  }

  ensure(twin: TwinRecord, model: AssetModel, modelKey: string) {
    this.twin = twin;
    this.model = model;
    if (this.state && this.modelKey === modelKey) return;
    this.modelKey = modelKey;
    this.state = withAlarms(buildConditionBundle(twin, model));
    this.emit();
  }

  resetMock() {
    if (!this.twin || !this.model) return;
    this.state = withAlarms(buildConditionBundle(this.twin, this.model));
    this.emit();
  }

  addInspection(input: {
    assetId: string;
    inspectionType: InspectionType;
    inspectionDate: string;
    condition: InspectionCondition;
    notes?: string;
    finding?: string;
    severity?: DefectSeverity;
    inspector?: string;
  }): { ok: true; inspection: InspectionRecord } | { ok: false; error: string } {
    if (!this.state || !this.model) {
      return { ok: false, error: "Condition store not ready" };
    }
    const known = new Set(Object.keys(this.model.assets));
    const draft: Partial<InspectionRecord> = {
      assetId: input.assetId,
      inspectionType: input.inspectionType,
      inspectionDate: input.inspectionDate,
      condition: input.condition,
      status: "COMPLETED",
      notes: input.notes,
      inspector: input.inspector,
      findings: input.finding ? [input.finding] : [],
    };
    const issues = validateInspection(draft, known);
    if (issues.length) {
      return { ok: false, error: issues[0]!.message };
    }

    const now = new Date().toISOString();
    const inspectionId = `INSP-${input.assetId}-${Date.now().toString(36).toUpperCase()}`;
    const inspection: InspectionRecord = {
      inspectionId,
      assetId: input.assetId,
      inspectionType: input.inspectionType,
      inspectionDate: input.inspectionDate,
      inspector: input.inspector,
      status: "COMPLETED",
      condition: input.condition,
      notes: input.notes,
      findings: input.finding ? [input.finding] : [],
      evidence: [],
      createdAt: now,
      updatedAt: now,
    };

    let defects = [...this.state.defects];
    if (input.finding) {
      const severity = input.severity ?? mapConditionToSeverity(input.condition);
      const defect: AssetDefect = {
        defectId: `DEF-${input.assetId}-${Date.now().toString(36).toUpperCase()}`,
        assetId: input.assetId,
        category: "OTHER",
        defectType: input.finding.toUpperCase().replace(/\s+/g, "_"),
        severity,
        status: "OPEN",
        description: input.finding,
        detectedAt: input.inspectionDate,
        detectedBy: "INSPECTION",
        inspectionId,
      };
      const defectIssues = validateDefect(defect, known);
      if (defectIssues.length) {
        return { ok: false, error: defectIssues[0]!.message };
      }
      defects = [...defects, defect];
    }

    const derived = deriveConditionFromDefects(
      defects,
      input.assetId,
      conditionToBaseScore(input.condition),
    );
    const record: ConditionRecord = {
      conditionId: `COND-${input.assetId}-${Date.now().toString(36)}`,
      assetId: input.assetId,
      timestamp: now,
      condition: derived.condition,
      score: derived.score,
      source: "INSPECTION",
      inspectionId,
      notes: input.notes,
    };

    this.state = recomputePlant(
      {
        ...this.state,
        inspections: [inspection, ...this.state.inspections],
        defects,
        latestByAsset: {
          ...this.state.latestByAsset,
          [input.assetId]: record,
        },
      },
      this.model,
    );
    this.emit();
    return { ok: true, inspection };
  }

  addFinding(input: {
    assetId: string;
    defectType: string;
    severity: DefectSeverity;
    description?: string;
  }): { ok: true; defect: AssetDefect } | { ok: false; error: string } {
    if (!this.state || !this.model) {
      return { ok: false, error: "Condition store not ready" };
    }
    const known = new Set(Object.keys(this.model.assets));
    const now = new Date().toISOString();
    const defect: AssetDefect = {
      defectId: `DEF-${input.assetId}-${Date.now().toString(36).toUpperCase()}`,
      assetId: input.assetId,
      category: "OTHER",
      defectType: input.defectType,
      severity: input.severity,
      status: "OPEN",
      description: input.description || input.defectType,
      detectedAt: now,
      detectedBy: "MANUAL",
    };
    const issues = validateDefect(defect, known);
    if (issues.length) return { ok: false, error: issues[0]!.message };

    const defects = [...this.state.defects, defect];
    const derived = deriveConditionFromDefects(defects, input.assetId, 90);
    this.state = recomputePlant(
      {
        ...this.state,
        defects,
        latestByAsset: {
          ...this.state.latestByAsset,
          [input.assetId]: {
            conditionId: `COND-${input.assetId}-${Date.now().toString(36)}`,
            assetId: input.assetId,
            timestamp: now,
            condition: derived.condition,
            score: derived.score,
            source: "MANUAL",
            notes: input.description,
          },
        },
      },
      this.model,
    );
    this.emit();
    return { ok: true, defect };
  }
}

function mapConditionToSeverity(c: InspectionCondition): DefectSeverity {
  if (c === "CRITICAL") return "CRITICAL";
  if (c === "DEGRADED") return "HIGH";
  if (c === "MINOR_ISSUE") return "MEDIUM";
  return "LOW";
}

function conditionToBaseScore(c: ConditionStatus): number {
  return clampScore(
    c === "GOOD"
      ? 95
      : c === "MINOR_ISSUE"
        ? 70
        : c === "DEGRADED"
          ? 55
          : c === "CRITICAL"
            ? 30
            : 50,
  );
}

const stores = new Map<string, ConditionStore>();

/** Session-scoped store per project — Twin + Sitemap share the same data. */
export function getConditionStore(projectId: string): ConditionStore {
  let store = stores.get(projectId);
  if (!store) {
    store = new ConditionStore();
    stores.set(projectId, store);
  }
  return store;
}
