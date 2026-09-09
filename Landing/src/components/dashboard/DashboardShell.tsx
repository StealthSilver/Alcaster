"use client";

import { useState } from "react";

import type { DashboardUser } from "@/data/dashboard";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
  user: DashboardUser;
  dateLabel: string;
  title?: string;
  subtitle?: string;
};

export function DashboardShell({
  children,
  user,
  dateLabel,
  title = "Dashboard",
  subtitle = "Monitor and understand your renewable energy portfolio.",
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#010609] font-sans text-white antialiased">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <Header
            title={title}
            subtitle={subtitle}
            dateLabel={dateLabel}
            user={user}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="mt-6 pb-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
