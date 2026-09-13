import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import type { KpiGaugeMetric, KpiSeriesPoint } from "@/lib/exportMetrics";
import {
  downloadCsv,
  type DateRangeValue,
} from "@/lib/chartActions";
import { usePanelFullscreen } from "@/hooks/usePanelFullscreen";
import { ChartToolbar } from "./ChartToolbar";
import { DateRangePicker } from "./DateRangePicker";
import { panelClass, sectionTitleClass } from "./panel";

type KpiAnalyticsProps = {
  gauges: KpiGaugeMetric[];
  series: KpiSeriesPoint[];
  dateRange: DateRangeValue;
  onDateRangeChange: (next: DateRangeValue) => void;
};

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 16, right: 40, bottom: 28, left: 40 };

export function KpiAnalytics({
  gauges,
  series,
  dateRange,
  onDateRangeChange,
}: KpiAnalyticsProps) {
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">(
    "daily",
  );
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const { ref, active, toggle } = usePanelFullscreen();

  const chart = useMemo(() => {
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const maxEnergy = Math.max(...series.map((s) => s.energyMwh), 0.5);
    const energyMax = Math.ceil(maxEnergy * 1.15 * 10) / 10;
    const pctMax = 120;
    const barW = Math.min(28, innerW / series.length / 2.2);
    const gap = innerW / series.length;

    const energyTicks = [0, 0.5, 1].map((t) => ({
      y: PAD.top + innerH * (1 - t),
      label: (energyMax * t).toFixed(t === 0 ? 0 : 1),
    }));
    const pctTicks = [0, 0.5, 1].map((t) => ({
      y: PAD.top + innerH * (1 - t),
      label: String(Math.round(pctMax * t)),
    }));

    const bars = series.map((s, i) => {
      const cx = PAD.left + gap * i + gap / 2;
      const energyH = (s.energyMwh / energyMax) * innerH;
      const cufH = (Math.min(s.cufPct, pctMax) / pctMax) * innerH;
      return {
        ...s,
        cx,
        energyY: PAD.top + innerH - energyH,
        energyH,
        cufY: PAD.top + innerH - cufH,
        cufH,
        prY: PAD.top + innerH - (Math.min(s.prPct, pctMax) / pctMax) * innerH,
        paY: PAD.top + innerH - (Math.min(s.paPct, pctMax) / pctMax) * innerH,
      };
    });

    const prPath = bars
      .map(
        (b, i) =>
          `${i === 0 ? "M" : "L"} ${b.cx.toFixed(1)} ${b.prY.toFixed(1)}`,
      )
      .join(" ");
    const paPath = bars
      .map(
        (b, i) =>
          `${i === 0 ? "M" : "L"} ${b.cx.toFixed(1)} ${b.paY.toFixed(1)}`,
      )
      .join(" ");

    return { bars, barW, energyTicks, pctTicks, prPath, paPath, baseline: PAD.top + innerH };
  }, [series]);

  const hovered = hoverIndex !== null ? chart.bars[hoverIndex] : null;

  function exportData() {
    downloadCsv("kpi-analytics", [
      ["Label", "Energy MWh", "PR %", "PA %", "CUF %"],
      ...series.map((s) => [
        s.label,
        s.energyMwh.toFixed(2),
        s.prPct.toFixed(2),
        s.paPct.toFixed(2),
        s.cufPct.toFixed(2),
      ]),
      [],
      ["Gauge", "Planned", "Actual", "Attainment %"],
      ...gauges.map((g) => [
        g.label,
        String(g.planned),
        String(g.actual),
        String(g.attainmentPct),
      ]),
    ]);
  }

  return (
    <motion.section
      ref={ref as React.RefObject<HTMLElement>}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`${panelClass} ${active ? "overflow-auto bg-page p-4" : ""}`}
      aria-label="KPI analytics"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-edge px-4 py-3">
        <div>
          <h2 className={sectionTitleClass}>KPIs</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="kpi-frequency">
            Frequency
          </label>
          <select
            id="kpi-frequency"
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
            onExport={exportData}
            onFullscreen={toggle}
            fullscreen={active}
          >
            <DateRangePicker value={dateRange} onChange={onDateRangeChange} compact />
          </ChartToolbar>
        </div>
      </div>

      <div className="relative px-3 pt-3 sm:px-4">
        {hovered ? (
          <div className="pointer-events-none absolute right-4 top-3 z-10 rounded-md border border-edge bg-page/95 px-3 py-2 text-[11px] shadow-lg backdrop-blur-sm">
            <p className="font-medium text-secondary">{hovered.label}</p>
            <p className="mt-1 text-fg">
              Energy{" "}
              <span className="font-semibold text-accent">
                {hovered.energyMwh.toFixed(2)} MWh
              </span>
            </p>
            <p className="text-muted">PR {hovered.prPct.toFixed(1)}%</p>
            <p className="text-muted">PA {hovered.paPct.toFixed(1)}%</p>
            <p className="text-muted">CUF {hovered.cufPct.toFixed(1)}%</p>
          </div>
        ) : null}

        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label="KPI comparison chart"
        >
          {chart.energyTicks.map((tick) => (
            <g key={`e-${tick.label}`}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={tick.y}
                y2={tick.y}
                stroke="color-mix(in srgb, var(--alcaster-fg) 5%, transparent)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={tick.y + 3}
                textAnchor="end"
                className="fill-subtle"
                fontSize={9}
                fontFamily="Inter, sans-serif"
              >
                {tick.label}
              </text>
            </g>
          ))}
          {chart.pctTicks.map((tick) => (
            <text
              key={`p-${tick.label}`}
              x={WIDTH - PAD.right + 8}
              y={tick.y + 3}
              textAnchor="start"
              className="fill-subtle"
              fontSize={9}
              fontFamily="Inter, sans-serif"
            >
              {tick.label}%
            </text>
          ))}

          {chart.bars.map((bar, i) => (
            <g key={bar.label}>
              <rect
                x={bar.cx - chart.barW - 2}
                y={bar.energyY}
                width={chart.barW}
                height={bar.energyH}
                rx={2}
                fill="#e6740a"
                opacity={0.9}
              />
              <rect
                x={bar.cx + 2}
                y={bar.cufY}
                width={chart.barW}
                height={bar.cufH}
                rx={2}
                fill="#0ea5b7"
                opacity={0.75}
              />
              <text
                x={bar.cx}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-subtle"
                fontSize={9}
                fontFamily="Inter, sans-serif"
              >
                {bar.label}
              </text>
              <rect
                x={bar.cx - gapHit(chart.bars.length)}
                y={PAD.top}
                width={gapHit(chart.bars.length) * 2}
                height={chart.baseline - PAD.top}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            </g>
          ))}

          <motion.path
            d={chart.prPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.1, delay: 0.2, ease: "easeOut" }}
          />
          <motion.path
            d={chart.paPath}
            fill="none"
            stroke="#2a9d6e"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="4 3"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.1, delay: 0.35, ease: "easeOut" }}
          />
        </svg>

        <div className="mt-1 flex flex-wrap items-center justify-center gap-4 pb-3 text-[10px] font-medium text-muted">
          <Legend swatch="#3b82f6" label="PR" line />
          <Legend swatch="#e6740a" label="Energy" />
          <Legend swatch="#2a9d6e" label="PA" line dashed />
          <Legend swatch="#0ea5b7" label="CUF" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-edge bg-fill-strong sm:grid-cols-4">
        {gauges.map((gauge, i) => (
          <GaugeCard key={gauge.id} gauge={gauge} delay={0.15 + i * 0.05} />
        ))}
      </div>
    </motion.section>
  );
}

