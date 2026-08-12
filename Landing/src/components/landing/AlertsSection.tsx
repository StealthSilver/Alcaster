"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const AlertsTwin = dynamic(
  () => import("@/components/landing/AlertsTwin").then((m) => m.AlertsTwin),
  {
    ssr: false,
    loading: () => (
      <div
        className="aspect-[16/10] w-full animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.03]"
        aria-hidden
      />
    ),
  },
);

const STEPS = [
  "3D equipment highlights anomalous state",
  "Warning surfaces with context",
  "Alert links to plant impact",
] as const;

export function AlertsSection() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionHeading
              eyebrow="Operational Intelligence"
              title="Know where the problem is."
              description="When equipment state changes, the twin makes impact spatially understandable — not buried in a table of codes."
            />
            <motion.ol
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="mt-10 space-y-4"
            >
              {STEPS.map((step, i) => (
                <motion.li
                  key={step}
                  variants={fadeUp}
                  className="flex items-start gap-3 text-sm text-white/55"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#e6740a]/35 text-[10px] font-semibold text-[#e6740a]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {step}
                </motion.li>
              ))}
            </motion.ol>
          </div>

          <div className="relative">
            <AlertsTwin />
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-64"
            >
              <div className="rounded-lg border border-[#e6740a]/35 bg-[#010609]/92 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#e6740a]">
                  INV-034 · Warning
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  Temperature above threshold
                </p>
                <p className="mt-3 text-xs text-white/45">
                  Impact:{" "}
                  <span className="text-white/80">2.8 MW generation affected</span>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
