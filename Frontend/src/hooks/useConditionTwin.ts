import { useEffect, useMemo, useSyncExternalStore } from "react";

import type { TwinRecord } from "@/lib/api";
import type { AssetModel } from "@/lib/assetModel";
import type { ConditionStatus, DefectSeverity } from "@/lib/conditionModel";
import {
  getConditionStore,
  type ConditionStoreState,
} from "@/lib/conditionStore";
import type {
  InspectionCondition,
  InspectionType,
} from "@/lib/inspectionModel";

const EMPTY: ConditionStoreState = {
  inspections: [],
  defects: [],
  latestByAsset: {},
  vegetation: [],
  soiling: [],
  plant: {
    score: 100,
    condition: "GOOD",
    counts: {
      good: 0,
      minorIssue: 0,
      degraded: 0,
      critical: 0,
      unknown: 0,
    },
    openFindings: 0,
    criticalFindings: 0,
    lastInspectionAt: null,
  },
  terrain: {
    terrainType: "FLAT",
    baseElevation: 0,
    surface: "bare",
    seed: 0,
    elevationScale: 0.2,
    visualSlope: 0,
    hillCount: 0,
  },
  generatedAt: new Date(0).toISOString(),
  alarms: [],
  error: null,
};

export function useConditionTwin(
  twin: TwinRecord | null,
  model: AssetModel | null,
  enabled = true,
) {
  const projectId = twin?.projectId ?? "";

  const modelKey = useMemo(() => {
    if (!model) return "";
    return [
      model.plantId,
      model.rootId,
      model.counts.inverters,
      model.counts.blocks,
      model.generatedAt,
    ].join("|");
  }, [model]);

  useEffect(() => {
    if (!enabled || !projectId || !twin || !model) return;
    getConditionStore(projectId).ensure(twin, model, modelKey);
  }, [enabled, projectId, twin, model, modelKey]);

  const state = useSyncExternalStore(
    (onChange) => {
      if (!enabled || !projectId) return () => undefined;
      return getConditionStore(projectId).subscribe(onChange);
    },
    () => {
      if (!enabled || !projectId) return EMPTY;
      return getConditionStore(projectId).getState() ?? EMPTY;
    },
    () => EMPTY,
  );

  const controls = useMemo(() => {
    if (!enabled || !projectId) {
      return {
        addInspection: () =>
          ({ ok: false as const, error: "Unavailable" }),
        addFinding: () => ({ ok: false as const, error: "Unavailable" }),
        resetMock: () => undefined,
      };
    }
    const store = getConditionStore(projectId);
    return {
      addInspection: (input: {
        assetId: string;
        inspectionType: InspectionType;
        inspectionDate: string;
        condition: InspectionCondition;
        notes?: string;
        finding?: string;
        severity?: DefectSeverity;
        inspector?: string;
      }) => store.addInspection(input),
      addFinding: (input: {
        assetId: string;
        defectType: string;
        severity: DefectSeverity;
        description?: string;
      }) => store.addFinding(input),
      resetMock: () => store.resetMock(),
    };
  }, [enabled, projectId]);

  return { state, controls };
}

export function conditionMapFromStore(
  state: ConditionStoreState,
): Record<string, ConditionStatus> {
  const map: Record<string, ConditionStatus> = {};
  for (const [id, rec] of Object.entries(state.latestByAsset)) {
    map[id] = rec.condition;
  }
  return map;
}

export function assetsWithOpenDefects(
  state: ConditionStoreState,
): Set<string> {
  const set = new Set<string>();
  for (const d of state.defects) {
    if (
      d.status === "OPEN" ||
      d.status === "ACKNOWLEDGED" ||
      d.status === "IN_PROGRESS"
    ) {
      set.add(d.assetId);
    }
  }
  return set;
}
