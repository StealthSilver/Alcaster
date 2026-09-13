import type { ProjectDashboardPayload } from "@/lib/api";
import { daysBetween, type DateRangeValue } from "@/lib/chartActions";

export type KpiIndexMetricId =
  | "pr"
  | "energy"
  | "pa"
  | "cuf"
  | "irradiance"
  | "yield";

export type KpiDayRow = {
  date: Date;
  label: string;
  pr: { planned: number; actual: number };
  energy: { planned: number; actual: number };
  pa: { planned: number; actual: number };
  cuf: { planned: number; actual: number };
  irradiance: { planned: number; actual: number };
  yield: { planned: number; actual: number };
};

export type KpiGaugeCard = {
  id: KpiIndexMetricId;
  label: string;
  unit: string;
  color: string;
  planned: number;
  actual: number;
  attainmentPct: number;
};

export const KPI_METRIC_META: Record<
  KpiIndexMetricId,
  { label: string; unit: string; color: string }
> = {
  pr: { label: "PR", unit: "%", color: "#3b82f6" },
  energy: { label: "Energy", unit: "MWh", color: "#e6740a" },
  pa: { label: "PA", unit: "%", color: "#2a9d6e" },
  cuf: { label: "CUF", unit: "%", color: "#0ea5b7" },
  irradiance: { label: "Irradiance", unit: "kWh/m²", color: "#e06b75" },
  yield: { label: "Yield", unit: "MWh/MWp", color: "#c45c26" },
};

function seedHash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h || 1;
}

function mulberry32(a: number) {
  return () => {
    a += 0x6d2b79f5;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round(n: number, d = 2) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function buildKpiIndexSeries(
  data: ProjectDashboardPayload,
  range: DateRangeValue,
  prTarget = 82,
): KpiDayRow[] {
  const days = Math.min(21, Math.max(7, daysBetween(range.start, range.end) + 1));
  const rand = mulberry32(seedHash(`${data.project.id}:kpi-index:${days}`));
  const capacity = Math.max(data.project.capacityMw, 0.1);
  const baseEnergy = Math.max(data.kpis.todayGenerationMwh, capacity * 3.5);
  const availability = data.kpis.availabilityPct || 95;
  const ghiDay = Math.max(data.weather.irradianceWm2 / 1000, 4) * 5.2;

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(range.end);
    date.setDate(range.end.getDate() - (days - 1 - i));
    const weather = 0.82 + rand() * 0.28;
    const energyPlanned = round(baseEnergy * (0.9 + rand() * 0.2), 2);
    const energyActual = round(energyPlanned * weather * (0.92 + rand() * 0.08), 2);
    const prPlanned = round(prTarget * (0.98 + rand() * 0.03), 2);
    const prActual = round(prPlanned * (0.94 + rand() * 0.08), 2);
    const paPlanned = round(clamp(availability + 1, 90, 99.5), 2);
    const paActual = round(clamp(paPlanned * (0.97 + rand() * 0.04), 85, 99.5), 2);
    const irrPlanned = round(ghiDay * (0.95 + rand() * 0.1), 2);
    const irrActual = round(irrPlanned * weather, 2);
    const yieldPlanned = round(energyPlanned / capacity, 2);
    const yieldActual = round(energyActual / capacity, 2);
    const cufPlanned = round(clamp((energyPlanned / (capacity * 5.2)) * 100, 10, 99), 2);
    const cufActual = round(clamp((energyActual / (capacity * 5.2)) * 100, 10, 99), 2);

    return {
      date,
      label: date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      pr: { planned: prPlanned, actual: prActual },
      energy: { planned: energyPlanned, actual: energyActual },
      pa: { planned: paPlanned, actual: paActual },
      cuf: { planned: cufPlanned, actual: cufActual },
      irradiance: { planned: irrPlanned, actual: irrActual },
      yield: { planned: yieldPlanned, actual: yieldActual },
    };
  });
}

export function buildKpiGauges(rows: KpiDayRow[]): KpiGaugeCard[] {
  if (rows.length === 0) return [];
  const avg = (pick: (r: KpiDayRow) => { planned: number; actual: number }) => {
    const planned = rows.reduce((s, r) => s + pick(r).planned, 0) / rows.length;
    const actual = rows.reduce((s, r) => s + pick(r).actual, 0) / rows.length;
    return { planned: round(planned, 2), actual: round(actual, 2) };
  };

  const defs: KpiIndexMetricId[] = [
    "pr",
    "energy",
    "pa",
    "cuf",
    "irradiance",
    "yield",
  ];

  return defs.map((id) => {
    const meta = KPI_METRIC_META[id];
    const { planned, actual } = avg((r) => r[id]);
    return {
      id,
      label: meta.label,
      unit: meta.unit,
      color: meta.color,
      planned,
      actual,
      attainmentPct: round(clamp((actual / Math.max(planned, 0.01)) * 100, 0, 120), 2),
    };
  });
}

export type PerformanceSideMetric = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};

export type RadialKpi = {
  id: string;
  label: string;
  value: number;
  color: string;
};

export type PowerIrrPoint = {
  hour: string;
  expectedKw: number;
  inverterKw: number;
  gridKw: number;
  irradiance: number;
};

export function buildPerformanceSideMetrics(
  data: ProjectDashboardPayload,
  inverterCount: number,
  runningCount: number,
): PerformanceSideMetric[] {
  const irr =
    (data.weather.irradianceWm2 / 1000) * 5.2 * Math.max(data.project.capacityMw, 1);
  return [
    {
      id: "import",
      label: "Import Energy",
      value: `${(data.kpis.todayGenerationMwh * 0.01).toFixed(2)} MWh`,
    },
    {
      id: "inverter-energy",
      label: "Energy at Inverters",
      value: `${data.kpis.todayGenerationMwh.toFixed(2)} MWh`,
    },
    {
      id: "irradiance",
      label: "Irradiance",
      value: `${irr.toLocaleString("en-US", { maximumFractionDigits: 2 })} kWh/m²`,
    },
    {
      id: "active-inv",
      label: "Active Inverter",
      value: `${runningCount}/${inverterCount}`,
      hint: "Pads reporting RUN",
    },
  ];
}

export function buildPowerVsIrradiation(
  data: ProjectDashboardPayload,
): PowerIrrPoint[] {
  return data.generationSeries.map((p) => ({
    hour: `${p.hour}:00`,
    expectedKw: round(p.forecast * 1000, 1),
    inverterKw: round(p.actual * 1000, 1),
    gridKw: round(p.actual * 980, 1),
    irradiance: round(data.weather.irradianceWm2 * (p.forecast / Math.max(...data.generationSeries.map((g) => g.forecast), 1)), 0),
  }));
}

export function buildRadialKpis(
  data: ProjectDashboardPayload,
  prPct: number,
): RadialKpi[] {
  const pa = data.kpis.availabilityPct;
  const cuf = clamp((data.kpis.todayGenerationMwh / Math.max(data.project.capacityMw * 5.2, 0.1)) * 100, 0, 100);
  const ga = clamp(pa * 0.96, 0, 100);
  return [
    { id: "pr", label: "PR", value: round(prPct, 2), color: "#3b82f6" },
    { id: "pa", label: "PA", value: round(pa, 2), color: "#e6740a" },
    { id: "ga", label: "GA", value: round(ga, 2), color: "#2a9d6e" },
    { id: "wpr", label: "WPR", value: 0, color: "#0ea5b7" },
    { id: "cuf", label: "CUF", value: round(cuf, 2), color: "#e06b75" },
  ];
}
