import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, X } from "lucide-react";

import {
  CreateSiteButton,
  DashboardShell,
  SiteTable,
} from "@/components/dashboard";
import { SiteDrawer } from "@/components/dashboard/SiteDrawer";
import { panelClass } from "@/components/dashboard/panel";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { ApiError, deleteSiteRequest, type Site } from "@/lib/api";
import { canEditSite } from "@/lib/roles";

export function SitesPage() {
  const { user } = useAuth();
  const { sites, loading, refreshSites, selectSite } = useWorkspace();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState<"create" | Site | null>(null);
  const [deleting, setDeleting] = useState<Site | null>(null);

  const role = user?.role ?? "";
  const canCreate = canEditSite(role);

  const shellUser = user
    ? { name: user.name, role: user.role, initials: user.initials }
    : { name: "User", role: "Organization Manager", initials: "U" };

  function viewSite(site: Site) {
    selectSite(site.id);
    void navigate("/");
  }

  async function onSaved(site: Site) {
    await refreshSites();
    selectSite(site.id);
    setDrawer(null);
  }

  return (
    <DashboardShell
      user={shellUser}
      title="Sites"
      hideSiteMeta
      actions={
        <CreateSiteButton
          disabled={!canCreate}
          onClick={() => setDrawer("create")}
        />
      }
    >
      {loading ? (
        <p className="text-sm text-muted">Loading sites…</p>
      ) : (
        <SiteTable
          sites={sites}
          role={role}
          onView={viewSite}
          onEdit={(site) => setDrawer(site)}
          onDelete={(site) => setDeleting(site)}
        />
      )}

      <SiteDrawer
        open={drawer !== null}
        site={drawer && drawer !== "create" ? drawer : null}
        onClose={() => setDrawer(null)}
        onSaved={onSaved}
      />

      {deleting ? (
        <DeleteSiteDialog
          site={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={async () => {
            await refreshSites();
            setDeleting(null);
          }}
        />
      ) : null}
    </DashboardShell>
  );
}

function DeleteSiteDialog({
  site,
  onClose,
  onDeleted,
}: {
  site: Site;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function confirmDelete() {
    setError(null);
    setSubmitting(true);
    try {
      await deleteSiteRequest(site.id);
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
        aria-label="Close delete site dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-site-title"
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
          <h2 id="delete-site-title" className="pr-8 text-sm font-semibold text-fg">
            Delete site
          </h2>
          <p className="mt-1 text-xs text-muted">
            This permanently deletes {site.name} and any projects under it.
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
