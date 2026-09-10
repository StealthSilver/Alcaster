import { isValidObjectId, Types } from "mongoose";

import { DigitalTwinModel } from "../db/models/DigitalTwin.js";
import { ProjectModel } from "../db/models/Project.js";
import { SiteModel } from "../db/models/Site.js";
import { TaskModel } from "../db/models/Task.js";
import { UserModel } from "../db/models/User.js";
import { HttpError } from "../errors.js";
import { canDeleteSite, canEditSite, isAdmin } from "../lib/roles.js";
import type {
  CreateSiteInput,
  PublicUser,
  SiteRecord,
  SiteStatus,
  SiteType,
  UpdateSiteInput,
} from "../types.js";

const SITE_TYPES = new Set<SiteType>(["solar", "wind", "bess", "hybrid"]);

export function requireOrganizationId(user: PublicUser): string {
  if (!user.organizationId) {
    throw new HttpError(
      403,
      "Your account is not linked to an organisation.",
    );
  }
  return user.organizationId;
}

export function userHasSiteAccess(user: PublicUser, siteId: string) {
  if (isAdmin(user.role)) return true;
  return user.siteIds.includes(siteId);
}

export function assertSiteAccess(user: PublicUser, siteId: string) {
  if (!userHasSiteAccess(user, siteId)) {
    throw new HttpError(403, "You do not have access to this site.");
  }
}

function requireSiteEditor(user: PublicUser) {
  if (!canEditSite(user.role)) {
    throw new HttpError(403, "You do not have permission to edit sites.");
  }
}

function requireSiteAdmin(user: PublicUser) {
  if (!canDeleteSite(user.role)) {
    throw new HttpError(403, "You do not have permission to delete sites.");
  }
}

function organizationNameFor(user: PublicUser) {
  return user.organizationName ?? "";
}

function asSiteType(value: unknown): SiteType {
  if (typeof value === "string" && SITE_TYPES.has(value as SiteType)) {
    return value as SiteType;
  }
  return "solar";
}

function asSiteStatus(value: unknown): SiteStatus {
  return value === "active" ? "active" : "inactive";
}

