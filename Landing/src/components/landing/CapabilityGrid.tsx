"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Box,
  CloudSun,
  LineChart,
  Radar,
  Sparkles,
  Workflow,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

type Capability = {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  treatment: "accent" | "bordered" | "ghost" | "dense" | "wide" | "minimal" | "metric" | "glow";
};

const CAPABILITIES: Capability[] = [
  {
    id: "twin",
    number: "01",
    title: "3D Digital Twin",
    description: "Create a spatial digital replica of your renewable plant.",
    icon: Box,
    treatment: "accent",
  },
  {
    id: "builder",
    number: "02",
    title: "Plant Builder",
    description: "Create and configure plant infrastructure visually.",
    icon: Workflow,
    treatment: "bordered",
  },
  {
    id: "realtime",
    number: "03",
    title: "Real-Time Data",
    description: "Connect plant telemetry and operational data.",
    icon: Activity,
    treatment: "metric",
  },
  {
    id: "weather",
    number: "04",
    title: "Weather Intelligence",
    description:
      "Understand how environmental conditions influence generation.",
    icon: CloudSun,
    treatment: "ghost",
  },
  {
    id: "simulation",
    number: "05",
    title: "Simulation",
    description: "Model plant behavior under different conditions.",
    icon: Sparkles,
    treatment: "glow",
  },
  {
    id: "analytics",
    number: "06",
    title: "Analytics",
    description:
      "Understand performance, availability, generation and losses.",
    icon: BarChart3,
    treatment: "dense",
  },
  {
    id: "forecasting",
    number: "07",
    title: "Forecasting",
    description: "Predict expected generation and plant behavior.",
    icon: LineChart,
    treatment: "minimal",
  },
  {
    id: "ops",
    number: "08",
    title: "Operational Intelligence",
    description: "Connect plant events, alerts and system behavior.",
    icon: Radar,
    treatment: "wide",
  },
];

function treatmentClasses(treatment: Capability["treatment"]): string {
  switch (treatment) {
    case "accent":
      return "border-[#e6740a]/30 bg-[#e6740a]/[0.07] lg:col-span-1";
    case "bordered":
      return "border-white/14 bg-transparent";
    case "ghost":
      return "border-transparent bg-white/[0.02]";
    case "dense":
      return "border-white/[0.08] bg-white/[0.04] pt-5";
    case "wide":
      return "border-white/[0.1] bg-gradient-to-br from-white/[0.05] to-transparent sm:col-span-2 lg:col-span-1";
    case "minimal":
      return "border-white/[0.06] bg-transparent";
    case "metric":
      return "border-white/[0.1] bg-[#010609]";
    case "glow":
      return "border-[#e6740a]/20 bg-white/[0.03]";
    default:
      return "";
  }
}

function CapabilityCard({ capability }: { capability: Capability }) {
  const Icon = capability.icon;
  const isAccent = capability.treatment === "accent" || capability.treatment === "glow";

  return (
    <motion.div variants={fadeUp} className="h-full">
      <Card
        hover
        className={cn(
          "group h-full p-5 transition-transform duration-400 hover:-translate-y-0.5 sm:p-6",
          treatmentClasses(capability.treatment),
        )}
      >
        {capability.treatment === "glow" ? (
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#e6740a]/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
            aria-hidden
          />
        ) : null}

        <div className="relative flex h-full flex-col">
          <div className="mb-5 flex items-start justify-between gap-3">
            <span
              className={cn(
                "text-[11px] font-semibold tabular-nums tracking-wider",
                isAccent ? "text-[#e6740a]" : "text-white/35",
              )}
            >
              {capability.number}
            </span>
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors duration-300",
                isAccent
                  ? "border-[#e6740a]/35 bg-[#e6740a]/10 text-[#e6740a] group-hover:border-[#e6740a]/55"
                  : "border-white/10 bg-white/[0.03] text-white/55 group-hover:border-white/20 group-hover:text-white/80",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
            </span>
          </div>

          <h3 className="text-base font-semibold tracking-tight text-white sm:text-[17px]">
            {capability.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-white/45">
            {capability.description}
          </p>

          {capability.treatment === "metric" ? (
            <div className="mt-5 flex gap-1.5" aria-hidden>
              {[40, 72, 55, 88, 64].map((h, i) => (
                <span
                  key={i}
                  className="w-1.5 rounded-sm bg-[#e6740a]/35 transition-colors duration-300 group-hover:bg-[#e6740a]/70"
                  style={{ height: `${h * 0.28}px` }}
                />
              ))}
            </div>
          ) : null}

          {capability.treatment === "minimal" ? (
            <div
              className="mt-auto pt-6 text-[10px] uppercase tracking-[0.2em] text-white/25"
              aria-hidden
            >
              Outlook
            </div>
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}

export function CapabilityGrid() {
  return (
    <section id="solutions" className="relative scroll-mt-24 py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Capabilities"
          title="Everything your plant knows. In one place."
          description="From the spatial twin to forecasting and ops intelligence — one connected surface for plant knowledge."
          className="max-w-3xl"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-12 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
        >
          {CAPABILITIES.map((capability) => (
            <CapabilityCard key={capability.id} capability={capability} />
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
