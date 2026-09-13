import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

import type { ProjectDashboardPayload } from "@/lib/api";
import {
  downloadCsv,
  rangeFromPreset,
  type DateRangeValue,
} from "@/lib/chartActions";
import {
  buildKpiGauges,
  buildKpiIndexSeries,
  KPI_METRIC_META,
  type KpiDayRow,
  type KpiIndexMetricId,
} from "@/lib/kpiPerformanceData";
import { usePanelFullscreen } from "@/hooks/usePanelFullscreen";
import { ChartToolbar } from "./ChartToolbar";
import { DateRangePicker } from "./DateRangePicker";
import { PlantDashboardMeta } from "./PlantDashboardMeta";
import { iconButtonClass, panelClass, sectionTitleClass } from "./panel";

type KpiDashboardViewProps = {
  data: ProjectDashboardPayload;
  prTarget?: number;
};

const WIDTH = 900;
const HEIGHT = 260;
const PAD = { top: 20, right: 56, bottom: 36, left: 56 };

export function KpiDashboardView({ data, prTarget = 82 }: KpiDashboardViewProps) {
  const [dateRange, setDateRange] = useState<DateRangeValue>(() =>
    rangeFromPreset("today"),
  );
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">(
    "daily",
  );
  const [pvsyst, setPvsyst] = useState(true);
  const [enabled, setEnabled] = useState<Record<KpiIndexMetricId, boolean>>({
    pr: true,
    energy: true,
    pa: true,
    cuf: true,
    irradiance: true,
    yield: true,
  });
  const [hover, setHover] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const chartFs = usePanelFullscreen();
  const tableFs = usePanelFullscreen();

  const rows = useMemo(
    () => buildKpiIndexSeries(data, dateRange, prTarget),
    [data, dateRange, prTarget, refreshKey],
  );
  const gauges = useMemo(() => buildKpiGauges(rows), [rows]);

  const chart = useMemo(() => buildComboChart(rows, enabled), [rows, enabled]);

  function exportChart() {
    downloadCsv(`kpi-index-${data.project.name}`, [
      [
        "Date",
        "PR PVSYST",
        "PR Actual",
        "Energy PVSYST",
        "Energy Actual",
        "PA PVSYST",
        "PA Actual",
        "CUF PVSYST",
        "CUF Actual",
        "Irradiance PVSYST",
        "Irradiance Actual",
        "Yield PVSYST",
        "Yield Actual",
      ],
      ...rows.map((r) => [
        r.label,
        String(r.pr.planned),
        String(r.pr.actual),
        String(r.energy.planned),
        String(r.energy.actual),
        String(r.pa.planned),
        String(r.pa.actual),
        String(r.cuf.planned),
        String(r.cuf.actual),
        String(r.irradiance.planned),
        String(r.irradiance.actual),
        String(r.yield.planned),
        String(r.yield.actual),
      ]),
    ]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-fg">KPI dashboard</h2>
        <PlantDashboardMeta plantName={data.project.name} />
      </div>

      <section
        ref={chartFs.ref as React.RefObject<HTMLElement>}
        className={`${panelClass} ${chartFs.active ? "overflow-auto bg-page p-4" : ""}`}
      >
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-edge px-4 py-3">
            <h2 className={sectionTitleClass}>Plant KPI Index</h2>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 text-xs text-muted">
              <button
                type="button"
                role="switch"
                aria-checked={pvsyst}
                onClick={() => setPvsyst((v) => !v)}
                className={[
                  "relative h-5 w-9 rounded-full transition-colors",
                  pvsyst ? "bg-accent" : "bg-fill-strong",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                    pvsyst ? "translate-x-4" : "",
                  ].join(" ")}
                />
              </button>
              PVsyst
            </label>
            <select
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as "daily" | "weekly" | "monthly")
              }
              className="h-8 rounded-md border border-edge-strong bg-input px-2.5 text-xs text-fg outline-none focus:border-accent/50"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <ChartToolbar
              onExport={exportChart}
              onFullscreen={chartFs.toggle}
              fullscreen={chartFs.active}
            >
              <DateRangePicker value={dateRange} onChange={setDateRange} compact />
              <button
                type="button"
                className={iconButtonClass}
                aria-label="Refresh"
                onClick={() => setRefreshKey((k) => k + 1)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </ChartToolbar>
          </div>
        </div>

        <div className="relative px-3 pt-3 sm:px-4">
          <div className="mb-1 flex justify-between text-[9px] text-subtle">
            <span>Energy MWh / Irradiance</span>
            <span>% / Yield</span>
          </div>
          {hover !== null && rows[hover] ? (
            <div className="pointer-events-none absolute left-4 top-3 z-10 rounded-md border border-edge bg-page/95 px-3 py-2 text-[11px] shadow-lg backdrop-blur-sm">
              <p className="font-medium text-secondary">{rows[hover].label}</p>
              {(Object.keys(KPI_METRIC_META) as KpiIndexMetricId[]).map((id) =>
                enabled[id] ? (
                  <p key={id} className="mt-0.5 text-fg">
                    <span style={{ color: KPI_METRIC_META[id].color }}>
                      {KPI_METRIC_META[id].label}
                    </span>
                    : A {rows[hover][id].actual}
                    {pvsyst ? ` · P ${rows[hover][id].planned}` : ""}
                  </p>
                ) : null,
              )}
            </div>
          ) : null}

          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="h-auto w-full"
            role="img"
            aria-label="Plant KPI index chart"
          >
            {chart.pctTicks.map((t) => (
              <line
                key={`g-${t.y}`}
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={t.y}
                y2={t.y}
                stroke="color-mix(in srgb, var(--alcaster-fg) 5%, transparent)"
              />
            ))}
            {chart.energyTicks.map((t) => (
              <text
                key={`e-${t.label}`}
                x={PAD.left - 8}
                y={t.y + 3}
                textAnchor="end"
                className="fill-subtle"
                fontSize={9}
              >
                {t.label}
              </text>
            ))}
            {chart.pctTicks.map((t) => (
              <text
                key={`p-${t.label}`}
                x={WIDTH - PAD.right + 8}
                y={t.y + 3}
                textAnchor="start"
                className="fill-subtle"
                fontSize={9}
              >
                {t.label}
              </text>
            ))}

            {chart.bars.map((b) => (
              <g key={b.i}>
                {enabled.energy ? (
                  <rect
                    x={b.x - 6}
                    y={b.energyY}
                    width={10}
                    height={b.energyH}
                    rx={2}
                    fill={KPI_METRIC_META.energy.color}
                    opacity={0.85}
                  />
                ) : null}
                {enabled.irradiance ? (
                  <rect
                    x={b.x + 6}
                    y={b.irrY}
                    width={8}
                    height={b.irrH}
                    rx={2}
                    fill={KPI_METRIC_META.irradiance.color}
                    opacity={0.55}
                  />
                ) : null}
                <text
                  x={b.x}
                  y={HEIGHT - 10}
                  textAnchor="middle"
                  className="fill-subtle"
                  fontSize={8}
                >
                  {b.label.slice(0, 5)}
                </text>
                <rect
                  x={b.x - 16}
                  y={PAD.top}
                  width={32}
                  height={HEIGHT - PAD.top - PAD.bottom}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHover(b.i)}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            ))}

            {chart.lines.map((line) =>
              enabled[line.id] ? (
                <g key={`${line.id}-${refreshKey}`}>
                  <motion.path
                    d={line.d}
                    fill="none"
                    stroke={line.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  />
                  {line.pts.map((pt, i) => (
                    <circle
                      key={`${line.id}-pt-${i}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={hover === i ? 4 : 2.5}
                      fill="var(--alcaster-page)"
                      stroke={line.color}
                      strokeWidth={1.5}
                    />
                  ))}
                </g>
              ) : null,
            )}
            {pvsyst
              ? chart.plannedLines.map((line) =>
                  enabled[line.id] ? (
                    <path
                      key={`p-${line.id}`}
                      d={line.d}
                      fill="none"
                      stroke={line.color}
                      strokeWidth={1.25}
                      strokeDasharray="4 4"
                      opacity={0.55}
                    />
                  ) : null,
                )
              : null}
          </svg>

          <div className="flex flex-wrap items-center justify-center gap-3 pb-3 pt-1 text-[10px] text-muted">
            {(Object.keys(KPI_METRIC_META) as KpiIndexMetricId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setEnabled((prev) => ({ ...prev, [id]: !prev[id] }))
                }
                className={[
                  "inline-flex items-center gap-1.5",
                  enabled[id] ? "text-secondary" : "opacity-40",
                ].join(" ")}
              >
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ backgroundColor: KPI_METRIC_META[id].color }}
                />
                {KPI_METRIC_META[id].label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {gauges.map((g, i) => (
          <GaugeCard key={g.id} gauge={g} delay={0.05 * i} />
        ))}
      </div>

      <section
        ref={tableFs.ref as React.RefObject<HTMLElement>}
        className={`${panelClass} ${tableFs.active ? "overflow-auto bg-page p-4" : ""}`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-edge px-4 py-3">
          <div>
            <h2 className={sectionTitleClass}>Plant KPI Index</h2>
          </div>
          <ChartToolbar
            onExport={exportChart}
            onFullscreen={tableFs.toggle}
            fullscreen={tableFs.active}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-xs">
            <thead>
              <tr className="border-b border-edge bg-fill/40 text-[10px] uppercase tracking-wide text-muted">
                <th className="px-3 py-2 font-medium" rowSpan={2}>
                  Date
                </th>
                {(Object.keys(KPI_METRIC_META) as KpiIndexMetricId[]).map(
                  (id) => (
                    <th
                      key={id}
                      colSpan={2}
                      className="px-3 py-2 text-center font-medium"
                      style={{ color: KPI_METRIC_META[id].color }}
                    >
                      {KPI_METRIC_META[id].label} [{KPI_METRIC_META[id].unit}]
                    </th>
                  ),
                )}
              </tr>
              <tr className="border-b border-edge text-[10px] text-muted">
                {(Object.keys(KPI_METRIC_META) as KpiIndexMetricId[]).map(
                  (id) => (
                    <FragmentPair key={id} />
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-edge/60 hover:bg-fill/40"
                >
                  <td className="px-3 py-2 font-medium tabular-nums text-fg">
                    {row.label}
                  </td>
                  {(Object.keys(KPI_METRIC_META) as KpiIndexMetricId[]).map(
                    (id) => (
                      <FragmentCells key={id} pair={row[id]} />
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FragmentPair() {
  return (
    <>
      <th className="px-2 py-1.5 font-medium">PVSYST</th>
      <th className="px-2 py-1.5 font-medium">Actual</th>
    </>
  );
}

function FragmentCells({
  pair,
}: {
  pair: { planned: number; actual: number };
}) {
  return (
    <>
      <td className="px-2 py-2 tabular-nums text-secondary">
        {pair.planned.toLocaleString("en-US", { maximumFractionDigits: 2 })}
      </td>
      <td className="px-2 py-2 tabular-nums text-fg">
        {pair.actual.toLocaleString("en-US", { maximumFractionDigits: 2 })}
      </td>
    </>
  );
}

function GaugeCard({
  gauge,
  delay,
}: {
  gauge: ReturnType<typeof buildKpiGauges>[number];
  delay: number;
}) {
  const size = 72;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(gauge.attainmentPct, 100);
  const offset = c * (1 - pct / 100);
  const maxBar = Math.max(gauge.planned, gauge.actual, 0.01);

  return (
    <article className={`${panelClass} flex items-center gap-3 px-3 py-3`}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="color-mix(in srgb, var(--alcaster-fg) 8%, transparent)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={gauge.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold tabular-nums text-fg">
            {gauge.attainmentPct.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-fg">
          {gauge.label}
          <span className="text-muted"> [{gauge.unit}]</span>
        </p>
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 text-[10px] text-muted">P</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fill">
              <div
                className="h-full rounded-full bg-fill-strong"
                style={{ width: `${(gauge.planned / maxBar) * 100}%` }}
              />
            </div>
            <span className="w-14 text-right text-[10px] tabular-nums text-secondary">
              {gauge.planned.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 text-[10px] text-muted">A</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fill">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(gauge.actual / maxBar) * 100}%`,
                  backgroundColor: gauge.color,
                }}
              />
            </div>
            <span className="w-14 text-right text-[10px] tabular-nums text-fg">
              {gauge.actual.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function buildComboChart(
  rows: KpiDayRow[],
  enabled: Record<KpiIndexMetricId, boolean>,
) {
  void enabled;
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const maxEnergy = Math.max(...rows.map((r) => r.energy.actual), 0.5);
  const maxIrr = Math.max(...rows.map((r) => r.irradiance.actual), 1);
  const energyMax = Math.ceil(maxEnergy * 1.2 * 10) / 10;
  const irrMax = Math.ceil(maxIrr * 1.15);
  const gap = rows.length <= 1 ? innerW : innerW / (rows.length - 1 || 1);

  const toX = (i: number) =>
    PAD.left + (rows.length <= 1 ? innerW / 2 : (i / (rows.length - 1)) * innerW);
  const toPctY = (v: number) => PAD.top + innerH - (Math.min(v, 120) / 120) * innerH;
  const toIrrY = (v: number) => PAD.top + innerH - (v / irrMax) * innerH;
  const toYieldY = (v: number) => PAD.top + innerH - (Math.min(v, 8) / 8) * innerH;

  const linePath = (
    values: number[],
    yFn: (v: number) => number,
  ) =>
    values
      .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${yFn(v).toFixed(1)}`)
      .join(" ");

  const bars = rows.map((r, i) => {
    const x = toX(i);
    const energyH = (r.energy.actual / energyMax) * innerH;
    const irrH = (r.irradiance.actual / irrMax) * innerH * 0.35;
    return {
      i,
      x,
      label: r.label,
      energyY: PAD.top + innerH - energyH,
      energyH,
      irrY: PAD.top + innerH - irrH,
      irrH,
    };
  });

  const lines = [
    {
      id: "pr" as const,
      color: KPI_METRIC_META.pr.color,
      pts: rows.map((r, i) => ({ x: toX(i), y: toPctY(r.pr.actual), v: r.pr.actual })),
      d: linePath(
        rows.map((r) => r.pr.actual),
        toPctY,
      ),
    },
    {
      id: "pa" as const,
      color: KPI_METRIC_META.pa.color,
      pts: rows.map((r, i) => ({ x: toX(i), y: toPctY(r.pa.actual), v: r.pa.actual })),
      d: linePath(
        rows.map((r) => r.pa.actual),
        toPctY,
      ),
    },
    {
      id: "cuf" as const,
      color: KPI_METRIC_META.cuf.color,
      pts: rows.map((r, i) => ({ x: toX(i), y: toPctY(r.cuf.actual), v: r.cuf.actual })),
      d: linePath(
        rows.map((r) => r.cuf.actual),
        toPctY,
      ),
    },
    {
      id: "yield" as const,
      color: KPI_METRIC_META.yield.color,
      pts: rows.map((r, i) => ({
        x: toX(i),
        y: toYieldY(r.yield.actual),
        v: r.yield.actual,
      })),
      d: linePath(
        rows.map((r) => r.yield.actual),
        toYieldY,
      ),
    },
    {
      id: "irradiance" as const,
      color: KPI_METRIC_META.irradiance.color,
      pts: rows.map((r, i) => ({
        x: toX(i),
        y: toIrrY(r.irradiance.actual),
        v: r.irradiance.actual,
      })),
      d: linePath(
        rows.map((r) => r.irradiance.actual),
        toIrrY,
      ),
    },
  ];

  const plannedLines = [
    {
      id: "pr" as const,
      color: KPI_METRIC_META.pr.color,
      d: linePath(
        rows.map((r) => r.pr.planned),
        toPctY,
      ),
    },
    {
      id: "pa" as const,
      color: KPI_METRIC_META.pa.color,
      d: linePath(
        rows.map((r) => r.pa.planned),
        toPctY,
      ),
    },
  ];

  return {
    bars,
    lines,
    plannedLines,
    energyTicks: [0, 0.5, 1].map((t) => ({
      y: PAD.top + innerH * (1 - t),
      label: (energyMax * t).toFixed(1),
    })),
    pctTicks: [0, 0.5, 1].map((t) => ({
      y: PAD.top + innerH * (1 - t),
      label: String(Math.round(120 * t)),
    })),
    gap,
  };
}
