
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const STAGES = [
  { id: "arrays", label: "Solar Arrays", x: 80, y: 48 },
  { id: "inverters", label: "Inverters", x: 220, y: 48 },
  { id: "transformers", label: "Transformers", x: 360, y: 48 },
  { id: "substation", label: "Substation", x: 500, y: 48 },
  { id: "grid", label: "Grid", x: 640, y: 48 },
] as const;

type DigitalTwinPreviewProps = {
  href?: string;
};

export function DigitalTwinPreview({ href = "/digital-twins" }: DigitalTwinPreviewProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.005 }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] sm:p-6"
      aria-label="Digital twin overview"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(230,116,10,0.08), transparent 70%)",
        }}
      />

      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-white">
            Digital Twin Overview
          </h2>
          <p className="mt-1 text-sm text-white/40">
            Energy path from arrays to grid
          </p>
        </div>
        <Link
          to={href}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#e6740a] transition-opacity hover:opacity-80"
        >
          Open Digital Twin
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="relative mt-6 overflow-hidden rounded-xl border border-white/[0.05] bg-[#010609]/60 px-2 py-8 sm:px-4">
        <svg
          viewBox="0 0 720 160"
          className="mx-auto h-auto w-full max-w-3xl"
          role="img"
          aria-label="Digital twin energy flow diagram"
        >
          <defs>
            <linearGradient id="flowLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e6740a" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#e6740a" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.35" />
            </linearGradient>
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Base connection line */}
          <path
            d={`M ${STAGES[0].x} 72 L ${STAGES[STAGES.length - 1].x} 72`}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1.5}
            fill="none"
          />
          <motion.path
            d={`M ${STAGES[0].x} 72 L ${STAGES[STAGES.length - 1].x} 72`}
            stroke="url(#flowLine)"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.8, delay: 0.4, ease: "easeOut" }}
          />

          {/* Moving energy particles */}
          {[0, 1, 2, 3].map((i) => (
            <motion.circle
              key={i}
              r={2.5}
              fill="#e6740a"
              filter="url(#softGlow)"
              initial={{ cx: STAGES[0].x, cy: 72, opacity: 0 }}
              animate={{
                cx: [
                  STAGES[0].x,
                  STAGES[1].x,
                  STAGES[2].x,
                  STAGES[3].x,
                  STAGES[4].x,
                ],
                opacity: [0, 1, 1, 1, 0],
              }}
              transition={{
                duration: 6,
                delay: i * 1.4,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}

          {STAGES.map((stage, index) => (
            <g key={stage.id}>
              <motion.rect
                x={stage.x - 36}
                y={48}
                width={72}
                height={48}
                rx={10}
                fill="rgba(255,255,255,0.03)"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + index * 0.08, duration: 0.4 }}
              />
              <motion.circle
                cx={stage.x}
                cy={72}
                r={4}
                fill={index === 0 ? "#e6740a" : "rgba(255,255,255,0.7)"}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.55 + index * 0.08 }}
              />
              {index < STAGES.length - 1 ? (
                <motion.circle
                  cx={stage.x}
                  cy={72}
                  r={10}
                  fill="none"
                  stroke={
                    index === 0
                      ? "rgba(230,116,10,0.35)"
                      : "rgba(255,255,255,0.12)"
                  }
                  strokeWidth={1}
                  animate={{ opacity: [0.35, 0.8, 0.35], scale: [1, 1.15, 1] }}
                  transition={{
                    duration: 2.8,
                    delay: index * 0.35,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ) : null}
              <text
                x={stage.x}
                y={128}
                textAnchor="middle"
                className="fill-white/50"
                fontSize={11}
                fontFamily="Inter, sans-serif"
                fontWeight={500}
              >
                {stage.label}
              </text>
            </g>
          ))}
        </svg>

        <div className="mt-2 flex justify-center gap-6 text-[10px] font-medium uppercase tracking-[0.14em] text-white/25 sm:hidden">
          {STAGES.map((s) => (
            <span key={s.id}>{s.label.split(" ")[0]}</span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
