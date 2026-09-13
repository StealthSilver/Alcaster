import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ClipboardList } from "lucide-react";

import {
  CmsBreadcrumbs,
  DashboardShell,
  DataExplorerView,
} from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { useSyncProjectFromRoute } from "@/hooks/useSyncProjectFromRoute";
import {
  ApiError,
  getProjectDashboardRequest,
  type ProjectDashboardPayload,
} from "@/lib/api";
import { ensureDemoDataEntry } from "@/lib/demoDataEntry";
import {
  projectDataEntryPath,
  projectRuleEnginePath,
} from "@/lib/paths";

export function DataExplorerPage() {
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
        ensureDemoDataEntry(payload.project);
        setData(payload);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Unable to load data explorer.",
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
            current="Data Explorer"
          />
        ) : (
          "Data Explorer"
        )
      }
      actions={
        projectId ? (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={projectRuleEnginePath(projectId)}
              className="inline-flex h-8 items-center rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
            >
              Rule Engine
            </Link>
            <Link
              to={`${projectDataEntryPath(projectId)}?product=data-explorer`}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Edit intake
            </Link>
          </div>
        ) : null
      }
    >
      {loading ? (
        <p className="text-sm text-muted">Loading data explorer…</p>
      ) : error ? (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : data ? (
        <DataExplorerView data={data} />
      ) : null}
    </DashboardShell>
  );
}
