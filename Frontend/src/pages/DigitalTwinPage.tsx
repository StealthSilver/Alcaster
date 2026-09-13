import { useEffect, useState } from "react";
import { ClipboardList, Map } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { DashboardShell } from "@/components/dashboard";
import { TwinViewer } from "@/components/twin/TwinViewer";
import { useAuth } from "@/context/AuthContext";
import { useAssetSelection } from "@/hooks/useAssetSelection";
import { useSyncProjectFromRoute } from "@/hooks/useSyncProjectFromRoute";
import {
  ApiError,
  getProjectRequest,
  getProjectTwinRequest,
  type Project,
  type TwinRecord,
} from "@/lib/api";
import { projectDataEntryPath, projectSitemapPath } from "@/lib/paths";

export function DigitalTwinPage() {
  useSyncProjectFromRoute();
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [twin, setTwin] = useState<TwinRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedAssetId } = useAssetSelection(projectId);

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
            : "Unable to load the digital twin.",
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

  const pageTitle = project ? `${project.name} / Digital Twin` : "Digital Twin";

  const viewerActions =
    project && twin ? (
      <>
        <Link
          to={projectSitemapPath(project.id, selectedAssetId)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
        >
          <Map className="h-3.5 w-3.5" />
          Sitemap
        </Link>
        <Link
          to={`${projectDataEntryPath(project.id)}?product=dt-normal`}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          Edit inputs
        </Link>
      </>
    ) : null;

  return (
    <DashboardShell
      user={shellUser}
      title={pageTitle}
      layout="fill"
      actions={viewerActions}
    >
      {loading ? (
        <p className="text-sm text-muted">Loading digital twin…</p>
      ) : error ? (
        <p className="rounded-md border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : project && twin ? (
        <TwinViewer twin={twin} projectName={project.name} />
      ) : project ? (
        <div className="rounded-md border border-edge bg-panel px-4 py-6 text-sm text-muted">
          <p>No digital twin data has been entered for this plant yet.</p>
          <Link
            to={`${projectDataEntryPath(project.id)}?product=dt-normal`}
            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Go to data entry
          </Link>
        </div>
      ) : (
        <p className="text-sm text-muted">Plant not found.</p>
      )}
    </DashboardShell>
  );
}
