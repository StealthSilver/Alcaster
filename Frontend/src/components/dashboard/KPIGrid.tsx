
import type { PortfolioKPI } from "@/data/dashboard";

import { KPICard } from "./KPICard";

type KPIGridProps = {
  kpis: PortfolioKPI[];
};

export function KPIGrid({ kpis }: KPIGridProps) {
  return (
    <section aria-label="Project KPIs">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi, index) => (
          <KPICard key={kpi.id} kpi={kpi} index={index} />
        ))}
      </div>
    </section>
  );
}
