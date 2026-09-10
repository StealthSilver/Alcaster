import { useNavigate } from "react-router-dom";

import { DashboardShell, SiteTable } from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";

export function AssignedSitesPage() {
  const { user } = useAuth();
  const { sites, loading, selectSite } = useWorkspace();
  const navigate = useNavigate();
  const role = user?.role ?? "";

  const shellUser = user
    ? { name: user.name, role: user.role, initials: user.initials }
    : { name: "User", role: "Organization Manager", initials: "U" };

  return (
    <DashboardShell
      user={shellUser}
      title="Assigned sites"
      hideSiteMeta
    >
      {loading ? (
        <p className="text-sm text-muted">Loading sites…</p>
      ) : sites.length === 0 ? (
        <div className="rounded-md border border-edge bg-surface px-4 py-12 text-center text-sm text-muted">
          No sites are assigned to you yet.
        </div>
      ) : (
        <SiteTable
          sites={sites}
          role={role}
          manageActions={false}
          onView={(site) => {
            selectSite(site.id);
            void navigate("/");
          }}
          onEdit={() => undefined}
          onDelete={() => undefined}
        />
      )}
    </DashboardShell>
  );
}
