"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/cn";
import { fadeUp, viewportOnce } from "@/lib/motion";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  size?: "default" | "compact";
  className?: string;
  as?: "h2" | "h3";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  size = "compact",
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  const compact = size === "compact";

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-[11px] font-medium uppercase tracking-[0.2em] text-[#e6740a]/90",
            compact ? "mb-2" : "mb-4",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <Tag
        className={cn(
          "text-balance font-bold tracking-tight text-white",
          compact
            ? "text-2xl sm:text-3xl lg:text-[2.15rem] lg:leading-[1.15]"
            : "text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]",
        )}
      >
        {title}
      </Tag>
      {description ? (
        <p
          className={cn(
            "text-pretty leading-relaxed text-white/55",
            compact
              ? "mt-2 text-sm sm:text-base"
              : "mt-4 text-base sm:text-lg",
          )}
        >
          {description}
        </p>
      ) : null}
    </motion.div>
  );
}
