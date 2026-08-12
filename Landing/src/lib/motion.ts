import type { Transition, Variants } from "framer-motion";

export const easeOut: Transition["ease"] = [0.22, 1, 0.36, 1];

export const duration = {
  fast: 0.4,
  base: 0.55,
  slow: 0.75,
} as const;

export const viewportOnce = {
  once: true,
  amount: 0.2,
  margin: "0px 0px -8% 0px",
} as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: duration.base, ease: easeOut },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: duration.base, ease: easeOut },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};
