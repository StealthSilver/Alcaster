import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  AlertsDashboardView,
  CmsBreadcrumbs,
  DashboardShell,
} from "@/components/dashboard";
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
import {
  projectEventsPath,
  projectHomePath,
} from "@/lib/paths";

export function AlertsPage() {
  useSyncProjectFromRoute();
  const { projectId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<ProjectDashboardPayload | null>(null);
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
        setData(dashboardPayload);
        setTwin(twinPayload.twin);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Unable to load alerts.",
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

  const project = data?.project;

  return (
    <DashboardShell
      user={shellUser}
      hideSiteMeta
      title={
        project ? (
          <CmsBreadcrumbs
            projectId={project.id}
            plantName={project.name}
            current="Alerts"
          />
        ) : (
          "Alerts"
        )
      }
      actions={
        projectId ? (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={projectEventsPath(projectId)}
              className="inline-flex h-8 items-center rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
            >
              Events
            </Link>
            <Link
              to={projectHomePath(projectId)}
              className="inline-flex h-8 items-center rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
            >
              CMS dashboard
            </Link>
          </div>
        ) : null
      }
    >
      {loading ? (
        <p className="text-sm text-muted">Loading alerts…</p>
      ) : error ? (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : data ? (
        <AlertsDashboardView data={data} twin={twin} />
      ) : null}
    </DashboardShell>
  );
}
