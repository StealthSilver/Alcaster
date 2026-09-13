import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Users } from "lucide-react";

import type { DashboardPayload, ProjectStatus } from "@/lib/api";
import type { Plant, PlantStatus, PortfolioKPI } from "@/data/dashboard";
import {
  rangeFromPreset,
  type DateRangeValue,
} from "@/lib/chartActions";
import {
  projectStatusLabel,
  projectStatusLozenge,
  siteStatusLabel,
  siteStatusLozenge,
  siteTypeLabel,
} from "@/lib/labels";
import { projectHomePath } from "@/lib/paths";
import {
  buildSiteInteractiveSeries,
  buildSitePlantRows,
} from "@/lib/siteCmsMonitor";

import { AnimatedMetric } from "./AnimatedMetric";
import { InteractiveLineChart } from "./InteractiveLineChart";
import { KPIGrid } from "./KPIGrid";
import { OperationalAlerts } from "./OperationalAlerts";
import { panelClass, sectionHintClass, sectionTitleClass } from "./panel";
import { RecentActivity } from "./RecentActivity";
import { RecentTasks } from "./RecentTasks";
import { SiteInfoButton } from "./SiteContextLine";
import { WeatherOverview } from "./WeatherOverview";

type DashboardProps = {
  data: DashboardPayload;
};

function emptyMonitoring(data: DashboardPayload) {
  return {
    kpis: {
      capacityMw: data.kpis.totalCapacityMw,
      currentOutputMw: 0,
      availabilityPct: 0,
      todayGenerationMwh: 0,
      vsForecastPct: 0,
    },
    generationSeries: [],
    weather: {
      irradianceWm2: 0,
      temperatureC: 0,
      windKmh: 0,
      cloudCoverPct: 0,
    },
    alerts: [],
    activity: [],
    plants: [],
  };
}

function projectToPlantStatus(status: ProjectStatus): PlantStatus {
  if (status === "active") return "online";
  if (status === "pending") return "warning";
  return "offline";
}

