"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/cn";
import { fadeUp, viewportOnce } from "@/lib/motion";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  as?: "h2" | "h3";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
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
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[#e6740a]/90">
          {eyebrow}
        </p>
      ) : null}
      <Tag className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
        {title}
      </Tag>
      {description ? (
        <p className="mt-4 text-pretty text-base leading-relaxed text-white/55 sm:text-lg">
          {description}
        </p>
      ) : null}
    </motion.div>
  );
}
