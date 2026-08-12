"use client";

import { motion } from "framer-motion";

import { Container } from "@/components/ui/Container";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { fadeUp, viewportOnce } from "@/lib/motion";

const CATEGORIES = [
  "Plant Owners",
  "EPCs",
  "O&M Teams",
  "Engineers",
  "Operators",
] as const;

export function TrustStrip() {
  const reduced = usePrefersReducedMotion();

  return (
    <section
      aria-label="Who Alcaster is built for"
      className="border-y border-white/[0.08]"
    >
      <Container className="py-10 sm:py-12">
        <motion.div
          variants={reduced ? undefined : fadeUp}
          initial={reduced ? false : "hidden"}
          whileInView={reduced ? undefined : "visible"}
          viewport={viewportOnce}
          className="flex flex-col items-start gap-6 sm:items-center sm:text-center"
        >
          <p className="max-w-2xl text-sm leading-relaxed text-white/50 sm:text-[15px]">
            Built for the people who design, operate and manage renewable energy
            infrastructure.
          </p>

          <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/40 sm:justify-center">
            {CATEGORIES.map((label, i) => (
              <li key={label} className="flex items-center gap-3">
                {i > 0 ? (
                  <span
                    aria-hidden
                    className="hidden h-3 w-px bg-white/15 sm:block"
                  />
                ) : null}
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </Container>
    </section>
  );
}
