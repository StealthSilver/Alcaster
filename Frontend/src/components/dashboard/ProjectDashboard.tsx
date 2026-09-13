import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bolt } from "lucide-react";

import type { ProjectDashboardPayload, Site } from "@/lib/api";
import {
  buildCmsInverters,
  buildCmsMetricStrip,
  buildCmsPlantRows,
  buildInteractiveSeries,
} from "@/lib/cmsMonitor";
import {
  rangeFromPreset,
  type DateRangeValue,
} from "@/lib/chartActions";
import { usePlantAnalytics } from "@/hooks/usePlantAnalytics";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  projectStatusLabel,
  projectStatusLozenge,
} from "@/lib/labels";

import { AlertsInsightPanel } from "./AlertsInsightPanel";
import { AnimatedMetric } from "./AnimatedMetric";
import { CmsMetricStrip } from "./CmsMetricStrip";
import { CmsPlantTable } from "./CmsPlantTable";
import { DateRangePicker } from "./DateRangePicker";
import { ExportSummaryCards } from "./ExportSummaryCards";
import { InteractiveLineChart } from "./InteractiveLineChart";
import { InverterHeatMap } from "./InverterHeatMap";
import { KpiAnalytics } from "./KpiAnalytics";
import { panelClass } from "./panel";
import { PerformanceGrid } from "./PerformanceGrid";
import { SiteInfoButton } from "./SiteContextLine";

type ProjectDashboardProps = {
  data: ProjectDashboardPayload;
};

type CmsTab = "overview" | "grid" | "kpi" | "heatmap";

const TABS: { id: CmsTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "grid", label: "Grid" },
  { id: "kpi", label: "KPI" },
  { id: "heatmap", label: "Heatmap" },
];

export function ProjectDashboard({ data }: ProjectDashboardProps) {
  const [tab, setTab] = useState<CmsTab>("overview");
  const [dateRange, setDateRange] = useState<DateRangeValue>(() =>
    rangeFromPreset("today"),
  );
  const { selectedSite } = useWorkspace();
  const analytics = usePlantAnalytics(data);
  const exportMetrics = analytics?.exportMetrics ?? [];
  const daily = exportMetrics[0];

  const inverters = useMemo(() => buildCmsInverters(data), [data]);
  const metrics = useMemo(() => buildCmsMetricStrip(data), [data]);
  const chartData = useMemo(
    () => buildInteractiveSeries(data.generationSeries),
    [data.generationSeries],
  );
  const plantRows = useMemo(
    () =>
      buildCmsPlantRows(
        data,
        daily?.currentMwh ?? data.kpis.todayGenerationMwh,
        daily?.prPct ?? 80,
      ),
    [data, daily],
  );

  const ranking = useMemo(
    () =>
      plantRows.map((row) => ({
        name: row.name,
        paPct: data.kpis.availabilityPct * (0.96 + (row.prPct % 7) * 0.005),
        prPct: row.prPct,
        yieldMwhPerMwp: row.yieldMwhPerMwp,
      })),
    [plantRows, data.kpis.availabilityPct],
  );

  const sharePct =
    data.kpis.capacityMw > 0
      ? Math.min(100, (data.kpis.currentOutputMw / data.kpis.capacityMw) * 100)
      : 0;

  const wmsSeries = chartData.series.filter((s) =>
    ["actual", "forecast", "ghi"].includes(s.id),
  );
  const powerSeries = chartData.series.filter((s) =>
    ["actual", "reactive", "target"].includes(s.id),
  );

  function setPreset(preset: "today" | "mtd" | "ytd") {
    setDateRange(rangeFromPreset(preset));
  }

  return (
    <div className="space-y-3">
      <Hero
        data={data}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onPreset={setPreset}
        sharePct={sharePct}
        site={selectedSite}
      />

      <CmsMetricStrip metrics={metrics} />

      <ExportSummaryCards metrics={exportMetrics} />

      <nav
        className="inline-flex gap-1 border-b border-edge"
        aria-label="CMS views"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={[
              "relative px-3 py-2 text-sm transition-colors",
              tab === item.id ? "text-fg" : "text-muted hover:text-fg",
            ].join(" ")}
          >
            {item.label}
            {tab === item.id ? (
              <motion.span
                layoutId="cms-tab"
                className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-accent"
              />
            ) : null}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <InverterHeatMap
              inverters={inverters}
              density="summary"
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
          <div className="flex flex-col gap-3 xl:col-span-2">
            <InteractiveLineChart
              title="WMS Comparison"
              hours={chartData.hours}
              series={wmsSeries}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
            <InteractiveLineChart
              title="Active vs Reactive Power"
              hours={chartData.hours}
              series={powerSeries}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </div>
      ) : null}

      {tab === "grid" ? <CmsPlantTable rows={plantRows} /> : null}

      {tab === "kpi" && analytics ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <KpiAnalytics
            gauges={analytics.kpiAnalytics.gauges}
            series={analytics.kpiAnalytics.series}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <PerformanceGrid
            data={analytics.performanceGrid}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
      ) : null}

      {tab === "heatmap" ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <InverterHeatMap
            inverters={inverters}
            density="small"
            title="Asset Heatmap"
            showDensityToggle={false}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          {analytics ? (
            <PerformanceGrid
              data={analytics.performanceGrid}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          ) : null}
        </div>
      ) : null}

      <AlertsInsightPanel
        project={data.project}
        alerts={data.alerts}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        ranking={
          ranking.length
            ? ranking
            : [
                {
                  name: data.project.name,
                  paPct: data.kpis.availabilityPct,
                  prPct: daily?.prPct ?? 81,
                  yieldMwhPerMwp: daily?.yieldMwhPerMwp ?? 3.8,
                },
              ]
        }
      />
    </div>
  );
}

