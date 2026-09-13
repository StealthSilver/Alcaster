import type { ProjectDashboardPayload, WeatherConditions } from "@/lib/api";

export type ForecastSeriesId =
  | "dtScheduled"
  | "forecast"
  | "forecastR1"
  | "forecastR2"
  | "forecastR3"
  | "forecastImplemented"
  | "actual"
  | "irradiance"
  | "digitalTwin";

export type ForecastSeriesMeta = {
  id: ForecastSeriesId;
  label: string;
  color: string;
  /** Right Y-axis (W/m²); others use left MW axis */
  axis: "mw" | "irr";
};

export const FORECAST_SERIES: ForecastSeriesMeta[] = [
  { id: "dtScheduled", label: "DT Scheduled Power", color: "#3b82f6", axis: "mw" },
  { id: "forecast", label: "Forecasted Generation", color: "#e6740a", axis: "mw" },
  { id: "forecastR1", label: "Forecasted Generation R1", color: "#e06b75", axis: "mw" },
  { id: "forecastR2", label: "Forecasted Generation R2", color: "#c45c26", axis: "mw" },
  { id: "forecastR3", label: "Forecasted Generation R3", color: "#2563eb", axis: "mw" },
  {
    id: "forecastImplemented",
    label: "Forecasted Generation Implemented",
    color: "#2a9d6e",
    axis: "mw",
  },
  { id: "actual", label: "Actual Generation", color: "#0ea5b7", axis: "mw" },
  { id: "irradiance", label: "Irradiance (W/m²)", color: "#16a34a", axis: "irr" },
  { id: "digitalTwin", label: "Digital Twin", color: "#6366f1", axis: "mw" },
];

export type ForecastPoint = {
  time: string;
  label: string;
  dtScheduled: number;
  forecast: number;
  forecastR1: number;
  forecastR2: number;
  forecastR3: number;
  forecastImplemented: number;
  actual: number;
  irradiance: number;
  digitalTwin: number;
  bandLow: number;
  bandHigh: number;
};

export type WeatherParamPoint = {
  time: string;
  label: string;
  ghi: number;
  poa: number;
  temperatureC: number;
  windKmh: number;
  humidityPct: number;
  cloudCoverPct: number;
};

export type ForecastSummary = {
  peakMw: number;
  energyMwh: number;
  vsActualPct: number;
  peakIrradiance: number;
  scheduleCompliancePct: number;
  twinDeltaMw: number;
};

function round(n: number, d = 2) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** Smooth daylight bell (0 at night, 1 at solar noon). */
function solarEnvelope(hourFrac: number) {
  const noon = 12.5;
  const sigma = 3.2;
  const z = (hourFrac - noon) / sigma;
  const day = Math.exp(-0.5 * z * z);
  if (hourFrac < 5.5 || hourFrac > 19.5) return 0;
  return day;
}

function hashSeed(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function formatStamp(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}:${mi}`;
}

function formatShort(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}:${mi}`;
}

/** Visible chart window: 24h at 30-minute resolution. */
export const FORECAST_VIEW_POINTS = 48;

const STEP_MS = 30 * 60 * 1000;
const MIN_POINTS = FORECAST_VIEW_POINTS;
const MAX_POINTS = 14 * 48; // 14 days

/** Resolve half-hour series bounds from a date range (min 24h, max 14d). */
export function resolveForecastWindow(rangeStart: Date, rangeEnd: Date) {
  const from = new Date(rangeStart);
  from.setHours(0, 0, 0, 0);
  const to = new Date(rangeEnd);
  to.setHours(23, 30, 0, 0);

  let steps = Math.floor((to.getTime() - from.getTime()) / STEP_MS) + 1;
  if (steps < MIN_POINTS) {
    from.setTime(to.getTime() - (MIN_POINTS - 1) * STEP_MS);
    steps = MIN_POINTS;
  }
  if (steps > MAX_POINTS) {
    from.setTime(to.getTime() - (MAX_POINTS - 1) * STEP_MS);
    steps = MAX_POINTS;
  }
  return { from, to, steps };
}

/**
 * Build half-hourly forecast curves across a date range,
 * seeded from plant capacity + weather so refresh wobbles stay coherent.
 */
