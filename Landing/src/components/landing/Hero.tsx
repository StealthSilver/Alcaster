"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { useLandingNav } from "@/components/landing/LandingNavContext";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { DEMO_APP_URL } from "@/lib/site";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function Hero() {
  const reduced = usePrefersReducedMotion();
  const { next } = useLandingNav();

  return (
    <section
      id="top"
      className="relative flex h-full min-h-0 flex-col overflow-hidden bg-transparent"
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-5 pb-8 pt-24 text-center sm:px-8 sm:pt-28">
        <motion.div
          variants={reduced ? undefined : staggerContainer}
          initial={reduced ? false : "hidden"}
          animate={reduced ? undefined : "visible"}
          className="mx-auto flex max-w-2xl flex-col items-center"
        >
          <motion.h1
            variants={reduced ? undefined : fadeUp}
            className="font-display text-balance text-[2rem] font-medium tracking-[-0.03em] text-white sm:text-5xl sm:leading-[1.05] lg:text-[3.35rem]"
          >
            See the plant.
            <span className="block text-white/88">Run the plant.</span>
          </motion.h1>

          <motion.div
            variants={reduced ? undefined : fadeUp}
            className="mt-5 h-px w-16 bg-[#e6740a]/80"
            aria-hidden
          />

          <motion.p
            variants={reduced ? undefined : fadeUp}
            className="mt-5 max-w-md text-pretty text-sm leading-relaxed text-white/55 sm:text-base"
          >
            Alcaster builds a living digital twin of solar and renewable sites,
            then connects SCADA, KPI, forecast, alerts, and ops to that same
            model.
          </motion.p>

          <motion.div
            variants={reduced ? undefined : fadeUp}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Button href={DEMO_APP_URL} target="_blank" variant="primary" size="lg">
              Request a Demo
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => next()}
            >
              Explore platform
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
