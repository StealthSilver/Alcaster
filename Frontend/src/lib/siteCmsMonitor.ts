/**
 * Site dashboard CMS adapters — reuse plant CMS widgets with site aggregates.
 */

import type {
  DashboardPayload,
  Project,
  ProjectDashboardPayload,
} from "@/lib/api";
import {
  buildCmsInverters,
  buildInteractiveSeries,
  buildCmsMetricStrip,
  type CmsInverterCell,
  type CmsMetricCard,
  type CmsPlantRow,
  type CmsInvStatus,
} from "@/lib/cmsMonitor";

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

function statusFromProject(project: Project): CmsInvStatus {
  if (project.status === "on_hold" || project.status === "completed") {
    return "offline";
  }
  if (project.status === "pending") return "stopped";
  return "running";
}

/** Synthetic plant payload so CMS builders / analytics stay reusable. */
export function siteToProjectDashboardShape(
  data: DashboardPayload,
): ProjectDashboardPayload {
  const site = data.site;
  const mon = data.monitoring ?? {
    kpis: {
      capacityMw: data.kpis.totalCapacityMw,
      currentOutputMw: 0,
      availabilityPct: 0,
      todayGenerationMwh: 0,
      vsForecastPct: 0,
    },
    generationSeries: [] as ProjectDashboardPayload["generationSeries"],
    weather: {
      irradianceWm2: 0,
      temperatureC: 0,
      windKmh: 0,
      cloudCoverPct: 0,
    },
    alerts: [] as ProjectDashboardPayload["alerts"],
    activity: [] as ProjectDashboardPayload["activity"],
    plants: [],
  };
  const syntheticProject: Project = {
    id: site?.id ?? "site",
    organizationId: data.organization.id,
    siteId: site?.id ?? "",
    siteName: site?.name ?? "Site",
    name: site?.name ?? "Site dashboard",
    location: site?.address ?? "",
    type: site?.type === "wind" || site?.type === "bess" || site?.type === "hybrid"
      ? site.type
      : "solar",
    status: site?.status === "active" ? "active" : "on_hold",
    capacityMw: mon.kpis.capacityMw,
    description: "",
    createdBy: site?.createdBy ?? "",
    createdAt: site?.createdAt ?? new Date().toISOString(),
    updatedAt: site?.updatedAt ?? new Date().toISOString(),
  };

  return {
    organization: data.organization,
    project: syntheticProject,
    dateLabel: data.dateLabel,
    kpis: mon.kpis,
    generationSeries: mon.generationSeries,
    weather: mon.weather,
    alerts: mon.alerts,
    activity: mon.activity,
    recentTasks: data.recentTasks,
  };
}

export function buildSiteMetricStrip(data: DashboardPayload): CmsMetricCard[] {
  return buildCmsMetricStrip(siteToProjectDashboardShape(data));
}

export function buildSiteInteractiveSeries(data: DashboardPayload) {
  const series = data.monitoring?.generationSeries ?? [];
  return buildInteractiveSeries(series);
}

/** Heatmap cells — one (or a few) per plant for site overview. */
export function buildSitePlantHeatCells(
  data: DashboardPayload,
): CmsInverterCell[] {
  const plants = data.monitoring?.plants ?? [];
  if (plants.length === 0) {
    return buildCmsInverters(siteToProjectDashboardShape(data)).slice(0, 24);
  }

  const cells: CmsInverterCell[] = [];
  for (const entry of plants) {
    const rand = mulberry32(seedHash(`${entry.project.id}:heat`));
    const units = Math.min(
      12,
      Math.max(4, Math.round(entry.project.capacityMw / 2)),
    );
    const perKw = (entry.kpis.currentOutputMw * 1000) / units;
    const baseStatus = statusFromProject(entry.project);
    for (let i = 0; i < units; i += 1) {
      const factor = 0.75 + rand() * 0.35;
      const powerKw =
        baseStatus === "offline" || baseStatus === "stopped"
          ? 0
          : round(perKw * factor, 2);
      const deviationPct = round((factor - 1) * 100, 2);
      let status = baseStatus;
      if (status === "running") {
        const r = rand();
        if (r > 0.92) status = "error";
        else if (powerKw < 1) status = "sleep";
      }
      cells.push({
        id: `${entry.project.id}-u${i}`,
        label: `${entry.project.name.slice(0, 10)} · U${i + 1}`,
        status,
        powerKw,
        deviationPct,
      });
    }
  }
  return cells;
}

/** Grid rows — one row per real plant at the site. */
export function buildSitePlantRows(
  data: DashboardPayload,
  siteExportMwh: number,
  sitePrPct: number,
): CmsPlantRow[] {
  const plants = data.monitoring?.plants ?? [];
  if (plants.length === 0) return [];

  const capacity = Math.max(data.monitoring?.kpis.capacityMw ?? 0.1, 0.1);
  const rand = mulberry32(seedHash(`${data.site?.id ?? "site"}:rows`));
  const irradiance = data.monitoring?.weather.irradianceWm2 ?? 0;
  const todayMwh = data.monitoring?.kpis.todayGenerationMwh ?? 0;

  return plants.map((entry) => {
    const share = entry.kpis.capacityMw / capacity;
    const exportMwh = round((siteExportMwh || todayMwh) * share, 2);
    const prPct = round(sitePrPct * (0.92 + rand() * 0.12), 2);
    const yieldVal = round(
      exportMwh / Math.max(entry.kpis.capacityMw, 0.1),
      2,
    );
    const prDev = round((rand() - 0.5) * 10, 2);
    const yieldDev = round((rand() - 0.45) * 12, 2);
    const location =
      entry.project.location.split(",")[0]?.trim() || entry.project.location;

    return {
      id: entry.project.id,
      name: entry.project.name,
      prPct,
      yieldMwhPerMwp: yieldVal,
      exportMwh,
      prDeviationPct: prDev,
      yieldDeviationPct: yieldDev,
      importMwh: round(rand() * 0.35, 2),
      insolationKwhM2: round((irradiance / 1000) * (4.5 + rand()), 2),
      activePowerMw: round(entry.kpis.currentOutputMw, 2),
      acCapMw: round(entry.kpis.capacityMw, 2),
      dcCapMwp: round(entry.kpis.capacityMw * 1.15, 2),
      location,
      status: statusFromProject(entry.project),
    };
  });
}
