import { useEffect, useState } from "react";

import {
  CreateProjectButton,
  Dashboard,
  DashboardShell,
} from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { ApiError, getDashboardRequest, type DashboardPayload } from "@/lib/api";

export function DashboardPage() {
  const { user } = useAuth();
  const { selectedSite, loading: workspaceLoading } = useWorkspace();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workspaceLoading) return;
    let cancelled = false;
    getDashboardRequest(selectedSite?.id)
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Unable to load the dashboard.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSite?.id, workspaceLoading]);

  const shellUser = user
    ? { name: user.name, role: user.role, initials: user.initials }
    : { name: "User", role: "Organization Manager", initials: "U" };

  return (
    <DashboardShell
      user={shellUser}
      dateLabel={data?.dateLabel ?? ""}
      title="Dashboard"
      actions={<CreateProjectButton />}
    >
      {loading ? (
        <p className="text-sm text-white/40">Loading site overview…</p>
      ) : error ? (
        <p className="rounded-xl border border-[#f07167]/25 bg-[#f07167]/10 px-4 py-3 text-sm text-[#f07167]">
          {error}
        </p>
      ) : data ? (
        <Dashboard data={data} />
      ) : null}
    </DashboardShell>
  );
}
