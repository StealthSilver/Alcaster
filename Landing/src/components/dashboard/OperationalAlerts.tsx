"use client";

import { ArrowRight, AlertTriangle, Circle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

import type { AlertSeverity, OperationalAlert } from "@/data/dashboard";

type OperationalAlertsProps = {
  alerts: OperationalAlert[];
};

const severityIcon: Record<
  AlertSeverity,
  { Icon: typeof AlertTriangle; className: string }
> = {
  warning: {
    Icon: AlertTriangle,
    className: "text-[#e6740a]",
  },
  critical: {
    Icon: AlertTriangle,
    className: "text-[#e6740a]",
  },
  info: {
    Icon: Circle,
    className: "text-white/45",
  },
};

export function OperationalAlerts({ alerts }: OperationalAlertsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_8px_28px_rgba(0,0,0,0.22)]"
      aria-label="Operational alerts"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight text-white">
          Operational Alerts
        </h2>
        <Link
          href="/alerts"
          className="inline-flex items-center gap-1 text-xs font-medium text-white/45 transition-colors hover:text-[#e6740a]"
        >
          View all alerts
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="mt-5 space-y-1">
        {alerts.map((alert, index) => {
          const { Icon, className } = severityIcon[alert.severity];
          return (
            <motion.li
              key={alert.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.42 + index * 0.05, duration: 0.35 }}
              className="flex gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-white/[0.03]"
            >
              <span className={`mt-0.5 relative ${className}`}>
                {alert.severity !== "info" ? (
                  <span className="absolute -inset-1 animate-pulse rounded-full bg-[#e6740a]/15" />
                ) : null}
                <Icon className="relative h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/85">
                  {alert.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-white/35">
                  <span>{alert.plant}</span>
                  <span className="text-white/15">·</span>
                  <span>{alert.timeAgo}</span>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </motion.section>
  );
}
