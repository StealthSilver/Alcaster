"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { DEMO_APP_URL } from "@/lib/site";
import {
  duration,
  easeOut,
  fadeUp,
  staggerContainer,
} from "@/lib/motion";

function HeroTwinSkeleton() {
  return (
    <div
      className="relative h-full min-h-[200px] w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#010609] sm:min-h-[240px] lg:min-h-[320px]"
      aria-hidden
    >
      <div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-white/[0.06]" />
      <div className="absolute left-1/2 top-8 bottom-8 w-px -translate-x-1/2 bg-white/[0.06]" />
    </div>
  );
}

const HeroTwin = dynamic(
  () => import("./HeroTwin").then((m) => m.HeroTwin),
  { ssr: false, loading: () => <HeroTwinSkeleton /> },
);

export function Hero() {
  const reduced = usePrefersReducedMotion();

  return (
    <section
      id="top"
      className="relative flex h-full min-h-0 flex-col overflow-hidden"
    >
      <Container className="relative flex min-h-0 flex-1 flex-col justify-center pt-20 pb-6 sm:pt-24 sm:pb-8">
        <div className="grid min-h-0 items-center gap-8 md:grid-cols-[1.05fr_0.95fr] md:gap-10 lg:gap-14">
          <motion.div
            variants={reduced ? undefined : staggerContainer}
            initial={reduced ? false : "hidden"}
            animate={reduced ? undefined : "visible"}
            className="max-w-xl"
          >
            <motion.p
              variants={reduced ? undefined : fadeUp}
              className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-[#e6740a]"
            >
              Digital twins for renewable energy
            </motion.p>

            <motion.h1
              variants={reduced ? undefined : fadeUp}
              className="text-balance text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.15rem] lg:leading-[1.1]"
            >
              Build the Digital Twin of Your Power Plant.
            </motion.h1>

            <motion.p
              variants={reduced ? undefined : fadeUp}
              className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-white/55 sm:mt-5 sm:text-lg"
            >
              Create interactive digital replicas of renewable energy plants and
              understand how they behave.
            </motion.p>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: duration.slow,
              ease: easeOut,
              delay: reduced ? 0 : 0.12,
            }}
            className="relative min-h-0"
          >
            <HeroTwin />
          </motion.div>
        </div>

        <motion.div
          variants={reduced ? undefined : fadeUp}
          initial={reduced ? false : "hidden"}
          animate={reduced ? undefined : "visible"}
          className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10"
        >
          <Button href={DEMO_APP_URL} target="_blank" variant="primary" size="lg">
            Request a Demo
          </Button>
        </motion.div>
      </Container>
    </section>
  );
}
