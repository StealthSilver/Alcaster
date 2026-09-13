"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { CONTACT_EMAIL, DEMO_APP_URL } from "@/lib/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function CTA() {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      variants={reduced ? undefined : staggerContainer}
      initial={reduced ? false : "hidden"}
      animate={reduced ? undefined : "visible"}
      className="mx-auto max-w-2xl text-center"
    >
      <motion.p
        variants={reduced ? undefined : fadeUp}
        className="font-mono text-[11px] tracking-[0.24em] text-[#e6740a]/90 uppercase"
      >
        Contact
      </motion.p>
      <motion.h2
        variants={reduced ? undefined : fadeUp}
        className="font-display mt-4 text-balance text-3xl font-medium tracking-[-0.03em] text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
      >
        Bring your plant into Alcaster.
      </motion.h2>
      <motion.div
        variants={reduced ? undefined : fadeUp}
        className="mx-auto mt-5 h-px w-14 bg-[#e6740a]/80"
        aria-hidden
      />
      <motion.p
        variants={reduced ? undefined : fadeUp}
        className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/50 sm:text-base"
      >
        Request a demo of the twin, SCADA, KPI, forecast, and ops workspace,
        or reach out directly.
      </motion.p>
      <motion.div
        variants={reduced ? undefined : fadeUp}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <Button href={DEMO_APP_URL} target="_blank" variant="primary" size="lg">
          Request a Demo
        </Button>
        <Button href={`mailto:${CONTACT_EMAIL}`} variant="secondary" size="lg">
          Contact us
        </Button>
      </motion.div>
      <motion.p
        variants={reduced ? undefined : fadeUp}
        className="mt-8 font-mono text-[11px] tracking-[0.08em] text-white/30"
      >
        {CONTACT_EMAIL}
      </motion.p>
    </motion.div>
  );
}
