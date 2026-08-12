"use client";

import { motion } from "framer-motion";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type EnergyFlowProps = {
  d: string;
  delay?: number;
  duration?: number;
  particles?: number;
};

export function EnergyFlow({
  d,
  delay = 0,
  duration = 5.5,
  particles = 3,
}: EnergyFlowProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <g aria-hidden>
      <path
        d={d}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={1.25}
      />
      <path
        d={d}
        fill="none"
        stroke="rgba(230,116,10,0.35)"
        strokeWidth={1.5}
        strokeDasharray="6 10"
        className={reduced ? undefined : "alcaster-flow-dash"}
        style={{ animationDelay: `${delay}s` }}
      />
      {!reduced
        ? Array.from({ length: particles }).map((_, i) => (
            <motion.circle
              key={i}
              r={2.2}
              fill="#e6740a"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{
                duration,
                delay: delay + i * (duration / particles),
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <animateMotion
                dur={`${duration}s`}
                begin={`${delay + i * (duration / particles)}s`}
                repeatCount="indefinite"
                path={d}
              />
            </motion.circle>
          ))
        : null}
    </g>
  );
}
