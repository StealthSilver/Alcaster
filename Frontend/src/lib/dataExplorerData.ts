import type { ProjectDashboardPayload } from "@/lib/api";
import {
  defaultDataEntryState,
  getProductValues,
  readDataEntryState,
} from "@/lib/dataEntryStore";

export type ExplorerTag = {
  id: string;
  tag: string;
  label: string;
  group: string;
  unit: string;
  quality: "GOOD" | "UNCERTAIN" | "BAD";
};

export type ExplorerSeriesPoint = {
  time: string;
  label: string;
  values: Record<string, number>;
};

export type ExplorerConfig = {
  historian: string;
  retentionDays: number;
  measurementGroups: string[];
  exportFormats: string[];
  catalogReady: boolean;
};

export type QueryResolution = "1m" | "5m" | "15m" | "1h";

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

function round(n: number, d = 2) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function solarEnvelope(hourFrac: number) {
  const noon = 12.5;
  const sigma = 3.2;
  const z = (hourFrac - noon) / sigma;
  const day = Math.exp(-0.5 * z * z);
  if (hourFrac < 5.5 || hourFrac > 19.5) return 0;
  return day;
}

export function readExplorerConfig(
  projectId: string,
  fallbackGroups = "Generation, Irradiance, Inverters, Meteo, Grid",
): ExplorerConfig {
  const values = getProductValues(
    readDataEntryState(projectId) ?? defaultDataEntryState(),
    "data-explorer",
  );
  const groups = (values.measurementGroups || fallbackGroups)
    .split(/[,/\n]+/)
    .map((g) => g.trim())
    .filter(Boolean);

  return {
    historian: values.primaryHistorian?.trim() || "TimescaleDB (demo)",
    retentionDays: Math.max(1, Number(values.retentionDays) || 730),
    measurementGroups: groups.length ? groups : ["Generation", "Meteo"],
    exportFormats: (values.exportFormats || "CSV, JSON")
      .split(/[,]+/)
      .map((f) => f.trim())
      .filter(Boolean),
    catalogReady: (values.dataCatalogReady || "yes").toLowerCase() === "yes",
  };
}

const TAG_TEMPLATES: {
  groupHint: string;
  tags: { tag: string; label: string; unit: string }[];
}[] = [
  {
    groupHint: "generation",
    tags: [
      { tag: "PV.P_AC", label: "Plant AC power", unit: "MW" },
      { tag: "PV.P_DC", label: "Array DC power", unit: "MW" },
      { tag: "GRID.P_EXPORT", label: "Grid export", unit: "MW" },
      { tag: "PV.ENERGY_TODAY", label: "Energy today", unit: "MWh" },
    ],
  },
  {
    groupHint: "irradiance",
    tags: [
      { tag: "MET.GHI", label: "Global irradiance", unit: "W/m²" },
      { tag: "MET.POA", label: "Plane of array", unit: "W/m²" },
      { tag: "MET.DNI", label: "Direct normal", unit: "W/m²" },
    ],
  },
  {
    groupHint: "poa",
    tags: [
      { tag: "MET.POA", label: "Plane of array", unit: "W/m²" },
      { tag: "MET.GHI", label: "Global irradiance", unit: "W/m²" },
    ],
  },
  {
    groupHint: "inverter",
    tags: [
      { tag: "INV.01.P", label: "Inverter 01 power", unit: "kW" },
      { tag: "INV.02.P", label: "Inverter 02 power", unit: "kW" },
      { tag: "INV.EFF", label: "Weighted efficiency", unit: "%" },
      { tag: "INV.TEMP", label: "Inverter cabinet temp", unit: "°C" },
    ],
  },
  {
    groupHint: "tracker",
    tags: [
      { tag: "TRK.ANGLE", label: "Tracker angle", unit: "°" },
      { tag: "TRK.AVAIL", label: "Tracker availability", unit: "%" },
    ],
  },
  {
    groupHint: "meteo",
    tags: [
      { tag: "MET.TEMP", label: "Ambient temperature", unit: "°C" },
      { tag: "MET.WIND", label: "Wind speed", unit: "km/h" },
      { tag: "MET.HUM", label: "Relative humidity", unit: "%" },
      { tag: "MET.CLOUD", label: "Cloud cover", unit: "%" },
    ],
  },
  {
    groupHint: "grid",
    tags: [
      { tag: "GRID.P_EXPORT", label: "Grid export", unit: "MW" },
      { tag: "GRID.FREQ", label: "Grid frequency", unit: "Hz" },
      { tag: "GRID.PF", label: "Power factor", unit: "" },
    ],
  },
  {
    groupHint: "33",
    tags: [
      { tag: "BAY.33.P", label: "33 kV bay power", unit: "MW" },
      { tag: "BAY.33.V", label: "33 kV voltage", unit: "kV" },
    ],
  },
];

function matchTemplates(group: string) {
  const key = group.toLowerCase();
  const hits = TAG_TEMPLATES.filter((t) => key.includes(t.groupHint));
  if (hits.length) return hits.flatMap((h) => h.tags);
  return [
    { tag: `${group.slice(0, 3).toUpperCase()}.VAL`, label: `${group} value`, unit: "" },
  ];
}

