import { useEffect, useId, useRef, useState } from "react";
import { Bell, LogOut, Menu, Search, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import type { DashboardUser } from "@/data/dashboard";
import { AlcasterLogo } from "@/components/theme/AlcasterLogo";
import { ThemeMenuItem } from "@/components/theme/ThemeToggle";

import {
  compactSearchClass,
  iconButtonClass,
  menuItemClass,
  menuPanelClass,
} from "./panel";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

type NavbarProps = {
  user: DashboardUser;
  onMenuClick: () => void;
};

export function Navbar({ user, onMenuClick }: NavbarProps) {
  return (
    <header className="z-40 flex h-14 shrink-0 items-center border-b border-edge bg-nav">
      <button
        type="button"
        onClick={onMenuClick}
        className={`${iconButtonClass} ml-3 lg:hidden`}
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      <Link
        to="/"
        className="flex h-14 w-14 shrink-0 items-center justify-center"
        aria-label="Alcaster home"
      >
        <AlcasterLogo className="h-4 w-auto" width={91} height={41} alt="" />
      </Link>

      <div className="flex min-w-0 flex-1 items-center gap-3 px-3 sm:px-4">
        <div className="min-w-0 flex-1">
          <WorkspaceSwitcher />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <label className="relative hidden md:block">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
            <input
              type="search"
              placeholder="Search projects…"
              className={`${compactSearchClass} w-44 lg:w-56`}
            />
          </label>
          <NotificationsMenu />
          <ProfileMenu user={user} />
        </div>
      </div>
    </header>
  );
}

function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className={`relative ${iconButtonClass}`}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={1.6} />
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className={`${menuPanelClass} absolute right-0 top-full z-50 mt-1 w-80`}
        >
          <div className="border-b border-edge px-3 py-2.5">
            <p className="text-sm font-medium text-fg">Notifications</p>
            <p className="mt-0.5 text-xs text-muted">
              Alerts for the selected site and project
            </p>
          </div>
          <p className="px-3 py-8 text-center text-sm text-muted">
            No new notifications.
          </p>
          <Link
            to="/alerts"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block border-t border-edge px-3 py-2.5 text-sm text-muted transition-colors hover:bg-fill hover:text-fg"
          >
            View alerts
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function ProfileMenu({ user }: { user: DashboardUser }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const initials = user.initials.toUpperCase();

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    void navigate("/signin", { replace: true });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-edge-strong bg-fill text-[11px] font-semibold uppercase text-fg transition-colors hover:bg-fill-strong"
        aria-label={`Profile menu for ${user.name}`}
      >
        {initials}
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className={`${menuPanelClass} absolute right-0 top-full z-50 mt-1 w-56`}
        >
          <div className="border-b border-edge px-3 py-2.5">
            <p className="truncate text-sm font-medium text-fg">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted">{user.role}</p>
          </div>
          <div className="py-1">
            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={menuItemClass}
            >
              <User className="h-3.5 w-3.5" strokeWidth={1.6} />
              Profile
            </Link>
            <ThemeMenuItem />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                void handleSignOut();
              }}
              className={menuItemClass}
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.6} />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

