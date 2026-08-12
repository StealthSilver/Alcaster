"use client";

import { motion } from "framer-motion";

import type { DashboardData } from "@/data/dashboard";

import { DigitalTwinPreview } from "./DigitalTwinPreview";
import { KPIGrid } from "./KPIGrid";
import { OperationalAlerts } from "./OperationalAlerts";
import { PlantPortfolio } from "./PlantPortfolio";
import { PortfolioGeneration } from "./PortfolioGeneration";
import { QuickActions } from "./QuickActions";
import { RecentActivity } from "./RecentActivity";
import { WeatherOverview } from "./WeatherOverview";

type DashboardProps = {
  data: DashboardData;
};

export function Dashboard({ data }: DashboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <KPIGrid kpis={data.kpis} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PortfolioGeneration series={data.generationSeries} />
        </div>
        <div className="flex flex-col gap-6">
          <WeatherOverview weather={data.weather} />
          <QuickActions />
        </div>
      </div>

      <PlantPortfolio plants={data.plants} />

      <DigitalTwinPreview />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OperationalAlerts alerts={data.alerts} />
        <RecentActivity activity={data.activity} />
      </div>
    </motion.div>
  );
}
