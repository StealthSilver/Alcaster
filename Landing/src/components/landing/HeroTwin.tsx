"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

import { DigitalTwinScene } from "@/components/twin/DigitalTwinScene";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";

type HeroTwinProps = {
  className?: string;
};

export function HeroTwin({ className }: HeroTwinProps) {
  const reduced = usePrefersReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 120, damping: 22, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 120, damping: 22, mass: 0.4 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(px * 10);
    y.set(py * 8);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      ref={frameRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "relative w-full",
        className,
      )}
    >
      <motion.div
        style={
          reduced
            ? undefined
            : { x: springX, y: springY, willChange: "transform" }
        }
        className="h-full w-full"
      >
        <DigitalTwinScene
          showLabels
          float
          interactive={false}
          className="min-h-[300px] sm:min-h-[360px] lg:min-h-[440px] [&>div]:min-h-inherit"
        />
      </motion.div>
    </div>
  );
}
