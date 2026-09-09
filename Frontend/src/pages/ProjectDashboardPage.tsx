import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { DashboardShell, ProjectDashboard } from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { useSyncProjectFromRoute } from "@/hooks/useSyncProjectFromRoute";
import {
  ApiError,
  getProjectDashboardRequest,
  type ProjectDashboardPayload,
} from "@/lib/api";

export function ProjectDashboardPage() {
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
            : "Unable to load this project.",
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
      dateLabel={data?.dateLabel ?? ""}
      title={project?.name ?? "Project"}
    >
      {loading ? (
        <p className="text-sm text-white/40">Loading project…</p>
      ) : error ? (
        <p className="rounded-xl border border-[#f07167]/25 bg-[#f07167]/10 px-4 py-3 text-sm text-[#f07167]">
          {error}
        </p>
      ) : data ? (
        <ProjectDashboard data={data} />
      ) : null}
    </DashboardShell>
  );
}
