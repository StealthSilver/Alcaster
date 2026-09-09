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
      className="shrink-0 border-t border-white/[0.08]"
    >
      <Container className="py-4 sm:py-5">
        <motion.div
          variants={reduced ? undefined : fadeUp}
          initial={reduced ? false : "hidden"}
          whileInView={reduced ? undefined : "visible"}
          viewport={viewportOnce}
          className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
        >
          <p className="max-w-xl text-xs leading-relaxed text-white/45 sm:text-sm">
            Built for the people who design, operate and manage renewable energy
            infrastructure.
          </p>

          <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/40 sm:justify-end sm:text-[11px]">
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
