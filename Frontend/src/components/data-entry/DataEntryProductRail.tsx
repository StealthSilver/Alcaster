import { Check, ChevronRight, Lock, Play } from "lucide-react";

import {
  PLANT_PRODUCTS,
  type PlantProduct,
  type PlantProductId,
  type ProductStatus,
} from "@/lib/plantProducts";
import { overallProgress } from "@/lib/dataEntryStore";
import type { DataEntryState } from "@/lib/dataEntryStore";
import { productStatus } from "@/lib/dataEntryStore";

type DataEntryProductRailProps = {
  state: DataEntryState;
  activeId: PlantProductId;
  onSelect: (id: PlantProductId) => void;
};

export function DataEntryProductRail({
  state,
  activeId,
  onSelect,
}: DataEntryProductRailProps) {
  const progress = overallProgress(state);
  const core = PLANT_PRODUCTS.filter((p) => p.group === "core");
  const twins = PLANT_PRODUCTS.filter((p) => p.group === "digital-twin");

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 lg:h-full lg:min-h-0 lg:w-64 lg:overflow-y-auto lg:overscroll-contain">
      <div className="rounded-md border border-edge bg-surface px-3 py-2.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
          Product intake
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <p className="text-sm tabular-nums text-fg">{progress}%</p>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fill">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-muted">
          Complete each product in order. Finished products start running.
        </p>
      </div>

      <RailGroup
        label="Core products"
        products={core}
        state={state}
        activeId={activeId}
        onSelect={onSelect}
      />
      <RailGroup
        label="Digital twin"
        products={twins}
        state={state}
        activeId={activeId}
        onSelect={onSelect}
      />
    </aside>
  );
}

function RailGroup({
  label,
  products,
  state,
  activeId,
  onSelect,
}: {
  label: string;
  products: PlantProduct[];
  state: DataEntryState;
  activeId: PlantProductId;
  onSelect: (id: PlantProductId) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 px-1 text-xs font-medium text-muted">{label}</p>
      <ol className="space-y-1">
        {products.map((product) => {
          const status = productStatus(state, product.id);
          const active = product.id === activeId;
          const locked = status === "locked";
          return (
            <li key={product.id}>
              <button
                type="button"
                disabled={locked}
                onClick={() => onSelect(product.id)}
                className={[
                  "flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left transition-colors",
                  active
                    ? "border-accent/40 bg-fill"
                    : locked
                      ? "cursor-not-allowed border-transparent opacity-45"
                      : "border-transparent hover:bg-fill",
                ].join(" ")}
              >
                <StatusIcon status={status} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium tabular-nums text-muted">
                      {product.code}
                    </span>
                    <span className="truncate text-[13px] font-medium text-fg">
                      {product.shortName}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted">
                    {statusLabel(status)}
                  </span>
                </span>
                {!locked ? (
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-subtle" />
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StatusIcon({ status }: { status: ProductStatus }) {
  if (status === "running") {
    return (
      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-accent">
        <Play className="h-3 w-3" fill="currentColor" />
      </span>
    );
  }
  if (status === "complete") {
    return (
      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-accent">
        <Check className="h-3 w-3" strokeWidth={2.5} />
      </span>
    );
  }
  if (status === "locked") {
    return (
      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-fill text-subtle">
        <Lock className="h-3 w-3" />
      </span>
    );
  }
  return (
    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-edge-strong text-[10px] font-medium text-muted">
      ·
    </span>
  );
}

function statusLabel(status: ProductStatus): string {
  switch (status) {
    case "running":
      return "Running";
    case "complete":
      return "Complete";
    case "available":
      return "Ready for input";
    case "locked":
      return "Locked — finish previous";
  }
}
