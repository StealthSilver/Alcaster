"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { CONTACT_EMAIL, DEMO_APP_URL } from "@/lib/site";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

export function CTA() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className="relative overflow-hidden rounded-md border border-white/[0.08] bg-[#071015]/80 px-5 py-8 text-center shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-[2px] sm:px-10 sm:py-10"
    >
      <motion.h2
        variants={fadeUp}
        className="relative text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[2.15rem] lg:leading-[1.15]"
      >
        Build the digital twin of your plant.
      </motion.h2>
      <motion.p
        variants={fadeUp}
        className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/55 sm:mt-3 sm:text-base"
      >
        See your renewable infrastructure differently.
      </motion.p>
      <motion.div
        variants={fadeUp}
        className="relative mt-5 flex flex-wrap items-center justify-center gap-3 sm:mt-6"
      >
        <Button href={DEMO_APP_URL} target="_blank" variant="primary" size="lg">
          Request a Demo
        </Button>
        <Button href={`mailto:${CONTACT_EMAIL}`} variant="secondary" size="lg">
          Contact us
        </Button>
      </motion.div>
    </motion.div>
  );
}
