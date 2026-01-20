"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SplitTextProps {
  children: string;
  delay?: number;
  duration?: number;
  className?: string;
  wordDelay?: number;
}

export default function SplitText({
  children,
  delay = 0,
  duration = 0.6,
  className = "",
  wordDelay = 0.08,
}: SplitTextProps) {
  const words = children.split(" ");

  return (
    <span className={className}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration,
            delay: delay + index * wordDelay,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
