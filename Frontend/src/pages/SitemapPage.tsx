import { Map } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { DashboardShell } from "@/components/dashboard";
import { SitemapViewer } from "@/components/sitemap/SitemapViewer";
import { useAuth } from "@/context/AuthContext";
import { useSyncProjectFromRoute } from "@/hooks/useSyncProjectFromRoute";
import {
  ApiError,
  getProjectRequest,
  getProjectTwinRequest,
  type Project,
  type TwinRecord,
} from "@/lib/api";
import { projectTwinPath } from "@/lib/paths";

export function SitemapPage() {
  useSyncProjectFromRoute();
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [twin, setTwin] = useState<TwinRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([getProjectRequest(projectId), getProjectTwinRequest(projectId)])
      .then(([projectPayload, twinPayload]) => {
        if (cancelled) return;
        setProject(projectPayload.project);
        setTwin(twinPayload.twin);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Unable to load the sitemap.",
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

  const ready = Boolean(project && twin && !loading && !error);

  return (
    <DashboardShell
      user={shellUser}
      title="Sitemap"
      layout={ready ? "fill" : "default"}
    >
      {loading ? (
        <p className="text-sm text-muted">Loading sitemap…</p>
      ) : error ? (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : project && !twin ? (
        <div className="rounded-md border border-edge bg-surface px-6 py-16 text-center shadow-[var(--alcaster-shadow)]">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md border border-edge bg-fill text-accent">
            <Map className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight text-fg">
            Create the digital twin first
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Every digital twin has an associated sitemap. Generate the 3D plant
            model and the 2D single-line diagram is built from the same layout.
          </p>
          <Link
            to={projectTwinPath(project.id)}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
          >
            Open digital twin
          </Link>
        </div>
      ) : project && twin ? (
        <SitemapViewer twin={twin} projectName={project.name} />
      ) : (
        <p className="text-sm text-muted">Project not found.</p>
      )}
    </DashboardShell>
  );
}
