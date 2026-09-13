import { LayoutDashboard } from "lucide-react";
import { useLocation } from "react-router-dom";

import { DashboardShell } from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { useSyncProjectFromRoute } from "@/hooks/useSyncProjectFromRoute";
import { isProjectPath } from "@/lib/paths";

type SectionPageProps = {
  title: string;
  description?: string;
};

export function SectionPage({ title }: SectionPageProps) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const projectNav = isProjectPath(pathname);
  useSyncProjectFromRoute();

  const shellUser = user
    ? { name: user.name, role: user.role, initials: user.initials }
    : { name: "User", role: "Organization Manager", initials: "U" };

  return (
    <DashboardShell user={shellUser} title={title}>
      <div className="rounded-md border border-edge bg-surface px-6 py-16 text-center shadow-[var(--alcaster-shadow)]">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md border border-edge bg-fill text-accent">
          <LayoutDashboard className="h-5 w-5" strokeWidth={1.6} />
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-tight text-fg">
          {title}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          This {projectNav ? "plant" : "site"} workspace is ready.
        </p>
      </div>
    </DashboardShell>
  );
}
