export type PublicUser = {
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

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
  gender: string;
  designation: string;
  company: string;
  siteIds: string[];
  organizationId: string | null;
  organizationName: string | null;
  createdAt: string;
};

export const ACCESS_ROLES = [
  "Admin",
  "Site Manager",
  "Site Engineer",
  "Developer",
] as const;

export const GENDERS = ["Male", "Female", "Other"] as const;

export type Gender = (typeof GENDERS)[number];

export type TeamMemberSite = {
  id: string;
  name: string;
  type: SiteType;
};

export type TeamMemberRecord = {
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

export type CreateTeamMemberInput = {
  name: string;
  email: string;
  password: string;
  role: AccessRole;
  gender: Gender;
  designation: string;
  company: string;
  siteIds: string[];
};

export type UpdateTeamMemberInput = {
  name: string;
  email: string;
  password: string;
  role: AccessRole | string;
  gender: Gender;
  designation: string;
  company: string;
  siteIds: string[];
};

export type AccessRole = (typeof ACCESS_ROLES)[number];

export type AccessRequestRecord = {
  id: string;
  fullName: string;
  email: string;
  company: string;
  role: AccessRole;
  message: string;
  createdAt: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type RequestAccessInput = {
  fullName: string;
  email: string;
  company: string;
  role: AccessRole;
  message: string;
};

export type UpdateProfileInput = {
  name: string;
  currentPassword: string;
  newPassword: string;
};

export type DeleteAccountInput = {
  password: string;
};

export type ProjectType = "solar" | "wind" | "hybrid" | "bess";
export type ProjectStatus = "active" | "pending" | "on_hold" | "completed";
export type SiteType = "solar" | "wind" | "bess" | "hybrid";
export type SiteStatus = "active" | "inactive";
export type TaskStatus = "open" | "in_progress" | "completed";

export type SiteRecord = {
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

export type CreateSiteInput = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: SiteType;
  status: SiteStatus;
};

export type UpdateSiteInput = CreateSiteInput;

export type ProjectRecord = {
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

export type CreateProjectInput = {
  siteId: string;
  name: string;
  location: string;
  type: ProjectType;
  status: ProjectStatus;
  capacityMw: number;
  description: string;
};

export type UpdateProjectInput = {
  name: string;
  location: string;
  type: ProjectType;
  status: ProjectStatus;
  capacityMw: number;
  description: string;
};

export type TaskRecord = {
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
  site: SiteRecord | null;
  dateLabel: string;
  kpis: DashboardKpis;
  projects: ProjectRecord[];
  recentTasks: TaskRecord[];
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
  project: ProjectRecord;
  dateLabel: string;
  kpis: ProjectDashboardKpis;
  generationSeries: GenerationPoint[];
  weather: WeatherConditions;
  alerts: OperationalAlert[];
  activity: ActivityItem[];
  recentTasks: TaskRecord[];
};

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

export type CreateTwinInput = TwinSpec;
