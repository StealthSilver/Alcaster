
import { motion } from "framer-motion";
import { Info } from "lucide-react";

import type { PortfolioKPI } from "@/data/dashboard";

import { AnimatedMetric } from "./AnimatedMetric";

type KPICardProps = {
  kpi: PortfolioKPI;
  index: number;
};

export function KPICard({ kpi, index }: KPICardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] transition-colors duration-300 hover:border-white/[0.1] hover:bg-white/[0.045]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(600px circle at 20% 0%, rgba(230,116,10,0.08), transparent 50%)",
        }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
          {kpi.label}
        </p>
        {kpi.tooltip ? (
          <span
            title={kpi.tooltip}
            className="text-white/25 transition-colors group-hover:text-white/45"
          >
            <Info className="h-3.5 w-3.5" strokeWidth={1.5} />
          </span>
        ) : null}
      </div>
      <div className="relative mt-4 text-[1.75rem] font-bold leading-none tracking-tight text-white sm:text-[1.9rem]">
        <AnimatedMetric
          value={kpi.value}
          decimals={kpi.decimals ?? 0}
          unit={kpi.unit}
          delay={0.15 + index * 0.06}
        />
      </div>
      <p className="relative mt-3 text-xs font-normal text-white/40 transition-colors group-hover:text-white/55">
        {kpi.supporting}
      </p>
    </motion.article>
  );
}
