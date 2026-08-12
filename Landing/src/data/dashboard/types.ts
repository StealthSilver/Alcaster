export type PlantStatus = "online" | "warning" | "offline";

export type AlertSeverity = "warning" | "critical" | "info";

export interface PortfolioKPI {
  id: string;
  label: string;
  value: number;
  unit?: string;
  decimals?: number;
  supporting: string;
  tooltip?: string;
}

export interface GenerationPoint {
  hour: string;
  actual: number;
  forecast: number;
  target: number;
}

export interface Plant {
  id: string;
  name: string;
  location: string;
  capacityMw: number;
  currentOutputMw: number;
  availability: number;
  status: PlantStatus;
}

export interface OperationalAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  plant: string;
  timeAgo: string;
}

export interface ActivityItem {
  id: string;
  time: string;
  description: string;
}

export interface WeatherConditions {
  irradianceWm2: number;
  temperatureC: number;
  windKmh: number;
  cloudCoverPct: number;
}

export interface DashboardUser {
  name: string;
  role: string;
  initials: string;
}

export interface DashboardData {
  user: DashboardUser;
  dateLabel: string;
  kpis: PortfolioKPI[];
  generationSeries: GenerationPoint[];
  plants: Plant[];
  alerts: OperationalAlert[];
  activity: ActivityItem[];
  weather: WeatherConditions;
}
