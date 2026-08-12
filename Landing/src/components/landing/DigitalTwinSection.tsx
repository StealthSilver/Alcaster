"use client";

import { motion } from "framer-motion";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import {
  duration,
  easeOut,
  fadeUp,
  staggerContainer,
  staggerFast,
  viewportOnce,
} from "@/lib/motion";

const LAYERS = [
  "Plant structure",
  "Equipment",
  "Location",
  "Connections",
  "Operational state",
  "Weather",
  "Telemetry",
  "Analytics",
] as const;

const NODES = [
  {
    id: "physical",
    label: "Real Plant",
    sub: "Physical assets & systems",
    x: 18,
  },
  {
    id: "twin",
    label: "Digital Twin",
    sub: "Unified spatial model",
    x: 50,
    accent: true,
  },
  {
    id: "data",
    label: "Data + Simulation",
    sub: "Live state & foresight",
    x: 82,
  },
] as const;

function TwinBridgeVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#010609]"
    >
      <div className="pointer-events-none absolute inset-0 alcaster-grid opacity-50" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 55% at 50% 45%, rgba(230,116,10,0.11), transparent 68%)",
        }}
      />

      <svg
        viewBox="0 0 720 280"
        className="relative h-auto w-full"
        role="img"
        aria-label="Real plant connected to digital twin connected to data and simulation"
      >
        {/* Connection paths */}
        <path
          d="M170 140 H290"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />
        <path
          d="M430 140 H550"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />
        <path
          d="M170 140 H290"
          fill="none"
          stroke="rgba(230,116,10,0.45)"
          strokeWidth="1.75"
          strokeDasharray="7 11"
          className={reduced ? undefined : "alcaster-flow-dash"}
        />
        <path
          d="M430 140 H550"
          fill="none"
          stroke="rgba(230,116,10,0.45)"
          strokeWidth="1.75"
          strokeDasharray="7 11"
          className={reduced ? undefined : "alcaster-flow-dash"}
          style={{ animationDelay: "0.8s" }}
        />

        {!reduced
          ? [0, 1, 2].map((i) => (
              <g key={i}>
                <motion.circle
                  r={2.4}
                  fill="#e6740a"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{
                    duration: 2.8,
                    delay: i * 0.9,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <animateMotion
                    dur="2.8s"
                    begin={`${i * 0.9}s`}
                    repeatCount="indefinite"
                    path="M170 140 H290"
                  />
                </motion.circle>
                <motion.circle
                  r={2.4}
                  fill="#e6740a"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{
                    duration: 2.8,
                    delay: 0.4 + i * 0.9,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <animateMotion
                    dur="2.8s"
                    begin={`${0.4 + i * 0.9}s`}
                    repeatCount="indefinite"
                    path="M430 140 H550"
                  />
                </motion.circle>
              </g>
            ))
          : null}

        {NODES.map((node) => {
          const cx = (node.x / 100) * 720;
          const isAccent = "accent" in node && node.accent;
          return (
            <g key={node.id}>
              <rect
                x={cx - 78}
                y={88}
                width={156}
                height={104}
                rx={14}
                fill={
                  isAccent ? "rgba(230,116,10,0.08)" : "rgba(255,255,255,0.03)"
                }
                stroke={
                  isAccent ? "rgba(230,116,10,0.55)" : "rgba(255,255,255,0.12)"
                }
                strokeWidth={1.25}
              />
              {isAccent && !reduced ? (
                <motion.circle
                  cx={cx}
                  cy={140}
                  r={36}
                  fill="rgba(230,116,10,0.06)"
                  animate={{ opacity: [0.35, 0.75, 0.35], scale: [1, 1.08, 1] }}
                  transition={{
                    duration: 3.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ) : null}
              <text
                x={cx}
                y={128}
                textAnchor="middle"
                fill={isAccent ? "#e6740a" : "#ffffff"}
                fontSize="14"
                fontWeight="600"
                fontFamily="Inter, sans-serif"
              >
                {node.label}
              </text>
              <text
                x={cx}
                y={152}
                textAnchor="middle"
                fill="rgba(255,255,255,0.42)"
                fontSize="11"
                fontFamily="Inter, sans-serif"
              >
                {node.sub}
              </text>
            </g>
          );
        })}

        {/* Bidirectional markers */}
        <text
          x={230}
          y={128}
          textAnchor="middle"
          fill="rgba(230,116,10,0.7)"
          fontSize="10"
          fontFamily="Inter, sans-serif"
        >
          ↔
        </text>
        <text
          x={490}
          y={128}
          textAnchor="middle"
          fill="rgba(230,116,10,0.7)"
          fontSize="10"
          fontFamily="Inter, sans-serif"
        >
          ↔
        </text>
      </svg>
    </motion.div>
  );
}

export function DigitalTwinSection() {
  const reduced = usePrefersReducedMotion();

  return (
    <section id="platform" className="relative scroll-mt-24 py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Platform"
              title="One plant. One digital representation."
              description="Alcaster models the full stack of plant knowledge — structure through analytics — as a single living twin."
            />

            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="mt-10 grid grid-cols-2 gap-2.5 sm:gap-3"
            >
              {LAYERS.map((layer, i) => (
                <motion.li
                  key={layer}
                  variants={fadeUp}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3.5 py-3",
                    i % 3 === 0
                      ? "border-[#e6740a]/25 bg-[#e6740a]/[0.06]"
                      : "border-white/[0.08] bg-white/[0.02]",
                  )}
                >
                  <span className="text-[10px] font-semibold tabular-nums text-[#e6740a]/80">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-white/75">{layer}</span>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <div className="space-y-4">
            <TwinBridgeVisual reduced={reduced} />
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              transition={{ duration: duration.base, ease: easeOut }}
              className="text-sm leading-relaxed text-white/45"
            >
              The twin is the shared substrate — physical reality, operational
              state, and simulation stay connected through one model.
            </motion.p>
          </div>
        </div>

        <motion.div
          variants={staggerFast}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-xs font-medium uppercase tracking-[0.14em] text-white/35 sm:mt-12"
        >
          {["Real Plant", "Digital Twin", "Data + Simulation"].map((label, i) => (
            <motion.span key={label} variants={fadeUp} className="inline-flex items-center gap-3">
              <span className={i === 1 ? "text-[#e6740a]" : "text-white/55"}>
                {label}
              </span>
              {i < 2 ? (
                <span className="text-[#e6740a]/60" aria-hidden>
                  ↔
                </span>
              ) : null}
            </motion.span>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
