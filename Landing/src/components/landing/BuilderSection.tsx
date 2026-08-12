"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Cable,
  Grid2x2,
  LayoutPanelTop,
  Settings2,
  Zap,
} from "lucide-react";

import { PlantModel } from "@/components/twin/PlantModel";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import { duration, easeOut, fadeUp, viewportOnce } from "@/lib/motion";

const STEPS = ["Drag", "Drop", "Connect", "Configure"] as const;
type Step = (typeof STEPS)[number];

const COMPONENTS = [
  { id: "panel", label: "Panel", icon: LayoutPanelTop },
  { id: "inverter", label: "Inverter", icon: Zap },
  { id: "transformer", label: "Transformer", icon: Settings2 },
  { id: "cable", label: "Cable", icon: Cable },
  { id: "grid", label: "Grid", icon: Grid2x2 },
] as const;

const PROPERTIES: Record<
  string,
  { label: string; value: string; unit?: string }[]
> = {
  panel: [
    { label: "Capacity", value: "550", unit: "W" },
    { label: "Tilt", value: "22", unit: "°" },
    { label: "Azimuth", value: "180", unit: "°" },
  ],
  inverter: [
    { label: "Rated Power", value: "2.5", unit: "MW" },
    { label: "Efficiency", value: "97.4", unit: "%" },
    { label: "MPPT Channels", value: "8" },
  ],
  transformer: [
    { label: "Rating", value: "100", unit: "MVA" },
    { label: "Voltage", value: "33/132", unit: "kV" },
    { label: "Cooling", value: "ONAN" },
  ],
  cable: [
    { label: "Type", value: "DC string" },
    { label: "Length", value: "42", unit: "m" },
    { label: "Cross-section", value: "4", unit: "mm²" },
  ],
  grid: [
    { label: "Point of Interconnect", value: "POI-01" },
    { label: "Voltage", value: "132", unit: "kV" },
    { label: "Export Limit", value: "100", unit: "MW" },
  ],
};

