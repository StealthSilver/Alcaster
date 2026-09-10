import {
  AlertTriangle,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Map,
  MapPin,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { isNavActive, type SidebarNavItem } from "./nav";
import { iconButtonClass, sidebarItemClass } from "./panel";

const siteNav: SidebarNavItem[] = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard, match: "dashboard" },
  { href: "/sites", label: "Sites", Icon: MapPin },
  { href: "/map", label: "Map", Icon: Map },
  { href: "/projects", label: "Projects", Icon: FolderKanban },
  { href: "/team", label: "Team", Icon: Users },
  { href: "/alerts", label: "Alerts", Icon: AlertTriangle },
  { href: "/reports", label: "Reports", Icon: FileText },
  { href: "/settings", label: "Settings", Icon: Settings },
];

type SiteSidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function SiteSidebar({ open, onClose }: SiteSidebarProps) {
  const { pathname } = useLocation();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-overlay transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <div className="relative z-50 hidden w-14 shrink-0 lg:block">
        <aside
          className="group/site absolute inset-y-0 left-0 flex w-14 flex-col overflow-hidden border-r border-edge bg-nav transition-[width] duration-200 ease-out hover:w-56 hover:overflow-visible"
          aria-label="Site navigation"
        >
          <SiteNav pathname={pathname} onClose={onClose} rail />
        </aside>
      </div>

      <aside
        className={`fixed top-14 bottom-0 left-0 z-50 flex w-56 flex-col border-r border-edge bg-nav transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Site navigation"
      >
        <div className="flex h-12 items-center justify-between border-b border-edge px-3">
          <p className="text-xs font-medium text-muted">Site</p>
          <button
            type="button"
            onClick={onClose}
            className={iconButtonClass}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <SiteNav pathname={pathname} onClose={onClose} />
      </aside>
    </>
  );
}

function SiteNav({
  pathname,
  onClose,
  rail = false,
}: {
  pathname: string;
  onClose: () => void;
  rail?: boolean;
}) {
  return (
    <nav className="flex flex-1 flex-col px-2 py-3">
      <ul className="space-y-0.5">
        {siteNav.map((item) => {
          const active = isNavActive(pathname, item.href, item.match);
          return (
            <li key={item.href}>
              <Link
                to={item.href}
                onClick={onClose}
                title={item.label}
                className={sidebarItemClass(active)}
              >
                {active ? (
                  <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
                ) : null}
                <item.Icon
                  className={`relative h-4 w-4 shrink-0 ${
                    active ? "text-accent" : ""
                  }`}
                  strokeWidth={1.6}
                />
                <span
                  className={`relative whitespace-nowrap ${
                    rail
                      ? "opacity-0 transition-opacity duration-150 group-hover/site:opacity-100"
                      : ""
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