export function buildForecastSeries(
  data: ProjectDashboardPayload,
  rangeStart: Date,
  rangeEnd: Date,
  refreshKey = 0,
): ForecastPoint[] {
  const capacity = Math.max(data.project.capacityMw || 25, 8);
  const peakMw = capacity * 1.05;
  const peakIrr = Math.max(data.weather.irradianceWm2, 900) * 1.25;
  const { from, steps } = resolveForecastWindow(rangeStart, rangeEnd);
  const seed = hashSeed(
    `${data.project.id}:${formatDateKey(from)}:${formatDateKey(rangeEnd)}:${refreshKey}`,
  );
  const rand = mulberry32(seed);

  const points: ForecastPoint[] = [];

  for (let i = 0; i < steps; i++) {
    const t = new Date(from.getTime() + i * STEP_MS);
    const hourFrac = t.getHours() + t.getMinutes() / 60;
    const env = solarEnvelope(hourFrac);
    const cloudDip = 1 - (data.weather.cloudCoverPct / 100) * 0.18;
    const dayJitter = 1 + Math.sin(i * 0.11 + refreshKey) * 0.02;
    const wobble = 1 + (rand() - 0.5) * 0.06;

    const base = peakMw * env * cloudDip * wobble * dayJitter;
    const irr = round(peakIrr * env * (0.92 + rand() * 0.1), 0);

    const forecast = round(base * (0.98 + rand() * 0.04), 2);
    const r1 = round(forecast * (0.94 + rand() * 0.05), 2);
    const r2 = round(forecast * (1.02 + rand() * 0.04), 2);
    const r3 = round(forecast * (0.97 + rand() * 0.06), 2);
    const implemented = round(forecast * (0.72 + rand() * 0.08), 2);
    const actual = round(forecast * (0.95 + (rand() - 0.5) * 0.12), 2);
    const dtScheduled = round(forecast * (0.99 + (rand() - 0.5) * 0.04), 2);
    const digitalTwin = round(forecast * (0.96 + (rand() - 0.5) * 0.08), 2);

    const spread = Math.max(forecast * 0.12, 0.8);
    const bandLow = round(Math.max(0, Math.min(r1, implemented, actual) - spread * 0.3), 2);
    const bandHigh = round(Math.max(r2, forecast, dtScheduled) + spread * 0.35, 2);

    points.push({
      time: t.toISOString(),
      label: formatShort(t),
      dtScheduled,
      forecast,
      forecastR1: r1,
      forecastR2: r2,
      forecastR3: r3,
      forecastImplemented: implemented,
      actual,
      irradiance: irr,
      digitalTwin,
      bandLow,
      bandHigh,
    });
  }

  return points;
}

export function buildWeatherParamSeries(
  data: ProjectDashboardPayload,
  rangeStart: Date,
  rangeEnd: Date,
  refreshKey = 0,
): WeatherParamPoint[] {
  const { from, steps } = resolveForecastWindow(rangeStart, rangeEnd);
  const seed = hashSeed(
    `wx:${data.project.id}:${formatDateKey(from)}:${formatDateKey(rangeEnd)}:${refreshKey}`,
  );
  const rand = mulberry32(seed);
  const base = data.weather;

  const points: WeatherParamPoint[] = [];
  for (let i = 0; i < steps; i++) {
    const t = new Date(from.getTime() + i * STEP_MS);
    const hourFrac = t.getHours() + t.getMinutes() / 60;
    const env = solarEnvelope(hourFrac);
    const nightCool = hourFrac < 7 || hourFrac > 19;

    const ghi = round(Math.max(base.irradianceWm2, 850) * 1.2 * env * (0.9 + rand() * 0.12), 0);
    const poa = round(ghi * (1.05 + rand() * 0.08), 0);
    const temperatureC = round(
      base.temperatureC +
        (nightCool ? -4 : 6) * env +
        (rand() - 0.5) * 1.5,
      1,
    );
    const windKmh = round(
      clamp(base.windKmh * (0.7 + rand() * 0.8) + env * 4, 0, 45),
      1,
    );
    const humidityPct = round(
      clamp(55 + (nightCool ? 20 : -10) + (rand() - 0.5) * 12, 15, 95),
      0,
    );
    const cloudCoverPct = round(
      clamp(
        base.cloudCoverPct + (rand() - 0.5) * 25 - env * 10,
        0,
        100,
      ),
      0,
    );

    points.push({
      time: t.toISOString(),
      label: formatStamp(t),
      ghi,
      poa,
      temperatureC,
      windKmh,
      humidityPct,
      cloudCoverPct,
    });
  }
  return points;
}

export function summarizeForecast(points: ForecastPoint[]): ForecastSummary {
  const peakMw = round(Math.max(...points.map((p) => p.actual), 0), 2);
  const energyMwh = round(
    points.reduce((s, p) => s + p.actual, 0) * 0.5,
    1,
  );
  const sumF = points.reduce((s, p) => s + p.forecast, 0) || 1;
  const sumA = points.reduce((s, p) => s + p.actual, 0);
  const vsActualPct = round(((sumA - sumF) / sumF) * 100, 1);
  const peakIrradiance = Math.max(...points.map((p) => p.irradiance), 0);
  const scheduleCompliancePct = round(
    100 -
      (points.reduce(
        (s, p) => s + Math.abs(p.dtScheduled - p.actual),
        0,
      ) /
        (sumF || 1)) *
        40,
    1,
  );
  const twinDeltaMw = round(
    points.reduce((s, p) => s + (p.digitalTwin - p.actual), 0) / points.length,
    2,
  );
  return {
    peakMw,
    energyMwh,
    vsActualPct,
    peakIrradiance,
    scheduleCompliancePct: clamp(scheduleCompliancePct, 70, 99.5),
    twinDeltaMw,
  };
}

export function weatherSnapshotFromSeries(
  series: WeatherParamPoint[],
  fallback: WeatherConditions,
): WeatherConditions {
  const latest =
    [...series].reverse().find((p) => p.ghi > 50) ?? series[series.length - 1];
  if (!latest) return fallback;
  return {
    irradianceWm2: latest.ghi,
    temperatureC: latest.temperatureC,
    windKmh: latest.windKmh,
    cloudCoverPct: latest.cloudCoverPct,
  };
}

export function formatDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function plantCodeFromName(name: string) {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 18) || "DEMO-SOLAR-01";
}