function useBuilderSequence(reduced: boolean, active: boolean) {
  const [tick, setTick] = useState(0);
  const [selected, setSelected] = useState("inverter");

  useEffect(() => {
    if (!active || reduced) return;

    let cancelled = false;
    const timeouts: number[] = [];
    const schedule = (fn: () => void, ms: number) => {
      timeouts.push(window.setTimeout(fn, ms));
    };

    const runCycle = (offset: number) => {
      schedule(() => {
        if (!cancelled) setTick(0);
      }, offset);
      schedule(() => {
        if (!cancelled) setTick(1);
      }, offset + 400);
      schedule(() => {
        if (!cancelled) setTick(2);
      }, offset + 1600);
      schedule(() => {
        if (!cancelled) setTick(3);
      }, offset + 2600);
      schedule(() => {
        if (!cancelled) setTick(4);
      }, offset + 3600);
      schedule(() => {
        if (!cancelled) setTick(5);
      }, offset + 4800);
    };

    runCycle(0);
    runCycle(7200);
    runCycle(14400);

    return () => {
      cancelled = true;
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [active, reduced]);

  const phase = !active || reduced ? 5 : tick;

  const stepIndex =
    phase <= 1 ? 0 : phase <= 3 ? 1 : phase === 4 ? 2 : 3;

  const placed =
    phase === 0
      ? []
      : phase === 1
        ? ["panel"]
        : phase === 2
          ? ["panel", "inverter"]
          : phase === 3
            ? ["panel", "inverter", "transformer"]
            : ["panel", "inverter", "transformer", "cable", "grid"];

  const connected = phase >= 4;

  return {
    step: STEPS[stepIndex] as Step,
    stepIndex,
    placed,
    selected,
    connected,
    setSelected,
  };
}

function BuilderCanvas({
  connected,
  reduced,
}: {
  connected: boolean;
  reduced: boolean;
}) {
  return (
    <div className="relative flex h-full min-h-[220px] items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-[#010609]">
      <div className="pointer-events-none absolute inset-0 alcaster-grid opacity-40" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 50% at 50% 45%, rgba(230,116,10,0.1), transparent 70%)",
        }}
      />
      <motion.svg
        viewBox="80 40 560 260"
        className="relative h-auto w-full max-h-[280px]"
        role="img"
        aria-label="Plant builder canvas"
        initial={reduced ? false : { opacity: 0.4, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: easeOut }}
      >
        <PlantModel
          interactive={false}
          showFlows={connected}
          warningId={null}
        />
        {!connected ? (
          <rect
            x={80}
            y={40}
            width={560}
            height={260}
            fill="rgba(1,6,9,0.35)"
          />
        ) : null}
      </motion.svg>

      <AnimatePresence>
        {!connected ? (
          <motion.div
            key="ghost"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-4 py-3 text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                Drop zone
              </p>
              <p className="mt-1 text-xs text-white/55">Plant canvas</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function BuilderSection() {
  const reduced = usePrefersReducedMotion();
  const [inView, setInView] = useState(false);
  const { stepIndex, placed, selected, connected, setSelected } =
    useBuilderSequence(reduced, inView);
  const props = PROPERTIES[selected] ?? PROPERTIES.inverter;

  return (
    <section className="relative py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Plant Builder"
          title="Build the plant. Don't just visualize it."
          description="Compose arrays, inverters, transformers, and grid connections into a spatially accurate digital twin — then configure every asset."
          className="max-w-2xl"
        />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          onViewportEnter={() => setInView(true)}
          className="mt-10 sm:mt-12"
        >
          {/* Step indicator */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-300",
                    i === stepIndex
                      ? "border-[#e6740a]/40 bg-[#e6740a]/12 text-[#e6740a]"
                      : i < stepIndex
                        ? "border-white/12 bg-white/[0.04] text-white/70"
                        : "border-white/[0.06] bg-transparent text-white/30",
                  )}
                >
                  {String(i + 1).padStart(2, "0")} {s}
                </span>
                {i < STEPS.length - 1 ? (
                  <span className="hidden text-white/20 sm:inline" aria-hidden>
                    →
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          {/* Mock product UI */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#010609]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#e6740a]/80" />
                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
                  Alcaster Builder
                </span>
              </div>
              <Badge tone="accent">Demo sequence</Badge>
            </div>

            <div className="grid lg:grid-cols-[200px_1fr_220px]">
              {/* Components panel */}
              <aside className="border-b border-white/[0.06] p-3 lg:border-b-0 lg:border-r">
                <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  Components
                </p>
                <ul className="space-y-1.5">
                  {COMPONENTS.map((c, i) => {
                    const Icon = c.icon;
                    const isPlaced = placed.includes(c.id);
                    const isDragging =
                      !reduced &&
                      stepIndex === 0 &&
                      c.id === "panel" &&
                      !isPlaced;
                    const isActive = selected === c.id && isPlaced;

                    return (
                      <motion.li key={c.id}>
                        <button
                          type="button"
                          onClick={() => isPlaced && setSelected(c.id)}
                          disabled={!isPlaced}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors duration-300",
                            isActive
                              ? "border-[#e6740a]/40 bg-[#e6740a]/10 text-white"
                              : isPlaced
                                ? "border-white/[0.08] bg-white/[0.03] text-white/75 hover:border-white/14"
                                : "border-transparent bg-transparent text-white/35",
                          )}
                        >
                          <motion.span
                            animate={
                              isDragging
                                ? { x: [0, 8, 0], y: [0, -4, 0] }
                                : { x: 0, y: 0 }
                            }
                            transition={
                              isDragging
                                ? {
                                    duration: 1.1,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }
                                : { duration: 0.3 }
                            }
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-md border",
                              isActive
                                ? "border-[#e6740a]/35 bg-[#e6740a]/15 text-[#e6740a]"
                                : "border-white/10 bg-white/[0.03] text-white/50",
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" aria-hidden />
                          </motion.span>
                          <span className="flex-1">{c.label}</span>
                          <AnimatePresence>
                            {isPlaced ? (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-1.5 w-1.5 rounded-full bg-[#e6740a]"
                              />
                            ) : null}
                          </AnimatePresence>
                        </button>
                        {!reduced &&
                        stepIndex === 1 &&
                        c.id === "inverter" &&
                        !isPlaced ? (
                          <motion.div
                            className="pointer-events-none mt-1 h-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{
                              duration: 1.2,
                              ease: "easeInOut",
                            }}
                          >
                            <div className="ml-10 h-8 w-24 -translate-y-2 rounded-md border border-[#e6740a]/40 bg-[#e6740a]/10" />
                          </motion.div>
                        ) : null}
                        <span className="sr-only">
                          Component {i + 1}: {c.label}
                          {isPlaced ? " placed" : " available"}
                        </span>
                      </motion.li>
                    );
                  })}
                </ul>
              </aside>

              {/* Center canvas */}
              <div className="relative min-h-[240px] p-3 sm:p-4">
                <BuilderCanvas connected={connected} reduced={reduced} />
                <AnimatePresence>
                  {connected && stepIndex >= 2 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: duration.fast, ease: easeOut }}
                      className="pointer-events-none absolute left-6 top-6"
                    >
                      <span className="rounded-md border border-[#e6740a]/30 bg-[#010609]/85 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#e6740a] backdrop-blur-sm">
                        {stepIndex === 2 ? "Connecting…" : "Configured"}
                      </span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Properties panel */}
              <aside className="border-t border-white/[0.06] p-3 lg:border-l lg:border-t-0">
                <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  Properties
                </p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selected + String(stepIndex >= 3)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: duration.fast, ease: easeOut }}
                    className="space-y-3"
                  >
                    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                        Selected
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {COMPONENTS.find((c) => c.id === selected)?.label ??
                          "Inverter"}
                      </p>
                    </div>
                    {stepIndex >= 3 ? (
                      props.map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between gap-3 px-1 text-xs"
                        >
                          <span className="text-white/40">{row.label}</span>
                          <span className="tabular-nums text-white/85">
                            {row.value}
                            {row.unit ? (
                              <span className="ml-1 text-white/40">
                                {row.unit}
                              </span>
                            ) : null}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="px-1 text-xs leading-relaxed text-white/35">
                        Place and connect equipment to configure asset
                        properties.
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </aside>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
