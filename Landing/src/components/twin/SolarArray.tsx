"use client";

import { cn } from "@/lib/cn";

type SolarArrayProps = {
  x: number;
  y: number;
  rows?: number;
  cols?: number;
  highlighted?: boolean;
  dimmed?: boolean;
  onSelect?: () => void;
  selected?: boolean;
  id?: string;
};

export function SolarArray({
  x,
  y,
  rows = 3,
  cols = 4,
  highlighted,
  dimmed,
  onSelect,
  selected,
  id,
}: SolarArrayProps) {
  const cellW = 14;
  const cellH = 9;
  const gap = 3;
  const width = cols * cellW + (cols - 1) * gap;
  const height = rows * cellH + (rows - 1) * gap;

  return (
    <g
      transform={`translate(${x} ${y})`}
      className={cn(
        onSelect && "cursor-pointer",
        dimmed && "opacity-40",
      )}
      onClick={onSelect}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      aria-label={id ?? "Solar array"}
    >
      <rect
        x={-6}
        y={-6}
        width={width + 12}
        height={height + 14}
        rx={4}
        fill={
          selected || highlighted
            ? "rgba(230,116,10,0.12)"
            : "rgba(255,255,255,0.02)"
        }
        stroke={
          selected || highlighted
            ? "rgba(230,116,10,0.55)"
            : "rgba(255,255,255,0.08)"
        }
        strokeWidth={1}
      />
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * (cellW + gap)}
            y={r * (cellH + gap)}
            width={cellW}
            height={cellH}
            rx={1.5}
            fill={
              highlighted
                ? "rgba(230,116,10,0.35)"
                : "rgba(255,255,255,0.12)"
            }
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={0.5}
          />
        )),
      )}
      <line
        x1={width / 2}
        y1={height + 2}
        x2={width / 2}
        y2={height + 8}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1}
      />
    </g>
  );
}
