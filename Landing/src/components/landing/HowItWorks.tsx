"use client";

import { motion } from "framer-motion";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const STEPS = [
  {
    number: "01",
    title: "Define",
    description: "Capture plant scope, capacity, and operating boundaries.",
  },
  {
    number: "02",
    title: "Build",
    description: "Assemble structure, equipment, and spatial layout.",
  },
  {
    number: "03",
    title: "Connect",
    description: "Wire telemetry, SCADA, and weather into the twin.",
  },
  {
    number: "04",
    title: "Understand",
    description: "See state, relationships, and impact in one model.",
  },
  {
    number: "05",
    title: "Simulate",
    description: "Test scenarios against the living plant representation.",
  },
  {
    number: "06",
    title: "Optimize",
    description: "Act on foresight grounded in physical reality.",
  },
] as const;

export function HowItWorks() {
  const reduced = usePrefersReducedMotion();

  return (
    <section id="technology" className="relative flex h-full min-h-0 flex-col justify-center overflow-hidden py-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 alcaster-radial opacity-60" />

      <Container className="relative">
        <SectionHeading
          eyebrow="How it works"
          title="From physical plant to digital intelligence."
          description="A clear path from plant definition to optimization — always anchored in one digital representation."
          className="max-w-3xl"
        />

        <div className="relative mt-8 sm:mt-10">
          <div
            className="pointer-events-none absolute left-0 right-0 top-[22px] hidden h-px md:block"
            aria-hidden
          >
            <div className="absolute inset-0 bg-white/[0.08]" />
            <div className="absolute inset-0 bg-[#e6740a]/50" />
          </div>

          <motion.ol
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="relative grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6 lg:gap-4"
          >
            {STEPS.map((step, i) => (
              <motion.li
                key={step.number}
                variants={fadeUp}
                className="relative flex flex-col gap-3 sm:flex-row sm:gap-4 md:flex-col md:gap-5"
              >
                <div
                  className={cn(
                    "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums",
                    i === STEPS.length - 1
                      ? "border-[#e6740a]/45 bg-[#e6740a]/15 text-[#e6740a]"
                      : "border-white/15 bg-[#010609] text-white/70",
                  )}
                >
                  {step.number}
                  {!reduced ? (
                    <motion.span
                      className="absolute inset-0 rounded-full border border-[#e6740a]/30"
                      animate={{ opacity: [0.2, 0.7, 0.2], scale: [1, 1.18, 1] }}
                      transition={{
                        duration: 3.2,
                        delay: i * 0.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      aria-hidden
                    />
                  ) : null}
                </div>

                <div className="pt-1.5 lg:pt-0">
                  <h3 className="text-base font-semibold tracking-tight text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">
                    {step.description}
                  </p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </Container>
    </section>
  );
}
