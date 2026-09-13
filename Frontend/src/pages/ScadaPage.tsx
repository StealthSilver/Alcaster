import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

import { DashboardShell } from "@/components/dashboard";
import { ScadaViewer } from "@/components/scada/ScadaViewer";
import { useAuth } from "@/context/AuthContext";
import { useSyncProjectFromRoute } from "@/hooks/useSyncProjectFromRoute";
import {
  ApiError,
  getProjectDashboardRequest,
  getProjectTwinRequest,
  type ProjectDashboardPayload,
  type TwinRecord,
} from "@/lib/api";
import { ensureDemoDataEntry } from "@/lib/demoDataEntry";
import { projectHomePath } from "@/lib/paths";

export function ScadaPage() {
  useSyncProjectFromRoute();
  const { projectId } = useParams();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<ProjectDashboardPayload | null>(
    null,
  );
  const [twin, setTwin] = useState<TwinRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getProjectDashboardRequest(projectId),
      getProjectTwinRequest(projectId),
    ])
      .then(([dashboardPayload, twinPayload]) => {
        if (cancelled) return;
        ensureDemoDataEntry(dashboardPayload.project);
        setDashboard(dashboardPayload);
        setTwin(twinPayload.twin);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Unable to load SCADA.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const shellUser = user
    ? { name: user.name, role: user.role, initials: user.initials }
    : { name: "User", role: "Organization Manager", initials: "U" };

  const ready = Boolean(dashboard && !loading && !error);
  const project = dashboard?.project;

  return (
    <DashboardShell
      user={shellUser}
      hideSiteMeta
      title={
        project ? (
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm"
          >
            <Link
              to={projectHomePath(project.id)}
              className="inline-flex text-muted transition-colors hover:text-fg"
              aria-label="Plant home"
            >
              <LayoutDashboard className="h-4 w-4" strokeWidth={1.75} />
            </Link>
            <span className="text-muted">/</span>
            <Link
              to={projectHomePath(project.id)}
              className="truncate text-muted transition-colors hover:text-fg"
            >
              {project.name}
            </Link>
            <span className="text-muted">/</span>
            <span className="truncate font-medium text-fg">SCADA</span>
          </nav>
        ) : (
          "SCADA"
        )
      }
      layout={ready ? "fill" : "default"}
      actions={
        projectId ? (
          <Link
            to={projectHomePath(projectId)}
            className="inline-flex h-8 items-center rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
          >
            CMS dashboard
          </Link>
        ) : null
      }
    >
      {loading ? (
        <p className="text-sm text-muted">Loading SCADA…</p>
      ) : error ? (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : dashboard ? (
        <ScadaViewer dashboard={dashboard} twin={twin} />
      ) : (
        <p className="text-sm text-muted">Plant not found.</p>
      )}
    </DashboardShell>
  );
}
