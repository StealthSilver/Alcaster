"use client";

import { motion } from "framer-motion";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const TRADITIONAL = [
  "Data",
  "Charts",
  "Tables",
  "Alerts",
  "Disconnected views",
] as const;

const ALCASTER = [
  "Plant",
  "3D",
  "Data",
  "Simulation",
  "Analytics",
  "Operational context",
] as const;

export function WhyAlcaster() {
  return (
    <section id="resources" className="relative flex h-full min-h-0 flex-col justify-center overflow-hidden py-6 sm:py-8">
      <Container>
        <SectionHeading
          eyebrow="Why Alcaster"
          title="Not another monitoring dashboard."
          description="Monitoring shows numbers. A digital twin shows the plant — spatially, operationally, and as one system."
          align="center"
          className="max-w-2xl"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mx-auto mt-8 grid max-w-4xl gap-5 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch sm:gap-8 lg:mt-10"
        >
          <motion.div variants={fadeUp} className="flex flex-col">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
              Traditional Monitoring
            </p>
            <div className="flex flex-1 flex-col gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              {TRADITIONAL.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-white/[0.06] bg-[#010609]/50 px-4 py-2.5 text-sm text-white/45"
                >
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="flex items-center justify-center py-2 sm:py-0"
            aria-hidden
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e6740a]/80">
              VS
            </span>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-[#e6740a]/90">
              Alcaster
            </p>
            <div
              className={cn(
                "relative flex flex-1 flex-col gap-2 overflow-hidden rounded-xl border border-[#e6740a]/25 bg-[#e6740a]/[0.06] p-4",
              )}
            >
              <div
                className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-[#e6740a]/12 blur-2xl"
                aria-hidden
              />
              {ALCASTER.map((item, i) => (
                <div
                  key={item}
                  className={cn(
                    "relative rounded-lg border px-4 py-2.5 text-sm font-medium",
                    i === 0
                      ? "border-[#e6740a]/40 bg-[#e6740a]/15 text-white"
                      : "border-white/[0.08] bg-[#010609]/40 text-white/80",
                  )}
                >
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
