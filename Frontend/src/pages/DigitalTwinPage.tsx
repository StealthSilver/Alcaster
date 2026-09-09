import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { DashboardShell } from "@/components/dashboard";
import { CreateTwinForm } from "@/components/twin/CreateTwinForm";
import { TwinViewer } from "@/components/twin/TwinViewer";
import { useAuth } from "@/context/AuthContext";
import { useSyncProjectFromRoute } from "@/hooks/useSyncProjectFromRoute";
import {
  ApiError,
  getProjectRequest,
  getProjectTwinRequest,
  type Project,
  type TwinRecord,
} from "@/lib/api";

export function DigitalTwinPage() {
  useSyncProjectFromRoute();
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [twin, setTwin] = useState<TwinRecord | null>(null);
  const [editing, setEditing] = useState(false);
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

  return (
    <DashboardShell
      user={shellUser}
      title="Digital Twin"
      layout={showForm || loading || error ? "default" : "fill"}
    >
      {loading ? (
        <p className="text-sm text-muted">Loading digital twin…</p>
      ) : error ? (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : project && showForm ? (
        <div className="space-y-5">
          <div>
            <p className="text-sm text-muted">
              Enter the plant details used to generate a dummy site model —
              land, modules, cabling, inverters, and the grid yard.
            </p>
          </div>
          <CreateTwinForm
            project={project}
            existing={twin?.spec}
            onCreated={(next) => {
              setTwin(next);
              setEditing(false);
            }}
            onCancel={twin ? () => setEditing(false) : undefined}
          />
        </div>
      ) : project && twin ? (
        <TwinViewer
          twin={twin}
          projectName={project.name}
          onRebuild={() => setEditing(true)}
        />
      ) : (
        <p className="text-sm text-muted">Project not found.</p>
      )}
    </DashboardShell>
  );
}
