import { Link } from "react-router-dom";
import { Users } from "lucide-react";

import type { DashboardPayload } from "@/lib/api";
import type { PortfolioKPI } from "@/data/dashboard";
import { siteStatusLabel, siteStatusLozenge, siteTypeLabel } from "@/lib/labels";

import { KPIGrid } from "./KPIGrid";
import { panelClass, sectionHintClass, sectionTitleClass } from "./panel";
import { ProjectList } from "./ProjectList";
import { RecentTasks } from "./RecentTasks";

type DashboardProps = {
  data: DashboardPayload;
};

function toKpis(data: DashboardPayload): PortfolioKPI[] {
  const { kpis } = data;
  return [
    {
      id: "total",
      label: "Projects",
      value: kpis.totalProjects,
      supporting: `${kpis.completed} completed`,
      tooltip: "Projects at the selected site",
    },
    {
      id: "active",
      label: "Active",
      value: kpis.active,
      supporting: "In operation",
      tooltip: "Projects marked active",
    },
    {
      id: "pending",
      label: "Pending",
      value: kpis.pending,
      supporting: "Awaiting kickoff",
      tooltip: "Projects not yet started",
    },
    {
      id: "onHold",
      label: "On hold",
      value: kpis.onHold,
      supporting: "Paused or blocked",
      tooltip: "Projects paused pending action",
    },
    {
      id: "capacity",
      label: "Capacity",
      value: kpis.totalCapacityMw,
      unit: "MW",
      supporting: "Installed at this site",
      tooltip: "Nameplate capacity at the selected site",
    },
  ];
}

export function Dashboard({ data }: DashboardProps) {
  return (
    <div className="space-y-4">
      {data.site ? <SiteSummary data={data} /> : null}
      <KPIGrid kpis={toKpis(data)} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ProjectList projects={data.projects} showViewAll />
        </div>
        <RecentTasks tasks={data.recentTasks} />
      </div>
    </div>
  );
}

function SiteSummary({ data }: { data: DashboardPayload }) {
  const site = data.site;
  if (!site) return null;

  return (
    <section className={`${panelClass} px-4 py-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={sectionTitleClass}>
            {site.name}{" "}
            <span className="font-normal text-muted">
              ({siteTypeLabel[site.type]})
            </span>
          </h2>
          <p className={sectionHintClass}>
            {site.address} · {site.projectCount} projects
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/team"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
          >
            <Users className="h-3.5 w-3.5" strokeWidth={1.8} />
            Team
          </Link>
          <span
            className={`inline-flex h-5 items-center rounded px-1.5 text-xs font-medium ${siteStatusLozenge[site.status]}`}
          >
            {siteStatusLabel[site.status]}
          </span>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-edge bg-fill-strong sm:grid-cols-4">
        <Meta label="Address" value={site.address} />
        <Meta label="Projects" value={String(site.projectCount)} />
        <Meta label="Organization" value={data.organization.name} />
        <Meta label="Status" value={siteStatusLabel[site.status]} />
      </dl>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-fg">{value}</dd>
    </div>
  );
}
