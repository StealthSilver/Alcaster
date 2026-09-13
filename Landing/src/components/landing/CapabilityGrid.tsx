"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Container } from "@/components/ui/Container";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import { fadeUp, staggerContainer } from "@/lib/motion";

const MODULES = [
  {
    id: "twin",
    group: "Digital twin",
    title: "Plant twin",
    body: "Interactive 3D replica of arrays, inverters, transformers, and grid connection. Inspect assets in place.",
  },
  {
    id: "sitemap",
    group: "Digital twin",
    title: "Sitemap & SLD",
    body: "Electrical topology and single-line diagrams aligned with the twin and monitoring views.",
  },
  {
    id: "scada",
    group: "Monitoring",
    title: "SCADA",
    body: "Plant mimic and live operating state tied to the equipment model you already built.",
  },
  {
    id: "alerts",
    group: "Monitoring",
    title: "Alerts & events",
    body: "Operational signals and event history with context from the plant, not a detached alarm list.",
  },
  {
    id: "kpi",
    group: "Overview",
    title: "CMS · KPI · performance",
    body: "Portfolio and plant dashboards for capacity, generation, and performance against targets.",
  },
  {
    id: "forecast",
    group: "Analytics",
    title: "Forecasting",
    body: "Expected generation and plant outlook grounded in the same site and weather context.",
  },
  {
    id: "explorer",
    group: "Analytics",
    title: "Data explorer",
    body: "Query and inspect plant series when you need to go deeper than the default boards.",
  },
  {
    id: "rules",
    group: "Analytics",
    title: "Rule engine",
    body: "Encode operating logic that watches plant state and surfaces conditions that matter.",
  },
  {
    id: "ops",
    group: "Operations",
    title: "CMMS & EMS",
    body: "Maintenance and energy-management surfaces that unlock once plant intake is complete.",
  },
  {
    id: "intake",
    group: "Setup",
    title: "Product intake",
    body: "Structured data entry that unlocks each product in sequence: twin, monitoring, analytics, ops.",
  },
] as const;

export function CapabilityGrid() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const current = MODULES[active] ?? MODULES[0];

  return (
    <section
      id="solutions"
      className="relative flex h-full min-h-0 flex-col justify-center overflow-hidden bg-transparent py-4 sm:py-8"
    >
      <Container className="relative">
        <motion.div
          variants={reduced ? undefined : staggerContainer}
          initial={reduced ? false : "hidden"}
          animate={reduced ? undefined : "visible"}
        >
          <div className="min-w-0">
            <motion.p
              variants={reduced ? undefined : fadeUp}
              className="font-mono text-[11px] tracking-[0.24em] text-[#e6740a]/90 uppercase"
            >
              Modules
            </motion.p>
            <motion.h2
              variants={reduced ? undefined : fadeUp}
              className="font-display mt-2 max-w-xl text-balance text-2xl font-medium tracking-[-0.03em] text-white sm:mt-3 sm:text-4xl"
            >
              What Alcaster runs on a plant.
            </motion.h2>
          </div>

          <motion.div
            variants={reduced ? undefined : fadeUp}
            className="mt-5 grid gap-5 lg:mt-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10"
          >
            <ul className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
              {MODULES.map((module, index) => {
                const selected = index === active;
                return (
                  <li key={module.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onFocus={() => setActive(index)}
                      onClick={() => setActive(index)}
                      className={cn(
                        "flex w-full items-baseline justify-between gap-3 py-1.5 text-left transition-colors duration-500 ease-out sm:py-2",
                        selected ? "text-white" : "text-white/40 hover:text-white/70",
                      )}
                    >
                      <span className="flex min-w-0 items-baseline gap-3 sm:gap-4">
                        <span className="font-mono text-[10px] tabular-nums text-[#e6740a]/70 sm:text-[11px]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="truncate text-[13px] font-medium tracking-tight sm:text-[15px]">
                          {module.title}
                        </span>
                      </span>
                      <span className="hidden shrink-0 font-mono text-[10px] tracking-[0.16em] text-white/25 uppercase md:inline">
                        {module.group}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="relative hidden min-h-[160px] flex-col justify-center border border-white/[0.08] bg-white/[0.02] px-5 py-5 lg:flex sm:px-6 sm:py-6">
              <div
                className="pointer-events-none absolute top-0 left-0 h-full w-px bg-[#e6740a]"
                aria-hidden
              />
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={current.id}
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="font-mono text-[10px] tracking-[0.2em] text-[#e6740a]/85 uppercase">
                    {current.group}
                  </p>
                  <h3 className="font-display mt-3 text-2xl font-medium tracking-[-0.02em] text-white">
                    {current.title}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-white/50">
                    {current.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="border-l border-[#e6740a]/80 pl-4 lg:hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={current.id}
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.28 }}
                >
                  <p className="font-mono text-[10px] tracking-[0.18em] text-[#e6740a]/85 uppercase">
                    {current.group}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/50">
                    {current.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
