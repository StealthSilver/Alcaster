import { isValidObjectId, Types } from "mongoose";

import { ProjectModel } from "../db/models/Project.js";
import { SiteModel } from "../db/models/Site.js";
import { HttpError } from "../errors.js";
import type {
  CreateSiteInput,
  PublicUser,
  SiteRecord,
  SiteStatus,
} from "../types.js";

export function requireOrganizationId(user: PublicUser): string {
  if (!user.organizationId) {
    throw new HttpError(
      403,
      "Your account is not linked to an organisation.",
    );
  }
  return user.organizationId;
}

export function toSiteRecord(
  doc: {
    _id: { toString(): string };
    organizationId: { toString(): string };
    name: string;
    location: string;
    status: string;
    description?: string;
    createdBy: { toString(): string };
    createdAt?: Date;
    updatedAt?: Date;
  },
  projectCount = 0,
): SiteRecord {
  const createdAt = (doc.createdAt ?? new Date()).toISOString();
  return {
    id: doc._id.toString(),
    organizationId: doc.organizationId.toString(),
    name: doc.name,
    location: doc.location,
    status: doc.status as SiteStatus,
    description: doc.description ?? "",
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

export async function listSites(user: PublicUser): Promise<SiteRecord[]> {
  const organizationId = requireOrganizationId(user);
  const docs = await SiteModel.find({ organizationId })
    .sort({ name: 1 })
    .lean();

  const counts = await ProjectModel.aggregate<{
    _id: Types.ObjectId;
    count: number;
  }>([
    { $match: { organizationId: new Types.ObjectId(organizationId) } },
    { $group: { _id: "$siteId", count: { $sum: 1 } } },
  ]);
  const countBySite = new Map(
    counts.map((row) => [row._id.toString(), row.count]),
  );

  return docs.map((doc) =>
    toSiteRecord(doc, countBySite.get(doc._id.toString()) ?? 0),
  );
}

export async function createSite(
  user: PublicUser,
  input: CreateSiteInput,
): Promise<SiteRecord> {
  const organizationId = requireOrganizationId(user);
  const existing = await SiteModel.findOne({
    organizationId,
    name: input.name,
  }).lean();
  if (existing) {
    throw new HttpError(409, "A site with this name already exists.", {
      name: "A site with this name already exists.",
    });
  }

  try {
    const doc = await SiteModel.create({
      organizationId,
      name: input.name,
      location: input.location,
      status: input.status,
      description: input.description,
      createdBy: user.id,
    });
    return toSiteRecord(doc, 0);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new HttpError(409, "A site with this name already exists.", {
        name: "A site with this name already exists.",
      });
    }
    throw error;
  }
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
      location: site.location,
    }));
  }

  const seeded = await SiteModel.insertMany([
    {
      organizationId: orgObjectId,
      name: "Karnataka Solar Complex",
      location: "Karnataka",
      status: "active",
      description: "Utility solar sites in Karnataka.",
      createdBy: userObjectId,
    },
    {
      organizationId: orgObjectId,
      name: "Rajasthan Green Valley",
      location: "Rajasthan",
      status: "pending",
      description: "Desert solar development cluster.",
      createdBy: userObjectId,
    },
    {
      organizationId: orgObjectId,
      name: "Gujarat Horizon Site",
      location: "Gujarat",
      status: "active",
      description: "Hybrid renewable site in Gujarat.",
      createdBy: userObjectId,
    },
  ]);

  return seeded.map((site) => ({
    id: site._id.toString(),
    name: site.name,
    location: site.location,
  }));
}