export function buildTagCatalog(
  data: ProjectDashboardPayload,
  config: ExplorerConfig,
): ExplorerTag[] {
  const seen = new Set<string>();
  const tags: ExplorerTag[] = [];

  for (const group of config.measurementGroups) {
    for (const t of matchTemplates(group)) {
      if (seen.has(t.tag)) continue;
      seen.add(t.tag);
      tags.push({
        id: t.tag.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        tag: t.tag,
        label: t.label,
        group,
        unit: t.unit,
        quality: "GOOD",
      });
    }
  }

  // Seed a few plant-specific live-ish tags
  const capacity = data.project.capacityMw;
  if (!seen.has("KPI.CAPACITY")) {
    tags.push({
      id: "kpi-capacity",
      tag: "KPI.CAPACITY",
      label: "Nameplate capacity",
      group: config.measurementGroups[0] ?? "Generation",
      unit: "MW",
      quality: "GOOD",
    });
    void capacity;
  }

  return tags;
}

const SERIES_COLORS = [
  "#3b82f6",
  "#e6740a",
  "#2a9d6e",
  "#e06b75",
  "#0ea5b7",
  "#6366f1",
  "#ca8a04",
];

export function seriesColor(index: number) {
  return SERIES_COLORS[index % SERIES_COLORS.length];
}

function resolutionMinutes(res: QueryResolution) {
  if (res === "1m") return 1;
  if (res === "5m") return 5;
  if (res === "15m") return 15;
  return 60;
}

function tagScale(
  tag: ExplorerTag,
  data: ProjectDashboardPayload,
  env: number,
  rand: () => number,
) {
  const capacity = Math.max(data.project.capacityMw, 8);
  const ghi = Math.max(data.weather.irradianceWm2, 700);

  if (tag.unit === "MW") return round(capacity * env * (0.85 + rand() * 0.2), 3);
  if (tag.unit === "kW") return round(capacity * 40 * env * (0.8 + rand() * 0.25), 1);
  if (tag.unit === "W/m²") return round(ghi * 1.15 * env * (0.9 + rand() * 0.12), 0);
  if (tag.unit === "%") {
    if (tag.tag.includes("EFF")) return round(96 + rand() * 2.5, 2);
    if (tag.tag.includes("HUM") || tag.tag.includes("CLOUD"))
      return round(20 + rand() * 60, 0);
    return round(88 + rand() * 10, 1);
  }
  if (tag.unit === "°C")
    return round(data.weather.temperatureC + env * 8 + (rand() - 0.5) * 2, 1);
  if (tag.unit === "km/h")
    return round(data.weather.windKmh * (0.6 + rand() * 0.8), 1);
  if (tag.unit === "Hz") return round(49.95 + rand() * 0.1, 3);
  if (tag.unit === "°") return round(-45 + env * 90 + (rand() - 0.5) * 4, 1);
  if (tag.unit === "kV") return round(32.5 + rand() * 1.2, 2);
  if (tag.unit === "MWh") return round(capacity * env * 4.5, 2);
  return round(env * 100 * (0.5 + rand()), 2);
}

export function buildExplorerSeries(
  data: ProjectDashboardPayload,
  tags: ExplorerTag[],
  start: Date,
  end: Date,
  resolution: QueryResolution,
  refreshKey = 0,
): ExplorerSeriesPoint[] {
  if (tags.length === 0) return [];

  const minutes = resolutionMinutes(resolution);
  const msStep = minutes * 60 * 1000;
  const span = Math.max(end.getTime() - start.getTime(), msStep);
  const maxPoints = resolution === "1m" ? 180 : resolution === "5m" ? 144 : 96;
  const count = Math.min(maxPoints, Math.floor(span / msStep) + 1);
  const seed = hashSeed(
    `${data.project.id}:explorer:${tags.map((t) => t.tag).join(",")}:${refreshKey}:${minutes}`,
  );
  const rand = mulberry32(seed);

  const points: ExplorerSeriesPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = new Date(start.getTime() + i * msStep);
    if (t > end) break;
    const hourFrac = t.getHours() + t.getMinutes() / 60;
    const env = solarEnvelope(hourFrac);
    const values: Record<string, number> = {};
    for (const tag of tags) {
      values[tag.tag] = tagScale(tag, data, env, rand);
    }
    const label = t.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    points.push({ time: t.toISOString(), label, values });
  }
  return points;
}

export type SavedQuery = {
  id: string;
  name: string;
  tags: string[];
  resolution: QueryResolution;
  createdAt: string;
};

const SAVED_KEY = "alcaster.dataExplorer.savedQueries";

export function loadSavedQueries(projectId: string): SavedQuery[] {
  try {
    const raw = localStorage.getItem(`${SAVED_KEY}:${projectId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedQuery[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSavedQueries(projectId: string, queries: SavedQuery[]) {
  localStorage.setItem(`${SAVED_KEY}:${projectId}`, JSON.stringify(queries));
}
