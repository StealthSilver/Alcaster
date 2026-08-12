"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

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
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 0.75", "end 0.45"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    restDelta: 0.001,
  });
  const lineScaleX = useTransform(progress, [0, 1], [0, 1]);
  const lineScaleY = useTransform(progress, [0, 1], [0, 1]);

  return (
    <section id="technology" className="relative scroll-mt-24 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 alcaster-radial opacity-60" />

      <Container className="relative">
        <SectionHeading
          eyebrow="How it works"
          title="From physical plant to digital intelligence."
          description="A clear path from plant definition to optimization — always anchored in one digital representation."
          className="max-w-3xl"
        />

        <div ref={trackRef} className="relative mt-14 sm:mt-16">
          {/* Desktop horizontal connector */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-[22px] hidden h-px lg:block"
            aria-hidden
          >
            <div className="absolute inset-0 bg-white/[0.08]" />
            {!reduced ? (
              <motion.div
                className="absolute inset-y-0 left-0 origin-left bg-[#e6740a]"
                style={{ scaleX: lineScaleX, height: 1 }}
              />
            ) : (
              <div className="absolute inset-0 bg-[#e6740a]/40" />
            )}
          </div>

          {/* Mobile vertical connector */}
          <div
            className="pointer-events-none absolute bottom-4 left-[21px] top-4 w-px lg:hidden"
            aria-hidden
          >
            <div className="absolute inset-0 bg-white/[0.08]" />
            {!reduced ? (
              <motion.div
                className="absolute inset-x-0 top-0 origin-top bg-[#e6740a]"
                style={{ scaleY: lineScaleY, width: 1 }}
              />
            ) : (
              <div className="absolute inset-0 bg-[#e6740a]/40" />
            )}
          </div>

          <motion.ol
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="relative grid gap-8 lg:grid-cols-6 lg:gap-4"
          >
            {STEPS.map((step, i) => (
              <motion.li
                key={step.number}
                variants={fadeUp}
                className="relative flex gap-4 lg:flex-col lg:gap-5"
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
