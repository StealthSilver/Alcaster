"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

export function CTA() {
  return (
    <section id="demo" className="relative flex h-full min-h-0 flex-col justify-center overflow-hidden py-6 sm:py-8">
      <Container>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-12 text-center sm:px-12 sm:py-16"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 55% 50% at 50% 40%, rgba(230,116,10,0.14), transparent 70%)",
            }}
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 alcaster-grid opacity-30" />

          <motion.h2
            variants={fadeUp}
            className="relative text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
          >
            Build the digital twin of your plant.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="relative mx-auto mt-4 max-w-md text-base leading-relaxed text-white/55 sm:text-lg"
          >
            See your renewable infrastructure differently.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="relative mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Button href="#demo" variant="primary" size="lg">
              Request a Demo
            </Button>
            <Button href="#platform" variant="secondary" size="lg">
              Explore the Platform
            </Button>
          </motion.div>
        </motion.div>
        <p className="mt-8 text-center text-xs text-white/30">© 2026 Alcaster</p>
      </Container>
    </section>
  );
}