function gapHit(count: number) {
  return Math.max(18, (WIDTH - PAD.left - PAD.right) / count / 2);
}

function Legend({
  swatch,
  label,
  line,
  dashed,
}: {
  swatch: string;
  label: string;
  line?: boolean;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {line ? (
        <span
          className="inline-block h-px w-3.5"
          style={{
            backgroundImage: dashed
              ? `repeating-linear-gradient(90deg, ${swatch} 0 3px, transparent 3px 6px)`
              : undefined,
            backgroundColor: dashed ? "transparent" : swatch,
            height: 2,
          }}
        />
      ) : (
        <span
          className="inline-block h-2 w-2 rounded-sm"
          style={{ backgroundColor: swatch }}
        />
      )}
      {label}
    </span>
  );
}

function GaugeCard({
  gauge,
  delay,
}: {
  gauge: KpiGaugeMetric;
  delay: number;
}) {
  const size = 88;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(gauge.attainmentPct, 100);
  const offset = c * (1 - pct / 100);

  return (
    <div className="bg-surface px-3 py-4 text-center">
      <div className="relative mx-auto" style={{ width: size, height: size }}>
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
            transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-semibold tabular-nums text-fg">
            {gauge.attainmentPct.toFixed(1)}%
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs font-medium text-fg">
        {gauge.label}
        <span className="text-muted"> [{gauge.unit}]</span>
      </p>
      <p className="mt-1 text-[10px] tabular-nums text-muted">
        P: {formatVal(gauge.planned, gauge.unit)} · A:{" "}
        {formatVal(gauge.actual, gauge.unit)}
      </p>
    </div>
  );
}

function formatVal(n: number, unit: string) {
  if (unit === "MWh") {
    return n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
