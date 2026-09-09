import { Bell, LogOut, Menu, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import type { DashboardUser } from "@/data/dashboard";

import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

type NavbarProps = {
  user: DashboardUser;
  onMenuClick: () => void;
};

export function Navbar({ user, onMenuClick }: NavbarProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    void navigate("/signin", { replace: true });
  }

  return (
    <header className="z-40 flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#010609] px-3 sm:px-4">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg border border-white/[0.08] p-2 text-white/60 transition-colors hover:bg-white/[0.04] hover:text-white lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      <Link to="/" className="flex shrink-0 items-center gap-2.5">
        <img
          src="/Alcaster-dark.svg"
          alt="Alcaster"
          width={72}
          height={32}
          className="h-7 w-auto"
        />
        <span className="hidden text-[13px] font-semibold tracking-[0.18em] text-white sm:inline">
          ALCASTER
        </span>
      </Link>

      <div className="min-w-0 flex-1">
        <WorkspaceSwitcher />
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <label className="relative hidden md:block">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            type="search"
            placeholder="Search projects…"
            className="h-9 w-44 rounded-lg border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#e6740a]/40 focus:bg-white/[0.05] lg:w-56"
          />
        </label>
        <button
          type="button"
          className="relative rounded-lg border border-white/[0.08] p-2 text-white/55 transition-colors hover:bg-white/[0.04] hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" strokeWidth={1.6} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#e6740a]" />
        </button>
        <div className="flex min-w-0 items-center gap-2 border-l border-white/[0.06] pl-2 sm:pl-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.05] text-xs font-semibold text-white"
            title={user.name}
          >
            {user.initials}
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-[11px] text-white/35">{user.role}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void handleSignOut();
            }}
            className="inline-flex items-center gap-2 rounded-lg p-2 text-[13px] font-medium text-white/45 transition-colors hover:bg-white/[0.03] hover:text-white/75"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.6} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
