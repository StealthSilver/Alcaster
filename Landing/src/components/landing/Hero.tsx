"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import {
  duration,
  easeOut,
  fadeUp,
  staggerContainer,
} from "@/lib/motion";

function HeroTwinSkeleton() {
  return (
    <div
      className="relative min-h-[280px] w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#010609] sm:min-h-[340px] lg:min-h-[420px]"
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 alcaster-grid opacity-50" />
      <div
        className="pointer-events-none absolute inset-0 alcaster-pulse-soft"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 55% 42%, rgba(230,116,10,0.14), transparent 70%)",
        }}
      />
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
      className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24"
    >
      <div className="pointer-events-none absolute inset-0 alcaster-radial" />
      <div className="pointer-events-none absolute inset-0 alcaster-grid opacity-70" />

      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <motion.div
            variants={reduced ? undefined : staggerContainer}
            initial={reduced ? false : "hidden"}
            animate={reduced ? undefined : "visible"}
            className="max-w-xl"
          >
            <motion.p
              variants={reduced ? undefined : fadeUp}
              className="mb-5 text-[11px] font-medium uppercase tracking-[0.22em] text-[#e6740a]"
            >
              Digital twins for renewable energy
            </motion.p>

            <motion.h1
              variants={reduced ? undefined : fadeUp}
              className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]"
            >
              Build the Digital Twin of Your Power Plant.
            </motion.h1>

            <motion.p
              variants={reduced ? undefined : fadeUp}
              className="mt-5 max-w-md text-pretty text-base leading-relaxed text-white/55 sm:text-lg"
            >
              Create interactive digital replicas of renewable energy plants and
              understand how they behave.
            </motion.p>

            <motion.div
              variants={reduced ? undefined : fadeUp}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button href="#platform" variant="secondary" size="lg">
                Explore Alcaster
              </Button>
              <Button href="#demo" variant="primary" size="lg">
                Request a Demo
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: duration.slow,
              ease: easeOut,
              delay: reduced ? 0 : 0.12,
            }}
            className="relative"
          >
            <HeroTwin />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
