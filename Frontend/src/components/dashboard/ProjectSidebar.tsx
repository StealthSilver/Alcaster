import { useState } from "react";
import {
  Activity,
  Box,
  ChevronDown,
  Gauge,
  LayoutDashboard,
  LineChart,
  Map,
  Radio,
  Settings,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation, useParams } from "react-router-dom";

import { useWorkspace } from "@/context/WorkspaceContext";
import { projectHomePath } from "@/lib/paths";

import { isNavActive, type SidebarNavItem } from "./nav";

type NavGroup = {
  id: string;
  label: string;
  items: SidebarNavItem[];
};

function projectGroups(base: string): NavGroup[] {
  return [
    {
      id: "overview",
      label: "Overview",
      items: [
        { href: base, label: "Dashboard", Icon: LayoutDashboard, match: "exact" },
      ],
    },
    {
      id: "plant",
      label: "Plant",
      items: [
        { href: `${base}/digital-twin`, label: "Digital Twin", Icon: Box },
        { href: `${base}/sitemap`, label: "Sitemap", Icon: Map },
        { href: `${base}/scada`, label: "SCADA", Icon: Gauge },
        { href: `${base}/monitoring`, label: "Monitoring", Icon: Radio },
      ],
    },
    {
      id: "insights",
      label: "Insights",
      items: [
        { href: `${base}/analytics`, label: "Analytics", Icon: Activity },
        { href: `${base}/forecasting`, label: "Forecasting", Icon: LineChart },
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
  const groups = projectGroups(base);
  const settingsHref = id ? `${base}/settings` : "/settings";
  const settingsActive =
    pathname === settingsHref || pathname.startsWith(`${settingsHref}/`);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-white/[0.06] bg-[#010609] transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Project navigation"
      >
        <div className="flex h-12 items-center justify-between px-4 lg:h-auto lg:px-4 lg:pt-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[rgba(120,180,140,0.95)]">
              Project
            </p>
            <p className="truncate text-[13px] font-semibold text-white">
              {project?.name ?? "Select a project"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-white/40 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-3 flex flex-1 flex-col overflow-y-auto px-3 pb-4">
          <div className="space-y-3">
            {groups.map((group) => (
              <NavSection
                key={group.id}
                group={group}
                pathname={pathname}
                onClose={onClose}
              />
            ))}
          </div>

          <div className="my-3 h-px bg-white/[0.06]" />

          <Link
            to={settingsHref}
            onClick={onClose}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
              settingsActive
                ? "bg-[#e6740a]/12 text-white"
                : "text-white/45 hover:bg-white/[0.03] hover:text-white/75"
            }`}
          >
            <Settings className="h-4 w-4" strokeWidth={1.6} />
            Settings
          </Link>
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
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/35 transition-colors hover:text-white/55"
      >
        {group.label}
        <ChevronDown
          className={`h-3 w-3 transition-transform ${expanded ? "" : "-rotate-90"}`}
          strokeWidth={2}
        />
      </button>
      {expanded ? (
        <ul className="mt-0.5 space-y-0.5">
          {group.items.map((item) => {
            const active = isNavActive(pathname, item.href, item.match);
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                    active
                      ? "text-white"
                      : "text-white/45 hover:bg-white/[0.03] hover:text-white/75"
                  }`}
                >
                  {active ? (
                    <motion.span
                      layoutId="project-nav-active"
                      className="absolute inset-0 rounded-lg bg-[#e6740a]/12"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                  <item.Icon
                    className={`relative h-4 w-4 ${active ? "text-[#e6740a]" : ""}`}
                    strokeWidth={1.6}
                  />
                  <span className="relative">{item.label}</span>
                  {active ? (
                    <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-[#e6740a]" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
