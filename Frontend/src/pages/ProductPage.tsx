import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ClipboardList, Play } from "lucide-react";

import { DashboardShell } from "@/components/dashboard";
import {
  panelClass,
  sectionHintClass,
  sectionTitleClass,
} from "@/components/dashboard/panel";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useSyncProjectFromRoute } from "@/hooks/useSyncProjectFromRoute";
import {
  getProductValues,
  productStatus,
  readDataEntryState,
  defaultDataEntryState,
} from "@/lib/dataEntryStore";
import { ensureDemoDataEntry } from "@/lib/demoDataEntry";
import { projectDataEntryPath } from "@/lib/paths";
import {
  productById,
  type PlantProductId,
} from "@/lib/plantProducts";

type ProductPageProps = {
  productId: PlantProductId;
};

export function ProductPage({ productId }: ProductPageProps) {
  useSyncProjectFromRoute();
  const { projectId } = useParams();
  const { user } = useAuth();
  const { selectedProject, projects } = useWorkspace();
  const [tick, setTick] = useState(0);

  const project =
    selectedProject ?? projects.find((item) => item.id === projectId) ?? null;

  useEffect(() => {
    if (!project) return;
    ensureDemoDataEntry(project);
    setTick((n) => n + 1);
  }, [project]);

  const product = productById(productId);
  const entryState = useMemo(() => {
    void tick;
    if (!projectId) return defaultDataEntryState();
    return readDataEntryState(projectId) ?? defaultDataEntryState();
  }, [projectId, tick]);

  const status = productStatus(entryState, productId);
  const values = getProductValues(entryState, productId);
  const filled = Object.entries(values).filter(([, v]) => v.trim());

  const shellUser = user
    ? { name: user.name, role: user.role, initials: user.initials }
    : { name: "User", role: "Organization Manager", initials: "U" };

  const dataEntryHref = projectId
    ? `${projectDataEntryPath(projectId)}?product=${productId}`
    : "#";

  return (
    <DashboardShell
      user={shellUser}
      title={project ? `${project.name} / ${product.shortName}` : product.name}
      actions={
        <Link
          to={dataEntryHref}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          Edit intake
        </Link>
      }
    >
      <div className="space-y-4">
        <section className={panelClass}>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-edge px-4 py-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
                Product {product.code}
              </p>
              <h2 className={`mt-0.5 ${sectionTitleClass}`}>{product.name}</h2>
              <p className={sectionHintClass}>{product.description}</p>
            </div>
            <StatusBadge status={status} />
          </div>
          <div className="px-4 py-4">
            <p className="text-sm text-secondary">
              Enables: {product.enables}
            </p>
            <p className="mt-3 text-sm text-muted">
              Foundation page — product UI will be built here next. Intake data
              below powers this surface once the product is running.
            </p>
          </div>
        </section>

        <section className={panelClass}>
          <div className="border-b border-edge px-4 py-3">
            <h2 className={sectionTitleClass}>Configured inputs</h2>
          </div>
          {filled.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted">
              No intake data yet.{" "}
              <Link to={dataEntryHref} className="text-accent hover:underline">
                Complete product intake
              </Link>{" "}
              to start this product.
            </p>
          ) : (
            <dl className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {filled.map(([key, value]) => {
                const field = product.fields.find((f) => f.key === key);
                return (
                  <div
                    key={key}
                    className="rounded-md border border-edge px-3 py-2.5"
                  >
                    <dt className="text-xs text-muted">
                      {field?.label ?? key}
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium text-fg">
                      {value}
                    </dd>
                  </div>
                );
              })}
            </dl>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function StatusBadge({
  status,
}: {
  status: "locked" | "available" | "complete" | "running";
}) {
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-2 py-1 text-xs font-medium text-accent">
        <Play className="h-3 w-3" fill="currentColor" />
        Running
      </span>
    );
  }
  if (status === "available") {
    return (
      <span className="rounded-md bg-fill px-2 py-1 text-xs font-medium text-muted">
        Needs data
      </span>
    );
  }
  if (status === "locked") {
    return (
      <span className="rounded-md bg-fill px-2 py-1 text-xs font-medium text-subtle">
        Locked
      </span>
    );
  }
  return (
    <span className="rounded-md bg-fill px-2 py-1 text-xs font-medium text-muted">
      Complete
    </span>
  );
}
