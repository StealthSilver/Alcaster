import type {
  ActivityItem,
  GenerationPoint,
  OperationalAlert,
  ProjectDashboardKpis,
  ProjectRecord,
  WeatherConditions,
} from "../types.js";

function hashId(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function unit(hash: number, salt: number): number {
  return ((hash >>> salt) % 1000) / 1000;
}

const HOURS = [
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
] as const;

const SOLAR_CURVE = [
  0.06, 0.18, 0.38, 0.58, 0.76, 0.88, 0.96, 0.93, 0.82, 0.64, 0.42, 0.2, 0.07,
];
const WIND_CURVE = [
  0.42, 0.48, 0.55, 0.62, 0.7, 0.74, 0.72, 0.68, 0.65, 0.7, 0.76, 0.8, 0.78,
];
const BESS_CURVE = [
  0.2, 0.15, 0.1, 0.08, 0.12, 0.35, 0.55, 0.7, 0.82, 0.78, 0.6, 0.4, 0.28,
];

function curveFor(type: ProjectRecord["type"]): number[] {
  if (type === "wind") return WIND_CURVE;
  if (type === "bess") return BESS_CURVE;
  if (type === "hybrid") {
    return SOLAR_CURVE.map(
      (value, index) => value * 0.7 + (WIND_CURVE[index] ?? 0) * 0.3,
    );
  }
  return SOLAR_CURVE;
}

function operatingFactor(project: ProjectRecord): number {
  if (project.status === "completed" || project.status === "on_hold") return 0;
  if (project.status === "pending") return 0.12;
  return 1;
}

export function buildProjectTelemetry(project: ProjectRecord): {
  kpis: ProjectDashboardKpis;
  generationSeries: GenerationPoint[];
  weather: WeatherConditions;
  alerts: OperationalAlert[];
  activity: ActivityItem[];
} {
  const hash = hashId(project.id);
  const factor = operatingFactor(project);
  const load = 0.62 + unit(hash, 3) * 0.3;
  const curve = curveFor(project.type);
  const noise = (index: number) => (unit(hash, index + 2) - 0.5) * 0.08;
  const availabilityBase =
    project.status === "active"
      ? 94 + unit(hash, 5) * 5.5
      : project.status === "pending"
        ? 40 + unit(hash, 5) * 20
        : project.status === "on_hold"
          ? 12 + unit(hash, 5) * 10
          : 0;

  const generationSeries: GenerationPoint[] = HOURS.map((hour, index) => {
    const target = round1(project.capacityMw * (curve[index] ?? 0));
    const forecast = round1(target * (0.92 + unit(hash, index) * 0.08));
    const actual = round1(
      Math.max(0, forecast * factor * (load + noise(index))),
    );
    return { hour, actual, forecast, target };
  });

  const nowIndex = Math.min(
    generationSeries.length - 1,
    Math.max(0, new Date().getHours() - 6),
  );
  const current = generationSeries[nowIndex] ?? {
    hour: "06",
    actual: 0,
    forecast: 0,
    target: 0,
  };
  const todayActual = generationSeries.reduce((sum, point) => sum + point.actual, 0);
  const todayForecast = generationSeries.reduce(
    (sum, point) => sum + point.forecast,
    0,
  );
  const vsForecast =
    todayForecast === 0 ? 0 : Math.min(120, (todayActual / todayForecast) * 100);

  const kpis: ProjectDashboardKpis = {
    capacityMw: project.capacityMw,
    currentOutputMw: round1(current.actual),
    availabilityPct: round1(availabilityBase * (factor === 0 ? 0.15 : 1)),
    todayGenerationMwh: round1(todayActual),
    vsForecastPct: round1(vsForecast),
  };

  const weather: WeatherConditions = {
    irradianceWm2: Math.round(380 + unit(hash, 6) * 520),
    temperatureC: Math.round(24 + unit(hash, 7) * 14),
    windKmh: Math.round(6 + unit(hash, 8) * 22),
    cloudCoverPct: Math.round(8 + unit(hash, 9) * 55),
  };

  const alerts = buildAlerts(project, hash, factor);
  const activity = buildActivity(project, hash);

  return { kpis, generationSeries, weather, alerts, activity };
}

function buildAlerts(
  project: ProjectRecord,
  hash: number,
  factor: number,
): OperationalAlert[] {
  if (factor === 0) {
    return [
      {
        id: `${project.id}-offline`,
        severity: "critical",
        title:
          project.status === "on_hold"
            ? "Plant paused — generation offline"
            : "Plant offline after project completion",
        plant: project.name,
        timeAgo: "1 hr ago",
      },
    ];
  }

  const catalog: OperationalAlert[] = [
    {
      id: `${project.id}-a1`,
      severity: "warning",
      title: "Inverter string temperature above threshold",
      plant: project.name,
      timeAgo: "4 min ago",
    },
    {
      id: `${project.id}-a2`,
      severity: "warning",
      title: "Block generation tracking below forecast",
      plant: project.name,
      timeAgo: "18 min ago",
    },
    {
      id: `${project.id}-a3`,
      severity: "info",
      title: "Grid connection stable",
      plant: project.name,
      timeAgo: "32 min ago",
    },
    {
      id: `${project.id}-a4`,
      severity: "info",
      title: "SCADA heartbeat restored",
      plant: project.name,
      timeAgo: "1 hr ago",
    },
  ];

  const count = project.status === "pending" ? 2 : 2 + (hash % 2);
  return catalog.slice(0, count);
}

function buildActivity(project: ProjectRecord, hash: number): ActivityItem[] {
  const hour = 10 + (hash % 4);
  return [
    {
      id: `${project.id}-act1`,
      time: `${hour + 2}:42`,
      description: `Output setpoint updated for ${project.name}`,
    },
    {
      id: `${project.id}-act2`,
      time: `${hour + 2}:31`,
      description: "Generation forecast refreshed",
    },
    {
      id: `${project.id}-act3`,
      time: `${hour + 1}:14`,
      description: "Digital twin model synchronized",
    },
    {
      id: `${project.id}-act4`,
      time: `${hour}:58`,
      description: "SCADA tag mapping verified",
    },
  ];
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
