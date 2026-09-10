export const AFTER_AUTH_PATH = "/sites";

export function isProjectPath(pathname: string): boolean {
  return /^\/projects\/(?!new(?:\/|$))[^/]+/.test(pathname);
}

export function projectHomePath(projectId: string): string {
  return `/projects/${projectId}`;
}

export function projectTwinPath(projectId: string, assetId?: string | null) {
  const base = `/projects/${projectId}/digital-twin`;
  if (!assetId) return base;
  return `${base}?asset=${encodeURIComponent(assetId)}`;
}

export function projectSitemapPath(projectId: string, assetId?: string | null) {
  const base = `/projects/${projectId}/sitemap`;
  if (!assetId) return base;
  return `${base}?asset=${encodeURIComponent(assetId)}`;
}

export function projectScadaPath(projectId: string): string {
  return `/projects/${projectId}/scada`;
}

export function swapProjectInPath(pathname: string, projectId: string): string {
  return pathname.replace(/^\/projects\/[^/]+/, `/projects/${projectId}`);
}
