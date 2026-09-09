import type { PortfolioKPI } from "@/data/dashboard";

import { KPICard } from "./KPICard";
import { panelClass } from "./panel";

type KPIGridProps = {
  kpis: PortfolioKPI[];
};

export function KPIGrid({ kpis }: KPIGridProps) {
  return (
    <section
      aria-label="Project KPIs"
      className={`grid grid-cols-1 overflow-hidden sm:grid-cols-2 md:grid-cols-5 ${panelClass}`}
    >
      {kpis.map((kpi, index) => (
        <KPICard key={kpi.id} kpi={kpi} index={index} />
      ))}
    </section>
  );
}
