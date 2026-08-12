"use client";

import {
  Activity,
  AlertTriangle,
  Box,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { DashboardUser } from "@/data/dashboard";

const primaryNav = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, match: "dashboard" },
  { href: "/projects", label: "Projects", Icon: FolderKanban },
  { href: "/digital-twins", label: "Digital Twins", Icon: Box },
  { href: "/analytics", label: "Analytics", Icon: Activity },
  { href: "/alerts", label: "Alerts", Icon: AlertTriangle },
  { href: "/simulation", label: "Simulation", Icon: Sparkles },
] as const;

type SidebarProps = {
  user: DashboardUser;
  open: boolean;
  onClose: () => void;
};

function isActive(pathname: string, href: string, match?: string) {
  if (match === "dashboard") {
    return pathname === "/" || pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ user, open, onClose }: SidebarProps) {
  const pathname = usePathname();

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
        className={`fixed inset-y-0 left-0 z-50 flex w-[232px] flex-col border-r border-white/[0.06] bg-[#010609] transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main navigation"
      >
        <div className="flex h-14 items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <img
              src="/Alcaster-dark.svg"
              alt="Alcaster"
              width={72}
              height={32}
              className="h-7 w-auto"
            />
            <span className="text-[13px] font-semibold tracking-[0.18em] text-white">
              ALCASTER
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-white/40 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-4 flex flex-1 flex-col px-3">
          <ul className="space-y-0.5">
            {primaryNav.map((item) => {
              const active = isActive(
                pathname,
                item.href,
                "match" in item ? item.match : undefined,
              );
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                      active
                        ? "text-white"
                        : "text-white/45 hover:bg-white/[0.03] hover:text-white/75"
                    }`}
                  >
                    {active ? (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-lg bg-[#e6740a]/12"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    ) : null}
                    <item.Icon
                      className={`relative h-4 w-4 ${
                        active ? "text-[#e6740a]" : ""
                      }`}
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

          <div className="my-4 h-px bg-white/[0.06]" />

          <Link
            href="/settings"
            onClick={onClose}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
              pathname.startsWith("/settings")
                ? "bg-[#e6740a]/12 text-white"
                : "text-white/45 hover:bg-white/[0.03] hover:text-white/75"
            }`}
          >
            <Settings className="h-4 w-4" strokeWidth={1.6} />
            Settings
          </Link>

          <div className="mt-auto border-t border-white/[0.06] px-2 py-4">
            <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.05] text-xs font-semibold text-white">
                {user.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {user.name}
                </p>
                <p className="truncate text-[11px] text-white/35">{user.role}</p>
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
