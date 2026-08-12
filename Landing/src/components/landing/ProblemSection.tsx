"use client";

import { motion } from "framer-motion";
import {
  Boxes,
  CloudSun,
  Cpu,
  PanelTop,
  Radio,
  Zap,
} from "lucide-react";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import {
  duration,
  easeOut,
  fadeUp,
  staggerContainer,
  viewportOnce,
} from "@/lib/motion";

const PLANT_ITEMS = [
  { label: "Panels", icon: PanelTop },
  { label: "Inverters", icon: Zap },
  { label: "Transformers", icon: Boxes },
  { label: "Substation", icon: Cpu },
  { label: "SCADA", icon: Radio },
  { label: "Weather", icon: CloudSun },
] as const;

const FLOW_STAGES = [
  { key: "plant", title: "Physical Plant", detail: "Hundreds of assets" },
  { key: "data", title: "Disconnected Data", detail: "Scattered systems" },
  { key: "visibility", title: "Limited Visibility", detail: "No shared picture" },
] as const;

function FlowVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-8"
    >
      <div className="pointer-events-none absolute inset-0 alcaster-grid opacity-40" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 30%, rgba(230,116,10,0.07), transparent 70%)",
        }}
      />

      <div className="relative space-y-8">
        <div>
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
            Physical plant
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {PLANT_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  variants={fadeUp}
                  className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.08] bg-[#010609]/60 px-3 py-4"
                >
                  <motion.span
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/70"
                    animate={
                      reduced
                        ? undefined
                        : {
                            borderColor: [
                              "rgba(255,255,255,0.1)",
                              "rgba(230,116,10,0.45)",
                              "rgba(255,255,255,0.1)",
                            ],
                          }
                    }
                    transition={{
                      duration: 3.2,
                      delay: i * 0.25,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                  </motion.span>
                  <span className="text-[11px] font-medium text-white/55">
                    {item.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-0">
          {!reduced ? (
            <svg
              className="pointer-events-none absolute inset-x-8 top-1/2 hidden h-px -translate-y-1/2 sm:block"
              viewBox="0 0 100 1"
              preserveAspectRatio="none"
              aria-hidden
            >
              <line
                x1="0"
                y1="0.5"
                x2="100"
                y2="0.5"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
              <motion.line
                x1="0"
                y1="0.5"
                x2="100"
                y2="0.5"
                stroke="rgba(230,116,10,0.55)"
                strokeWidth="1.25"
                strokeDasharray="6 10"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: -48 }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
              />
            </svg>
          ) : null}

          {FLOW_STAGES.map((stage, i) => (
            <motion.div
              key={stage.key}
              variants={fadeUp}
              className={cn(
                "relative z-10 flex flex-1 flex-col items-center text-center",
                i < FLOW_STAGES.length - 1 && "sm:pr-4",
              )}
            >
              <div
                className={cn(
                  "mb-3 flex h-10 w-10 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums",
                  i === FLOW_STAGES.length - 1
                    ? "border-[#e6740a]/40 bg-[#e6740a]/10 text-[#e6740a]"
                    : "border-white/12 bg-[#010609] text-white/55",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <p className="text-sm font-medium text-white">{stage.title}</p>
              <p className="mt-1 text-xs text-white/40">{stage.detail}</p>
              {i < FLOW_STAGES.length - 1 ? (
                <div className="my-3 h-6 w-px bg-gradient-to-b from-[#e6740a]/50 to-transparent sm:hidden" />
              ) : null}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function ProblemSection() {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="relative py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 alcaster-radial opacity-80" />
      <Container className="relative">
        <SectionHeading
          eyebrow="The Problem"
          title="Renewable plants are complex physical systems."
          description="Understanding what is happening across hundreds of assets, systems and connections shouldn't require looking at disconnected screens."
          className="max-w-3xl"
        />

        <div className="mt-12 sm:mt-14">
          <FlowVisual reduced={reduced} />
        </div>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          transition={{ duration: duration.base, ease: easeOut, delay: 0.12 }}
          className="mx-auto mt-10 max-w-2xl text-center text-lg font-medium tracking-tight text-white sm:mt-12 sm:text-xl"
        >
          Alcaster creates a{" "}
          <span className="text-[#e6740a]">unified digital representation</span>
          .
        </motion.p>
      </Container>
    </section>
  );
}
