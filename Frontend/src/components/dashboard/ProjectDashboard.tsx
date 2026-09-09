import type { ProjectDashboardPayload } from "@/lib/api";
import type { PortfolioKPI } from "@/data/dashboard";
import {
  projectStatusLabel,
  projectStatusLozenge,
  projectTypeLabel,
} from "@/lib/labels";
import { projectHomePath } from "@/lib/paths";

import { DigitalTwinPreview } from "./DigitalTwinPreview";
import { KPIGrid } from "./KPIGrid";
import { OperationalAlerts } from "./OperationalAlerts";
import { panelClass, sectionHintClass, sectionTitleClass } from "./panel";
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
      label: "Capacity",
      value: kpis.capacityMw,
      unit: "MW",
      supporting: `${projectTypeLabel[project.type]} · ${project.location}`,
      tooltip: "Nameplate capacity for this project",
    },
    {
      id: "output",
      label: "Output",
      value: kpis.currentOutputMw,
      unit: "MW",
      decimals: 1,
      supporting: `${share.toFixed(1)}% of capacity`,
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
      label: "Today",
      value: kpis.todayGenerationMwh,
      unit: "MWh",
      decimals: 1,
      supporting: "Generation since 06:00",
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
          ? "At or above forecast"
          : "Behind forecast",
      tooltip: "Today's actual generation versus forecast",
    },
  ];
}

export function ProjectDashboard({ data }: ProjectDashboardProps) {
  const base = projectHomePath(data.project.id);

  return (
    <div className="space-y-4">
      <ProjectSummary data={data} />
      <KPIGrid kpis={toKpis(data)} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PortfolioGeneration
            series={data.generationSeries}
            title="Generation"
            subtitle="Actual vs forecast for this project"
          />
        </div>
        <WeatherOverview
          weather={data.weather}
          subtitle="Conditions at this project"
        />
      </div>

      <DigitalTwinPreview href={`${base}/digital-twin`} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
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
    </div>
  );
}

function ProjectSummary({ data }: { data: ProjectDashboardPayload }) {
  const { project } = data;

  return (
    <section className={`${panelClass} px-4 py-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={sectionTitleClass}>{project.name}</h2>
          <p className={sectionHintClass}>
            {project.description ||
              `${projectTypeLabel[project.type]} plant at ${project.location}`}
          </p>
        </div>
        <span
          className={`inline-flex h-5 items-center rounded px-1.5 text-xs font-medium ${projectStatusLozenge[project.status]}`}
        >
          {projectStatusLabel[project.status]}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-edge bg-fill-strong sm:grid-cols-4">
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
    <div className="bg-surface px-3 py-2.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-fg">{value}</dd>
    </div>
  );
}
