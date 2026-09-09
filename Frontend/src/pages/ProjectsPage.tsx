import {
  CreateProjectButton,
  DashboardShell,
  ProjectTable,
} from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";

export function ProjectsPage() {
  const { user } = useAuth();
  const { projects, loading } = useWorkspace();

  const shellUser = user
    ? { name: user.name, role: user.role, initials: user.initials }
    : { name: "User", role: "Organization Manager", initials: "U" };

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <DashboardShell
      user={shellUser}
      dateLabel={dateLabel}
      title="Projects"
      actions={<CreateProjectButton />}
    >
      {loading ? (
        <p className="text-sm text-white/40">Loading projects…</p>
      ) : (
        <ProjectTable projects={projects} />
      )}
    </DashboardShell>
  );
}
