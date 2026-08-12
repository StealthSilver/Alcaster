"use client";

import { motion } from "framer-motion";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const SLOTS = 6;

export function PartnersSection() {
  return (
    <section id="resources" className="relative scroll-mt-24 py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Organizations"
          title="Built for renewable energy organizations."
          description="Trusted by teams designing, building, and operating renewable infrastructure."
          align="center"
          className="max-w-2xl"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
        >
          {Array.from({ length: SLOTS }, (_, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="flex h-20 items-center justify-center rounded-xl border border-dashed border-white/[0.12] bg-white/[0.015] sm:h-24"
              aria-hidden
            >
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/25">
                Logo
              </span>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