function asCoordinate(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

type SiteDoc = {
  _id: { toString(): string };
  organizationId: { toString(): string };
  name: string;
  address?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  type?: string;
  status?: string;
  createdBy: { toString(): string };
  createdAt?: Date;
  updatedAt?: Date;
};

export function toSiteRecord(
  doc: SiteDoc,
  projectCount = 0,
  organizationName = "",
): SiteRecord {
  const createdAt = (doc.createdAt ?? new Date()).toISOString();
  const address = (doc.address || doc.location || "").trim();
  return {
    id: doc._id.toString(),
    organizationId: doc.organizationId.toString(),
    organizationName,
    name: doc.name,
    address,
    latitude: asCoordinate(doc.latitude),
    longitude: asCoordinate(doc.longitude),
    type: asSiteType(doc.type),
    status: asSiteStatus(doc.status),
    projectCount,
    createdBy: doc.createdBy.toString(),
    createdAt,
    updatedAt: (doc.updatedAt ?? doc.createdAt ?? new Date()).toISOString(),
  };
}

export async function findSiteForOrg(
  organizationId: string,
  siteId: string,
) {
  if (!isValidObjectId(siteId)) {
    throw new HttpError(400, "Select a valid site.", {
      siteId: "Select a valid site.",
    });
  }
  const site = await SiteModel.findOne({
    _id: siteId,
    organizationId,
  });
  if (!site) {
    throw new HttpError(404, "Site not found.");
  }
  return site;
}

async function projectCountsBySite(organizationId: string) {
  const counts = await ProjectModel.aggregate<{
    _id: Types.ObjectId;
    count: number;
  }>([
    { $match: { organizationId: new Types.ObjectId(organizationId) } },
    { $group: { _id: "$siteId", count: { $sum: 1 } } },
  ]);
  return new Map(counts.map((row) => [row._id.toString(), row.count]));
}

async function assertUniqueName(
  organizationId: string,
  name: string,
  excludeId?: string,
) {
  const existing = await SiteModel.findOne({
    organizationId,
    name,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();
  if (existing) {
    throw new HttpError(409, "A site with this name already exists.", {
      name: "A site with this name already exists.",
    });
  }
}

function duplicateNameError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function listSites(user: PublicUser): Promise<SiteRecord[]> {
  const organizationId = requireOrganizationId(user);
  const filter: Record<string, unknown> = { organizationId };
  if (!isAdmin(user.role)) {
    const assigned = user.siteIds.filter((id) => isValidObjectId(id));
    if (assigned.length === 0) return [];
    filter._id = { $in: assigned.map((id) => new Types.ObjectId(id)) };
  }

  const docs = await SiteModel.find(filter)
    .sort({ name: 1 })
    .lean();
  const countBySite = await projectCountsBySite(organizationId);
  const organizationName = organizationNameFor(user);

  return docs.map((doc) =>
    toSiteRecord(doc, countBySite.get(doc._id.toString()) ?? 0, organizationName),
  );
}

export async function createSite(
  user: PublicUser,
  input: CreateSiteInput,
): Promise<SiteRecord> {
  requireSiteEditor(user);
  const organizationId = requireOrganizationId(user);
  await assertUniqueName(organizationId, input.name);

  try {
    const doc = await SiteModel.create({
      organizationId,
      name: input.name,
      address: input.address,
      location: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      type: input.type,
      status: input.status,
      createdBy: user.id,
    });

    if (!isAdmin(user.role) && isValidObjectId(user.id)) {
      await UserModel.findByIdAndUpdate(user.id, {
        $addToSet: { siteIds: doc._id },
      });
    }

    return toSiteRecord(doc, 0, organizationNameFor(user));
  } catch (error) {
    if (duplicateNameError(error)) {
      throw new HttpError(409, "A site with this name already exists.", {
        name: "A site with this name already exists.",
      });
    }
    throw error;
  }
}

export async function updateSite(
  user: PublicUser,
  siteId: string,
  input: UpdateSiteInput,
): Promise<SiteRecord> {
  requireSiteEditor(user);
  const organizationId = requireOrganizationId(user);
  assertSiteAccess(user, siteId);
  const site = await findSiteForOrg(organizationId, siteId);
  await assertUniqueName(organizationId, input.name, site.id);

  site.name = input.name;
  site.set("address", input.address);
  site.set("location", input.address);
  site.set("latitude", input.latitude);
  site.set("longitude", input.longitude);
  site.set("type", input.type);
  site.status = input.status;

  try {
    await site.save();
  } catch (error) {
    if (duplicateNameError(error)) {
      throw new HttpError(409, "A site with this name already exists.", {
        name: "A site with this name already exists.",
      });
    }
    throw error;
  }

  const countBySite = await projectCountsBySite(organizationId);
  return toSiteRecord(
    site,
    countBySite.get(site.id) ?? 0,
    organizationNameFor(user),
  );
}

export async function deleteSite(user: PublicUser, siteId: string) {
  requireSiteAdmin(user);
  const organizationId = requireOrganizationId(user);
  const site = await findSiteForOrg(organizationId, siteId);

  const projects = await ProjectModel.find({
    organizationId,
    siteId: site._id,
  })
    .select("_id")
    .lean();
  const projectIds = projects.map((project) => project._id);

  if (projectIds.length > 0) {
    await DigitalTwinModel.deleteMany({
      organizationId,
      projectId: { $in: projectIds },
    });
    await TaskModel.deleteMany({
      organizationId,
      projectId: { $in: projectIds },
    });
    await ProjectModel.deleteMany({
      organizationId,
      siteId: site._id,
    });
  }

  await UserModel.updateMany(
    { siteIds: site._id },
    { $pull: { siteIds: site._id } },
  );
  await site.deleteOne();
}

export async function seedSitesForOrganization(
  organizationId: string,
  createdBy: string,
): Promise<{ id: string; name: string; location: string }[]> {
  const orgObjectId = new Types.ObjectId(organizationId);
  const userObjectId = new Types.ObjectId(createdBy);
  const existing = await SiteModel.find({ organizationId }).lean();
  if (existing.length > 0) {
    return existing.map((site) => ({
      id: site._id.toString(),
      name: site.name,
      location: (site.location || site.address || "").trim(),
    }));
  }

  const seeded = await SiteModel.insertMany([
    {
      organizationId: orgObjectId,
      name: "Karnataka Solar Complex",
      address: "Pavagada Solar Park, Tumakuru, Karnataka, India",
      location: "Karnataka",
      latitude: 14.1,
      longitude: 77.28,
      type: "solar",
      status: "active",
      createdBy: userObjectId,
    },
    {
      organizationId: orgObjectId,
      name: "Rajasthan Green Valley",
      address: "Bhadla Solar Park, Jodhpur, Rajasthan, India",
      location: "Rajasthan",
      latitude: 27.54,
      longitude: 71.91,
      type: "solar",
      status: "inactive",
      createdBy: userObjectId,
    },
    {
      organizationId: orgObjectId,
      name: "Gujarat Horizon Site",
      address: "Kutch Hybrid Park, Gujarat, India",
      location: "Gujarat",
      latitude: 23.24,
      longitude: 69.67,
      type: "hybrid",
      status: "active",
      createdBy: userObjectId,
    },
  ]);

  return seeded.map((site) => ({
    id: site._id.toString(),
    name: site.name,
    location: (site.location || site.address || "").trim(),
  }));
}
