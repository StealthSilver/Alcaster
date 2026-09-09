import { motion } from "framer-motion";

import type { DashboardPayload } from "@/lib/api";
import type { PortfolioKPI } from "@/data/dashboard";

import { KPIGrid } from "./KPIGrid";
import { ProjectList } from "./ProjectList";
import { RecentTasks } from "./RecentTasks";

type DashboardProps = {
  data: DashboardPayload;
};

function toKpis(data: DashboardPayload): PortfolioKPI[] {
  const { kpis } = data;
  return [
    {
      id: "total",
      label: "Total Projects",
      value: kpis.totalProjects,
          supporting: `${kpis.completed} completed at this site`,
          tooltip: "Projects at the selected site",
        },
        {
          id: "active",
          label: "Active",
          value: kpis.active,
          supporting: "Currently in operation",
          tooltip: "Projects marked active",
        },
        {
          id: "pending",
          label: "Pending",
          value: kpis.pending,
          supporting: "Awaiting kickoff",
          tooltip: "Projects not yet started",
        },
        {
          id: "onHold",
          label: "On Hold",
          value: kpis.onHold,
          supporting: "Paused or blocked",
          tooltip: "Projects paused pending action",
        },
        {
          id: "capacity",
          label: "Installed Capacity",
          value: kpis.totalCapacityMw,
          unit: "MW",
          supporting: "Across this site",
          tooltip: "Nameplate capacity at the selected site",
    },
  ];
}

export function Dashboard({ data }: DashboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <KPIGrid kpis={toKpis(data)} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ProjectList projects={data.projects} showViewAll />
        </div>
        <RecentTasks tasks={data.recentTasks} />
      </div>
    </motion.div>
  );
}
