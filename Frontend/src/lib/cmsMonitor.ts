import type { GenerationPoint, ProjectDashboardPayload } from "@/lib/api";

export type CmsInvStatus = "running" | "error" | "stopped" | "sleep" | "offline";

export type CmsInverterCell = {
  id: string;
  label: string;
  status: CmsInvStatus;
  powerKw: number;
  deviationPct: number;
};

export type CmsPlantRow = {
  id: string;
  name: string;
  prPct: number;
  yieldMwhPerMwp: number;
  exportMwh: number;
  prDeviationPct: number;
  yieldDeviationPct: number;
  importMwh: number;
  insolationKwhM2: number;
  activePowerMw: number;
  acCapMw: number;
  dcCapMwp: number;
  location: string;
  status: CmsInvStatus;
};

export type CmsMetricCard = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  deltaPct: number;
  icon: "zap" | "temp" | "droplet" | "sun" | "gauge" | "activity";
};

function seedHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h || 1;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function round(n: number, d = 2) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function statusFrom(rand: () => number, deviationPct: number): CmsInvStatus {
  const r = rand();
  if (r > 0.94) return "offline";
  if (r > 0.9) return "sleep";
  if (r > 0.86 || deviationPct < -12) return "stopped";
  if (r > 0.8 || deviationPct < -5) return "error";
  return "running";
}

export const CMS_STATUS_META: Record<
  CmsInvStatus,
  { label: string; color: string; legend: string }
> = {
  running: { label: "Running", color: "#3dcf8e", legend: "> -2%" },
  error: { label: "Common Error", color: "#e8a54b", legend: "< 15%" },
  stopped: { label: "Stopped", color: "#e06b75", legend: "> -2 to 5%" },
  sleep: { label: "Sleep", color: "#8b939e", legend: "Sleep" },
  offline: {
    label: "No Recent Communication",
    color: "#4a5562",
    legend: "No Recent Communication",
  },
};

export function buildCmsInverters(
  data: ProjectDashboardPayload,
): CmsInverterCell[] {
  const capacity = Math.max(data.project.capacityMw, 1);
  const count = Math.min(96, Math.max(24, Math.round(capacity * 2.4)));
  const rand = mulberry32(seedHash(`${data.project.id}:inv`));
  const pacMw = data.kpis.currentOutputMw;
  const perKw = (pacMw * 1000) / count;

  return Array.from({ length: count }, (_, i) => {
    const pad = Math.floor(i / 8) + 1;
    const unit = (i % 8) + 1;
    const factor = 0.72 + rand() * 0.4;
    const powerKw = round(perKw * factor, 2);
    const deviationPct = round((factor - 1) * 100, 2);
    const status = statusFrom(rand, deviationPct);
    return {
      id: `is${pad}-inv-${unit}-${i}`,
      label: `IS${pad} INV ${unit}`,
      status: status === "running" && powerKw < 1 ? "sleep" : status,
      powerKw: status === "offline" || status === "sleep" ? 0 : powerKw,
      deviationPct,
    };
  });
}

export function buildCmsPlantRows(
  data: ProjectDashboardPayload,
  exportMwh: number,
  prPct: number,
): CmsPlantRow[] {
  const rand = mulberry32(seedHash(`${data.project.id}:rows`));
  const capacity = data.project.capacityMw;
  const blocks = Math.min(8, Math.max(3, Math.round(capacity / 8)));
  const location = data.project.location.split(",")[0]?.trim() || data.project.location;

  return Array.from({ length: blocks }, (_, i) => {
    const share = 0.7 + rand() * 0.5;
    const blockExport = round((exportMwh / blocks) * share, 2);
    const blockPr = round(prPct * (0.9 + rand() * 0.14), 2);
    const yieldVal = round(blockExport / Math.max(capacity / blocks, 0.1), 2);
    const prDev = round((rand() - 0.55) * 14, 2);
    const yieldDev = round((rand() - 0.4) * 16, 2);
    const status = statusFrom(rand, prDev);
    return {
      id: `block-${i + 1}`,
      name: i === 0 ? data.project.name : `${data.project.name} · B${i + 1}`,
      prPct: blockPr,
      yieldMwhPerMwp: yieldVal,
      exportMwh: blockExport,
      prDeviationPct: prDev,
      yieldDeviationPct: yieldDev,
      importMwh: round(rand() * 0.4, 2),
      insolationKwhM2: round(
        (data.weather.irradianceWm2 / 1000) * (4.8 + rand()),
        2,
      ),
      activePowerMw: round((data.kpis.currentOutputMw / blocks) * share, 2),
      acCapMw: round(capacity / blocks, 2),
      dcCapMwp: round((capacity / blocks) * 1.15, 2),
      location,
      status,
    };
  });
}

export function buildCmsMetricStrip(
  data: ProjectDashboardPayload,
): CmsMetricCard[] {
  const w = data.weather;
  const k = data.kpis;
  return [
    {
      id: "production",
      label: "Daily Production",
      value: k.todayGenerationMwh.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      unit: "MWh",
      deltaPct: round(k.vsForecastPct - 100, 1),
      icon: "zap",
    },
    {
      id: "temp",
      label: "Module Temp",
      value: (w.temperatureC + 8).toFixed(2),
      unit: "°C",
      deltaPct: 3.4,
      icon: "temp",
    },
    {
      id: "humidity",
      label: "Relative Humidity",
      value: String(Math.round(38 + w.cloudCoverPct * 0.2)),
      unit: "%",
      deltaPct: -1.4,
      icon: "droplet",
    },
    {
      id: "ghi",
      label: "GHI",
      value: w.irradianceWm2.toLocaleString("en-US"),
      unit: "W/m²",
      deltaPct: 2.1,
      icon: "sun",
    },
    {
      id: "availability",
      label: "Availability",
      value: k.availabilityPct.toFixed(2),
      unit: "%",
      deltaPct: 1.2,
      icon: "gauge",
    },
    {
      id: "output",
      label: "Active Power",
      value: k.currentOutputMw.toFixed(2),
      unit: "MW",
      deltaPct: round((k.currentOutputMw / Math.max(k.capacityMw, 0.1)) * 10 - 5, 1),
      icon: "activity",
    },
  ];
}

export type ChartSeries = {
  id: string;
  label: string;
  color: string;
  values: number[];
};

export function buildInteractiveSeries(
  generation: GenerationPoint[],
): { hours: string[]; series: ChartSeries[] } {
  const hours = generation.map((g) => `${g.hour}:00`);
  const actual = generation.map((g) => g.actual);
  const forecast = generation.map((g) => g.forecast);
  const target = generation.map((g) => g.target);
  const reactive = generation.map((g) => round(g.actual * 0.18, 2));
  const ghiProxy = generation.map((g) => round(g.forecast * 0.85, 2));

  return {
    hours,
    series: [
      { id: "actual", label: "Active Power", color: "#3b82f6", values: actual },
      { id: "forecast", label: "Forecast", color: "#e6740a", values: forecast },
      { id: "target", label: "Target", color: "#2a9d6e", values: target },
      { id: "reactive", label: "Reactive", color: "#a78bfa", values: reactive },
      { id: "ghi", label: "GHI proxy", color: "#e06b75", values: ghiProxy },
    ],
  };
}
