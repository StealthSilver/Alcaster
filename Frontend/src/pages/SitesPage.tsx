import {
  CreateSiteButton,
  DashboardShell,
  SiteTable,
} from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";

export function SitesPage() {
  const { user } = useAuth();
  const { sites, loading } = useWorkspace();

  const shellUser = user
    ? { name: user.name, role: user.role, initials: user.initials }
    : { name: "User", role: "Organization Manager", initials: "U" };

  return (
    <DashboardShell
      user={shellUser}
      title="Sites"
      actions={<CreateSiteButton />}
    >
      {loading ? (
        <p className="text-sm text-muted">Loading sites…</p>
      ) : (
        <SiteTable sites={sites} />
      )}
    </DashboardShell>
  );
}
