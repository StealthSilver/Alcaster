"use client";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

type ArchCard = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  featured?: boolean;
  badge?: string;
};

const ARCHITECTURES: ArchCard[] = [
  {
    id: "solar",
    title: "Solar",
    subtitle: "PV plants",
    description:
      "Full digital twin coverage for utility-scale solar — arrays, inverters, transformers, and grid connection in one spatial model.",
    featured: true,
    badge: "Primary focus",
  },
  {
    id: "wind",
    title: "Wind",
    subtitle: "Wind farms",
    description:
      "Architecture readiness for wind fleets — same twin, telemetry, and ops model as solar expands.",
    badge: "Platform expansion",
  },
  {
    id: "hybrid",
    title: "Hybrid",
    subtitle: "Solar + Wind + Storage",
    description:
      "Unified plant representation designed for hybrid sites where generation and storage share operational context.",
    badge: "Architecture ready",
  },
  {
    id: "bess",
    title: "BESS",
    subtitle: "Battery energy storage",
    description:
      "Storage-aware twin foundations so charge, discharge, and grid services sit alongside generation assets.",
    badge: "Architecture ready",
  },
];

function SolarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="24" cy="18" r="6" stroke="currentColor" strokeWidth="1.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 24 + Math.cos(rad) * 9;
        const y1 = 18 + Math.sin(rad) * 9;
        const x2 = 24 + Math.cos(rad) * 12.5;
        const y2 = 18 + Math.sin(rad) * 12.5;
        return (
          <line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      })}
      <rect
        x="8"
        y="30"
        width="32"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line x1="16" y1="30" x2="16" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="24" y1="30" x2="24" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="32" y1="30" x2="32" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="8" y1="35" x2="40" y2="35" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function WindIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <line x1="24" y1="22" x2="24" y2="42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="20" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M24 20 L24 6 C24 6 32 10 30 18 C29 20 26 20 24 20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M24 20 L36 28 C36 28 30 34 24 30 C22 29 22 26 24 20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M24 20 L12 28 C12 28 18 34 24 30 C26 29 26 26 24 20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1="16" y1="42" x2="32" y2="42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HybridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="16" y1="8" x2="16" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="27" x2="16" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="16" x2="5" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="27" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="34" y1="14" x2="34" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="34" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M34 12 L40 8 M34 12 L40 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="10" y="34" width="14" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 38h8M17 34v8" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <path
        d="M28 38h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 3"
        opacity="0.6"
      />
    </svg>
  );
}

function BessIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <rect x="10" y="14" width="28" height="22" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="18" y="10" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="20" width="6" height="12" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="21" y="20" width="6" height="12" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="28" y="20" width="6" height="12" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M17 26h0.01M24 26h0.01M31 26h0.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

const ICONS = {
  solar: SolarIcon,
  wind: WindIcon,
  hybrid: HybridIcon,
  bess: BessIcon,
} as const;

function ArchCardView({ arch }: { arch: ArchCard }) {
  const Icon = ICONS[arch.id as keyof typeof ICONS];

  return (
    <motion.div
      variants={fadeUp}
      className={cn(arch.featured && "sm:col-span-2 lg:col-span-1 lg:row-span-3")}
    >
      <Card
        hover
        className={cn(
          "group h-full p-6 sm:p-7",
          arch.featured
            ? "min-h-[280px] border-[#e6740a]/25 bg-[#e6740a]/[0.06] lg:min-h-full lg:p-8"
            : "border-white/[0.08]",
        )}
      >
        {arch.featured ? (
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#e6740a]/10 blur-3xl"
            aria-hidden
          />
        ) : null}

        <div className="relative flex h-full flex-col">
          <div className="mb-5 flex items-start justify-between gap-3">
            <span
              className={cn(
                "flex items-center justify-center rounded-xl border",
                arch.featured
                  ? "h-14 w-14 border-[#e6740a]/35 bg-[#e6740a]/10 text-[#e6740a]"
                  : "h-11 w-11 border-white/10 bg-white/[0.03] text-white/55",
              )}
            >
              <Icon className={arch.featured ? "h-8 w-8" : "h-6 w-6"} />
            </span>
            {arch.badge ? (
              <Badge tone={arch.featured ? "accent" : "neutral"}>{arch.badge}</Badge>
            ) : null}
          </div>

          <h3
            className={cn(
              "font-semibold tracking-tight text-white",
              arch.featured ? "text-2xl sm:text-3xl" : "text-lg",
            )}
          >
            {arch.title}
          </h3>
          <p
            className={cn(
              "mt-1 font-medium",
              arch.featured ? "text-sm text-[#e6740a]/90" : "text-xs text-white/40",
            )}
          >
            {arch.subtitle}
          </p>
          <p
            className={cn(
              "mt-3 leading-relaxed text-white/45",
              arch.featured ? "max-w-md text-base" : "text-sm",
            )}
          >
            {arch.description}
          </p>

          {!arch.featured ? (
            <p className="mt-auto pt-5 text-[10px] uppercase tracking-[0.18em] text-white/25">
              Roadmap architecture
            </p>
          ) : (
            <p className="mt-auto pt-8 text-[11px] uppercase tracking-[0.18em] text-white/35">
              Deepest twin fidelity today
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export function TechnologySection() {
  return (
    <section id="architectures" className="relative scroll-mt-24 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 alcaster-radial opacity-60" />
      <Container className="relative">
        <SectionHeading
          eyebrow="Technology"
          title="One platform. Every renewable architecture."
          description="Solar is the deepest twin experience today. Wind, hybrid, and storage share the same platform model as coverage expands."
          className="max-w-3xl"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-12 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2 lg:grid-rows-3"
        >
          {ARCHITECTURES.map((arch) => (
            <ArchCardView key={arch.id} arch={arch} />
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
