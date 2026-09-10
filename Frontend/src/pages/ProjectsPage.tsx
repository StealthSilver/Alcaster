import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, X } from "lucide-react";

import {
  CreateProjectButton,
  DashboardShell,
  ProjectTable,
} from "@/components/dashboard";
import { ProjectDrawer } from "@/components/dashboard/ProjectDrawer";
import { panelClass } from "@/components/dashboard/panel";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { ApiError, deleteProjectRequest, type Project } from "@/lib/api";
import { projectHomePath } from "@/lib/paths";
import { canEditProject } from "@/lib/roles";

type LocationState = {
  create?: boolean;
};

export function ProjectsPage() {
  const { user } = useAuth();
  const {
    sites,
    projects,
    selectedSite,
    loading,
    refreshProjects,
    selectSite,
    openProject,
  } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawer, setDrawer] = useState<"create" | Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const role = user?.role ?? "";
  const canCreate = canEditProject(role);

  useEffect(() => {
    const state = location.state as LocationState | null;
    if (!state?.create) return;
    setDrawer("create");
    void navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const shellUser = user
    ? { name: user.name, role: user.role, initials: user.initials }
    : { name: "User", role: "Organization Manager", initials: "U" };

  function viewProject(project: Project) {
    openProject(project);
    void navigate(projectHomePath(project.id));
  }

  function viewTeam(project: Project) {
    if (selectedSite?.id !== project.siteId) {
      selectSite(project.siteId);
    }
    void navigate("/team");
  }

  async function onSaved(project: Project) {
    setDrawer(null);
    if (project.siteId !== selectedSite?.id) {
      selectSite(project.siteId);
    }
    await refreshProjects(project.siteId);
  }

  return (
    <DashboardShell
      user={shellUser}
      title="Projects"
      actions={
        <CreateProjectButton
          disabled={!canCreate}
          onClick={() => setDrawer("create")}
        />
      }
    >
      {loading ? (
        <p className="text-sm text-muted">Loading projects…</p>
      ) : (
        <ProjectTable
          projects={projects}
          role={role}
          onView={viewProject}
          onTeam={viewTeam}
          onEdit={(project) => setDrawer(project)}
          onDelete={(project) => setDeleting(project)}
        />
      )}

      <ProjectDrawer
        open={drawer !== null}
        project={drawer && drawer !== "create" ? drawer : null}
        sites={sites}
        defaultSiteId={selectedSite?.id}
        onClose={() => setDrawer(null)}
        onSaved={onSaved}
      />

      {deleting ? (
        <DeleteProjectDialog
          project={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={async () => {
            await refreshProjects(deleting.siteId);
            setDeleting(null);
          }}
        />
      ) : null}
    </DashboardShell>
  );
}

function DeleteProjectDialog({
  project,
  onClose,
  onDeleted,
}: {
  project: Project;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function confirmDelete() {
    setError(null);
    setSubmitting(true);
    try {
      await deleteProjectRequest(project.id);
      await onDeleted();
    } catch (caught: unknown) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-overlay"
        aria-label="Close delete project dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-project-title"
        className={`relative w-full max-w-md ${panelClass}`}
      >
        <div className="px-4 py-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-fill hover:text-fg"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <h2
            id="delete-project-title"
            className="pr-8 text-sm font-semibold text-fg"
          >
            Delete project
          </h2>
          <p className="mt-1 text-xs text-muted">
            This permanently deletes {project.name} and any twins or tasks under
            it.
          </p>
        </div>
        {error ? (
          <p
            role="alert"
            className="mx-4 mb-3 rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 border-t border-edge px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-8 items-center rounded-md px-3 text-sm text-muted transition-colors hover:bg-fill hover:text-fg disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void confirmDelete()}
            disabled={submitting}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-danger-strong px-3 text-sm font-medium text-on-accent transition-colors hover:bg-danger disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deleting
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
