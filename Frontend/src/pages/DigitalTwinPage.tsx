import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Map, RotateCcw } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { DashboardShell } from "@/components/dashboard";
import { CreateTwinForm } from "@/components/twin/CreateTwinForm";
import { TwinViewer } from "@/components/twin/TwinViewer";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useAssetSelection } from "@/hooks/useAssetSelection";
import { useSyncProjectFromRoute } from "@/hooks/useSyncProjectFromRoute";
import {
  ApiError,
  getProjectRequest,
  getProjectTwinRequest,
  type Project,
  type TwinRecord,
} from "@/lib/api";
import { projectSitemapPath } from "@/lib/paths";

export function DigitalTwinPage() {
  useSyncProjectFromRoute();
  const { projectId } = useParams();
  const { user } = useAuth();
  const { sites, selectedSite } = useWorkspace();
  const [project, setProject] = useState<Project | null>(null);
  const [twin, setTwin] = useState<TwinRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formActions, setFormActions] = useState<ReactNode>(null);
  const { selectedAssetId } = useAssetSelection(projectId);
  const onHeaderActions = useCallback((actions: ReactNode | null) => {
    setFormActions(actions);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([getProjectRequest(projectId), getProjectTwinRequest(projectId)])
      .then(([projectPayload, twinPayload]) => {
        if (cancelled) return;
        setProject(projectPayload.project);
        setTwin(twinPayload.twin);
        setEditing(!twinPayload.twin);
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

  const showForm = !loading && !error && project && (editing || !twin);
  const pageTitle = project ? `${project.name} / Digital Twin` : "Digital Twin";

  const viewerActions =
    project && twin && !showForm ? (
      <>
        <Link
          to={projectSitemapPath(project.id, selectedAssetId)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
        >
          <Map className="h-3.5 w-3.5" />
          Sitemap
        </Link>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Edit inputs
        </button>
      </>
    ) : null;

  return (
    <DashboardShell
      user={shellUser}
      title={pageTitle}
      layout="fill"
      actions={showForm ? formActions : viewerActions}
    >
      {loading ? (
        <p className="text-sm text-muted">Loading digital twin…</p>
      ) : error ? (
        <p className="rounded-md border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : project && showForm ? (
        <CreateTwinForm
          project={project}
          site={
            sites.find((item) => item.id === project.siteId) ?? selectedSite
          }
          sites={sites}
          organizationName={user?.organizationName ?? null}
          existing={twin?.spec}
          onHeaderActions={onHeaderActions}
          onCreated={(next) => {
            setTwin(next);
            setEditing(false);
          }}
          onCancel={twin ? () => setEditing(false) : undefined}
        />
      ) : project && twin ? (
        <TwinViewer twin={twin} projectName={project.name} />
      ) : (
        <p className="text-sm text-muted">Project not found.</p>
      )}
    </DashboardShell>
  );
}
