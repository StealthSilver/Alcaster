import type { DashboardData } from "./types";

/**
 * Mock portfolio data for the Alcaster dashboard.
 * Replace this module with API-backed loaders when the backend is wired.
 */
export const dashboardData: DashboardData = {
  user: {
    name: "Rajat",
    role: "Administrator",
    initials: "R",
  },
  dateLabel: "Thursday, August 13",
  kpis: [
    {
      id: "plants",
      label: "Total Plants",
      value: 12,
      supporting: "Across 3 locations",
      tooltip: "Active plants in your portfolio",
    },
    {
      id: "capacity",
      label: "Installed Capacity",
      value: 420,
      unit: "MW",
      supporting: "+24 MW this quarter",
      tooltip: "Nameplate capacity across all plants",
    },
    {
      id: "generation",
      label: "Current Generation",
      value: 287.4,
      unit: "MW",
      decimals: 1,
      supporting: "68.4% of installed capacity",
      tooltip: "Real-time aggregated active power",
    },
    {
      id: "availability",
      label: "Plant Availability",
      value: 97.8,
      unit: "%",
      decimals: 1,
      supporting: "+1.4% vs last month",
      tooltip: "Share of capacity available for generation",
    },
    {
      id: "today",
      label: "Today's Generation",
      value: 4.82,
      unit: "GWh",
      decimals: 2,
      supporting: "92.4% of forecast",
      tooltip: "Energy delivered since midnight",
    },
  ],
  generationSeries: [
    { hour: "06", actual: 42, forecast: 48, target: 55 },
    { hour: "07", actual: 78, forecast: 85, target: 95 },
    { hour: "08", actual: 128, forecast: 135, target: 145 },
    { hour: "09", actual: 178, forecast: 185, target: 195 },
    { hour: "10", actual: 228, forecast: 235, target: 250 },
    { hour: "11", actual: 262, forecast: 268, target: 280 },
    { hour: "12", actual: 287, forecast: 292, target: 300 },
    { hour: "13", actual: 295, forecast: 298, target: 305 },
    { hour: "14", actual: 288, forecast: 295, target: 300 },
    { hour: "15", actual: 265, forecast: 275, target: 285 },
    { hour: "16", actual: 228, forecast: 240, target: 250 },
    { hour: "17", actual: 168, forecast: 180, target: 190 },
    { hour: "18", actual: 98, forecast: 110, target: 120 },
  ],
  plants: [
    {
      id: "abc-solar",
      name: "ABC Solar Plant",
      location: "Karnataka",
      capacityMw: 100,
      currentOutputMw: 72.4,
      availability: 98.2,
      status: "online",
    },
    {
      id: "green-valley",
      name: "Green Valley Solar",
      location: "Rajasthan",
      capacityMw: 75,
      currentOutputMw: 48.6,
      availability: 94.1,
      status: "warning",
    },
    {
      id: "horizon",
      name: "Horizon Renewable Plant",
      location: "Gujarat",
      capacityMw: 150,
      currentOutputMw: 112.8,
      availability: 99.1,
      status: "online",
    },
    {
      id: "karnataka-hybrid",
      name: "Solar Park Karnataka",
      location: "Karnataka",
      capacityMw: 95,
      currentOutputMw: 0,
      availability: 0,
      status: "offline",
    },
  ],
  alerts: [
    {
      id: "a1",
      severity: "warning",
      title: "INV-034 temperature above threshold",
      plant: "Solar Plant Karnataka",
      timeAgo: "4 min ago",
    },
    {
      id: "a2",
      severity: "warning",
      title: "Block 12 generation below forecast",
      plant: "Green Valley Solar",
      timeAgo: "18 min ago",
    },
    {
      id: "a3",
      severity: "info",
      title: "Grid connection restored",
      plant: "Horizon Renewable",
      timeAgo: "32 min ago",
    },
    {
      id: "a4",
      severity: "critical",
      title: "Substation feeder trip detected",
      plant: "Solar Park Karnataka",
      timeAgo: "1 hr ago",
    },
  ],
  activity: [
    {
      id: "act1",
      time: "12:42",
      description: "INV-034 status changed",
    },
    {
      id: "act2",
      time: "12:31",
      description: "Generation forecast updated",
    },
    {
      id: "act3",
      time: "12:14",
      description: "Solar Plant Karnataka synchronized",
    },
    {
      id: "act4",
      time: "11:58",
      description: "New plant configuration created",
    },
    {
      id: "act5",
      time: "11:40",
      description: "Digital twin model refreshed",
    },
  ],
  weather: {
    irradianceWm2: 742,
    temperatureC: 31,
    windKmh: 12,
    cloudCoverPct: 18,
  },
};

export async function getDashboardData(): Promise<DashboardData> {
  // Swap for a real fetch later — keep the same return shape.
  return dashboardData;
}
