"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Container } from "@/components/ui/Container";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import { fadeUp, staggerContainer } from "@/lib/motion";

const STEPS = [
  {
    id: "site",
    title: "Create the site",
    description:
      "Stand up the plant record: identity, capacity, timezone, and operating context.",
  },
  {
    id: "intake",
    title: "Complete product intake",
    description:
      "Feed each product the data it needs. Completing one unlocks the next in sequence.",
  },
  {
    id: "twin",
    title: "Build the twin",
    description:
      "Define spatial layout and assets so the plant exists as an inspectable digital replica.",
  },
  {
    id: "connect",
    title: "Connect monitoring",
    description:
      "Attach SCADA mimics, alerts, and events to the same equipment model.",
  },
  {
    id: "measure",
    title: "Measure & forecast",
    description:
      "Run CMS, KPI, performance, forecasting, and data explorer against live plant context.",
  },
  {
    id: "govern",
    title: "Govern operations",
    description:
      "Apply the rule engine and ops products so decisions stay grounded in the twin.",
  },
] as const;

export function HowItWorks() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const step = STEPS[active] ?? STEPS[0];

  return (
    <section
      id="technology"
      className="relative flex h-full min-h-0 flex-col justify-center overflow-hidden bg-transparent py-6 sm:py-8"
    >
      <Container className="relative">
        <motion.div
          variants={reduced ? undefined : staggerContainer}
          initial={reduced ? false : "hidden"}
          animate={reduced ? undefined : "visible"}
        >
          <motion.p
            variants={reduced ? undefined : fadeUp}
            className="font-mono text-[11px] tracking-[0.24em] text-[#e6740a]/90 uppercase"
          >
            Process
          </motion.p>
          <motion.h2
            variants={reduced ? undefined : fadeUp}
            className="font-display mt-3 max-w-xl text-balance text-3xl font-medium tracking-[-0.03em] text-white sm:text-4xl"
          >
            From plant record to operating twin.
          </motion.h2>
          <motion.p
            variants={reduced ? undefined : fadeUp}
            className="mt-3 max-w-lg text-sm leading-relaxed text-white/50 sm:text-base"
          >
            Alcaster follows the path the product enforces: intake unlocks
            capability, and every surface shares one plant model.
          </motion.p>

          <motion.div
            variants={reduced ? undefined : fadeUp}
            className="mt-10"
          >
            <div
              className="relative flex gap-1 sm:gap-2"
              role="tablist"
              aria-label="Process steps"
            >
              <div
                className="pointer-events-none absolute top-[15px] right-3 left-3 hidden h-px bg-white/[0.08] sm:block"
                aria-hidden
              />
              {STEPS.map((item, index) => {
                const selected = index === active;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls="process-panel"
                    id={`process-tab-${item.id}`}
                    onMouseEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    onClick={() => setActive(index)}
                    className="relative z-10 flex flex-1 flex-col items-center gap-3 text-center"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border font-mono text-[11px] tabular-nums transition-colors duration-500 ease-out",
                        selected
                          ? "border-[#e6740a] bg-[#e6740a]/15 text-[#e6740a]"
                          : "border-white/15 bg-transparent text-white/45 hover:border-white/30",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "hidden text-[11px] font-medium tracking-tight transition-colors duration-500 sm:block",
                        selected ? "text-white" : "text-white/35",
                      )}
                    >
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              id="process-panel"
              role="tabpanel"
              aria-labelledby={`process-tab-${step.id}`}
              className="mt-8 border-t border-white/[0.08] pt-6 sm:mt-10"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step.id}
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="max-w-2xl"
                >
                  <p className="font-mono text-[11px] tracking-[0.2em] text-[#e6740a]/80 uppercase">
                    Step {String(active + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-display mt-2 text-2xl font-medium tracking-[-0.02em] text-white sm:text-3xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/50 sm:text-base">
                    {step.description}
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
