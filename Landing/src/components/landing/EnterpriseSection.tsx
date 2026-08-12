"use client";

import { motion } from "framer-motion";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const USERS = [
  "Plant Operators",
  "Electrical Engineers",
  "Solar Engineers",
  "Wind Engineers",
  "O&M Teams",
  "Project Managers",
] as const;

type Cursor = {
  id: string;
  label: string;
  initials: string;
  x: string;
  y: string;
  delay: number;
};

const CURSORS: Cursor[] = [
  { id: "op", label: "Operator", initials: "PO", x: "18%", y: "28%", delay: 0 },
  { id: "ee", label: "Elec. Eng.", initials: "EE", x: "62%", y: "22%", delay: 0.4 },
  { id: "om", label: "O&M", initials: "OM", x: "48%", y: "58%", delay: 0.8 },
  { id: "pm", label: "PM", initials: "PM", x: "78%", y: "48%", delay: 1.2 },
];

function SharedPlantVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      variants={fadeUp}
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8"
    >
      <div className="pointer-events-none absolute inset-0 alcaster-grid opacity-35" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 45%, rgba(230,116,10,0.08), transparent 70%)",
        }}
      />

      <div className="relative mx-auto aspect-[16/10] max-w-xl">
        {/* Abstract plant footprint */}
        <svg
          viewBox="0 0 320 200"
          className="h-full w-full text-white/25"
          fill="none"
          aria-hidden
        >
          <rect
            x="40"
            y="50"
            width="180"
            height="100"
            rx="4"
            stroke="currentColor"
            strokeWidth="1"
            className="text-white/15"
          />
          {[0, 1, 2, 3, 4].map((col) =>
            [0, 1, 2].map((row) => (
              <rect
                key={`${col}-${row}`}
                x={52 + col * 32}
                y={62 + row * 28}
                width={26}
                height={20}
                rx="1"
                stroke="rgba(230,116,10,0.35)"
                strokeWidth="1"
                fill="rgba(230,116,10,0.06)"
              />
            )),
          )}
          <rect
            x="240"
            y="70"
            width="36"
            height="60"
            rx="2"
            stroke="currentColor"
            strokeWidth="1"
          />
          <line
            x1="220"
            y1="100"
            x2="240"
            y2="100"
            stroke="rgba(230,116,10,0.45)"
            strokeWidth="1.25"
            strokeDasharray="3 4"
            className={reduced ? undefined : "alcaster-flow-dash"}
          />
          <circle cx="276" cy="100" r="4" stroke="rgba(230,116,10,0.6)" strokeWidth="1.25" />
        </svg>

        {CURSORS.map((cursor) => (
          <motion.div
            key={cursor.id}
            className="absolute flex items-center gap-1.5"
            style={{ left: cursor.x, top: cursor.y }}
            initial={reduced ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            animate={
              reduced
                ? undefined
                : {
                    y: [0, -3, 0],
                  }
            }
            transition={{
              opacity: { duration: 0.5, delay: cursor.delay },
              y: {
                duration: 4.5,
                delay: cursor.delay,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          >
            <span className="relative flex h-6 w-6 items-center justify-center rounded-full border border-[#e6740a]/40 bg-[#010609] text-[9px] font-semibold tracking-wide text-[#e6740a]">
              {cursor.initials}
              <span
                className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#e6740a]"
                aria-hidden
              />
            </span>
            <span className="rounded border border-white/10 bg-[#010609]/85 px-1.5 py-0.5 text-[10px] text-white/50">
              {cursor.label}
            </span>
          </motion.div>
        ))}
      </div>

      <p className="relative mt-4 text-center text-xs text-white/35">
        One twin. Shared operational context across roles.
      </p>
    </motion.div>
  );
}

export function EnterpriseSection() {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="relative py-20 sm:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Enterprise"
              title="Built for teams that run real infrastructure."
              description="Operators, engineers, and managers work from the same plant representation — not parallel dashboards."
              className="max-w-xl"
            />

            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="mt-8 flex flex-wrap gap-2"
            >
              {USERS.map((user) => (
                <motion.li key={user} variants={fadeUp}>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/55",
                    )}
                  >
                    {user}
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <SharedPlantVisual reduced={reduced} />
        </div>
      </Container>
    </section>
  );
}
