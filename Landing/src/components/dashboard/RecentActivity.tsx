"use client";

import { motion } from "framer-motion";

import type { ActivityItem } from "@/data/dashboard";

type RecentActivityProps = {
  activity: ActivityItem[];
};

export function RecentActivity({ activity }: RecentActivityProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_8px_28px_rgba(0,0,0,0.22)]"
      aria-label="Recent activity"
    >
      <h2 className="text-base font-semibold tracking-tight text-white">
        Recent Activity
      </h2>

      <ol className="relative mt-5 space-y-0">
        <div className="absolute bottom-2 left-[3.5px] top-2 w-px bg-white/[0.06]" />
        {activity.map((item, index) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.48 + index * 0.06, duration: 0.4 }}
            className="relative flex gap-4 py-2.5 pl-1"
          >
            <span className="relative z-10 mt-1.5 h-2 w-2 shrink-0 rounded-full border border-white/25 bg-[#010609]">
              <motion.span
                className="absolute inset-0 rounded-full bg-[#e6740a]/50"
                animate={{ opacity: [0.2, 0.7, 0.2], scale: [1, 1.4, 1] }}
                transition={{
                  duration: 3,
                  delay: index * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium tabular-nums tracking-wide text-white/35">
                {item.time}
              </p>
              <p className="mt-0.5 text-sm text-white/75">{item.description}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </motion.section>
  );
}
