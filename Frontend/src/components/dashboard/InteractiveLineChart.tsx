import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

import type { ChartSeries } from "@/lib/cmsMonitor";
import {
  downloadCsv,
  type DateRangeValue,
} from "@/lib/chartActions";
import { usePanelFullscreen } from "@/hooks/usePanelFullscreen";
import { ChartToolbar } from "./ChartToolbar";
import { DateRangePicker } from "./DateRangePicker";
import { iconButtonClass, panelClass, sectionTitleClass } from "./panel";

type InteractiveLineChartProps = {
  title: string;
  hours: string[];
  series: ChartSeries[];
  yLabel?: string;
  dateRange: DateRangeValue;
  onDateRangeChange: (next: DateRangeValue) => void;
};

const WIDTH = 560;
const HEIGHT = 200;
const PAD = { top: 16, right: 16, bottom: 28, left: 40 };

function buildPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
}

export function InteractiveLineChart({
  title,
  hours,
  series,
  yLabel = "MW",
  dateRange,
  onDateRangeChange,
}: InteractiveLineChartProps) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(series.map((s) => [s.id, true])),
  );
  const [hover, setHover] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const { ref, active, toggle } = usePanelFullscreen();

  const liveSeries = useMemo(() => {
    if (refreshKey === 0) return series;
    return series.map((s) => ({
      ...s,
      values: s.values.map((v, i) => {
        const wobble = 1 + Math.sin(refreshKey * 1.7 + i * 0.45) * 0.04;
        return Math.max(0, Math.round(v * wobble * 100) / 100);
      }),
    }));
  }, [series, refreshKey]);

  const visibleHours = hours.slice(offset, offset + 10);
  const visibleSeries = liveSeries.map((s) => ({
    ...s,
    values: s.values.slice(offset, offset + 10),
  }));

  const chart = useMemo(() => {
    const activeSeries = visibleSeries.filter((s) => enabled[s.id]);
    const maxY = Math.max(...activeSeries.flatMap((s) => s.values), 1);
    const yMax = Math.ceil(maxY * 1.15);
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const n = Math.max(visibleHours.length - 1, 1);
    const toX = (i: number) => PAD.left + (i / n) * innerW;
    const toY = (v: number) => PAD.top + innerH - (v / yMax) * innerH;

    const paths = activeSeries.map((s) => ({
      ...s,
      d: buildPath(s.values.map((v, i) => ({ x: toX(i), y: toY(v) }))),
      pts: s.values.map((v, i) => ({ x: toX(i), y: toY(v), v })),
    }));

    const ticks = [0, 0.5, 1].map((t) => ({
      y: PAD.top + innerH * (1 - t),
      label: Math.round(yMax * t),
    }));

    return { paths, ticks, toX, baseline: PAD.top + innerH, yMax };
  }, [visibleSeries, visibleHours.length, enabled, refreshKey]);

  const canPrev = offset > 0;
  const canNext = offset + 10 < hours.length;

  function exportData() {
    downloadCsv(
      title.toLowerCase().replace(/\s+/g, "-"),
      [
        ["Time", ...liveSeries.map((s) => s.label)],
        ...hours.map((hour, i) => [
          hour,
          ...liveSeries.map((s) => String(s.values[i] ?? "")),
        ]),
      ],
    );
  }

  function refresh() {
    setSpinning(true);
    setHover(null);
    setOffset(0);
    setRefreshKey((k) => k + 1);
    window.setTimeout(() => setSpinning(false), 650);
  }

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`${panelClass} flex flex-col ${active ? "overflow-auto bg-page p-3" : ""}`}
    >
      <div className="flex items-center gap-2 border-b border-edge px-3 py-2">
        <h3 className={`${sectionTitleClass} min-w-0 truncate`}>{title}</h3>
        <div className="ml-auto shrink-0">
          <ChartToolbar
            onExport={exportData}
            onFullscreen={toggle}
            fullscreen={active}
          >
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              compact
            />
            <button
              type="button"
              className={iconButtonClass}
              title="Refresh"
              aria-label="Refresh chart"
              onClick={refresh}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`}
              />
            </button>
          </ChartToolbar>
        </div>
      </div>

      <div className="relative flex-1 px-2 pt-2">
        {hover !== null && visibleHours[hover] ? (
          <div className="pointer-events-none absolute left-3 top-2 z-10 min-w-[140px] rounded-md border border-edge bg-page/95 px-2.5 py-2 text-[11px] shadow-lg backdrop-blur-sm">
            <p className="font-medium text-secondary">{visibleHours[hover]}</p>
            {chart.paths.map((s) => (
              <p key={s.id} className="mt-0.5 flex items-center gap-1.5 text-fg">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}:{" "}
                <span className="font-semibold tabular-nums">
                  {s.pts[hover]?.v.toFixed(1)} {yLabel}
                </span>
              </p>
            ))}
          </div>
        ) : null}

        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label={title}
        >
          {chart.ticks.map((tick) => (
            <g key={tick.label}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={tick.y}
                y2={tick.y}
                stroke="color-mix(in srgb, var(--alcaster-fg) 6%, transparent)"
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

          {chart.paths.map((s) => (
            <motion.path
              key={`${s.id}-${refreshKey}`}
              d={s.d}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}

          {visibleHours.map((hour, i) => (
            <g key={`${hour}-${i}`}>
              <text
                x={chart.toX(i)}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-subtle"
                fontSize={9}
                fontFamily="Inter, sans-serif"
              >
                {hour.replace(":00", "")}
              </text>
              <rect
                x={chart.toX(i) - 14}
                y={PAD.top}
                width={28}
                height={chart.baseline - PAD.top}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              {hover === i ? (
                <>
                  <line
                    x1={chart.toX(i)}
                    x2={chart.toX(i)}
                    y1={PAD.top}
                    y2={chart.baseline}
                    stroke="color-mix(in srgb, var(--alcaster-fg) 18%, transparent)"
                    strokeDasharray="3 3"
                  />
                  {chart.paths.map((s) => (
                    <circle
                      key={s.id}
                      cx={s.pts[i]?.x}
                      cy={s.pts[i]?.y}
                      r={3.5}
                      fill={s.color}
                      stroke="var(--alcaster-page)"
                      strokeWidth={1.5}
                    />
                  ))}
                </>
              ) : null}
            </g>
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-edge px-3 py-2">
        <div className="flex flex-wrap gap-2">
          {series.map((s) => {
            const on = enabled[s.id];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  setEnabled((prev) => ({ ...prev, [s.id]: !prev[s.id] }))
                }
                className={[
                  "inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] transition-opacity",
                  on ? "text-secondary" : "opacity-40 text-muted",
                ].join(" ")}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            className="rounded border border-edge px-2 py-0.5 text-[10px] text-muted disabled:opacity-30 hover:text-fg"
          >
            ‹
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setOffset((o) => o + 1)}
            className="rounded border border-edge px-2 py-0.5 text-[10px] text-muted disabled:opacity-30 hover:text-fg"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
