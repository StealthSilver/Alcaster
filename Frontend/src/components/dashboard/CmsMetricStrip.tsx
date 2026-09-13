import { useRef } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Gauge,
  Sun,
  Thermometer,
  Zap,
} from "lucide-react";

import type { CmsMetricCard } from "@/lib/cmsMonitor";
import { panelClass } from "./panel";

const ICONS = {
  zap: Zap,
  temp: Thermometer,
  droplet: Droplets,
  sun: Sun,
  gauge: Gauge,
  activity: Activity,
} as const;

type CmsMetricStripProps = {
  metrics: CmsMetricCard[];
};

export function CmsMetricStrip({ metrics }: CmsMetricStripProps) {
  const scroller = useRef<HTMLDivElement>(null);

  function scrollBy(dir: -1 | 1) {
    scroller.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        className="absolute left-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-edge bg-surface text-muted shadow-sm hover:text-fg sm:flex"
        aria-label="Scroll metrics left"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        className="absolute right-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-edge bg-surface text-muted shadow-sm hover:text-fg sm:flex"
        aria-label="Scroll metrics right"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div
        ref={scroller}
        className="flex gap-2 overflow-x-auto px-1 py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-10 [&::-webkit-scrollbar]:hidden"
      >
        {metrics.map((metric) => {
          const Icon = ICONS[metric.icon];
          const up = metric.deltaPct >= 0;
          return (
            <article
              key={metric.id}
              className={`${panelClass} flex min-w-[168px] flex-1 items-center gap-3 px-3 py-3`}
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fill text-accent">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted">
                  {metric.label}
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-fg">
                  {metric.value}
                  {metric.unit ? (
                    <span className="ml-1 text-[10px] font-medium text-muted">
                      {metric.unit}
                    </span>
                  ) : null}
                </p>
                <p
                  className={[
                    "mt-0.5 text-[10px] font-medium tabular-nums",
                    up ? "text-success" : "text-danger",
                  ].join(" ")}
                >
                  {up ? "+" : ""}
                  {metric.deltaPct.toFixed(1)}%
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
