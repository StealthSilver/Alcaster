import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Info, RefreshCw, Sun, Zap } from "lucide-react";

import type { ProjectDashboardPayload } from "@/lib/api";
import {
  downloadCsv,
  rangeFromPreset,
  type DateRangeValue,
} from "@/lib/chartActions";
import {
  buildCmsInverters,
  CMS_STATUS_META,
} from "@/lib/cmsMonitor";
import {
  buildPerformanceSideMetrics,
  buildPowerVsIrradiation,
  buildRadialKpis,
} from "@/lib/kpiPerformanceData";
import { usePlantAnalytics } from "@/hooks/usePlantAnalytics";
import { usePanelFullscreen } from "@/hooks/usePanelFullscreen";
import { AlertsInsightPanel } from "./AlertsInsightPanel";
import { ChartToolbar } from "./ChartToolbar";
import { DateRangePicker } from "./DateRangePicker";
import { ExportSummaryCards } from "./ExportSummaryCards";
import { PlantDashboardMeta } from "./PlantDashboardMeta";
import {
  iconButtonClass,
  panelClass,
  sectionHintClass,
  sectionTitleClass,
} from "./panel";

type PerformanceDashboardViewProps = {
  data: ProjectDashboardPayload;
};

const WIDTH = 640;
const HEIGHT = 240;
const PAD = { top: 16, right: 44, bottom: 32, left: 44 };

