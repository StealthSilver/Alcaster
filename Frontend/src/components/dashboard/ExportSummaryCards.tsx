import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Leaf, Zap } from "lucide-react";

import type { ExportPeriod, ExportPeriodMetrics } from "@/lib/exportMetrics";
import { AnimatedMetric } from "./AnimatedMetric";
import { panelClass } from "./panel";

const PERIOD_ACCENT: Record<
  ExportPeriod,
  { stroke: string; tint: string }
> = {
  daily: {
    stroke: "#e6740a",
    tint: "from-[#e6740a]/12 to-transparent",
  },
  weekly: {
    stroke: "#0ea5b7",
    tint: "from-[#0ea5b7]/12 to-transparent",
  },
  monthly: {
    stroke: "#2a9d6e",
    tint: "from-[#2a9d6e]/12 to-transparent",
  },
  yearly: {
    stroke: "#5b7cfa",
    tint: "from-[#5b7cfa]/12 to-transparent",
  },
};

type ExportSummaryCardsProps = {
  metrics: ExportPeriodMetrics[];
};

function sparkGeometry(values: number[], width: number, height: number) {
  if (values.length === 0) return { line: "", area: "", coords: [] as { x: number; y: number; v: number }[] };
  const max = Math.max(...values, 0.01);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, max * 0.08);
  const padY = 4;
  const coords = values.map((v, i) => {
    const x = values.length === 1 ? 0 : (i / (values.length - 1)) * width;
    const y = height - padY - ((v - min) / span) * (height - padY * 2);
    return { x, y, v };
  });
  const line = coords
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const last = coords[coords.length - 1];
  const first = coords[0];
  const area = `${line} L ${last.x.toFixed(1)} ${height} L ${first.x.toFixed(1)} ${height} Z`;
  return { line, area, coords };
}

export function ExportSummaryCards({ metrics }: ExportSummaryCardsProps) {
  return (
    <section aria-label="Export summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric, index) => (
        <ExportCard key={metric.period} metric={metric} index={index} />
      ))}
    </section>
  );
}

function ExportCard({
  metric,
  index,
}: {
  metric: ExportPeriodMetrics;
  index: number;
}) {
  const accent = PERIOD_ACCENT[metric.period];
  const ahead = metric.deltaPct >= 0;
  const spark = useMemo(
    () => sparkGeometry(metric.sparkline, 240, 56),
    [metric.sparkline],
  );
  const [hover, setHover] = useState<number | null>(null);
  const gradId = `export-spark-${metric.period}`;
  const hovered = hover !== null ? spark.coords[hover] : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={`${panelClass} relative overflow-hidden`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${accent.tint}`}
      />
      <div className="relative px-3.5 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-medium text-muted">{metric.label}</h3>
          <span
            className={[
              "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
              ahead
                ? "bg-success/15 text-success"
                : "bg-danger/15 text-danger",
            ].join(" ")}
          >
            {ahead ? (
              <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
            ) : (
              <ArrowDownRight className="h-3 w-3" strokeWidth={2} />
            )}
            {Math.abs(metric.deltaPct).toFixed(1)}%
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-1">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-subtle">
              Current
            </p>
            <p className="mt-0.5 text-xl font-semibold tracking-tight text-fg">
              <AnimatedMetric
                value={metric.currentMwh}
                decimals={2}
                unit="MWh"
                delay={0.05 + index * 0.04}
              />
            </p>
          </div>
          <div className="pb-0.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-subtle">
              Expected
            </p>
            <p className="mt-0.5 text-sm tabular-nums text-secondary">
              {metric.expectedMwh.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-xs text-muted">MWh</span>
            </p>
          </div>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-edge pt-3">
          <Stat
            icon={<span className="text-[10px] font-semibold text-muted">₹</span>}
            label="Revenue"
            value={`${metric.revenueMillionInr.toFixed(2)} M`}
          />
          <Stat
            icon={<Leaf className="h-3 w-3" strokeWidth={1.75} />}
            label="CO₂ avoided"
            value={`${metric.co2TonsPrevented.toLocaleString("en-US", {
              maximumFractionDigits: 1,
            })} t`}
          />
          <Stat
            icon={<Zap className="h-3 w-3" strokeWidth={1.75} />}
            label="Yield"
            value={`${metric.yieldMwhPerMwp.toFixed(2)}`}
            hint="MWh/MWp"
          />
          <Stat
            icon={
              <span className="text-[9px] font-semibold tracking-tight text-muted">
                %
              </span>
            }
            label="CUF / PR"
            value={`${metric.cufPct.toFixed(1)} / ${metric.prPct.toFixed(1)}`}
          />
        </dl>
      </div>

      <div className="relative mt-2">
        {hovered ? (
          <div className="pointer-events-none absolute right-2 top-0 z-10 rounded border border-edge bg-page/95 px-2 py-1 text-[10px] tabular-nums text-fg shadow-sm">
            {hovered.v.toFixed(2)}
          </div>
        ) : null}
        <svg
          viewBox="0 0 240 56"
          className="h-14 w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${metric.label} trend`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent.stroke} stopOpacity="0.35" />
              <stop offset="100%" stopColor={accent.stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={spark.area}
            fill={`url(#${gradId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.25 + index * 0.05 }}
          />
          <motion.path
            d={spark.line}
            fill="none"
            stroke={accent.stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 1.1,
              delay: 0.2 + index * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
          {spark.coords.map((p, i) => (
            <rect
              key={i}
              x={p.x - 8}
              y={0}
              width={16}
              height={56}
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
          {hovered ? (
            <circle
              cx={hovered.x}
              cy={hovered.y}
              r={3.5}
              fill={accent.stroke}
              stroke="var(--alcaster-page)"
              strokeWidth={1.5}
            />
          ) : null}
        </svg>
      </div>
    </motion.article>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[10px] text-muted">
        <span className="inline-flex h-3.5 w-3.5 items-center justify-center text-subtle">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-xs font-medium tabular-nums text-fg">
        {value}
        {hint ? <span className="ml-1 text-[10px] font-normal text-muted">{hint}</span> : null}
      </dd>
    </div>
  );
}