export function Dashboard({ data }: DashboardProps) {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRangeValue>(() =>
    rangeFromPreset("today"),
  );
  const mon = data.monitoring ?? emptyMonitoring(data);
  const viewData: DashboardPayload = { ...data, monitoring: mon };

  const siteKpis = useMemo(() => toSiteKpis(data, mon), [data, mon]);
  const chartData = useMemo(
    () => buildSiteInteractiveSeries(viewData),
    [viewData],
  );
  const plantCards = useMemo(
    () => toPlantCards(mon),
    [mon],
  );
  const plantRows = useMemo(
    () => buildSitePlantRows(viewData, mon.kpis.todayGenerationMwh, 82),
    [viewData, mon.kpis.todayGenerationMwh],
  );

  const contribution = useMemo(() => {
    const total = Math.max(mon.kpis.currentOutputMw, 0.01);
    return [...mon.plants]
      .map((p) => ({
        id: p.project.id,
        name: p.project.name,
        mw: p.kpis.currentOutputMw,
        pct: (p.kpis.currentOutputMw / total) * 100,
        capacityMw: p.kpis.capacityMw,
        availability: p.kpis.availabilityPct,
        todayMwh: p.kpis.todayGenerationMwh,
        status: p.project.status,
      }))
      .sort((a, b) => b.mw - a.mw);
  }, [mon]);

  const powerSeries = chartData.series.filter((s) =>
    ["actual", "forecast", "target"].includes(s.id),
  );

  if (!data.site) {
    return (
      <section className={`${panelClass} px-4 py-8 text-center`}>
        <p className="text-sm text-muted">
          Select a site to view its plant portfolio.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <SiteHeader data={data} />

      <KPIGrid kpis={siteKpis} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <InteractiveLineChart
            title="Site generation (all plants)"
            hours={chartData.hours}
            series={powerSeries}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
        <WeatherOverview weather={mon.weather} />
      </div>

      <section aria-label="Plants at this site">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className={sectionTitleClass}>Plants at this site</h2>
            <p className={sectionHintClass}>
              Live output compiled from every plant under {data.site.name}
            </p>
          </div>
          <span className="text-xs tabular-nums text-muted">
            {plantCards.length} plants · {mon.kpis.capacityMw} MW total
          </span>
        </div>
        {plantCards.length === 0 ? (
          <section className={`${panelClass} px-4 py-8 text-center`}>
            <p className="text-sm text-muted">No plants at this site yet.</p>
            <Link
              to="/projects"
              className="mt-3 inline-flex text-sm text-accent hover:underline"
            >
              Add a plant
            </Link>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {plantCards.map((plant, index) => (
              <SitePlantCard key={plant.id} plant={plant} index={index} />
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <PlantComparisonTable
            rows={contribution}
            onOpen={(id) => void navigate(projectHomePath(id))}
          />
        </div>
        <div className="space-y-4 xl:col-span-2">
          <OperationalAlerts alerts={mon.alerts} viewAllHref="/projects" />
          <PlantShareList plants={contribution} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RecentTasks tasks={data.recentTasks} />
        <RecentActivity activity={mon.activity} />
      </div>

      {plantRows.length > 0 ? (
        <p className="text-[11px] text-muted">
          Grid metrics above are site-level aggregates. Open a plant card for
          the full CMS dashboard (inverters, heatmap, KPI).
        </p>
      ) : null}
    </div>
  );
}

function toSiteKpis(
  data: DashboardPayload,
  mon: NonNullable<DashboardPayload["monitoring"]>,
): PortfolioKPI[] {
  const util =
    mon.kpis.capacityMw > 0
      ? ((mon.kpis.currentOutputMw / mon.kpis.capacityMw) * 100).toFixed(1)
      : "0";
  return [
    {
      id: "plants",
      label: "Plants",
      value: data.kpis.totalProjects,
      supporting: `${data.kpis.active} active · ${data.kpis.pending} pending`,
      tooltip: "Plants registered at this site",
    },
    {
      id: "capacity",
      label: "Site capacity",
      value: mon.kpis.capacityMw || data.kpis.totalCapacityMw,
      unit: "MW",
      supporting: "Sum of plant nameplate",
      tooltip: "Total installed capacity across plants",
    },
    {
      id: "output",
      label: "Live output",
      value: mon.kpis.currentOutputMw,
      unit: "MW",
      decimals: 1,
      supporting: `${util}% of site capacity`,
      tooltip: "Aggregated active power from all plants",
    },
    {
      id: "availability",
      label: "Availability",
      value: mon.kpis.availabilityPct,
      unit: "%",
      decimals: 1,
      supporting: "Capacity-weighted across plants",
      tooltip: "Weighted plant availability",
    },
    {
      id: "today",
      label: "Today energy",
      value: mon.kpis.todayGenerationMwh,
      unit: "MWh",
      decimals: 1,
      supporting: `${mon.kpis.vsForecastPct.toFixed(0)}% of forecast`,
      tooltip: "Site energy since midnight",
    },
  ];
}

function toPlantCards(
  mon: NonNullable<DashboardPayload["monitoring"]>,
): Plant[] {
  return mon.plants.map((entry) => ({
    id: entry.project.id,
    name: entry.project.name,
    location: entry.project.location,
    capacityMw: entry.kpis.capacityMw,
    currentOutputMw: entry.kpis.currentOutputMw,
    availability: entry.kpis.availabilityPct,
    status: projectToPlantStatus(entry.project.status),
  }));
}

function SiteHeader({ data }: { data: DashboardPayload }) {
  const site = data.site!;
  return (
    <section className={`${panelClass} px-4 py-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-fg">
              {site.name}
            </h2>
            <SiteInfoButton site={site} />
            <span
              className={`inline-flex h-5 items-center rounded px-1.5 text-[10px] font-medium ${siteStatusLozenge[site.status]}`}
            >
              {siteStatusLabel[site.status]}
            </span>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {site.address}
            </span>
            <span>·</span>
            <span>{siteTypeLabel[site.type]}</span>
            <span>·</span>
            <span>
              {data.projects.length} plants · {data.organization.name}
            </span>
          </p>
          <p className="mt-2 text-[11px] text-muted">
            Site dashboard — compilation of all plants. Plant CMS is per-plant.
          </p>
        </div>
        <Link
          to="/team"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge-strong px-3 text-sm text-secondary transition-colors hover:bg-fill hover:text-fg"
        >
          <Users className="h-3.5 w-3.5" strokeWidth={1.8} />
          Team
        </Link>
      </div>
    </section>
  );
}

function SitePlantCard({ plant, index }: { plant: Plant; index: number }) {
  const utilization =
    plant.capacityMw > 0
      ? Math.round((plant.currentOutputMw / plant.capacityMw) * 100)
      : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group flex flex-col rounded-xl border border-edge-strong bg-page/90 p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-fg">{plant.name}</h3>
          <p className="mt-0.5 truncate text-[11px] text-muted">
            {plant.location}
          </p>
        </div>
        <span
          className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{
            color:
              plant.status === "online"
                ? "rgba(120, 180, 140, 0.95)"
                : plant.status === "warning"
                  ? "#e6740a"
                  : "#94a3b8",
          }}
        >
          {plant.status}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted">
            Live output
          </p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-fg">
            <AnimatedMetric value={plant.currentOutputMw} decimals={1} unit="MW" />
          </p>
        </div>
        <p className="text-right text-[11px] text-muted">
          {plant.capacityMw} MW · {plant.availability.toFixed(1)}% avail.
        </p>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-fill-strong">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.min(100, utilization)}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-muted">{utilization}% of plant capacity</p>

      <Link
        to={projectHomePath(plant.id)}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-accent"
      >
        Open plant CMS
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.article>
  );
}

type ContributionRow = {
  id: string;
  name: string;
  mw: number;
  pct: number;
  capacityMw: number;
  availability: number;
  todayMwh: number;
  status: ProjectStatus;
};

function PlantComparisonTable({
  rows,
  onOpen,
}: {
  rows: ContributionRow[];
  onOpen: (id: string) => void;
}) {
  return (
    <section className={`${panelClass} overflow-hidden`} aria-label="Plant comparison">
      <div className="border-b border-edge px-4 py-3">
        <h2 className={sectionTitleClass}>Plant comparison</h2>
        <p className={sectionHintClass}>
          Side-by-side metrics for every plant at this site
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted">No plant telemetry yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-edge bg-fill/40 text-[10px] uppercase tracking-wide text-muted">
                <th className="px-3 py-2.5 font-medium">Plant</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Output</th>
                <th className="px-3 py-2.5 font-medium">Share</th>
                <th className="px-3 py-2.5 font-medium">Capacity</th>
                <th className="px-3 py-2.5 font-medium">Avail.</th>
                <th className="px-3 py-2.5 font-medium">Today</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-edge/60 transition-colors hover:bg-fill/40"
                  onClick={() => onOpen(row.id)}
                >
                  <td className="px-3 py-2.5 font-medium text-fg">{row.name}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex h-5 items-center rounded px-1.5 text-[10px] font-medium ${projectStatusLozenge[row.status]}`}
                    >
                      {projectStatusLabel[row.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-secondary">
                    {row.mw.toFixed(1)} MW
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-secondary">
                    {row.pct.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-secondary">
                    {row.capacityMw} MW
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-secondary">
                    {row.availability.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-secondary">
                    {row.todayMwh.toFixed(1)} MWh
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PlantShareList({ plants }: { plants: ContributionRow[] }) {
  return (
    <section className={panelClass} aria-label="Output share">
      <div className="border-b border-edge px-4 py-3">
        <h2 className={sectionTitleClass}>Output share</h2>
        <p className={sectionHintClass}>Contribution to site live power</p>
      </div>
      {plants.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted">No plants contributing.</p>
      ) : (
        <ul className="divide-y divide-edge px-4">
          {plants.slice(0, 8).map((plant) => (
            <li key={plant.id} className="py-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <Link
                  to={projectHomePath(plant.id)}
                  className="truncate font-medium text-fg hover:text-accent"
                >
                  {plant.name}
                </Link>
                <span className="shrink-0 tabular-nums text-muted">
                  {plant.pct.toFixed(0)}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-fill-strong">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.min(100, plant.pct)}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] tabular-nums text-muted">
                {plant.mw.toFixed(1)} MW of site output
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
