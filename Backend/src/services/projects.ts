import { isValidObjectId, Types } from "mongoose";

import { DigitalTwinModel } from "../db/models/DigitalTwin.js";
import { ProjectModel } from "../db/models/Project.js";
import { SiteModel } from "../db/models/Site.js";
import { TaskModel } from "../db/models/Task.js";
import { HttpError } from "../errors.js";
import { canDeleteProject, canEditProject, isAdmin } from "../lib/roles.js";
import type {
  CreateProjectInput,
  DashboardKpis,
  DashboardPayload,
  ProjectDashboardPayload,
  ProjectRecord,
  ProjectStatus,
  ProjectType,
  PublicUser,
  TaskRecord,
  TaskStatus,
  UpdateProjectInput,
} from "../types.js";
import { buildProjectTelemetry } from "./projectTelemetry.js";
import {
  assertSiteAccess,
  findSiteForOrg,
  requireOrganizationId,
  seedSitesForOrganization,
  toSiteRecord,
} from "./sites.js";

function toProjectRecord(doc: {
  _id: { toString(): string };
  organizationId: { toString(): string };
  siteId:
    | { toString(): string; name?: string }
    | { _id: { toString(): string }; name: string };
  name: string;
  location: string;
  type: string;
  status: string;
  capacityMw: number;
  description?: string;
  createdBy: { toString(): string };
  createdAt?: Date;
  updatedAt?: Date;
}): ProjectRecord {
  const site = doc.siteId;
  if (!site) {
    const createdAt = (doc.createdAt ?? new Date()).toISOString();
    return {
      id: doc._id.toString(),
      organizationId: doc.organizationId.toString(),
      siteId: "",
      siteName: "Unassigned",
      name: doc.name,
      location: doc.location,
      type: doc.type as ProjectType,
      status: doc.status as ProjectStatus,
      capacityMw: doc.capacityMw,
      description: doc.description ?? "",
      createdBy: doc.createdBy.toString(),
      createdAt,
      updatedAt: (doc.updatedAt ?? doc.createdAt ?? new Date()).toISOString(),
    };
  }
  const siteId =
    typeof site === "object" && site !== null && "_id" in site
      ? site._id.toString()
      : site.toString();
  const siteName =
    typeof site === "object" && site !== null && "name" in site
      ? (site.name ?? "Site")
      : "Site";
  const createdAt = (doc.createdAt ?? new Date()).toISOString();
  return {
    id: doc._id.toString(),
    organizationId: doc.organizationId.toString(),
    siteId,
    siteName,
    name: doc.name,
    location: doc.location,
    type: doc.type as ProjectType,
    status: doc.status as ProjectStatus,
    capacityMw: doc.capacityMw,
    description: doc.description ?? "",
    createdBy: doc.createdBy.toString(),
    createdAt,
    updatedAt: (doc.updatedAt ?? doc.createdAt ?? new Date()).toISOString(),
  };
}

function toTaskRecord(doc: {
  _id: { toString(): string };
  organizationId: { toString(): string };
  projectId:
    | { toString(): string; name?: string }
    | { _id: { toString(): string }; name: string };
  title: string;
  status: string;
  createdAt?: Date;
}): TaskRecord {
  const project = doc.projectId;
  const projectId =
    typeof project === "object" && project !== null && "_id" in project
      ? project._id.toString()
      : project.toString();
  const projectName =
    typeof project === "object" && project !== null && "name" in project
      ? (project.name ?? "Project")
      : "Project";

  return {
    id: doc._id.toString(),
    organizationId: doc.organizationId.toString(),
    projectId,
    projectName,
    title: doc.title,
    status: doc.status as TaskStatus,
    createdAt: (doc.createdAt ?? new Date()).toISOString(),
  };
}

function buildKpis(projects: ProjectRecord[]): DashboardKpis {
  return {
    totalProjects: projects.length,
    active: projects.filter((project) => project.status === "active").length,
    pending: projects.filter((project) => project.status === "pending").length,
    onHold: projects.filter((project) => project.status === "on_hold").length,
    completed: projects.filter((project) => project.status === "completed")
      .length,
    totalCapacityMw: projects.reduce(
      (sum, project) => sum + project.capacityMw,
      0,
    ),
  };
}

