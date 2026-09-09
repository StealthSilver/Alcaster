
import { Box, LineChart, Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const actions = [
  {
    href: "/projects/new",
    label: "Create Project",
    Icon: Plus,
    primary: true,
  },
  {
    href: "/digital-twins",
    label: "Open Digital Twin",
    Icon: Box,
    primary: false,
  },
  {
    href: "/simulation",
    label: "Run Simulation",
    Icon: Sparkles,
    primary: false,
  },
  {
    href: "/analytics",
    label: "View Analytics",
    Icon: LineChart,
    primary: false,
  },
] as const;

export function QuickActions() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.44, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_8px_28px_rgba(0,0,0,0.22)]"
      aria-label="Quick actions"
    >
      <h2 className="text-base font-semibold tracking-tight text-white">
        Quick Actions
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {actions.map((action) => (
          <Link
            key={action.href}
            to={action.href}
            className={
              action.primary
                ? "inline-flex items-center justify-center gap-2 rounded-xl bg-[#e6740a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#f0821a]"
                : "inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-transparent px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:border-white/[0.14] hover:bg-white/[0.04] hover:text-white"
            }
          >
            <action.Icon className="h-4 w-4" strokeWidth={1.75} />
            {action.label}
          </Link>
        ))}
      </div>
    </motion.section>
  );
}
