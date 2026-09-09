import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

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

export function ScadaPage() {
  useSyncProjectFromRoute();
  const { projectId } = useParams();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<ProjectDashboardPayload | null>(null);
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

  return (
    <DashboardShell
      user={shellUser}
      title="SCADA"
      layout={ready ? "fill" : "default"}
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
        <p className="text-sm text-muted">Project not found.</p>
      )}
    </DashboardShell>
  );
}
