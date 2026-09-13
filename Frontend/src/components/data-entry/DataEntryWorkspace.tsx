import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { DataEntryProductRail } from "@/components/data-entry/DataEntryProductRail";
import { ProductIntakeForm } from "@/components/data-entry/ProductIntakeForm";
import { CreateTwinForm } from "@/components/twin/CreateTwinForm";
import {
  panelClass,
  sectionHintClass,
  sectionTitleClass,
} from "@/components/dashboard/panel";
import type { Project, Site, TwinRecord, TwinSpec } from "@/lib/api";
import {
  defaultDataEntryState,
  getProductValues,
  markProductComplete,
  productStatus,
  readDataEntryState,
  seedFromPlant,
  writeDataEntryState,
  type DataEntryState,
} from "@/lib/dataEntryStore";
import { ensureDemoDataEntry } from "@/lib/demoDataEntry";
import {
  PLANT_PRODUCT_IDS,
  previousProductId,
  productById,
  type PlantProductId,
} from "@/lib/plantProducts";

type DataEntryWorkspaceProps = {
  project: Project;
  site: Site | null;
  sites: Site[];
  organizationName: string | null;
  twin: TwinRecord | null;
  onTwinCreated: (twin: TwinRecord) => void;
  onHeaderActions?: (actions: ReactNode | null) => void;
  initialProductId?: PlantProductId | null;
};

export function DataEntryWorkspace({
  project,
  site,
  sites,
  organizationName,
  twin,
  onTwinCreated,
  onHeaderActions,
  initialProductId,
}: DataEntryWorkspaceProps) {
  const [state, setState] = useState<DataEntryState>(() => {
    const demo = ensureDemoDataEntry(project);
    if (demo) {
      if (twin && !demo.twinComplete) {
        const next = { ...demo, twinComplete: true };
        if (demo.unlocked.includes("dt-normal")) {
          return markProductComplete(next, "dt-normal");
        }
        return next;
      }
      return demo;
    }

    const existing = readDataEntryState(project.id);
    if (existing) {
      if (twin && !existing.twinComplete) {
        const next = { ...existing, twinComplete: true };
        if (existing.unlocked.includes("dt-normal")) {
          return markProductComplete(next, "dt-normal");
        }
        return next;
      }
      return existing;
    }
    const seeded = defaultDataEntryState();
    const dash = seedFromPlant({
      operatorName: organizationName ?? undefined,
      capacityMw: project.capacityMw,
    });
    seeded.values.dashboard = {
      ...seeded.values.dashboard,
      ...dash,
    };
    if (twin) {
      seeded.twinComplete = true;
    }
    return seeded;
  });

  const activeId = useMemo(() => {
    if (
      initialProductId &&
      state.unlocked.includes(initialProductId)
    ) {
      return initialProductId;
    }
    return state.activeProductId;
  }, [initialProductId, state.activeProductId, state.unlocked]);

  const [selectedId, setSelectedId] = useState<PlantProductId>(activeId);

  useEffect(() => {
    setSelectedId(activeId);
  }, [activeId]);

  const persist = useCallback(
    (next: DataEntryState) => {
      setState(next);
      writeDataEntryState(project.id, next);
    },
    [project.id],
  );

  useEffect(() => {
    if (
      !state.unlocked.includes("dt-normal") ||
      !state.twinComplete ||
      state.completed.includes("dt-normal")
    ) {
      return;
    }
    persist(markProductComplete(state, "dt-normal"));
  }, [persist, state]);

  function selectProduct(id: PlantProductId) {
    if (!state.unlocked.includes(id)) return;
    setSelectedId(id);
    persist({ ...state, activeProductId: id });
  }

  function updateField(key: string, value: string) {
    const current = getProductValues(state, selectedId);
    const nextValues = {
      ...state.values,
      [selectedId]: { ...current, [key]: value },
    };
    persist({ ...state, values: nextValues });
  }

  function completeCurrent() {
    const next = markProductComplete(
      { ...state, activeProductId: selectedId },
      selectedId,
    );
    persist(next);
    const following = next.activeProductId;
    if (following !== selectedId) setSelectedId(following);
  }

  function onTwinDone(nextTwin: TwinRecord) {
    onTwinCreated(nextTwin);
    const next = markProductComplete(
      { ...state, twinComplete: true, activeProductId: selectedId },
      "dt-normal",
    );
    persist(next);
    setSelectedId(next.activeProductId);
  }

  const product = productById(selectedId);
  const values = getProductValues(state, selectedId);
  const status = productStatus(state, selectedId);
  const prevId = previousProductId(selectedId);
  const canGoBack = Boolean(prevId && state.unlocked.includes(prevId));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      <DataEntryProductRail
        state={state}
        activeId={selectedId}
        onSelect={selectProduct}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {product.intake === "twin" ? (
          <TwinProductPanel
            project={project}
            site={site}
            sites={sites}
            organizationName={organizationName}
            twin={twin}
            alreadyRunning={status === "running"}
            onHeaderActions={onHeaderActions}
            onCreated={onTwinDone}
            onBack={
              canGoBack && prevId
                ? () => selectProduct(prevId)
                : undefined
            }
            onSkipContinue={
              status === "running"
                ? () => {
                    const index = PLANT_PRODUCT_IDS.indexOf(selectedId);
                    const next = PLANT_PRODUCT_IDS[index + 1];
                    if (next && state.unlocked.includes(next)) {
                      selectProduct(next);
                    }
                  }
                : undefined
            }
          />
        ) : (
          <ProductIntakeForm
            productId={selectedId}
            values={values}
            alreadyRunning={status === "running"}
            onChange={updateField}
            onComplete={completeCurrent}
            onBack={
              canGoBack && prevId
                ? () => selectProduct(prevId)
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}

function TwinProductPanel({
  project,
  site,
  sites,
  organizationName,
  twin,
  alreadyRunning,
  onHeaderActions,
  onCreated,
  onBack,
  onSkipContinue,
}: {
  project: Project;
  site: Site | null;
  sites: Site[];
  organizationName: string | null;
  twin: TwinRecord | null;
  alreadyRunning: boolean;
  onHeaderActions?: (actions: ReactNode | null) => void;
  onCreated: (twin: TwinRecord) => void;
  onBack?: () => void;
  onSkipContinue?: () => void;
}) {
  const product = productById("dt-normal");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className={`${panelClass} px-4 py-3`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
              Product {product.code}
            </p>
            <h2 className={`mt-0.5 ${sectionTitleClass}`}>{product.name}</h2>
            <p className={sectionHintClass}>{product.description}</p>
          </div>
          {alreadyRunning ? (
            <span className="inline-flex h-6 items-center rounded-md bg-accent/15 px-2 text-xs font-medium text-accent">
              Running
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-muted">Enables: {product.enables}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous product
            </button>
          ) : null}
          {onSkipContinue ? (
            <button
              type="button"
              onClick={onSkipContinue}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
            >
              Continue to next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <CreateTwinForm
          project={project}
          site={site}
          sites={sites}
          organizationName={organizationName}
          existing={twin?.spec as TwinSpec | undefined}
          onHeaderActions={onHeaderActions}
          onCreated={onCreated}
        />
      </div>
    </div>
  );
}
