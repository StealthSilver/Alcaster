import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  CmsBreadcrumbs,
  CmsDashboardActions,
  DashboardShell,
  ForecastDashboardView,
} from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { useSyncProjectFromRoute } from "@/hooks/useSyncProjectFromRoute";
import {
  ApiError,
  getProjectDashboardRequest,
  type ProjectDashboardPayload,
} from "@/lib/api";

export function ForecastDashboardPage() {
  useSyncProjectFromRoute();
  const { projectId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<ProjectDashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
            : "Unable to load forecasting dashboard.",
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
            current="Forecast"
          />
        ) : (
          "Forecasting"
        )
      }
      actions={
        projectId ? <CmsDashboardActions projectId={projectId} /> : null
      }
    >
      {loading ? (
        <p className="text-sm text-muted">Loading forecasting dashboard…</p>
      ) : error ? (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : data ? (
        <ForecastDashboardView data={data} />
      ) : null}
    </DashboardShell>
  );
}
