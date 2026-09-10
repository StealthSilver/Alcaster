import { useState } from "react";
import { useLocation } from "react-router-dom";

import type { DashboardUser } from "@/data/dashboard";
import { isProjectPath } from "@/lib/paths";

import { useWorkspace } from "@/context/WorkspaceContext";

import { Header } from "./Header";
import { Navbar } from "./Navbar";
import { ProjectSidebar } from "./ProjectSidebar";
import { SiteContextLine } from "./SiteContextLine";
import { SiteSidebar } from "./SiteSidebar";

type DashboardShellProps = {
  children: React.ReactNode;
  user: DashboardUser;
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  layout?: "default" | "fill";
  hideHeader?: boolean;
  hideSiteMeta?: boolean;
};

export function DashboardShell({
  children,
  user,
  title = "Dashboard",
  description,
  actions,
  layout = "default",
  hideHeader = false,
  hideSiteMeta = false,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const { selectedSite } = useWorkspace();
  const projectNav = isProjectPath(pathname);
  const fill = layout === "fill";
  const siteMeta =
    !hideSiteMeta && selectedSite ? (
      <SiteContextLine site={selectedSite} />
    ) : null;

  return (
    <div
      className={`flex flex-col bg-page font-sans text-fg antialiased ${
        fill ? "h-screen overflow-hidden" : "min-h-screen"
      }`}
    >
      <Navbar user={user} onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex min-h-0 min-w-0 flex-1">
        <SiteSidebar
          open={!projectNav && sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        {projectNav ? (
          <ProjectSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        ) : null}
        <div
          className={`flex min-h-0 min-w-0 flex-1 flex-col ${
            fill ? "overflow-hidden" : ""
          }`}
        >
          <div
            className={
              fill
                ? "flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-8"
                : "mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6"
            }
          >
            {hideHeader ? null : (
              <Header
                title={title}
                description={
                  siteMeta || description ? (
                    <>
                      {siteMeta}
                      {description}
                    </>
                  ) : null
                }
                actions={actions}
              />
            )}
            <main
              className={
                fill
                  ? "mt-4 flex min-h-0 flex-1 flex-col overflow-hidden"
                  : hideHeader
                    ? "pb-10"
                    : "mt-6 pb-10"
              }
            >
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
