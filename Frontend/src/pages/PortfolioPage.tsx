import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ClipboardList, Play } from "lucide-react";

import { DashboardShell } from "@/components/dashboard";
import { ExportSummaryCards } from "@/components/dashboard/ExportSummaryCards";
import {
  panelClass,
  sectionTitleClass,
} from "@/components/dashboard/panel";
import { useAuth } from "@/context/AuthContext";
import { usePlantAnalytics } from "@/hooks/usePlantAnalytics";
import { useSyncProjectFromRoute } from "@/hooks/useSyncProjectFromRoute";
import {
  ApiError,
  getProjectDashboardRequest,
  type ProjectDashboardPayload,
} from "@/lib/api";
import {
  overallProgress,
  productStatus,
  readDataEntryState,
  runningCount,
  defaultDataEntryState,
} from "@/lib/dataEntryStore";
import { ensureDemoDataEntry } from "@/lib/demoDataEntry";
import { projectDataEntryPath } from "@/lib/paths";
import { PLANT_PRODUCTS, type PlantProductId } from "@/lib/plantProducts";
import {
  projectStatusLabel,
  projectTypeLabel,
} from "@/lib/labels";

export function PortfolioPage() {
  useSyncProjectFromRoute();
  const { projectId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<ProjectDashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    getProjectDashboardRequest(projectId)
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Unable to load this plant portfolio.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Re-read local data-entry progress when returning to this page.
  useEffect(() => {
    function onFocus() {
      setTick((n) => n + 1);
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    if (!data?.project) return;
    ensureDemoDataEntry(data.project);
    setTick((n) => n + 1);
  }, [data?.project]);

  const entryState = useMemo(() => {
    void tick;
    if (!projectId) return defaultDataEntryState();
    return readDataEntryState(projectId) ?? defaultDataEntryState();
  }, [projectId, tick]);

  const shellUser = user
    ? { name: user.name, role: user.role, initials: user.initials }
    : { name: "User", role: "Organization Manager", initials: "U" };

  const project = data?.project;
  const progress = overallProgress(entryState);
  const running = runningCount(entryState);
  const dataEntryHref = projectId ? projectDataEntryPath(projectId) : "#";
  const analytics = usePlantAnalytics(data, tick);

  return (
    <DashboardShell
      user={shellUser}
      title={project ? `${project.name} / Portfolio` : "Portfolio"}
      actions={
        <Link
          to={dataEntryHref}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          Data entry
        </Link>
      }
    >
      {loading ? (
        <p className="text-sm text-muted">Loading portfolio…</p>
      ) : error ? (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : project ? (
        <div className="space-y-4">
          {analytics ? (
            <ExportSummaryCards metrics={analytics.exportMetrics} />
          ) : null}

          <section className={panelClass} aria-label="Plant summary">
            <div className="border-b border-edge px-4 py-3">
              <h2 className={sectionTitleClass}>Plant summary</h2>
            </div>
            <dl className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <Meta label="Plant" value={project.name} />
              <Meta label="Location" value={project.location || "—"} />
              <Meta
                label="Type"
                value={projectTypeLabel[project.type] ?? project.type}
              />
              <Meta
                label="Status"
                value={projectStatusLabel[project.status] ?? project.status}
              />
              <Meta
                label="Capacity"
                value={
                  project.capacityMw != null
                    ? `${project.capacityMw} MW`
                    : "—"
                }
              />
              <Meta label="Site" value={project.siteName || "—"} />
              <Meta
                label="Expected production"
                value={
                  entryState.values.dashboard?.expectedAnnualGenerationMwh
                    ? `${entryState.values.dashboard.expectedAnnualGenerationMwh} MWh / yr`
                    : "Set in Data Entry → Dashboard"
                }
              />
              <Meta
                label="Target PR"
                value={
                  entryState.values.dashboard?.performanceRatioTarget
                    ? `${entryState.values.dashboard.performanceRatioTarget}%`
                    : "—"
                }
              />
              <Meta
                label="Timezone"
                value={entryState.values.dashboard?.timezone || "—"}
              />
            </dl>
          </section>

          <section className={panelClass} aria-label="Product readiness">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-edge px-4 py-3">
              <div>
                <h2 className={sectionTitleClass}>Products</h2>
              </div>
              <div className="text-right">
                <p className="text-sm tabular-nums text-fg">
                  {running}/{PLANT_PRODUCTS.length} running
                </p>
                <p className="text-xs text-muted">{progress}% intake complete</p>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-fill">
                <div
                  className="h-full rounded-full bg-accent transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {PLANT_PRODUCTS.map((product) => {
                  const status = productStatus(
                    entryState,
                    product.id as PlantProductId,
                  );
                  return (
                    <li key={product.id}>
                      <Link
                        to={`${dataEntryHref}?product=${product.id}`}
                        className={[
                          "flex h-full flex-col rounded-md border px-3 py-2.5 transition-colors",
                          status === "locked"
                            ? "pointer-events-none border-edge opacity-45"
                            : "border-edge hover:bg-fill",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-medium tabular-nums text-muted">
                            {product.code}
                          </span>
                          <StatusPill status={status} />
                        </div>
                        <p className="mt-1 text-sm font-medium text-fg">
                          {product.shortName}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                          {product.enables}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </div>
      ) : null}
    </DashboardShell>
  );
}

function StatusPill({
  status,
}: {
  status: "locked" | "available" | "complete" | "running";
}) {
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
        <Play className="h-2.5 w-2.5" fill="currentColor" />
        Running
      </span>
    );
  }
  if (status === "available") {
    return (
      <span className="rounded bg-fill px-1.5 py-0.5 text-[10px] font-medium text-muted">
        Needs data
      </span>
    );
  }
  if (status === "locked") {
    return (
      <span className="rounded bg-fill px-1.5 py-0.5 text-[10px] font-medium text-subtle">
        Locked
      </span>
    );
  }
  return (
    <span className="rounded bg-fill px-1.5 py-0.5 text-[10px] font-medium text-muted">
      Complete
    </span>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-edge px-3 py-2.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-fg">{value}</dd>
    </div>
  );
}
