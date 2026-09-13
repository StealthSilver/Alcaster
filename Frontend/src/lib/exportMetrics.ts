import type { GenerationPoint, ProjectDashboardKpis } from "@/lib/api";

export type ExportPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type ExportPeriodMetrics = {
  period: ExportPeriod;
  label: string;
  currentMwh: number;
  expectedMwh: number;
  deltaPct: number;
  revenueMillionInr: number;
  co2TonsPrevented: number;
  yieldMwhPerMwp: number;
  cufPct: number;
  prPct: number;
  sparkline: number[];
};

export type KpiGaugeMetric = {
  id: "pr" | "energy" | "pa" | "cuf";
  label: string;
  unit: string;
  planned: number;
  actual: number;
  attainmentPct: number;
  color: string;
};

export type KpiSeriesPoint = {
  label: string;
  energyMwh: number;
  prPct: number;
  paPct: number;
  cufPct: number;
};

export type PerformanceCell = {
  id: string;
  region: string;
  block: string;
  energyMwh: number;
  cufPct: number;
  paPct: number;
  gaPct: number;
  prPct: number;
  yieldMwhPerMwp: number;
};

export type PerformanceGridData = {
  cells: PerformanceCell[];
  rows: string[];
  cols: string[];
  medianPr: number;
};

const INR_PER_MWH = 4500;
const CO2_TONS_PER_MWH = 0.7;
const HOURS_IN_DAY = 24;

function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function seedFrom(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
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

function sparkFrom(
  base: number,
  points: number,
  rand: () => number,
  variance = 0.12,
): number[] {
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < points; i += 1) {
    const drift = 1 + (rand() - 0.48) * variance;
    v = Math.max(0, v * drift);
    out.push(round(v, 3));
  }
  return out;
}

export type ExportMetricsInput = {
  plantName: string;
  capacityMw: number;
  kpis: ProjectDashboardKpis;
  generationSeries?: GenerationPoint[];
  expectedAnnualMwh?: number | null;
  prTargetPct?: number | null;
};

function resolveExpectedAnnual(input: ExportMetricsInput): number {
  if (input.expectedAnnualMwh && input.expectedAnnualMwh > 0) {
    return input.expectedAnnualMwh;
  }
  // ~1600 MWh/MWp/yr typical for utility solar in India demo context
  return round(input.capacityMw * 1600, 0);
}

/**
 * Derive portfolio export cards + KPI / performance-grid demo series from
 * live plant KPIs and optional CMS intake targets.
 */
export function buildExportMetrics(
  input: ExportMetricsInput,
): ExportPeriodMetrics[] {
  const capacity = Math.max(input.capacityMw, 0.1);
  const expectedAnnual = resolveExpectedAnnual(input);
  const prTarget = input.prTargetPct && input.prTargetPct > 0 ? input.prTargetPct : 82;
  const today = Math.max(input.kpis.todayGenerationMwh, 0);
  const vsForecast = input.kpis.vsForecastPct || 100;
  const rand = mulberry32(seedFrom(input.plantName));

  const dailyExpected = round(expectedAnnual / 365, 2);
  const dailyCurrent =
    today > 0
      ? round(today, 2)
      : round(dailyExpected * (vsForecast / 100), 2);

  const weeklyExpected = round(dailyExpected * 7, 2);
  const weeklyCurrent = round(dailyCurrent * (5.8 + rand() * 1.4), 2);

  const monthlyExpected = round(dailyExpected * 30, 2);
  const monthlyCurrent = round(dailyCurrent * (24 + rand() * 6), 2);

  const yearlyExpected = round(expectedAnnual, 2);
  // YTD: scale from day-of-year approximation (~70% through year for demo feel)
  const dayOfYear = 255;
  const yearlyCurrent = round(
    dailyCurrent * dayOfYear * (0.92 + rand() * 0.1),
    2,
  );

  const prFrom = (ratio: number) =>
    round(clamp(prTarget * ratio, 55, 99), 2);

  const periods: Array<{
    period: ExportPeriod;
    label: string;
    current: number;
    expected: number;
    sparkPoints: number;
    prRatio: number;
  }> = [
    {
      period: "daily",
      label: "Daily Export",
      current: dailyCurrent,
      expected: dailyExpected,
      sparkPoints: 12,
      prRatio: vsForecast / 100,
    },
    {
      period: "weekly",
      label: "Weekly Export",
      current: weeklyCurrent,
      expected: weeklyExpected,
      sparkPoints: 7,
      prRatio: 0.98 + (rand() - 0.5) * 0.06,
    },
    {
      period: "monthly",
      label: "Monthly Export",
      current: monthlyCurrent,
      expected: monthlyExpected,
      sparkPoints: 14,
      prRatio: 0.97 + (rand() - 0.5) * 0.05,
    },
    {
      period: "yearly",
      label: "Yearly Export",
      current: yearlyCurrent,
      expected: yearlyExpected,
      sparkPoints: 12,
      prRatio: 0.96 + (rand() - 0.5) * 0.05,
    },
  ];

  return periods.map((p) => {
    const deltaPct =
      p.expected > 0
        ? round(((p.current - p.expected) / p.expected) * 100, 2)
        : 0;
    const periodDays =
      p.period === "daily"
        ? 1
        : p.period === "weekly"
          ? 7
          : p.period === "monthly"
            ? 30
            : dayOfYear;
    const yieldMwhPerMwp = round(p.current / capacity, 2);
    const displayYield =
      p.period === "daily"
        ? yieldMwhPerMwp
        : round(yieldMwhPerMwp / periodDays, 2);

    const peakSunHours = 5.2 * periodDays;
    const opsCuf = round(
      clamp((p.current / (capacity * peakSunHours)) * 100, 0, 100),
      2,
    );

    return {
      period: p.period,
      label: p.label,
      currentMwh: p.current,
      expectedMwh: p.expected,
      deltaPct,
      revenueMillionInr: round((p.current * INR_PER_MWH) / 1_000_000, 2),
      co2TonsPrevented: round(p.current * CO2_TONS_PER_MWH, 2),
      yieldMwhPerMwp: displayYield,
      cufPct: opsCuf,
      prPct: prFrom(p.prRatio),
      sparkline:
        input.generationSeries && p.period === "daily"
          ? input.generationSeries.map((g) => g.actual)
          : sparkFrom(p.current / p.sparkPoints, p.sparkPoints, rand),
    };
  });
}

