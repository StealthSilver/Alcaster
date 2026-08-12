"use client";

import { cn } from "@/lib/cn";

type EquipmentLabelProps = {
  title: string;
  value: string;
  unit?: string;
  subtitle?: string;
  className?: string;
  accent?: boolean;
};

export function EquipmentLabel({
  title,
  value,
  unit,
  subtitle,
  className,
  accent = false,
}: EquipmentLabelProps) {
  return (
    <div
      className={cn(
        "pointer-events-none select-none rounded-lg border px-3 py-2 backdrop-blur-sm",
        accent
          ? "border-[#e6740a]/35 bg-[#010609]/85"
          : "border-white/10 bg-[#010609]/80",
        className,
      )}
    >
      <p
        className={cn(
          "text-[10px] font-medium uppercase tracking-[0.16em]",
          accent ? "text-[#e6740a]" : "text-white/45",
        )}
      >
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums tracking-tight text-white">
        {value}
        {unit ? (
          <span className="ml-1 text-[11px] font-medium text-white/45">{unit}</span>
        ) : null}
      </p>
      {subtitle ? (
        <p className="mt-0.5 text-[11px] text-white/40">{subtitle}</p>
      ) : null}
    </div>
  );
}
