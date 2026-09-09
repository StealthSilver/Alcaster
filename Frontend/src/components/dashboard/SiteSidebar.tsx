import {
  AlertTriangle,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MapPin,
  Settings,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { isNavActive, type SidebarNavItem } from "./nav";

const siteNav: SidebarNavItem[] = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard, match: "dashboard" },
  { href: "/sites", label: "Sites", Icon: MapPin },
  { href: "/projects", label: "Projects", Icon: FolderKanban },
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
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <div className="relative z-30 hidden w-14 shrink-0 lg:block">
        <aside
          className="group/site absolute inset-y-0 left-0 flex w-14 flex-col overflow-hidden border-r border-white/[0.06] bg-[#010609] transition-[width] duration-200 ease-out hover:w-56 hover:overflow-visible hover:shadow-[8px_0_24px_rgba(0,0,0,0.35)]"
          aria-label="Site navigation"
        >
          <SiteNav pathname={pathname} onClose={onClose} rail />
        </aside>
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-white/[0.06] bg-[#010609] transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Site navigation"
      >
        <div className="flex h-14 items-center justify-between px-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
            Site
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-white/40 hover:text-white"
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
                className={`relative flex h-10 items-center gap-3 overflow-hidden rounded-lg px-3 text-[13px] font-medium transition-colors ${
                  active
                    ? "text-white"
                    : "text-white/45 hover:bg-white/[0.03] hover:text-white/75"
                }`}
              >
                {active ? (
                  <span className="absolute inset-0 rounded-lg bg-[#e6740a]/12" />
                ) : null}
                {active ? (
                  <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-[#e6740a]" />
                ) : null}
                <item.Icon
                  className={`relative h-4 w-4 shrink-0 ${
                    active ? "text-[#e6740a]" : ""
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
