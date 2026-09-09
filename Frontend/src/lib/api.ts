export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  organizationId: string | null;
  organizationName: string | null;
};

export type RequestAccessPayload = {
  fullName: string;
  email: string;
  company: string;
  message: string;
};

export type FieldErrors = Partial<Record<string, string>>;

export class ApiError extends Error {
  readonly status: number;
  readonly fields: FieldErrors;

  constructor(message: string, status: number, fields: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

// Local `vite` always uses the /api proxy in vite.config.ts (localhost:4000).
// Production builds still honor VITE_API_URL (e.g. Render).
const API_BASE = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL ?? "");

type ErrorBody = {
  message?: string;
  fields?: FieldErrors;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(
      "Unable to reach the server. Please try again.",
      0,
    );
  }

  let body: ErrorBody = {};
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    body = (await response.json()) as ErrorBody;
  }

  if (!response.ok) {
    throw new ApiError(
      body.message ?? "Something went wrong. Please try again.",
      response.status,
      body.fields ?? {},
    );
  }

  return body as T;
}

export function signInRequest(email: string, password: string) {
  return request<{ user: AuthUser }>("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function requestAccessRequest(payload: RequestAccessPayload) {
  return request<{ message: string }>("/api/auth/request-access", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCurrentUserRequest() {
  return request<{ user: AuthUser }>("/api/auth/me");
}

export function signOutRequest() {
  return request<{ message: string }>("/api/auth/signout", {
    method: "POST",
  });
}

export type ProjectType = "solar" | "wind" | "hybrid" | "bess";
export type ProjectStatus = "active" | "pending" | "on_hold" | "completed";
export type SiteStatus = "active" | "pending" | "on_hold";
export type TaskStatus = "open" | "in_progress" | "completed";

export type Site = {
  id: string;
  organizationId: string;
  name: string;
  location: string;
  status: SiteStatus;
  description: string;
  projectCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateSitePayload = {
  name: string;
  location: string;
  status: SiteStatus;
  description: string;
};

export type Project = {
  id: string;
  organizationId: string;
  siteId: string;
  siteName: string;
  name: string;
  location: string;
  type: ProjectType;
  status: ProjectStatus;
  capacityMw: number;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskItem = {
  id: string;
  organizationId: string;
  projectId: string;
  projectName: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
};

export type DashboardKpis = {
  totalProjects: number;
  active: number;
  pending: number;
  onHold: number;
  completed: number;
  totalCapacityMw: number;
};

export type DashboardPayload = {
  organization: { id: string; name: string };
  site: Site | null;
  dateLabel: string;
  kpis: DashboardKpis;
  projects: Project[];
  recentTasks: TaskItem[];
};

export type ProjectDashboardKpis = {
  capacityMw: number;
  currentOutputMw: number;
  availabilityPct: number;
  todayGenerationMwh: number;
  vsForecastPct: number;
};

export type GenerationPoint = {
  hour: string;
  actual: number;
  forecast: number;
  target: number;
};

export type WeatherConditions = {
  irradianceWm2: number;
  temperatureC: number;
  windKmh: number;
  cloudCoverPct: number;
};

export type AlertSeverity = "warning" | "critical" | "info";

export type OperationalAlert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  plant: string;
  timeAgo: string;
};

export type ActivityItem = {
  id: string;
  time: string;
  description: string;
};

export type ProjectDashboardPayload = {
  organization: { id: string; name: string };
  project: Project;
  dateLabel: string;
  kpis: ProjectDashboardKpis;
  generationSeries: GenerationPoint[];
  weather: WeatherConditions;
  alerts: OperationalAlert[];
  activity: ActivityItem[];
  recentTasks: TaskItem[];
};

export type CreateProjectPayload = {
  siteId: string;
  name: string;
  location: string;
  type: ProjectType;
  status: ProjectStatus;
  capacityMw: number;
  description: string;
};

export function getDashboardRequest(siteId?: string) {
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
  return request<DashboardPayload>(`/api/dashboard${query}`);
}

export function listSitesRequest() {
  return request<{ sites: Site[] }>("/api/sites");
}

export function createSiteRequest(payload: CreateSitePayload) {
  return request<{ site: Site }>("/api/sites", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listProjectsRequest(siteId: string) {
  return request<{ projects: Project[] }>(
    `/api/projects?siteId=${encodeURIComponent(siteId)}`,
  );
}

export function createProjectRequest(payload: CreateProjectPayload) {
  return request<{ project: Project }>("/api/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getProjectRequest(projectId: string) {
  return request<{ project: Project }>(
    `/api/projects/${encodeURIComponent(projectId)}`,
  );
}

export function getProjectDashboardRequest(projectId: string) {
  return request<ProjectDashboardPayload>(
    `/api/projects/${encodeURIComponent(projectId)}/dashboard`,
  );
}

export type ModuleTech = "mono_perc" | "topcon" | "bifacial";
export type MountingType = "fixed_tilt" | "single_axis";
export type InverterKind = "string" | "central";

export type TwinSpec = {
  capacityMw: number;
  landAreaAcres: number;
  usableLandPct: number;
  latitude: number;
  longitude: number;
  dcAcRatio: number;
  moduleWattageW: number;
  moduleTech: ModuleTech;
  tiltDeg: number;
  azimuthDeg: number;
  mountingType: MountingType;
  groundCoverageRatio: number;
  modulesPerString: number;
  inverterType: InverterKind;
  inverterRatingKw: number;
  transformerMva: number;
  mvVoltageKv: number;
  gridVoltageKv: number;
  includeBuilding: boolean;
  includeWeatherStation: boolean;
  includeFence: boolean;
  includeRoads: boolean;
};

export type TwinDerived = {
  dcCapacityMwp: number;
  moduleCount: number;
  stringCount: number;
  inverterCount: number;
  combinerCount: number;
  tableCount: number;
  siteWidthM: number;
  siteDepthM: number;
};

export type TwinRecord = {
  id: string;
  organizationId: string;
  projectId: string;
  spec: TwinSpec;
  derived: TwinDerived;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateTwinPayload = TwinSpec;

export function getProjectTwinRequest(projectId: string) {
  return request<{ twin: TwinRecord | null }>(
    `/api/projects/${encodeURIComponent(projectId)}/twin`,
  );
}

export function createProjectTwinRequest(
  projectId: string,
  payload: CreateTwinPayload,
) {
  return request<{ twin: TwinRecord }>(
    `/api/projects/${encodeURIComponent(projectId)}/twin`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
