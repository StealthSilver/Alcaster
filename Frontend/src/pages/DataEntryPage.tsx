import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { DashboardShell } from "@/components/dashboard";
import { DataEntryWorkspace } from "@/components/data-entry/DataEntryWorkspace";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useSyncProjectFromRoute } from "@/hooks/useSyncProjectFromRoute";
import {
  ApiError,
  getProjectRequest,
  getProjectTwinRequest,
  type Project,
  type TwinRecord,
} from "@/lib/api";
import { PLANT_PRODUCT_IDS, type PlantProductId } from "@/lib/plantProducts";

function parseProductId(raw: string | null): PlantProductId | null {
  if (!raw) return null;
  return PLANT_PRODUCT_IDS.includes(raw as PlantProductId)
    ? (raw as PlantProductId)
    : null;
}

export function DataEntryPage() {
  useSyncProjectFromRoute();
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { sites, selectedSite } = useWorkspace();
  const [project, setProject] = useState<Project | null>(null);
  const [twin, setTwin] = useState<TwinRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formActions, setFormActions] = useState<ReactNode>(null);
  const onHeaderActions = useCallback((actions: ReactNode | null) => {
    setFormActions(actions);
  }, []);

  const initialProductId = parseProductId(searchParams.get("product"));

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
            : "Unable to load plant data entry.",
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

  const pageTitle = project
    ? `${project.name} / Data Entry`
    : "Data Entry";

  return (
    <DashboardShell
      user={shellUser}
      title={pageTitle}
      layout="fill"
      actions={formActions}
    >
      {loading ? (
        <p className="text-sm text-muted">Loading data entry…</p>
      ) : error ? (
        <p className="rounded-md border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : project ? (
        <DataEntryWorkspace
          project={project}
          site={
            sites.find((item) => item.id === project.siteId) ?? selectedSite
          }
          sites={sites}
          organizationName={user?.organizationName ?? null}
          twin={twin}
          initialProductId={initialProductId}
          onHeaderActions={onHeaderActions}
          onTwinCreated={(next) => setTwin(next)}
        />
      ) : (
        <p className="text-sm text-muted">Plant not found.</p>
      )}
    </DashboardShell>
  );
}
