"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

import { EquipmentLabel } from "./EquipmentLabel";
import {
  PLANT_EQUIPMENT,
  PlantModel,
  type PlantEquipmentId,
} from "./PlantModel";

type DigitalTwinSceneProps = {
  className?: string;
  interactive?: boolean;
  showLabels?: boolean;
  showTooltip?: boolean;
  warningId?: PlantEquipmentId | null;
  float?: boolean;
  compact?: boolean;
};

export function DigitalTwinScene({
  className,
  interactive = false,
  showLabels = true,
  showTooltip = false,
  warningId = null,
  float = true,
  compact = false,
}: DigitalTwinSceneProps) {
  const [selected, setSelected] = useState<PlantEquipmentId | null>(null);
  const reduced = usePrefersReducedMotion();
  const meta = selected ? PLANT_EQUIPMENT[selected] : null;

  return (
    <div
      className={cn(
        "relative flex min-h-[280px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#010609]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 alcaster-grid opacity-60" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 55% 40%, rgba(230,116,10,0.09), transparent 70%)",
        }}
      />

      <motion.div
        className={cn(
          "relative flex flex-1 items-center justify-center px-2 py-4 sm:px-3 sm:py-6",
          float && !reduced && "alcaster-float",
        )}
        initial={reduced ? false : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <svg
          viewBox={compact ? "60 40 620 280" : "0 20 720 310"}
          className="h-auto max-h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Digital twin of a solar power plant showing arrays, inverters, transformer, substation, and grid"
        >
          <PlantModel
            selectedId={selected}
            onSelect={interactive ? setSelected : undefined}
            warningId={warningId}
            interactive={interactive}
            showFlows
          />
        </svg>
      </motion.div>

      {showLabels ? (
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2 sm:left-4 sm:top-4">
          <EquipmentLabel title="Plant Capacity" value="100" unit="MW" />
          <EquipmentLabel
            title="Current Output"
            value="72.4"
            unit="MW"
            accent
          />
          <EquipmentLabel title="Availability" value="97.8" unit="%" />
        </div>
      ) : null}

      {showTooltip && meta ? (
        <div className="absolute bottom-3 right-3 w-[min(100%,240px)] rounded-lg border border-white/12 bg-[#010609]/92 p-3 backdrop-blur-sm sm:bottom-4 sm:right-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#e6740a]">
            {meta.name}
          </p>
          <p className="mt-1 text-xs text-white/45">{meta.type}</p>
          <dl className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-white/40">Power</dt>
              <dd className="font-medium tabular-nums text-white">{meta.power}</dd>
            </div>
            {meta.efficiency ? (
              <div className="flex justify-between gap-4">
                <dt className="text-white/40">Efficiency</dt>
                <dd className="font-medium tabular-nums text-white">
                  {meta.efficiency}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-white/40">Status</dt>
              <dd
                className={cn(
                  "font-medium",
                  meta.status === "WARNING" ? "text-[#e6740a]" : "text-white",
                )}
              >
                {meta.status}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      {interactive && !meta ? (
        <p className="absolute bottom-3 left-3 text-[11px] text-white/35 sm:bottom-4 sm:left-4">
          Select equipment to inspect
        </p>
      ) : null}
    </div>
  );
}
