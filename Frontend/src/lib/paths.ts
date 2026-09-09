export function isProjectPath(pathname: string): boolean {
  return /^\/projects\/(?!new(?:\/|$))[^/]+/.test(pathname);
}

export function projectHomePath(projectId: string): string {
  return `/projects/${projectId}`;
}

export function projectTwinPath(projectId: string): string {
  return `/projects/${projectId}/digital-twin`;
}

export function projectSitemapPath(projectId: string): string {
  return `/projects/${projectId}/sitemap`;
}

export function projectScadaPath(projectId: string): string {
  return `/projects/${projectId}/scada`;
}

export function swapProjectInPath(pathname: string, projectId: string): string {
  return pathname.replace(/^\/projects\/[^/]+/, `/projects/${projectId}`);
}
