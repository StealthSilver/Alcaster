"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Cloud, Sun, Thermometer, Wind } from "lucide-react";

import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import { duration, easeOut, fadeUp, viewportOnce } from "@/lib/motion";

const WEATHER = [
  { id: "irr", label: "Irradiance", value: 742, unit: "W/m²", icon: Sun },
  {
    id: "temp",
    label: "Temperature",
    value: 31,
    unit: "°C",
    icon: Thermometer,
  },
  { id: "wind", label: "Wind", value: 12, unit: "km/h", icon: Wind },
  { id: "cloud", label: "Cloud Cover", value: 18, unit: "%", icon: Cloud },
] as const;

const FLOW = ["Weather", "Plant Model", "Expected Generation"] as const;

function CloudField({ reduced }: { reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 640 220"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      {/* Solar field silhouette */}
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, col) => (
          <rect
            key={`${row}-${col}`}
            x={48 + col * 70}
            y={90 + row * 22}
            width={52}
            height={14}
            rx={2}
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={0.75}
            transform={`skewX(-12) translate(${row * 4}, 0)`}
          />
        )),
      )}

      {/* Soft ground plane */}
      <ellipse
        cx={320}
        cy={198}
        rx={260}
        ry={18}
        fill="rgba(255,255,255,0.02)"
      />

      {/* Animated clouds */}
      {!reduced ? (
        <>
          <motion.g
            animate={{ x: [0, 80, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          >
            <ellipse
              cx={120}
              cy={48}
              rx={48}
              ry={16}
              fill="rgba(255,255,255,0.08)"
            />
            <ellipse
              cx={148}
              cy={44}
              rx={28}
              ry={12}
              fill="rgba(255,255,255,0.06)"
            />
            <ellipse
              cx={96}
              cy={46}
              rx={22}
              ry={10}
              fill="rgba(255,255,255,0.05)"
            />
          </motion.g>
          <motion.g
            animate={{ x: [40, -60, 40] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          >
            <ellipse
              cx={420}
              cy={36}
              rx={56}
              ry={18}
              fill="rgba(255,255,255,0.07)"
            />
            <ellipse
              cx={452}
              cy={32}
              rx={30}
              ry={12}
              fill="rgba(255,255,255,0.05)"
            />
            <ellipse
              cx={390}
              cy={34}
              rx={24}
              ry={10}
              fill="rgba(255,255,255,0.045)"
            />
          </motion.g>
          {/* Moving shadow band over panels */}
          <motion.rect
            x={0}
            y={88}
            width={120}
            height={110}
            fill="rgba(1,6,9,0.35)"
            animate={{ x: [-140, 680] }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
            style={{ mixBlendMode: "multiply" }}
          />
        </>
      ) : (
        <ellipse
          cx={200}
          cy={44}
          rx={50}
          ry={16}
          fill="rgba(255,255,255,0.07)"
        />
      )}

      {/* Sun accent */}
      <circle cx={560} cy={40} r={14} fill="rgba(230,116,10,0.35)" />
      <circle cx={560} cy={40} r={7} fill="#e6740a" opacity={0.85} />
    </svg>
  );
}

function GenerationReadout({
  value,
  active,
}: {
  value: number;
  active: boolean;
}) {
  return (
    <div className="relative z-10 rounded-xl border border-[#e6740a]/30 bg-[#010609]/88 px-4 py-3 backdrop-blur-sm">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#e6740a]">
        Expected Generation
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
        {active ? (
          <AnimatedNumber value={value} decimals={1} unit="MW" />
        ) : (
          <span className="tabular-nums">
            0.0
            <span className="ml-1.5 text-[0.55em] font-medium tracking-wide text-white/50">
              MW
            </span>
          </span>
        )}
      </p>
    </div>
  );
}

export function SimulationSection() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const [generation, setGeneration] = useState(68.4);

  useEffect(() => {
    if (!inView || reduced) return;
    const id = window.setInterval(() => {
      setGeneration((g) => {
        const next = g + (Math.random() - 0.45) * 0.8;
        return Math.min(72.5, Math.max(64.2, Number(next.toFixed(1))));
      });
    }, 2200);
    return () => window.clearInterval(id);
  }, [inView, reduced]);

  return (
    <section className="relative py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Physics-Aware Simulation"
          title="Understand why the plant behaves the way it does."
          description="Weather conditions drive the plant model — so expected generation reflects irradiance, temperature, wind, and cloud cover together."
          className="max-w-2xl"
        />

        <motion.div
          ref={ref}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-10 sm:mt-12"
        >
          {/* Flow strip */}
          <div className="mb-6 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em]">
            {FLOW.map((label, i) => (
              <span key={label} className="inline-flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-md border px-2.5 py-1",
                    i === 1
                      ? "border-[#e6740a]/35 bg-[#e6740a]/10 text-[#e6740a]"
                      : "border-white/10 bg-white/[0.03] text-white/55",
                  )}
                >
                  {label}
                </span>
                {i < FLOW.length - 1 ? (
                  <span className="text-[#e6740a]/55" aria-hidden>
                    →
                  </span>
                ) : null}
              </span>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.35fr]">
            {/* Weather metrics */}
            <div className="grid grid-cols-2 gap-3">
              {WEATHER.map((m, i) => {
                const Icon = m.icon;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={viewportOnce}
                    transition={{
                      duration: duration.base,
                      delay: i * 0.06,
                      ease: easeOut,
                    }}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center gap-2 text-white/40">
                      <Icon className="h-3.5 w-3.5 text-[#e6740a]/80" aria-hidden />
                      <span className="text-[10px] font-medium uppercase tracking-[0.14em]">
                        {m.label}
                      </span>
                    </div>
                    <p className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                      {inView ? (
                        <AnimatedNumber
                          value={m.value}
                          decimals={0}
                          unit={m.unit}
                          delay={0.1 + i * 0.08}
                        />
                      ) : (
                        <span className="tabular-nums">—</span>
                      )}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* Solar field + clouds + generation */}
            <div className="relative min-h-[240px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#010609]">
              <CloudField reduced={reduced} />
              <div className="absolute bottom-4 left-4 right-4 flex justify-end sm:bottom-5 sm:right-5">
                <GenerationReadout value={generation} active={inView} />
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
