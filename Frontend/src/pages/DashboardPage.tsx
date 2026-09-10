import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";
import { Users } from "lucide-react";

import {
  CreateProjectButton,
  Dashboard,
  DashboardShell,
} from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { ApiError, getDashboardRequest, type DashboardPayload } from "@/lib/api";
import { canEditProject } from "@/lib/roles";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      title="Dashboard"
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/team"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
          >
            <Users className="h-3.5 w-3.5" strokeWidth={1.8} />
            Team
          </Link>
          <CreateProjectButton
            disabled={!canEditProject(user?.role ?? "")}
            onClick={() =>
              void navigate("/projects", { state: { create: true } })
            }
          />
        </div>
      }
    >
      {loading ? (
        <p className="text-sm text-muted">Loading site overview…</p>
      ) : error ? (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : data ? (
        <Dashboard data={data} />
      ) : null}
    </DashboardShell>
  );
}
