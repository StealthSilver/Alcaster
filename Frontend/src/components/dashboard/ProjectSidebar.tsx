import {
  Activity,
  Bell,
  Box,
  Briefcase,
  Calculator,
  ClipboardList,
  Database,
  Gauge,
  LayoutDashboard,
  LineChart,
  ListOrdered,
  Map,
  Settings,
  Wrench,
  Zap,
  X,
} from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";

import { useWorkspace } from "@/context/WorkspaceContext";
import { projectHomePath } from "@/lib/paths";

import { isNavActive, type SidebarNavItem } from "./nav";
import { iconButtonClass, sidebarItemClass } from "./panel";

type NavGroup = {
  id: string;
  label: string;
  items: SidebarNavItem[];
};

function plantGroups(base: string): NavGroup[] {
  return [
    {
      id: "data-entry",
      label: "Data Entry",
      items: [
        {
          href: `${base}/data-entry`,
          label: "Product intake",
          Icon: ClipboardList,
        },
      ],
    },
    {
      id: "overview",
      label: "Overview",
      items: [
        { href: `${base}/portfolio`, label: "Portfolio", Icon: Briefcase },
        {
          href: base,
          label: "Dashboard (CMS)",
          Icon: LayoutDashboard,
          match: "exact",
        },
        { href: `${base}/kpi`, label: "KPI dashboard", Icon: Activity },
        {
          href: `${base}/performance`,
          label: "Performance",
          Icon: LineChart,
        },
      ],
    },
    {
      id: "monitoring",
      label: "Monitoring",
      items: [
        { href: `${base}/scada`, label: "SCADA", Icon: Gauge },
        { href: `${base}/alerts`, label: "Alerts", Icon: Bell },
        { href: `${base}/events`, label: "Events", Icon: ListOrdered },
      ],
    },
    {
      id: "analytics",
      label: "Analytics & planning",
      items: [
        { href: `${base}/forecasting`, label: "Forecasting", Icon: LineChart },
        {
          href: `${base}/data-explorer`,
          label: "Data Explorer",
          Icon: Database,
        },
        {
          href: `${base}/rule-engine`,
          label: "Rule Engine",
          Icon: Calculator,
        },
      ],
    },
    {
      id: "operations",
      label: "Operations",
      items: [
        { href: `${base}/cmms`, label: "CMMS", Icon: Wrench },
        { href: `${base}/ems`, label: "EMS", Icon: Zap },
      ],
    },
    {
      id: "digital-twin",
      label: "Digital twin",
      items: [
        { href: `${base}/digital-twin`, label: "Plant twin", Icon: Box },
        { href: `${base}/sitemap`, label: "Sitemap", Icon: Map },
        { href: `${base}/analytics`, label: "Analytics", Icon: Activity },
      ],
    },
  ];
}

type ProjectSidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function ProjectSidebar({ open, onClose }: ProjectSidebarProps) {
  const { pathname } = useLocation();
  const { projectId } = useParams();
  const { selectedProject, projects } = useWorkspace();
  const project =
    selectedProject ?? projects.find((item) => item.id === projectId) ?? null;
  const id = project?.id ?? projectId ?? "";
  const base = id ? projectHomePath(id) : "/projects";
  const groups = plantGroups(base);
  const settingsHref = id ? `${base}/settings` : "/settings";
  const settingsActive =
    pathname === settingsHref || pathname.startsWith(`${settingsHref}/`);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-overlay transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`fixed top-14 bottom-0 left-0 z-30 flex w-56 flex-col overflow-hidden border-r border-edge bg-nav transition-transform duration-300 ease-out lg:static lg:z-10 lg:h-full lg:shrink-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Plant navigation"
      >
        <div className="flex shrink-0 justify-end border-b border-edge px-3 py-2 lg:hidden">
          <button
            type="button"
            onClick={onClose}
            className={iconButtonClass}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-3">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
            {groups.map((group) => (
              <NavSection
                key={group.id}
                group={group}
                pathname={pathname}
                onClose={onClose}
              />
            ))}
          </div>

          <div className="mt-3 shrink-0 border-t border-edge pt-2">
            <Link
              to={settingsHref}
              onClick={onClose}
              className={sidebarItemClass(settingsActive)}
            >
              {settingsActive ? (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
              ) : null}
              <Settings
                className={`relative h-4 w-4 ${settingsActive ? "text-accent" : ""}`}
                strokeWidth={1.6}
              />
              <span className="relative">Settings</span>
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}

function NavSection({
  group,
  pathname,
  onClose,
}: {
  group: NavGroup;
  pathname: string;
  onClose: () => void;
}) {
  return (
    <div>
      <p className="px-3 pb-1 text-xs font-medium text-muted">{group.label}</p>
      <ul className="space-y-0.5">
        {group.items.map((item) => {
          const active = isNavActive(pathname, item.href, item.match);
          return (
            <li key={item.href}>
              <Link
                to={item.href}
                onClick={onClose}
                className={sidebarItemClass(active)}
              >
                {active ? (
                  <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
                ) : null}
                <item.Icon
                  className={`relative h-4 w-4 ${active ? "text-accent" : ""}`}
                  strokeWidth={1.6}
                />
                <span className="relative">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
