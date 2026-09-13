import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, Pin } from "lucide-react";

import {
  projectHomePath,
  projectKpiPath,
  projectPerformancePath,
  projectPortfolioPath,
} from "@/lib/paths";

export type CmsCrumbPage =
  | "Home"
  | "KPI"
  | "Performance"
  | "Portfolio"
  | "Alerts"
  | "Events"
  | "Forecast"
  | "Data Explorer"
  | "Rules";

type CmsBreadcrumbsProps = {
  projectId: string;
  plantName: string;
  current: CmsCrumbPage;
};

export function CmsBreadcrumbs({
  projectId,
  plantName,
  current,
}: CmsBreadcrumbsProps) {
  const [pinned, setPinned] = useState(false);
  const home = projectHomePath(projectId);

  const crumbs: { label: string; to?: string }[] = [
    { label: "CMS", to: home },
    { label: plantName, to: home },
  ];

  if (current === "Forecast") {
    crumbs.push({ label: "F&S" }, { label: "Dashboard" });
  } else if (current !== "Home") {
    crumbs.push({ label: current });
  } else {
    crumbs.push({ label: "Home" });
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm"
    >
      <Link
        to={home}
        className="inline-flex text-muted transition-colors hover:text-fg"
        aria-label="Plant home"
      >
        <Home className="h-4 w-4" strokeWidth={1.75} />
      </Link>
      {crumbs.map((crumb, index) => (
        <span
          key={`${crumb.label}-${index}`}
          className="inline-flex min-w-0 items-center gap-1.5"
        >
          <span className="text-muted">/</span>
          {crumb.to && index < crumbs.length - 1 ? (
            <Link
              to={crumb.to}
              className="truncate text-muted transition-colors hover:text-fg"
              title={crumb.label}
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="truncate font-medium text-fg" title={crumb.label}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
      <span className="text-muted">/</span>
      <button
        type="button"
        onClick={() => setPinned((p) => !p)}
        className={[
          "inline-flex transition-colors",
          pinned ? "text-accent" : "text-fg hover:text-accent",
        ].join(" ")}
        aria-label={pinned ? "Unpin page" : "Pin page"}
        title={pinned ? "Unpin" : "Pin"}
      >
        <Pin
          className="h-3.5 w-3.5"
          strokeWidth={1.75}
          fill={pinned ? "currentColor" : "none"}
        />
      </button>
    </nav>
  );
}

export function CmsDashboardActions({
  projectId,
  active,
}: {
  projectId: string;
  active?: "cms" | "kpi" | "performance";
}) {
  const linkClass = (key: "cms" | "kpi" | "performance") =>
    [
      "inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors",
      active === key
        ? "border-accent/40 bg-accent/10 text-fg"
        : "border-edge-strong text-secondary hover:bg-fill hover:text-fg",
    ].join(" ");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link to={projectHomePath(projectId)} className={linkClass("cms")}>
        CMS
      </Link>
      <Link to={projectKpiPath(projectId)} className={linkClass("kpi")}>
        KPI dashboard
      </Link>
      <Link
        to={projectPerformancePath(projectId)}
        className={linkClass("performance")}
      >
        Performance dashboard
      </Link>
      <Link
        to={projectPortfolioPath(projectId)}
        className="inline-flex h-8 items-center rounded-md border border-edge px-3 text-sm text-muted hover:bg-fill hover:text-fg"
      >
        Portfolio
      </Link>
    </div>
  );
}
