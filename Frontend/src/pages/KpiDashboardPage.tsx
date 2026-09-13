import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  CmsBreadcrumbs,
  CmsDashboardActions,
  DashboardShell,
  KpiDashboardView,
} from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { useSyncProjectFromRoute } from "@/hooks/useSyncProjectFromRoute";
import {
  ApiError,
  getProjectDashboardRequest,
  type ProjectDashboardPayload,
} from "@/lib/api";
import { readDataEntryState } from "@/lib/dataEntryStore";

export function KpiDashboardPage() {
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
            : "Unable to load KPI dashboard.",
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
  const prTarget = project
    ? Number(
        readDataEntryState(project.id)?.values.dashboard
          ?.performanceRatioTarget,
      ) || 82
    : 82;

  return (
    <DashboardShell
      user={shellUser}
      hideSiteMeta
      title={
        project ? (
          <CmsBreadcrumbs
            projectId={project.id}
            plantName={project.name}
            current="KPI"
          />
        ) : (
          "KPI dashboard"
        )
      }
      actions={
        projectId ? (
          <CmsDashboardActions projectId={projectId} active="kpi" />
        ) : null
      }
    >
      {loading ? (
        <p className="text-sm text-muted">Loading KPI dashboard…</p>
      ) : error ? (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : data ? (
        <KpiDashboardView data={data} prTarget={prTarget} />
      ) : null}
    </DashboardShell>
  );
}
