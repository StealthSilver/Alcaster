import { LayoutDashboard } from "lucide-react";
import { useLocation } from "react-router-dom";

import { DashboardShell } from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useSyncProjectFromRoute } from "@/hooks/useSyncProjectFromRoute";
import { isProjectPath } from "@/lib/paths";

type SectionPageProps = {
  title: string;
  description: string;
};

export function SectionPage({ title, description }: SectionPageProps) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { selectedSite, selectedProject } = useWorkspace();
  const projectNav = isProjectPath(pathname);
  useSyncProjectFromRoute();

  const shellUser = user
    ? { name: user.name, role: user.role, initials: user.initials }
    : { name: "User", role: "Organization Manager", initials: "U" };

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const contextName = projectNav
    ? (selectedProject?.name ?? "Project")
    : (selectedSite?.name ?? "Site");

  return (
    <DashboardShell
      user={shellUser}
      dateLabel={dateLabel}
      title={title}
    >
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-6 py-16 text-center shadow-[0_8px_28px_rgba(0,0,0,0.22)]">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#e6740a]">
          <LayoutDashboard className="h-5 w-5" strokeWidth={1.6} />
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-tight text-white">
          {title}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/40">
          This {projectNav ? "project" : "site"} workspace is ready. {description}{" "}
          for {contextName}.
        </p>
      </div>
    </DashboardShell>
  );
}