export function buildKpiAnalytics(input: ExportMetricsInput): {
  gauges: KpiGaugeMetric[];
  series: KpiSeriesPoint[];
} {
  const metrics = buildExportMetrics(input);
  const daily = metrics[0];
  const prTarget = input.prTargetPct && input.prTargetPct > 0 ? input.prTargetPct : 82;
  const availability = input.kpis.availabilityPct || 95;
  const capacity = Math.max(input.capacityMw, 0.1);
  const rand = mulberry32(seedFrom(`${input.plantName}:kpi`));

  const energyPlanned = daily.expectedMwh;
  const energyActual = daily.currentMwh;
  const prActual = daily.prPct;
  const paPlanned = round(clamp(availability + 1.2, 90, 99.5), 2);
  const paActual = round(clamp(availability - 0.4 + rand() * 0.8, 88, 99), 2);
  const cufPlanned = round(daily.cufPct * 1.01, 2);
  const cufActual = daily.cufPct;

  const gauges: KpiGaugeMetric[] = [
    {
      id: "pr",
      label: "PR",
      unit: "%",
      planned: prTarget,
      actual: prActual,
      attainmentPct: round(clamp((prActual / prTarget) * 100, 0, 120), 1),
      color: "#3b82f6",
    },
    {
      id: "energy",
      label: "Energy",
      unit: "MWh",
      planned: energyPlanned,
      actual: energyActual,
      attainmentPct: round(
        clamp((energyActual / Math.max(energyPlanned, 0.01)) * 100, 0, 120),
        1,
      ),
      color: "#e6740a",
    },
    {
      id: "pa",
      label: "PA",
      unit: "%",
      planned: paPlanned,
      actual: paActual,
      attainmentPct: round(clamp((paActual / paPlanned) * 100, 0, 120), 1),
      color: "#2a9d6e",
    },
    {
      id: "cuf",
      label: "CUF",
      unit: "%",
      planned: cufPlanned,
      actual: cufActual,
      attainmentPct: round(
        clamp((cufActual / Math.max(cufPlanned, 0.01)) * 100, 0, 120),
        1,
      ),
      color: "#0ea5b7",
    },
  ];

  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const series: KpiSeriesPoint[] = labels.map((label, i) => {
    const factor = 0.75 + rand() * 0.35 + (i === 6 ? -0.15 : 0);
    const energy = round((energyActual / 7) * factor * 1.8, 2);
    return {
      label,
      energyMwh: energy,
      prPct: round(prActual * (0.94 + rand() * 0.1), 1),
      paPct: round(paActual * (0.97 + rand() * 0.04), 1),
      cufPct: round(
        ((energy / capacity / HOURS_IN_DAY) * 100) * (0.9 + rand() * 0.15),
        1,
      ),
    };
  });

  return { gauges, series };
}

export function buildPerformanceGrid(
  input: ExportMetricsInput,
): PerformanceGridData {
  const capacity = Math.max(input.capacityMw, 0.1);
  const metrics = buildExportMetrics(input);
  const daily = metrics[0];
  const rand = mulberry32(seedFrom(`${input.plantName}:grid`));

  const rows = ["North", "Central", "South"];
  const cols = ["Block A", "Block B", "Block C", "Block D"];
  const cells: PerformanceCell[] = [];

  for (const region of rows) {
    for (const block of cols) {
      const share = 0.18 + rand() * 0.12;
      const energy = round(daily.currentMwh * share, 2);
      const pr = round(daily.prPct * (0.9 + rand() * 0.14), 2);
      const cuf = round(daily.cufPct * (0.88 + rand() * 0.16), 2);
      const pa = round(
        (input.kpis.availabilityPct || 95) * (0.94 + rand() * 0.08),
        2,
      );
      const ga = round(pa * (0.92 + rand() * 0.06), 2);
      cells.push({
        id: `${region}-${block}`,
        region,
        block,
        energyMwh: energy,
        cufPct: clamp(cuf, 40, 99),
        paPct: clamp(pa, 70, 99.5),
        gaPct: clamp(ga, 65, 99),
        prPct: clamp(pr, 55, 98),
        yieldMwhPerMwp: round(energy / (capacity / cols.length), 2),
      });
    }
  }

  const sortedPr = [...cells].map((c) => c.prPct).sort((a, b) => a - b);
  const medianPr = sortedPr[Math.floor(sortedPr.length / 2)] ?? daily.prPct;

  return { cells, rows, cols, medianPr };
}
