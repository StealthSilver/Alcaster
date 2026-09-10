export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  organizationId: string | null;
  organizationName: string | null;
  siteIds: string[];
  createdAt: string | null;
};

export type RequestAccessPayload = {
  fullName: string;
  email: string;
  company: string;
  role: string;
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

export type UpdateProfilePayload = {
  name: string;
  currentPassword?: string;
  newPassword?: string;
};

export function updateProfileRequest(payload: UpdateProfilePayload) {
  return request<{ user: AuthUser }>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAccountRequest(password: string) {
  return request<{ message: string }>("/api/auth/me", {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
}

export function signOutRequest() {
  return request<{ message: string }>("/api/auth/signout", {
    method: "POST",
  });
}

export type ProjectType = "solar" | "wind" | "hybrid" | "bess";
export type ProjectStatus = "active" | "pending" | "on_hold" | "completed";
export type SiteType = "solar" | "wind" | "bess" | "hybrid";
export type SiteStatus = "active" | "inactive";
export type TaskStatus = "open" | "in_progress" | "completed";

export type Site = {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: SiteType;
  status: SiteStatus;
  projectCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateSitePayload = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: SiteType;
  status: SiteStatus;
};

export type UpdateSitePayload = CreateSitePayload;

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

export type UpdateProjectPayload = {
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

export function updateSiteRequest(siteId: string, payload: UpdateSitePayload) {
  return request<{ site: Site }>(`/api/sites/${encodeURIComponent(siteId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteSiteRequest(siteId: string) {
  return request<{ message: string }>(
    `/api/sites/${encodeURIComponent(siteId)}`,
    { method: "DELETE" },
  );
}

export type Gender = "Male" | "Female" | "Other";

export type TeamMemberSite = {
  id: string;
  name: string;
  type: SiteType;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  gender: string;
  designation: string;
  company: string;
  siteIds: string[];
  sites: TeamMemberSite[];
  initials: string;
  createdAt: string;
};

export type CreateTeamMemberPayload = {
  name: string;
  email: string;
  password: string;
  role: string;
  gender: Gender;
  designation: string;
  company: string;
  siteIds: string[];
};

export type UpdateTeamMemberPayload = {
  name: string;
  email: string;
  password?: string;
  role: string;
  gender: Gender;
  designation: string;
  company: string;
  siteIds: string[];
};

export function listTeamMembersRequest(siteId: string) {
  return request<{ members: TeamMember[] }>(
    `/api/team?siteId=${encodeURIComponent(siteId)}`,
  );
}

export function createTeamMemberRequest(payload: CreateTeamMemberPayload) {
  return request<{ member: TeamMember }>("/api/team", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTeamMemberRequest(
  userId: string,
  payload: UpdateTeamMemberPayload,
) {
  return request<{ member: TeamMember }>(
    `/api/team/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteTeamMemberRequest(userId: string) {
  return request<{ message: string }>(
    `/api/team/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
}

export function listUsersRequest() {
  return request<{ users: TeamMember[] }>("/api/users");
}

export function getUserRequest(userId: string) {
  return request<{ user: TeamMember }>(
    `/api/users/${encodeURIComponent(userId)}`,
  );
}

export function createUserRequest(payload: CreateTeamMemberPayload) {
  return request<{ user: TeamMember }>("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUserRequest(
  userId: string,
  payload: UpdateTeamMemberPayload,
) {
  return request<{ user: TeamMember }>(
    `/api/users/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteUserRequest(userId: string) {
  return request<{ message: string }>(
    `/api/users/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
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

export function updateProjectRequest(
  projectId: string,
  payload: UpdateProjectPayload,
) {
  return request<{ project: Project }>(
    `/api/projects/${encodeURIComponent(projectId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteProjectRequest(projectId: string) {
  return request<{ message: string }>(
    `/api/projects/${encodeURIComponent(projectId)}`,
    { method: "DELETE" },
  );
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
  intake?: Record<string, string>;
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
