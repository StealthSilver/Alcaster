"use client";

import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

type AnimatedMetricProps = {
  value: number;
  decimals?: number;
  unit?: string;
  className?: string;
  delay?: number;
};

export function AnimatedMetric({
  value,
  decimals = 0,
  unit,
  className = "",
  delay = 0,
}: AnimatedMetricProps) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (latest) =>
    latest.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
  );
  const [text, setText] = useState(
    (0).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
  );

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => setText(v));
    const controls = animate(motionValue, value, {
      duration: 1.35,
      delay,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => {
      unsubscribe();
      controls.stop();
    };
  }, [display, motionValue, value, delay, decimals]);

  return (
    <span className={`tabular-nums ${className}`}>
      <motion.span>{text}</motion.span>
      {unit ? (
        <span className="ml-1.5 text-[0.55em] font-medium tracking-wide text-white/50">
          {unit}
        </span>
      ) : null}
    </span>
  );
}
