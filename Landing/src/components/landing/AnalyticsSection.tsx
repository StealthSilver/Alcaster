"use client";

import { useId, useRef } from "react";
import { motion, useInView } from "framer-motion";

import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import { duration, easeOut, fadeUp, viewportOnce } from "@/lib/motion";

const METRICS = [
  { label: "Generation", value: 72.4, unit: "MW", decimals: 1 },
  { label: "Availability", value: 97.8, unit: "%", decimals: 1 },
  { label: "Performance Ratio", value: 84.2, unit: "%", decimals: 1 },
  { label: "Capacity Utilization", value: 71.6, unit: "%", decimals: 1 },
  { label: "Losses", value: 4.1, unit: "MW", decimals: 1 },
] as const;

/** Actual generation path (higher variance) */
const ACTUAL_D =
  "M40 148 C80 140, 110 112, 150 118 C190 124, 220 96, 260 102 C300 108, 330 78, 370 86 C410 94, 440 70, 480 78 C520 86, 550 62, 590 70";

/** Forecast path (smoother) */
const FORECAST_D =
  "M40 152 C80 146, 110 120, 150 124 C190 128, 220 104, 260 108 C300 112, 330 88, 370 92 C410 96, 440 78, 480 84 C520 90, 550 72, 590 78";

function AnalyticsChart({
  active,
  reduced,
}: {
  active: boolean;
  reduced: boolean;
}) {
  const gradId = useId().replace(/:/g, "");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#010609] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
            Actual vs Forecast
          </p>
          <p className="mt-1 text-sm text-white/70">Today · 15-min intervals</p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-white/45">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-[#e6740a]" />
            Actual
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-px w-4 border-t border-dashed border-white/40" />
            Forecast
          </span>
        </div>
      </div>

      <svg
        viewBox="0 0 640 200"
        className="h-auto w-full"
        role="img"
        aria-label="Actual versus forecast generation chart"
      >
        <defs>
          <linearGradient id={`fill-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6740a" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#e6740a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Minimal horizontal guides */}
        {[50, 100, 150].map((y) => (
          <line
            key={y}
            x1={40}
            x2={600}
            y1={y}
            y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
          />
        ))}

        {/* Area under actual */}
        <motion.path
          d={`${ACTUAL_D} L590 180 L40 180 Z`}
          fill={`url(#fill-${gradId})`}
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, ease: easeOut }}
        />

        {/* Forecast */}
        <motion.path
          d={FORECAST_D}
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={1.5}
          strokeDasharray="5 6"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={
            active
              ? { pathLength: 1, opacity: 1 }
              : { pathLength: 0, opacity: 0 }
          }
          transition={{
            duration: reduced ? 0.01 : 1.4,
            ease: easeOut,
            delay: reduced ? 0 : 0.15,
          }}
        />

        {/* Actual */}
        <motion.path
          d={ACTUAL_D}
          fill="none"
          stroke="#e6740a"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={
            active
              ? { pathLength: 1, opacity: 1 }
              : { pathLength: 0, opacity: 0 }
          }
          transition={{
            duration: reduced ? 0.01 : 1.55,
            ease: easeOut,
            delay: reduced ? 0 : 0.05,
          }}
        />

        {/* End markers */}
        {active ? (
          <>
            <circle cx={590} cy={70} r={3.5} fill="#e6740a" />
            <circle
              cx={590}
              cy={78}
              r={3}
              fill="none"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth={1.25}
            />
          </>
        ) : null}
      </svg>
    </div>
  );
}

export function AnalyticsSection() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section className="relative py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Plant Intelligence"
          title="From plant data to plant intelligence."
          description="Surface generation, availability, and performance signals in one operational view — so decisions start from clarity, not spreadsheet archaeology."
          className="max-w-2xl"
        />

        <motion.div
          ref={ref}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          transition={{ duration: duration.slow, ease: easeOut }}
          className="mt-10 space-y-4 sm:mt-12"
        >
          <AnalyticsChart active={inView} reduced={reduced} />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {METRICS.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{
                  duration: duration.base,
                  delay: 0.05 + i * 0.05,
                  ease: easeOut,
                }}
                className={cn(
                  "rounded-xl border px-3.5 py-3.5",
                  i === 0
                    ? "border-[#e6740a]/30 bg-[#e6740a]/[0.06]"
                    : "border-white/[0.08] bg-white/[0.03]",
                )}
              >
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
                  {m.label}
                </p>
                <p
                  className={cn(
                    "mt-2 text-lg font-semibold tracking-tight sm:text-xl",
                    i === 0 ? "text-[#e6740a]" : "text-white",
                  )}
                >
                  {inView ? (
                    <AnimatedNumber
                      value={m.value}
                      decimals={m.decimals}
                      unit={m.unit}
                      delay={0.15 + i * 0.06}
                    />
                  ) : (
                    <span className="tabular-nums">—</span>
                  )}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