function formatDateLabel(date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function requireProjectEditor(user: PublicUser) {
  if (!canEditProject(user.role)) {
    throw new HttpError(403, "You do not have permission to edit projects.");
  }
}

function requireProjectAdmin(user: PublicUser) {
  if (!canDeleteProject(user.role)) {
    throw new HttpError(403, "You do not have permission to delete projects.");
  }
}

function duplicateProjectNameError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function findProjectForOrg(
  organizationId: string,
  projectId: string,
) {
  if (!isValidObjectId(projectId)) {
    throw new HttpError(400, "Select a valid project.");
  }
  const project = await ProjectModel.findOne({
    _id: projectId,
    organizationId,
  }).populate("siteId", "name");
  if (!project) {
    throw new HttpError(404, "Project not found.");
  }
  return project;
}

export async function getProject(
  user: PublicUser,
  projectId: string,
): Promise<ProjectRecord> {
  const organizationId = requireOrganizationId(user);
  const doc = await findProjectForOrg(organizationId, projectId);
  const project = toProjectRecord(doc);
  if (project.siteId) assertSiteAccess(user, project.siteId);
  return project;
}

export async function getProjectDashboard(
  user: PublicUser,
  projectId: string,
): Promise<ProjectDashboardPayload> {
  const organizationId = requireOrganizationId(user);
  const orgName = user.organizationName ?? "Your organisation";
  const doc = await findProjectForOrg(organizationId, projectId);
  const project = toProjectRecord(doc);
  if (project.siteId) assertSiteAccess(user, project.siteId);
  const telemetry = buildProjectTelemetry(project);

  const taskDocs = await TaskModel.find({
    organizationId,
    projectId: doc._id,
  })
    .sort({ createdAt: -1 })
    .limit(8)
    .populate("projectId", "name")
    .lean();

  return {
    organization: { id: organizationId, name: orgName },
    project,
    dateLabel: formatDateLabel(),
    kpis: telemetry.kpis,
    generationSeries: telemetry.generationSeries,
    weather: telemetry.weather,
    alerts: telemetry.alerts,
    activity: telemetry.activity,
    recentTasks: taskDocs.map(toTaskRecord),
  };
}

export async function listProjects(
  user: PublicUser,
  siteId?: string,
): Promise<ProjectRecord[]> {
  const organizationId = requireOrganizationId(user);
  const filter: Record<string, string> = { organizationId };
  if (siteId) {
    assertSiteAccess(user, siteId);
    await findSiteForOrg(organizationId, siteId);
    filter.siteId = siteId;
  }
  const docs = await ProjectModel.find(filter)
    .populate("siteId", "name")
    .sort({ updatedAt: -1 })
    .lean();
  return docs.map(toProjectRecord);
}

export async function createProject(
  user: PublicUser,
  input: CreateProjectInput,
): Promise<ProjectRecord> {
  requireProjectEditor(user);
  const organizationId = requireOrganizationId(user);
  assertSiteAccess(user, input.siteId);
  const site = await findSiteForOrg(organizationId, input.siteId);

  const existing = await ProjectModel.findOne({
    siteId: site._id,
    name: input.name,
  }).lean();
  if (existing) {
    throw new HttpError(
      409,
      "A project with this name already exists at this site.",
      { name: "A project with this name already exists at this site." },
    );
  }

  try {
    const doc = await ProjectModel.create({
      organizationId,
      siteId: site._id,
      name: input.name,
      location: input.location,
      type: input.type,
      status: input.status,
      capacityMw: input.capacityMw,
      description: input.description,
      createdBy: user.id,
    });

    await TaskModel.create({
      organizationId,
      projectId: doc._id,
      title: `Kick off ${doc.name}`,
      status: "open",
      createdBy: user.id,
    });

    const created = await ProjectModel.findById(doc._id)
      .populate("siteId", "name")
      .lean();
    return toProjectRecord(created ?? doc);
  } catch (error) {
    if (duplicateProjectNameError(error)) {
      throw new HttpError(
        409,
        "A project with this name already exists at this site.",
        { name: "A project with this name already exists at this site." },
      );
    }
    throw error;
  }
}

export async function updateProject(
  user: PublicUser,
  projectId: string,
  input: UpdateProjectInput,
): Promise<ProjectRecord> {
  requireProjectEditor(user);
  const organizationId = requireOrganizationId(user);
  const doc = await findProjectForOrg(organizationId, projectId);
  const current = toProjectRecord(doc);
  if (current.siteId) assertSiteAccess(user, current.siteId);

  const existing = await ProjectModel.findOne({
    siteId: doc.siteId,
    name: input.name,
    _id: { $ne: doc._id },
  }).lean();
  if (existing) {
    throw new HttpError(
      409,
      "A project with this name already exists at this site.",
      { name: "A project with this name already exists at this site." },
    );
  }

  doc.name = input.name;
  doc.location = input.location;
  doc.type = input.type;
  doc.status = input.status;
  doc.capacityMw = input.capacityMw;
  doc.set("description", input.description);

  try {
    await doc.save();
  } catch (error) {
    if (duplicateProjectNameError(error)) {
      throw new HttpError(
        409,
        "A project with this name already exists at this site.",
        { name: "A project with this name already exists at this site." },
      );
    }
    throw error;
  }

  const updated = await ProjectModel.findById(doc._id)
    .populate("siteId", "name")
    .lean();
  return toProjectRecord(updated ?? doc);
}

export async function deleteProject(user: PublicUser, projectId: string) {
  requireProjectAdmin(user);
  const organizationId = requireOrganizationId(user);
  const doc = await findProjectForOrg(organizationId, projectId);
  const project = toProjectRecord(doc);
  if (project.siteId) assertSiteAccess(user, project.siteId);

  await DigitalTwinModel.deleteMany({
    organizationId,
    projectId: doc._id,
  });
  await TaskModel.deleteMany({
    organizationId,
    projectId: doc._id,
  });
  await doc.deleteOne();
}

export async function getDashboard(
  user: PublicUser,
  siteId?: string,
): Promise<DashboardPayload> {
  const organizationId = requireOrganizationId(user);
  const orgName = user.organizationName ?? "Your organisation";

  let siteDoc = null;
  if (siteId) {
    assertSiteAccess(user, siteId);
    siteDoc = await findSiteForOrg(organizationId, siteId);
  } else if (isAdmin(user.role)) {
    siteDoc = await SiteModel.findOne({ organizationId }).sort({ name: 1 });
  } else {
    const assigned = user.siteIds.find((id) => isValidObjectId(id));
    siteDoc = assigned
      ? await SiteModel.findOne({ _id: assigned, organizationId })
      : null;
  }

  if (!siteDoc) {
    return {
      organization: { id: organizationId, name: orgName },
      site: null,
      dateLabel: formatDateLabel(),
      kpis: buildKpis([]),
      projects: [],
      recentTasks: [],
    };
  }

  const resolvedSiteId = siteDoc._id;
  const [projectDocs, taskDocs, projectCount] = await Promise.all([
    ProjectModel.find({ organizationId, siteId: resolvedSiteId })
      .populate("siteId", "name")
      .sort({ updatedAt: -1 })
      .lean(),
    TaskModel.find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(24)
      .populate("projectId", "name siteId")
      .lean(),
    ProjectModel.countDocuments({
      organizationId,
      siteId: resolvedSiteId,
    }),
  ]);

  const projects = projectDocs.map(toProjectRecord);
  const projectIds = new Set(projects.map((project) => project.id));
  const recentTasks = taskDocs
    .map(toTaskRecord)
    .filter((task) => projectIds.has(task.projectId))
    .slice(0, 8);

  return {
    organization: { id: organizationId, name: orgName },
    site: toSiteRecord(siteDoc, projectCount, orgName),
    dateLabel: formatDateLabel(),
    kpis: buildKpis(projects),
    projects,
    recentTasks,
  };
}

export async function seedProjectsForOrganization(
  organizationId: string,
  createdBy: string,
): Promise<void> {
  const sites = await seedSitesForOrganization(organizationId, createdBy);
  const orgObjectId = new Types.ObjectId(organizationId);
  const userObjectId = new Types.ObjectId(createdBy);

  await ProjectModel.collection
    .dropIndex("organizationId_1_name_1")
    .catch(() => undefined);

  const siteByLocation = new Map(
    sites.map((site) => [site.location.toLowerCase(), site]),
  );
  const fallbackSite = sites[0];
  if (!fallbackSite) return;

  const orphans = await ProjectModel.find({
    organizationId,
    $or: [{ siteId: { $exists: false } }, { siteId: null }],
  });
  for (const project of orphans) {
    const match =
      siteByLocation.get(project.location.toLowerCase()) ?? fallbackSite;
    project.siteId = new Types.ObjectId(match.id);
    await project.save();
  }

  const count = await ProjectModel.countDocuments({ organizationId });
  if (count > 0) return;

  const karnataka =
    sites.find((site) => site.name.includes("Karnataka") || site.location === "Karnataka") ??
    fallbackSite;
  const rajasthan =
    sites.find((site) => site.name.includes("Rajasthan") || site.location === "Rajasthan") ??
    fallbackSite;
  const gujarat =
    sites.find((site) => site.name.includes("Gujarat") || site.location === "Gujarat") ??
    fallbackSite;

  const seeded = await ProjectModel.insertMany([
    {
      organizationId: orgObjectId,
      siteId: new Types.ObjectId(karnataka.id),
      name: "ABC Solar Plant",
      location: "Karnataka",
      type: "solar",
      status: "active",
      capacityMw: 100,
      description: "Utility-scale solar plant in Karnataka.",
      createdBy: userObjectId,
    },
    {
      organizationId: orgObjectId,
      siteId: new Types.ObjectId(rajasthan.id),
      name: "Green Valley Solar",
      location: "Rajasthan",
      type: "solar",
      status: "pending",
      capacityMw: 75,
      description: "New solar site awaiting commissioning.",
      createdBy: userObjectId,
    },
    {
      organizationId: orgObjectId,
      siteId: new Types.ObjectId(gujarat.id),
      name: "Horizon Renewable Plant",
      location: "Gujarat",
      type: "hybrid",
      status: "active",
      capacityMw: 150,
      description: "Hybrid solar and storage plant.",
      createdBy: userObjectId,
    },
    {
      organizationId: orgObjectId,
      siteId: new Types.ObjectId(karnataka.id),
      name: "Solar Park Karnataka",
      location: "Karnataka",
      type: "solar",
      status: "on_hold",
      capacityMw: 95,
      description: "Park expansion paused pending permits.",
      createdBy: userObjectId,
    },
  ]);

  const byName = new Map(seeded.map((project) => [project.name, project]));
  const abc = byName.get("ABC Solar Plant");
  const green = byName.get("Green Valley Solar");
  const horizon = byName.get("Horizon Renewable Plant");
  const park = byName.get("Solar Park Karnataka");

  await TaskModel.insertMany(
    [
      abc
        ? {
            organizationId: orgObjectId,
            projectId: abc._id,
            title: "Complete interconnection study",
            status: "in_progress",
            createdBy: userObjectId,
          }
        : null,
      abc
        ? {
            organizationId: orgObjectId,
            projectId: abc._id,
            title: "Schedule site walkthrough",
            status: "open",
            createdBy: userObjectId,
          }
        : null,
      green
        ? {
            organizationId: orgObjectId,
            projectId: green._id,
            title: "Upload as-built drawings",
            status: "open",
            createdBy: userObjectId,
          }
        : null,
      horizon
        ? {
            organizationId: orgObjectId,
            projectId: horizon._id,
            title: "Review SCADA mapping",
            status: "completed",
            createdBy: userObjectId,
          }
        : null,
      park
        ? {
            organizationId: orgObjectId,
            projectId: park._id,
            title: "Resume construction permits",
            status: "open",
            createdBy: userObjectId,
          }
        : null,
    ].filter((task) => task !== null),
  );
}
