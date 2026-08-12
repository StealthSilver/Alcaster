
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import type { GenerationPoint } from "@/data/dashboard";

type PortfolioGenerationProps = {
  series: GenerationPoint[];
};

const WIDTH = 720;
const HEIGHT = 280;
const PAD = { top: 24, right: 16, bottom: 36, left: 44 };

function buildPath(
  points: { x: number; y: number }[],
  close = false,
  baselineY?: number,
) {
  if (points.length === 0) return "";
  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  if (!close || baselineY === undefined) return line;
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x.toFixed(2)} ${baselineY} L ${first.x.toFixed(2)} ${baselineY} Z`;
}

export function PortfolioGeneration({ series }: PortfolioGenerationProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const maxY = Math.max(
      ...series.flatMap((p) => [p.actual, p.forecast, p.target]),
      1,
    );
    const yMax = Math.ceil(maxY / 50) * 50;

    const toX = (i: number) =>
      PAD.left + (series.length <= 1 ? 0 : (i / (series.length - 1)) * innerW);
    const toY = (v: number) => PAD.top + innerH - (v / yMax) * innerH;

    const actualPts = series.map((p, i) => ({ x: toX(i), y: toY(p.actual) }));
    const forecastPts = series.map((p, i) => ({
      x: toX(i),
      y: toY(p.forecast),
    }));
    const targetPts = series.map((p, i) => ({ x: toX(i), y: toY(p.target) }));

    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      y: PAD.top + innerH * (1 - t),
      label: Math.round(yMax * t),
    }));

    return {
      actualPts,
      forecastPts,
      targetPts,
      actualPath: buildPath(actualPts),
      forecastPath: buildPath(forecastPts),
      targetPath: buildPath(targetPts),
      areaPath: buildPath(actualPts, true, PAD.top + innerH),
      ticks,
      toX,
      baselineY: PAD.top + innerH,
    };
  }, [series]);

  const hovered = hoverIndex !== null ? series[hoverIndex] : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] sm:p-6"
      aria-label="Portfolio generation"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-white">
            Portfolio Generation
          </h2>
          <p className="mt-1 text-sm text-white/40">Actual vs Forecast</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-white/45">
          <LegendDot color="#e6740a" label="Actual" />
          <LegendDot color="rgba(255,255,255,0.55)" label="Forecast" dashed />
          <LegendDot color="rgba(255,255,255,0.25)" label="Target" dashed />
        </div>
      </div>

      <div className="relative mt-6">
        {hovered ? (
          <div className="pointer-events-none absolute right-0 top-0 z-10 rounded-lg border border-white/[0.08] bg-[#010609]/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
            <p className="font-medium text-white/70">{hovered.hour}:00</p>
            <p className="mt-1 text-white">
              Actual{" "}
              <span className="font-semibold text-[#e6740a]">
                {hovered.actual} MW
              </span>
            </p>
            <p className="text-white/50">Forecast {hovered.forecast} MW</p>
            <p className="text-white/35">Target {hovered.target} MW</p>
          </div>
        ) : null}

        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label="Generation chart comparing actual, forecast, and target"
        >
          {chart.ticks.map((tick) => (
            <g key={tick.label}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={tick.y}
                y2={tick.y}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 10}
                y={tick.y + 3}
                textAnchor="end"
                className="fill-white/25"
                fontSize={10}
                fontFamily="Inter, sans-serif"
              >
                {tick.label}
              </text>
            </g>
          ))}

          <motion.path
            d={chart.targetPath}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={1.25}
            strokeDasharray="4 5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.15, ease: "easeOut" }}
          />
          <motion.path
            d={chart.forecastPath}
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth={1.5}
            strokeDasharray="3 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.25, ease: "easeOut" }}
          />
          <motion.path
            d={chart.areaPath}
            fill="url(#actualArea)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.55 }}
          />
          <motion.path
            d={chart.actualPath}
            fill="none"
            stroke="#e6740a"
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />

          <defs>
            <linearGradient id="actualArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e6740a" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#e6740a" stopOpacity="0" />
            </linearGradient>
          </defs>

          {series.map((point, i) => (
            <g key={point.hour}>
              <text
                x={chart.toX(i)}
                y={HEIGHT - 12}
                textAnchor="middle"
                className="fill-white/30"
                fontSize={10}
                fontFamily="Inter, sans-serif"
              >
                {point.hour}
              </text>
              <rect
                x={chart.toX(i) - 14}
                y={PAD.top}
                width={28}
                height={chart.baselineY - PAD.top}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className="cursor-crosshair"
              />
              {hoverIndex === i ? (
                <>
                  <line
                    x1={chart.toX(i)}
                    x2={chart.toX(i)}
                    y1={PAD.top}
                    y2={chart.baselineY}
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth={1}
                  />
                  <circle
                    cx={chart.actualPts[i].x}
                    cy={chart.actualPts[i].y}
                    r={4}
                    fill="#e6740a"
                    stroke="#010609"
                    strokeWidth={2}
                  />
                </>
              ) : null}
            </g>
          ))}
        </svg>
      </div>
    </motion.section>
  );
}

function LegendDot({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-block h-px w-4"
        style={{
          backgroundImage: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 3px, transparent 3px 6px)`
            : undefined,
          backgroundColor: dashed ? "transparent" : color,
          height: dashed ? 2 : 2,
        }}
      />
      {label}
    </span>
  );
}
