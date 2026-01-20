"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface BlurInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export default function BlurIn({
  children,
  delay = 0,
  duration = 0.6,
  className = "",
}: BlurInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
