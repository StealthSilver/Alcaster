
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import type { Plant, PlantStatus } from "@/data/dashboard";

type PlantCardProps = {
  plant: Plant;
  index: number;
};

const statusLabel: Record<PlantStatus, string> = {
  online: "ONLINE",
  warning: "WARNING",
  offline: "OFFLINE",
};

const statusColor: Record<PlantStatus, string> = {
  online: "rgba(120, 180, 140, 0.95)",
  warning: "#e6740a",
  offline: "color-mix(in srgb, var(--alcaster-fg) 35%, transparent)",
};

export function PlantCard({ plant, index }: PlantCardProps) {
  const utilization =
    plant.capacityMw > 0
      ? Math.round((plant.currentOutputMw / plant.capacityMw) * 100)
      : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: 0.25 + index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -3 }}
      className="group flex flex-col rounded-2xl border border-edge bg-fill p-5 shadow-[var(--alcaster-shadow)] transition-colors duration-300 hover:border-edge-strong hover:bg-fill"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-fg">
            {plant.name}
          </h3>
          <p className="mt-1 text-xs text-muted">{plant.location}</p>
        </div>
        <StatusBadge status={plant.status} />
      </div>

      <p className="mt-6 text-2xl font-bold tracking-tight text-fg">
        {plant.capacityMw}
        <span className="ml-1.5 text-sm font-medium text-muted">MW</span>
      </p>

      <div className="mt-5 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            Current Output
          </span>
          <span className="text-sm font-semibold tabular-nums text-fg">
            {plant.currentOutputMw.toFixed(1)} MW
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-fill-strong">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${utilization}%` }}
            transition={{ duration: 1, delay: 0.4 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-muted">
          <span>{utilization}% of capacity</span>
          <span>{plant.availability.toFixed(1)}% avail.</span>
        </div>
      </div>

      <Link
        to={`/digital-twins/${plant.id}`}
        className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-accent"
      >
        View Digital Twin
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.article>
  );
}

function StatusBadge({ status }: { status: PlantStatus }) {
  const color = statusColor[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-[0.12em] text-muted">
      <span className="relative flex h-1.5 w-1.5">
        {status === "online" || status === "warning" ? (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
            style={{ backgroundColor: color, animationDuration: "2.4s" }}
          />
        ) : null}
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow:
              status === "online"
                ? `0 0 8px ${color}`
                : status === "warning"
                  ? `0 0 8px rgba(230,116,10,0.45)`
                  : "none",
          }}
        />
      </span>
      {statusLabel[status]}
    </span>
  );
}
