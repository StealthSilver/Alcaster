"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Container } from "@/components/ui/Container";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import { fadeUp, staggerContainer } from "@/lib/motion";

const LAYERS = [
  {
    id: "structure",
    label: "Plant structure",
    detail:
      "Sites, capacity, and plant identity become the shared substrate every product reads from.",
  },
  {
    id: "electrical",
    label: "Electrical model",
    detail:
      "Sitemap and single-line diagrams map arrays, inverters, transformers, and grid ties.",
  },
  {
    id: "twin",
    label: "Spatial twin",
    detail:
      "A 3D plant twin mirrors equipment layout so operators inspect assets in context, not in tables alone.",
  },
  {
    id: "scada",
    label: "SCADA & telemetry",
    detail:
      "Live mimic views and plant signals attach to the same model the twin and dashboards use.",
  },
  {
    id: "analytics",
    label: "KPI & performance",
    detail:
      "CMS dashboards, KPI boards, and performance charts report against the plant you already defined.",
  },
  {
    id: "foresight",
    label: "Forecast & rules",
    detail:
      "Generation outlook, data explorer, and a rule engine sit on top of the connected plant record.",
  },
] as const;

const DETAIL_EASE = [0.22, 1, 0.36, 1] as const;

export function DigitalTwinSection() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const layer = LAYERS[active] ?? LAYERS[0];

  return (
    <section
      id="platform"
      className="relative flex h-full min-h-0 flex-col justify-center overflow-hidden bg-transparent py-4 sm:py-8"
    >
      <Container className="relative">
        <motion.div
          variants={reduced ? undefined : staggerContainer}
          initial={reduced ? false : "hidden"}
          animate={reduced ? undefined : "visible"}
          className="grid min-h-0 gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16"
        >
          <div>
            <motion.p
              variants={reduced ? undefined : fadeUp}
              className="font-mono text-[11px] tracking-[0.24em] text-[#e6740a]/90 uppercase"
            >
              Platform
            </motion.p>
            <motion.h2
              variants={reduced ? undefined : fadeUp}
              className="font-display mt-3 max-w-md text-balance text-3xl font-medium tracking-[-0.03em] text-white sm:text-4xl"
            >
              One plant. One digital representation.
            </motion.h2>
            <motion.p
              variants={reduced ? undefined : fadeUp}
              className="mt-4 max-w-md text-sm leading-relaxed text-white/50 sm:text-base"
            >
              Alcaster is not a stack of disconnected tools. Every layer,
              from structure through foresight, hangs off the same plant model.
            </motion.p>

            <motion.div
              variants={reduced ? undefined : fadeUp}
              className="relative mt-8 hidden min-h-[4.5rem] border-l border-[#e6740a]/70 pl-4 lg:block"
              aria-live="polite"
            >
              <AnimatePresence mode="sync" initial={false}>
                <motion.p
                  key={layer.id}
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.4, ease: DETAIL_EASE }}
                  className="absolute inset-y-0 left-4 right-0 text-sm leading-relaxed text-white/45"
                >
                  {layer.detail}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          </div>

          <motion.div variants={reduced ? undefined : fadeUp} className="min-w-0">
            <div
              className="relative flex flex-col"
              role="listbox"
              aria-label="Platform layers"
              aria-activedescendant={`layer-${layer.id}`}
            >
              {LAYERS.map((item, index) => {
                const selected = index === active;
                return (
                  <button
                    key={item.id}
                    id={`layer-${item.id}`}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    onClick={() => setActive(index)}
                    className={cn(
                      "grid h-11 grid-cols-[2.5rem_1fr] items-center gap-3 border-l px-3 text-left transition-colors duration-300 ease-out",
                      selected
                        ? "border-[#e6740a] text-white"
                        : "border-transparent text-white/45 hover:text-white/70",
                    )}
                  >
                    <span
                      className={cn(
                        "font-mono text-[11px] tabular-nums transition-colors duration-300",
                        selected ? "text-[#e6740a]" : "text-white/28",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-medium tracking-tight sm:text-[15px]">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className="relative mt-5 min-h-[3.75rem] border-l border-[#e6740a]/70 pl-4 lg:hidden"
              aria-live="polite"
            >
              <AnimatePresence mode="sync" initial={false}>
                <motion.p
                  key={layer.id}
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.4, ease: DETAIL_EASE }}
                  className="absolute inset-y-0 left-4 right-0 text-sm leading-relaxed text-white/45"
                >
                  {layer.detail}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
