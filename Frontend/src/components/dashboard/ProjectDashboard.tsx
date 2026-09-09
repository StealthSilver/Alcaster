import { motion } from "framer-motion";

import type { ProjectDashboardPayload } from "@/lib/api";
import type { PortfolioKPI } from "@/data/dashboard";
import {
  projectStatusColor,
  projectStatusLabel,
  projectTypeLabel,
} from "@/lib/labels";
import { projectHomePath } from "@/lib/paths";

import { DigitalTwinPreview } from "./DigitalTwinPreview";
import { KPIGrid } from "./KPIGrid";
import { OperationalAlerts } from "./OperationalAlerts";
import { PortfolioGeneration } from "./PortfolioGeneration";
import { RecentActivity } from "./RecentActivity";
import { RecentTasks } from "./RecentTasks";
import { WeatherOverview } from "./WeatherOverview";

type ProjectDashboardProps = {
  data: ProjectDashboardPayload;
};

function toKpis(data: ProjectDashboardPayload): PortfolioKPI[] {
  const { kpis, project } = data;
  const share =
    kpis.capacityMw > 0 ? (kpis.currentOutputMw / kpis.capacityMw) * 100 : 0;

  return [
    {
      id: "capacity",
      label: "Installed Capacity",
      value: kpis.capacityMw,
      unit: "MW",
      supporting: `${projectTypeLabel[project.type]} · ${project.location}`,
      tooltip: "Nameplate capacity for this project",
    },
    {
      id: "output",
      label: "Current Output",
      value: kpis.currentOutputMw,
      unit: "MW",
      decimals: 1,
      supporting: `${share.toFixed(1)}% of installed capacity`,
      tooltip: "Live active power at this plant",
    },
    {
      id: "availability",
      label: "Availability",
      value: kpis.availabilityPct,
      unit: "%",
      decimals: 1,
      supporting: projectStatusLabel[project.status],
      tooltip: "Share of capacity available for generation",
    },
    {
      id: "today",
      label: "Today's Generation",
      value: kpis.todayGenerationMwh,
      unit: "MWh",
      decimals: 1,
      supporting: "Energy delivered since 06:00",
      tooltip: "Cumulative generation today",
    },
    {
      id: "forecast",
      label: "vs Forecast",
      value: kpis.vsForecastPct,
      unit: "%",
      decimals: 1,
      supporting:
        kpis.vsForecastPct >= 100
          ? "Tracking at or above forecast"
          : "Behind today's forecast",
      tooltip: "Today's actual generation versus forecast",
    },
  ];
}

export function ProjectDashboard({ data }: ProjectDashboardProps) {
  const base = projectHomePath(data.project.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <KPIGrid kpis={toKpis(data)} />

      <ProjectSummary data={data} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PortfolioGeneration
            series={data.generationSeries}
            title="Today's Generation"
            subtitle="Actual vs forecast for this project"
          />
        </div>
        <WeatherOverview
          weather={data.weather}
          subtitle="Conditions at this project"
        />
      </div>

      <DigitalTwinPreview href={`${base}/digital-twin`} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <OperationalAlerts
          alerts={data.alerts}
          viewAllHref={`${base}/monitoring`}
        />
        <RecentTasks
          tasks={data.recentTasks}
          subtitle="Work items on this project"
        />
        <RecentActivity activity={data.activity} />
      </div>
    </motion.div>
  );
}

function ProjectSummary({ data }: { data: ProjectDashboardPayload }) {
  const { project } = data;
  const statusColor = projectStatusColor[project.status];

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_8px_28px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
            Project overview
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-tight text-white">
            {project.name}
          </h2>
          {project.description ? (
            <p className="mt-1 max-w-2xl text-sm text-white/45">
              {project.description}
            </p>
          ) : (
            <p className="mt-1 text-sm text-white/40">
              {projectTypeLabel[project.type]} plant at {project.location}
            </p>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/55">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          {projectStatusLabel[project.status]}
        </span>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Meta label="Site" value={project.siteName} />
        <Meta label="Type" value={projectTypeLabel[project.type]} />
        <Meta label="Location" value={project.location} />
        <Meta label="Capacity" value={`${project.capacityMw} MW`} />
      </dl>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-3">
      <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/35">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-white">{value}</dd>
    </div>
  );
}
