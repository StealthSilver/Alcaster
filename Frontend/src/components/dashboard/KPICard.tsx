import { Info } from "lucide-react";

import type { PortfolioKPI } from "@/data/dashboard";

import { AnimatedMetric } from "./AnimatedMetric";

type KPICardProps = {
  kpi: PortfolioKPI;
  index: number;
};

export function KPICard({ kpi }: KPICardProps) {
  return (
    <article className="min-w-0 border-b border-edge px-3 py-3.5 sm:border-r sm:[&:nth-child(2n)]:border-r-0 md:border-b-0 md:[&:nth-child(2n)]:border-r md:[&:nth-child(5n)]:border-r-0 md:last:border-r-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted">{kpi.label}</p>
        {kpi.tooltip ? (
          <span title={kpi.tooltip} className="text-subtle">
            <Info className="h-3.5 w-3.5" strokeWidth={1.5} />
          </span>
        ) : null}
      </div>
      <div className="mt-2 text-xl font-semibold leading-none tracking-tight text-fg md:text-2xl">
        <AnimatedMetric
          value={kpi.value}
          decimals={kpi.decimals ?? 0}
          unit={kpi.unit}
          delay={0}
        />
      </div>
      <p className="mt-2 text-xs text-muted">{kpi.supporting}</p>
    </article>
  );
}
