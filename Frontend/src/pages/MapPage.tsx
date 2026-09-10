import { useNavigate } from "react-router-dom";

import { DashboardShell, SitesMap } from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import type { Site } from "@/lib/api";

export function MapPage() {
  const { user } = useAuth();
  const { sites, loading, selectedSite, selectSite } = useWorkspace();
  const navigate = useNavigate();

  const shellUser = user
    ? { name: user.name, role: user.role, initials: user.initials }
    : { name: "User", role: "Organization Manager", initials: "U" };

  function openSite(site: Site) {
    selectSite(site.id);
    void navigate("/");
  }

  return (
    <DashboardShell
      user={shellUser}
      title="Map"
      hideSiteMeta
      layout={loading ? "default" : "fill"}
    >
      {loading ? (
        <p className="text-sm text-muted">Loading sites…</p>
      ) : (
        <SitesMap
          sites={sites}
          initialSiteId={selectedSite?.id}
          onOpenSite={openSite}
        />
      )}
    </DashboardShell>
  );
}