function Hero({
  data,
  dateRange,
  onDateRangeChange,
  onPreset,
  sharePct,
  site,
}: {
  data: ProjectDashboardPayload;
  dateRange: DateRangeValue;
  onDateRangeChange: (next: DateRangeValue) => void;
  onPreset: (preset: "today" | "mtd" | "ytd") => void;
  sharePct: number;
  site: Site | null;
}) {
  const { project, kpis, organization } = data;
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - sharePct / 100);

  const siteForInfo: Site =
    site ??
    ({
      id: project.siteId,
      organizationId: organization.id,
      organizationName: organization.name,
      name: project.siteName,
      address: project.location,
      latitude: 14.152,
      longitude: 77.273,
      type:
        project.type === "wind" ||
        project.type === "bess" ||
        project.type === "hybrid"
          ? project.type
          : "solar",
      status: "active",
      projectCount: 1,
      createdBy: project.createdBy,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    } satisfies Site);

  return (
    <section className={`${panelClass} px-4 py-4`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-edge pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm font-semibold text-fg">
            {project.name}
          </h2>
          <SiteInfoButton site={siteForInfo} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ["today", "Today"],
              ["mtd", "MTD"],
              ["ytd", "YTD"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onPreset(id)}
              className={[
                "h-8 rounded-md px-3 text-xs transition-colors",
                dateRange.preset === id
                  ? "bg-accent text-on-accent"
                  : "border border-edge text-muted hover:bg-fill hover:text-fg",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
          <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative h-[76px] w-[76px] shrink-0">
          <svg width="76" height="76" className="-rotate-90">
            <circle
              cx="38"
              cy="38"
              r={r}
              fill="none"
              stroke="color-mix(in srgb, var(--alcaster-fg) 8%, transparent)"
              strokeWidth="5"
            />
            <motion.circle
              cx="38"
              cy="38"
              r={r}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[#3b82f6]">
            <Bolt className="h-5 w-5" fill="currentColor" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
            Active Power Generated
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            <AnimatedMetric
              value={kpis.currentOutputMw}
              decimals={1}
              unit="MW"
            />
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex h-5 items-center rounded px-1.5 text-[10px] font-medium ${projectStatusLozenge[project.status]}`}
            >
              {projectStatusLabel[project.status]}
            </span>
            <span className="text-[10px] text-muted">
              {project.capacityMw} MW · {project.location}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
