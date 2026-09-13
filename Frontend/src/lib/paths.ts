export const AFTER_AUTH_PATH = "/sites";

export function isProjectPath(pathname: string): boolean {
  return /^\/projects\/(?!new(?:\/|$))[^/]+/.test(pathname);
}

export function projectHomePath(projectId: string): string {
  return `/projects/${projectId}`;
}

export function projectTwinPath(
  projectId: string,
  assetId?: string | null,
  historyIso?: string | null,
) {
  const base = `/projects/${projectId}/digital-twin`;
  const params = new URLSearchParams();
  if (assetId) params.set("asset", assetId);
  if (historyIso) params.set("history", historyIso);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function projectSitemapPath(projectId: string, assetId?: string | null) {
  const base = `/projects/${projectId}/sitemap`;
  if (!assetId) return base;
  return `${base}?asset=${encodeURIComponent(assetId)}`;
}

export function projectScadaPath(projectId: string): string {
  return `/projects/${projectId}/scada`;
}

export function projectAlertsPath(projectId: string): string {
  return `/projects/${projectId}/alerts`;
}

export function projectEventsPath(projectId: string): string {
  return `/projects/${projectId}/events`;
}

export function projectDataEntryPath(projectId: string): string {
  return `/projects/${projectId}/data-entry`;
}

export function projectPortfolioPath(projectId: string): string {
  return `/projects/${projectId}/portfolio`;
}

export function projectKpiPath(projectId: string): string {
  return `/projects/${projectId}/kpi`;
}

export function projectPerformancePath(projectId: string): string {
  return `/projects/${projectId}/performance`;
}

export function projectForecastingPath(projectId: string): string {
  return `/projects/${projectId}/forecasting`;
}

export function projectCmmsPath(projectId: string): string {
  return `/projects/${projectId}/cmms`;
}

export function projectEmsPath(projectId: string): string {
  return `/projects/${projectId}/ems`;
}

export function projectRuleEnginePath(projectId: string): string {
  return `/projects/${projectId}/rule-engine`;
}

export function projectDataExplorerPath(projectId: string): string {
  return `/projects/${projectId}/data-explorer`;
}

export function projectAssetTwinPath(projectId: string): string {
  return `/projects/${projectId}/asset-twin`;
}

export function swapProjectInPath(pathname: string, projectId: string): string {
  return pathname.replace(/^\/projects\/[^/]+/, `/projects/${projectId}`);
}
