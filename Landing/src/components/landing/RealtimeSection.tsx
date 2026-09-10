"use client";

import { motion } from "framer-motion";
import { Activity, Radio, Server } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const SOURCES = [
  { id: "scada", label: "SCADA" },
  { id: "sensors", label: "Sensors" },
  { id: "iot", label: "IoT" },
] as const;

const STAGES = [
  {
    id: "plant",
    title: "Real Plant",
    sub: "Operational telemetry",
    icon: Radio,
  },
  {
    id: "backend",
    title: "Digital Twin Backend",
    sub: "Normalize · Sync · Model",
    icon: Server,
    accent: true,
  },
  {
    id: "twin",
    title: "Alcaster 3D Digital Twin",
    sub: "Spatial live state",
    icon: Activity,
  },
] as const;

function DataPacket({
  path,
  delay,
  reduced,
}: {
  path: string;
  delay: number;
  reduced: boolean;
}) {
  if (reduced) return null;
  return (
    <motion.circle
      r={3}
      fill="#e6740a"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{
        duration: 2.6,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <animateMotion
        dur="2.6s"
        begin={`${delay}s`}
        repeatCount="indefinite"
        path={path}
      />
    </motion.circle>
  );
}

function RealtimeFlow({ reduced }: { reduced: boolean }) {
  const pathA = "M200 150 H320";
  const pathB = "M400 150 H520";

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#010609]"
    >
      <svg
        viewBox="0 0 720 300"
        className="relative h-auto w-full"
        role="img"
        aria-label="Data flowing from real plant through digital twin backend into Alcaster 3D twin"
      >
        {/* Source chips under Real Plant */}
        {SOURCES.map((s, i) => (
          <g key={s.id}>
            <rect
              x={88 + i * 72}
              y={218}
              width={64}
              height={28}
              rx={6}
              fill="rgba(255,255,255,0.03)"
              stroke="rgba(255,255,255,0.1)"
            />
            <text
              x={120 + i * 72}
              y={236}
              textAnchor="middle"
              fill="rgba(255,255,255,0.5)"
              fontSize="10"
              fontFamily="Inter, sans-serif"
              fontWeight={500}
            >
              {s.label}
            </text>
          </g>
        ))}
        <path
          d="M120 218 V198"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        <path
          d="M192 218 V198"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        <path
          d="M264 218 V198"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />

        {/* Connection rails */}
        <path
          d={pathA}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />
        <path
          d={pathB}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />
        <path
          d={pathA}
          fill="none"
          stroke="rgba(230,116,10,0.45)"
          strokeWidth="1.75"
          strokeDasharray="7 11"
          className={reduced ? undefined : "alcaster-flow-dash"}
        />
        <path
          d={pathB}
          fill="none"
          stroke="rgba(230,116,10,0.45)"
          strokeWidth="1.75"
          strokeDasharray="7 11"
          className={reduced ? undefined : "alcaster-flow-dash"}
          style={{ animationDelay: "0.7s" }}
        />

        {[0, 1, 2].map((i) => (
          <g key={i}>
            <DataPacket path={pathA} delay={i * 0.85} reduced={reduced} />
            <DataPacket
              path={pathB}
              delay={0.35 + i * 0.85}
              reduced={reduced}
            />
          </g>
        ))}

        {/* Stage nodes */}
        {STAGES.map((stage, i) => {
          const cx = 120 + i * 240;
          const accent = "accent" in stage && stage.accent;
          return (
            <g key={stage.id}>
              <rect
                x={cx - 88}
                y={98}
                width={176}
                height={104}
                rx={14}
                fill={
                  accent ? "rgba(230,116,10,0.08)" : "rgba(255,255,255,0.03)"
                }
                stroke={
                  accent ? "rgba(230,116,10,0.55)" : "rgba(255,255,255,0.12)"
                }
                strokeWidth={1.25}
              />
              {accent && !reduced ? (
                <motion.circle
                  cx={cx}
                  cy={150}
                  r={40}
                  fill="rgba(230,116,10,0.05)"
                  animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.06, 1] }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ) : null}
              <text
                x={cx}
                y={138}
                textAnchor="middle"
                fill={accent ? "#e6740a" : "#ffffff"}
                fontSize="13"
                fontWeight="600"
                fontFamily="Inter, sans-serif"
              >
                {stage.title}
              </text>
              <text
                x={cx}
                y={160}
                textAnchor="middle"
                fill="rgba(255,255,255,0.42)"
                fontSize="11"
                fontFamily="Inter, sans-serif"
              >
                {stage.sub}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Mobile-friendly stage list (visible under SVG on small screens via overlay labels) */}
      <div className="grid gap-2 border-t border-white/[0.06] p-4 sm:hidden">
        {STAGES.map((s) => {
          const Icon = s.icon;
          const accent = "accent" in s && s.accent;
          return (
            <div
              key={s.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                accent
                  ? "border-[#e6740a]/30 bg-[#e6740a]/[0.06]"
                  : "border-white/[0.08] bg-white/[0.02]",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  accent ? "text-[#e6740a]" : "text-white/45",
                )}
                aria-hidden
              />
              <div>
                <p
                  className={cn(
                    "text-sm font-medium",
                    accent ? "text-[#e6740a]" : "text-white",
                  )}
                >
                  {s.title}
                </p>
                <p className="text-xs text-white/40">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function RealtimeSection() {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="relative py-20 sm:py-28">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
          <div>
            <SectionHeading
              eyebrow="Realtime Sync"
              title="When the plant changes, the twin changes with it."
              description="Alcaster is designed to integrate operational plant data — SCADA, sensors, and IoT streams — so the twin reflects live equipment state. Specific connector availability depends on your plant architecture."
            />
            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="mt-8 flex flex-wrap gap-2"
            >
              {SOURCES.map((s) => (
                <motion.li
                  key={s.id}
                  variants={fadeUp}
                  className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/55"
                >
                  {s.label}
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <RealtimeFlow reduced={reduced} />
        </div>
      </Container>
    </section>
  );
}
