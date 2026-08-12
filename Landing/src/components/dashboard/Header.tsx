"use client";

import { Bell, Menu, Search } from "lucide-react";

import type { DashboardUser } from "@/data/dashboard";

type HeaderProps = {
  title: string;
  subtitle: string;
  dateLabel: string;
  user: DashboardUser;
  onMenuClick: () => void;
};

export function Header({
  title,
  subtitle,
  dateLabel,
  user,
  onMenuClick,
}: HeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.05] pb-5">
      <div className="flex min-w-0 items-start gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="mt-0.5 rounded-lg border border-white/[0.08] p-2 text-white/60 transition-colors hover:bg-white/[0.04] hover:text-white lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {title}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-white/40">{subtitle}</p>
          <p className="mt-2 text-xs font-medium tracking-wide text-white/30">
            {dateLabel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <label className="relative hidden sm:block">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            type="search"
            placeholder="Search plants, assets…"
            className="h-9 w-52 rounded-lg border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#e6740a]/40 focus:bg-white/[0.05] lg:w-64"
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
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.05] text-xs font-semibold text-white"
          title={user.name}
        >
          {user.initials}
        </div>
      </div>
    </header>
  );
}
