"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import { duration, easeOut, fadeUp, viewportOnce } from "@/lib/motion";

const DigitalTwinScene = dynamic(
  () =>
    import("@/components/twin/DigitalTwinScene").then((m) => m.DigitalTwinScene),
  {
    ssr: false,
    loading: () => (
      <div
        className="aspect-[16/9] w-full animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.03]"
        aria-hidden
      />
    ),
  },
);

export function ProductShowcase() {
  const reduced = usePrefersReducedMotion();
  const [showLabels, setShowLabels] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <section className="relative py-20 sm:py-28">
      <Container className="relative">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Product"
            title="See your plant as a living system."
            description="Explore equipment, energy flow, and operational context in an interactive digital twin — not a static diagram."
            className="max-w-2xl"
          />

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="flex shrink-0 flex-wrap items-center gap-2"
          >
            <Badge tone="accent">Interactive</Badge>
            <button
              type="button"
              onClick={() => setShowLabels((v) => !v)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-300",
                showLabels
                  ? "border-[#e6740a]/35 bg-[#e6740a]/10 text-[#e6740a]"
                  : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/18 hover:text-white/80",
              )}
              aria-pressed={showLabels}
            >
              Labels {showLabels ? "on" : "off"}
            </button>
          </motion.div>
        </div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          transition={{ duration: duration.slow, ease: easeOut }}
          className="mt-10 sm:mt-12"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <motion.div
            animate={
              reduced
                ? undefined
                : {
                    scale: hovered ? 1.008 : 1,
                    y: hovered ? -2 : 0,
                  }
            }
            transition={{ duration: 0.45, ease: easeOut }}
            className="relative"
          >
            <div
              className={cn(
                "pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-500",
                hovered ? "opacity-100" : "opacity-0",
              )}
              style={{
                boxShadow:
                  "0 0 0 1px rgba(230,116,10,0.28), 0 24px 80px -32px rgba(230,116,10,0.35)",
              }}
              aria-hidden
            />
            <DigitalTwinScene
              interactive
              showTooltip
              showLabels={showLabels}
              float={!reduced}
              className="shadow-[0_32px_80px_-40px_rgba(0,0,0,0.85)]"
            />
          </motion.div>
        </motion.div>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-5 text-center text-xs text-white/35 sm:text-sm"
        >
          Select equipment on the twin to inspect live-style telemetry.
        </motion.p>
      </Container>
    </section>
  );
}
