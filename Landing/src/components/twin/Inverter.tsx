"use client";

import { cn } from "@/lib/cn";

type InverterProps = {
  x: number;
  y: number;
  label?: string;
  status?: "online" | "warning" | "offline";
  selected?: boolean;
  dimmed?: boolean;
  onSelect?: () => void;
  id?: string;
};

export function Inverter({
  x,
  y,
  label,
  status = "online",
  selected,
  dimmed,
  onSelect,
  id,
}: InverterProps) {
  const stroke =
    status === "warning"
      ? "rgba(230,116,10,0.9)"
      : selected
        ? "rgba(230,116,10,0.65)"
        : "rgba(255,255,255,0.18)";

  return (
    <g
      transform={`translate(${x} ${y})`}
      className={cn(onSelect && "cursor-pointer", dimmed && "opacity-40")}
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
      aria-label={id ?? label ?? "Inverter"}
    >
      <rect
        x={0}
        y={0}
        width={36}
        height={28}
        rx={4}
        fill={
          selected || status === "warning"
            ? "rgba(230,116,10,0.12)"
            : "rgba(255,255,255,0.04)"
        }
        stroke={stroke}
        strokeWidth={1.25}
      />
      <rect
        x={6}
        y={7}
        width={24}
        height={4}
        rx={1}
        fill="rgba(255,255,255,0.15)"
      />
      <rect
        x={6}
        y={15}
        width={14}
        height={4}
        rx={1}
        fill="rgba(255,255,255,0.1)"
      />
      <circle
        cx={30}
        cy={8}
        r={2.5}
        fill={status === "warning" ? "#e6740a" : "rgba(255,255,255,0.55)"}
        className={status === "warning" ? "alcaster-pulse-soft" : undefined}
      />
      {label ? (
        <text
          x={18}
          y={42}
          textAnchor="middle"
          fill="rgba(255,255,255,0.45)"
          fontSize={9}
          fontFamily="Inter, sans-serif"
          fontWeight={500}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}
