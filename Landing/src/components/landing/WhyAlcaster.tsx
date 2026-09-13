"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { Container } from "@/components/ui/Container";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import { fadeUp, staggerContainer } from "@/lib/motion";

const SIGNALS = [
  {
    id: "monitor",
    label: "Monitor",
    value: "SCADA · alerts · events",
    detail:
      "Watch plant state on mimics and signal boards that know which asset is talking.",
  },
  {
    id: "measure",
    label: "Measure",
    value: "CMS · KPI · performance",
    detail:
      "Track generation, availability, and targets from portfolio down to the site.",
  },
  {
    id: "anticipate",
    label: "Anticipate",
    value: "Forecast · weather context",
    detail:
      "Read expected generation against the plant you already modeled, not a separate spreadsheet.",
  },
  {
    id: "decide",
    label: "Decide",
    value: "Rules · explorer · twin",
    detail:
      "Open the twin, query the series, and let rules flag conditions before they escalate.",
  },
] as const;

export function WhyAlcaster() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);

  return (
    <section
      id="resources"
      className="relative flex h-full min-h-0 flex-col justify-center overflow-hidden bg-transparent py-6 sm:py-8"
    >
      <Container className="relative">
        <motion.div
          variants={reduced ? undefined : staggerContainer}
          initial={reduced ? false : "hidden"}
          animate={reduced ? undefined : "visible"}
          className="mx-auto max-w-4xl"
        >
          <motion.p
            variants={reduced ? undefined : fadeUp}
            className="font-mono text-[11px] tracking-[0.24em] text-[#e6740a]/90 uppercase"
          >
            Operate
          </motion.p>
          <motion.h2
            variants={reduced ? undefined : fadeUp}
            className="font-display mt-3 text-balance text-3xl font-medium tracking-[-0.03em] text-white sm:text-4xl"
          >
            Built for how a plant is actually run.
          </motion.h2>
          <motion.p
            variants={reduced ? undefined : fadeUp}
            className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50 sm:text-base"
          >
            Monitoring alone shows numbers. Alcaster keeps the twin, the
            electrical model, and the operating surfaces in one workspace, so
            context never leaves the plant.
          </motion.p>

          <motion.div
            variants={reduced ? undefined : fadeUp}
            className="mt-10 grid gap-px bg-white/[0.08] sm:grid-cols-2"
          >
            {SIGNALS.map((signal, index) => {
              const selected = index === active;
              return (
                <button
                  key={signal.id}
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onClick={() => setActive(index)}
                  className={cn(
                    "relative bg-[#010609]/55 px-5 py-5 text-left transition-colors duration-500 ease-out sm:px-6 sm:py-6",
                    selected ? "bg-[#071018]/90" : "hover:bg-[#050d12]/80",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0 left-0 h-full w-0.5 transition-colors duration-500",
                      selected ? "bg-[#e6740a]" : "bg-transparent",
                    )}
                    aria-hidden
                  />
                  <span className="font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase">
                    {signal.label}
                  </span>
                  <span
                    className={cn(
                      "mt-3 block font-display text-xl font-medium tracking-[-0.02em] transition-colors duration-500 sm:text-2xl",
                      selected ? "text-white" : "text-white/70",
                    )}
                  >
                    {signal.value}
                  </span>
                  <span
                    className={cn(
                      "mt-3 block text-sm leading-relaxed transition-opacity duration-500",
                      selected ? "text-white/50 opacity-100" : "text-white/35 opacity-80",
                    )}
                  >
                    {signal.detail}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