export function PerformanceDashboardView({
  data,
}: PerformanceDashboardViewProps) {
  const [dateRange, setDateRange] = useState<DateRangeValue>(() =>
    rangeFromPreset("today"),
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [median, setMedian] = useState(true);
  const [invMode, setInvMode] = useState(false);
  const [mountFilter, setMountFilter] = useState<"all" | "tracker" | "fixed">(
    "all",
  );
  const [metric, setMetric] = useState<"pr" | "cuf" | "pa" | "power">("pr");
  const powerFs = usePanelFullscreen();
  const radialFs = usePanelFullscreen();
  const gridFs = usePanelFullscreen();

  const analytics = usePlantAnalytics(data, refreshKey);
  const inverters = useMemo(() => buildCmsInverters(data), [data, refreshKey]);
  const running = inverters.filter((i) => i.status === "running").length;
  const sideMetrics = useMemo(
    () => buildPerformanceSideMetrics(data, inverters.length, running),
    [data, inverters.length, running],
  );
  const powerSeries = useMemo(
    () => buildPowerVsIrradiation(data),
    [data, refreshKey],
  );
  const radial = useMemo(
    () =>
      buildRadialKpis(
        data,
        analytics?.exportMetrics[0]?.prPct ?? 82,
      ),
    [data, analytics],
  );

  const filteredInv = useMemo(() => {
    if (mountFilter === "all") return inverters;
    return inverters.filter((_, i) =>
      mountFilter === "tracker" ? i % 2 === 0 : i % 2 === 1,
    );
  }, [inverters, mountFilter]);

  const chart = useMemo(() => {
    const maxKw = Math.max(
      ...powerSeries.flatMap((p) => [p.expectedKw, p.inverterKw, p.gridKw]),
      1,
    );
    const maxIrr = Math.max(...powerSeries.map((p) => p.irradiance), 1);
    const yMax = Math.ceil(maxKw * 1.1);
    const irrMax = Math.ceil(maxIrr * 1.1);
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const n = Math.max(powerSeries.length - 1, 1);
    const toX = (i: number) => PAD.left + (i / n) * innerW;
    const toY = (v: number) => PAD.top + innerH - (v / yMax) * innerH;
    const toIrr = (v: number) => PAD.top + innerH - (v / irrMax) * innerH;
    const path = (vals: number[], yFn: (v: number) => number) =>
      vals
        .map(
          (v, i) =>
            `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${yFn(v).toFixed(1)}`,
        )
        .join(" ");

    return {
      toX,
      baseline: PAD.top + innerH,
      yMax,
      irrMax,
      expected: path(
        powerSeries.map((p) => p.expectedKw),
        toY,
      ),
      inverter: path(
        powerSeries.map((p) => p.inverterKw),
        toY,
      ),
      grid: path(
        powerSeries.map((p) => p.gridKw),
        toY,
      ),
      irr: path(
        powerSeries.map((p) => p.irradiance),
        toIrr,
      ),
      ticks: [0, 0.5, 1].map((t) => ({
        y: PAD.top + innerH * (1 - t),
        kw: Math.round(yMax * t),
        irr: Math.round(irrMax * t),
      })),
    };
  }, [powerSeries]);

  const peakKw = Math.max(...powerSeries.map((p) => p.inverterKw), 0);
  const activeKw = powerSeries[powerSeries.length - 1]?.inverterKw ?? 0;

  function metricValue(inv: (typeof inverters)[number]) {
    if (metric === "power") return inv.powerKw;
    if (metric === "cuf") return Math.min(100, inv.powerKw / 25);
    if (metric === "pa") return inv.status === "running" ? 98 : 70;
    return Math.max(55, 90 + inv.deviationPct);
  }

  function cellColor(value: number) {
    const base = median ? value - 80 + 80 : value;
    if (metric === "power") {
      if (value <= 0) return CMS_STATUS_META.offline.color;
      if (value < 50) return CMS_STATUS_META.error.color;
      return CMS_STATUS_META.running.color;
    }
    if (base >= 88) return "rgba(42, 157, 110, 0.85)";
    if (base >= 78) return "rgba(42, 157, 110, 0.5)";
    if (base >= 68) return "rgba(230, 116, 10, 0.65)";
    return "rgba(192, 75, 69, 0.7)";
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-fg">Performance dashboard</h2>
        <div className="flex flex-wrap items-center gap-2">
          <PlantDashboardMeta plantName={data.project.name} />
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            type="button"
            className={iconButtonClass}
            aria-label="Refresh"
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {analytics ? (
        <ExportSummaryCards metrics={analytics.exportMetrics} />
      ) : null}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="flex flex-col gap-2 xl:col-span-2">
          {sideMetrics.map((m) => {
            const Icon =
              m.id === "irradiance" ? Sun : m.id === "active-inv" ? Info : Zap;
            return (
              <article key={m.id} className={`${panelClass} px-3 py-3`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                    {m.label}
                  </p>
                  <span className="text-accent">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                </div>
                <p className="mt-2 text-lg font-semibold tabular-nums text-fg">
                  {m.value}
                </p>
                {m.hint ? (
                  <p className="mt-1 text-[10px] text-muted">{m.hint}</p>
                ) : null}
              </article>
            );
          })}
        </div>

        <section
          ref={powerFs.ref as React.RefObject<HTMLElement>}
          className={`${panelClass} xl:col-span-6 ${powerFs.active ? "overflow-auto bg-page p-3" : ""}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-3 py-2.5">
            <div>
              <h2 className={sectionTitleClass}>Power vs Irradiation</h2>
              <p className={sectionHintClass}>
                Active Power: {activeKw.toFixed(0)} kW · Peak Power:{" "}
                {peakKw.toFixed(0)} kW
              </p>
            </div>
            <ChartToolbar
              onExport={() =>
                downloadCsv("power-vs-irradiation", [
                  ["Hour", "Expected kW", "Inverter kW", "Grid kW", "Irradiance"],
                  ...powerSeries.map((p) => [
                    p.hour,
                    String(p.expectedKw),
                    String(p.inverterKw),
                    String(p.gridKw),
                    String(p.irradiance),
                  ]),
                ])
              }
              onFullscreen={powerFs.toggle}
              fullscreen={powerFs.active}
            >
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                compact
              />
            </ChartToolbar>
          </div>
          <div className="relative px-2 pt-2">
            {hover !== null && powerSeries[hover] ? (
              <div className="pointer-events-none absolute left-3 top-2 z-10 rounded-md border border-edge bg-page/95 px-2.5 py-2 text-[11px] shadow-lg">
                <p className="font-medium text-secondary">
                  {powerSeries[hover].hour}
                </p>
                <p className="text-fg">
                  Inverter {powerSeries[hover].inverterKw.toFixed(0)} kW
                </p>
                <p className="text-muted">
                  Expected {powerSeries[hover].expectedKw.toFixed(0)} kW
                </p>
                <p className="text-muted">
                  Irradiance {powerSeries[hover].irradiance} W/m²
                </p>
              </div>
            ) : null}
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full">
              {chart.ticks.map((t) => (
                <g key={t.kw}>
                  <line
                    x1={PAD.left}
                    x2={WIDTH - PAD.right}
                    y1={t.y}
                    y2={t.y}
                    stroke="color-mix(in srgb, var(--alcaster-fg) 5%, transparent)"
                  />
                  <text
                    x={PAD.left - 8}
                    y={t.y + 3}
                    textAnchor="end"
                    className="fill-subtle"
                    fontSize={9}
                  >
                    {t.kw}
                  </text>
                  <text
                    x={WIDTH - PAD.right + 8}
                    y={t.y + 3}
                    textAnchor="start"
                    className="fill-subtle"
                    fontSize={9}
                  >
                    {t.irr}
                  </text>
                </g>
              ))}
              <motion.path
                key={`exp-${refreshKey}`}
                d={chart.expected}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1 }}
              />
              <motion.path
                key={`inv-${refreshKey}`}
                d={chart.inverter}
                fill="none"
                stroke="#e6740a"
                strokeWidth={2}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.1 }}
              />
              <motion.path
                key={`grid-${refreshKey}`}
                d={chart.grid}
                fill="none"
                stroke="#2a9d6e"
                strokeWidth={1.75}
                strokeDasharray="4 3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.15 }}
              />
              <motion.path
                key={`irr-${refreshKey}`}
                d={chart.irr}
                fill="none"
                stroke="#0ea5b7"
                strokeWidth={1.75}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
              />
              {powerSeries.map((p, i) => (
                <g key={p.hour}>
                  {i % 2 === 0 ? (
                    <text
                      x={chart.toX(i)}
                      y={HEIGHT - 10}
                      textAnchor="middle"
                      className="fill-subtle"
                      fontSize={8}
                    >
                      {p.hour.replace(":00", "")}
                    </text>
                  ) : null}
                  <rect
                    x={chart.toX(i) - 10}
                    y={PAD.top}
                    width={20}
                    height={chart.baseline - PAD.top}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                  />
                </g>
              ))}
            </svg>
            <div className="flex flex-wrap justify-center gap-3 pb-3 text-[10px] text-muted">
              <LegendDot color="#3b82f6" label="Expected Power" />
              <LegendDot color="#e6740a" label="Power @ Inverters" />
              <LegendDot color="#2a9d6e" label="Power @ Grid" />
              <LegendDot color="#0ea5b7" label="Irradiation" />
            </div>
          </div>
        </section>

        <section
          ref={radialFs.ref as React.RefObject<HTMLElement>}
          className={`${panelClass} xl:col-span-4 ${radialFs.active ? "overflow-auto bg-page p-3" : ""}`}
        >
          <div className="flex items-center justify-between border-b border-edge px-3 py-2.5">
            <div>
              <h2 className={sectionTitleClass}>Performance KPIs</h2>
            </div>
            <ChartToolbar
              onExport={() =>
                downloadCsv("performance-kpis", [
                  ["Metric", "Value %"],
                  ...radial.map((r) => [r.label, String(r.value)]),
                ])
              }
              onFullscreen={radialFs.toggle}
              fullscreen={radialFs.active}
            />
          </div>
          <div className="flex flex-col items-center px-3 py-4">
            <RadialRings items={radial} />
            <div className="mt-4 grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
              {radial.map((r) => (
                <div
                  key={r.id}
                  className="rounded-md border border-edge px-2 py-1.5 text-center"
                >
                  <p className="text-[10px] text-muted">{r.label}</p>
                  <p
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: r.color }}
                  >
                    {r.value.toFixed(2)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section
        ref={gridFs.ref as React.RefObject<HTMLElement>}
        className={`${panelClass} ${gridFs.active ? "overflow-auto bg-page p-3" : ""}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-3 py-2.5">
          <div>
            <h2 className={sectionTitleClass}>Inverter Performance Grid</h2>
            <p className={sectionHintClass}>
              {filteredInv.length} pads · metric {metric.toUpperCase()}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <Toggle label="Median" checked={median} onChange={setMedian} />
            <Toggle label="Inverter" checked={invMode} onChange={setInvMode} />
            <div className="inline-flex rounded-md border border-edge p-0.5">
              {(
                [
                  ["all", "All"],
                  ["tracker", "Tracker"],
                  ["fixed", "Non Tracker"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMountFilter(id)}
                  className={[
                    "rounded px-2 py-1 text-[11px]",
                    mountFilter === id
                      ? "bg-[#3b82f6] text-white"
                      : "text-muted hover:text-fg",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={metric}
              onChange={(e) =>
                setMetric(e.target.value as "pr" | "cuf" | "pa" | "power")
              }
              className="h-8 rounded-md border border-edge-strong bg-input px-2 text-xs text-fg"
            >
              <option value="pr">PR</option>
              <option value="cuf">CUF</option>
              <option value="pa">PA</option>
              <option value="power">Power</option>
            </select>
            <ChartToolbar
              onExport={() =>
                downloadCsv("inverter-performance-grid", [
                  ["Inverter", "Status", metric.toUpperCase()],
                  ...filteredInv.map((inv) => [
                    inv.label,
                    CMS_STATUS_META[inv.status].label,
                    metricValue(inv).toFixed(2),
                  ]),
                ])
              }
              onFullscreen={gridFs.toggle}
              fullscreen={gridFs.active}
            />
          </div>
        </div>
        <div className="p-3">
          {invMode ? (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
              {filteredInv.map((inv) => {
                const value = metricValue(inv);
                return (
                  <button
                    key={inv.id}
                    type="button"
                    title={`${inv.label}: ${value.toFixed(2)}`}
                    className="flex min-h-[52px] overflow-hidden rounded-md border border-edge bg-fill/30 text-left hover:bg-fill"
                  >
                    <span
                      className="w-1 shrink-0"
                      style={{ backgroundColor: cellColor(value) }}
                    />
                    <span className="min-w-0 flex-1 px-2 py-1.5">
                      <span className="block truncate text-[10px] text-muted">
                        {inv.label}
                      </span>
                      <span className="block text-xs font-medium tabular-nums text-fg">
                        {metric === "power"
                          ? `${value.toFixed(1)} kW`
                          : `${value.toFixed(1)}%`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-3 text-[10px] text-muted">
                <span>Heatmap · {metric.toUpperCase()}</span>
                <span className="inline-flex overflow-hidden rounded">
                  {[60, 72, 80, 88, 95].map((v) => (
                    <span
                      key={v}
                      className="h-2 w-5"
                      style={{ backgroundColor: cellColor(v) }}
                    />
                  ))}
                </span>
                <span>Low → High</span>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(22px,1fr))] gap-1.5">
                {filteredInv.map((inv) => (
                  <button
                    key={inv.id}
                    type="button"
                    title={`${inv.label}: ${metricValue(inv).toFixed(1)}${metric === "power" ? " kW" : "%"}`}
                    className="aspect-square rounded-md transition-transform hover:scale-110"
                    style={{ backgroundColor: cellColor(metricValue(inv)) }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <AlertsInsightPanel
        project={data.project}
        alerts={data.alerts}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        ranking={
          analytics
            ? [
                {
                  name: data.project.name,
                  paPct: data.kpis.availabilityPct,
                  prPct: analytics.exportMetrics[0]?.prPct ?? 82,
                  yieldMwhPerMwp: analytics.exportMetrics[0]?.yieldMwhPerMwp ?? 3.8,
                },
              ]
            : []
        }
      />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-[11px] text-muted">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-[#3b82f6]" : "bg-fill-strong",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-4" : "",
          ].join(" ")}
        />
      </button>
      {label}
    </label>
  );
}

function RadialRings({
  items,
}: {
  items: { id: string; label: string; value: number; color: string }[];
}) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {items.map((item, i) => {
        const r = 86 - i * 14;
        const stroke = 10;
        const c = 2 * Math.PI * r;
        const pct = Math.min(item.value, 100) / 100;
        return (
          <g key={item.id}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="color-mix(in srgb, var(--alcaster-fg) 8%, transparent)"
              strokeWidth={stroke}
            />
            <motion.circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={item.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: c * (1 - pct) }}
              transition={{ duration: 1.1, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          </g>
        );
      })}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        className="fill-fg"
        fontSize={18}
        fontWeight={600}
      >
        {items[0]?.value.toFixed(0)}%
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        className="fill-muted"
        fontSize={10}
      >
        PR
      </text>
    </svg>
  );
}
