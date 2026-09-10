import { isValidObjectId, Types } from "mongoose";

import { AccessRequestModel } from "../db/models/AccessRequest.js";
import { SiteModel } from "../db/models/Site.js";
import { UserModel } from "../db/models/User.js";
import { HttpError } from "../errors.js";
import { getInitials, hashPassword } from "../lib/crypto.js";
import { canAssignAdmin, canManageTeam, canManageUsers, isAdmin } from "../lib/roles.js";
import type {
  CreateTeamMemberInput,
  PublicUser,
  SiteType,
  TeamMemberRecord,
  TeamMemberSite,
  UpdateTeamMemberInput,
} from "../types.js";
import {
  assertSiteAccess,
  listSites,
  requireOrganizationId,
} from "./sites.js";

type UserDoc = {
  _id: { toString(): string };
  name: string;
  email: string;
  role: string;
  gender?: string;
  designation?: string;
  company?: string;
  siteIds?: unknown;
  createdAt?: Date;
};

function idsFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") return item;
      if (typeof item === "object" && item !== null && "toString" in item) {
        return String(item.toString());
      }
      return "";
    })
    .filter(Boolean);
}

function requireTeamManager(user: PublicUser) {
  if (!canManageTeam(user.role)) {
    throw new HttpError(403, "You do not have permission to manage the team.");
  }
}

function requireUsersAdmin(user: PublicUser) {
  if (!canManageUsers(user.role)) {
    throw new HttpError(403, "You do not have permission to manage users.");
  }
}

function duplicateEmailError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

async function sitesForMember(
  organizationId: string,
  member: { role: string; siteIds: string[] },
): Promise<TeamMemberSite[]> {
  const filter: Record<string, unknown> = { organizationId };
  if (!isAdmin(member.role)) {
    const assigned = member.siteIds.filter((id) => isValidObjectId(id));
    if (assigned.length === 0) return [];
    filter._id = { $in: assigned.map((id) => new Types.ObjectId(id)) };
  }

  const docs = await SiteModel.find(filter)
    .select("name type")
    .sort({ name: 1 })
    .lean();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    name: doc.name,
    type: (doc.type as SiteType | undefined) ?? "solar",
  }));
}

async function toTeamMember(
  organizationId: string,
  doc: UserDoc,
): Promise<TeamMemberRecord> {
  const siteIds = isAdmin(doc.role) ? [] : idsFrom(doc.siteIds);
  const sites = await sitesForMember(organizationId, {
    role: doc.role,
    siteIds,
  });
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    gender: doc.gender ?? "",
    designation: doc.designation ?? "",
    company: doc.company ?? "",
    siteIds: isAdmin(doc.role) ? sites.map((site) => site.id) : siteIds,
    sites,
    initials: getInitials(doc.name),
    createdAt: (doc.createdAt ?? new Date()).toISOString(),
  };
}

async function resolveSiteIds(
  actor: PublicUser,
  role: string,
  siteIds: string[],
): Promise<Types.ObjectId[]> {
  if (isAdmin(role)) return [];

  const assignable = await listSites(actor);
  const allowed = new Set(assignable.map((site) => site.id));
  const unique = [...new Set(siteIds)];

  for (const siteId of unique) {
    if (!isValidObjectId(siteId) || !allowed.has(siteId)) {
      throw new HttpError(400, "Please fix the highlighted fields.", {
        siteIds: "Select sites you have access to.",
      });
    }
  }

  return unique.map((id) => new Types.ObjectId(id));
}

async function findOrgMember(organizationId: string, userId: string) {
  if (!isValidObjectId(userId)) {
    throw new HttpError(404, "Team member not found.");
  }
  const doc = await UserModel.findOne({
    _id: userId,
    organizationId,
  });
  if (!doc) {
    throw new HttpError(404, "Team member not found.");
  }
  return doc;
}

export async function listOrgUsers(
  actor: PublicUser,
): Promise<TeamMemberRecord[]> {
  requireUsersAdmin(actor);
  const organizationId = requireOrganizationId(actor);
  const docs = await UserModel.find({ organizationId })
    .sort({ name: 1 })
    .lean();
  return Promise.all(docs.map((doc) => toTeamMember(organizationId, doc)));
}

export async function getOrgUser(
  actor: PublicUser,
  userId: string,
): Promise<TeamMemberRecord> {
  requireUsersAdmin(actor);
  const organizationId = requireOrganizationId(actor);
  const doc = await findOrgMember(organizationId, userId);
  return toTeamMember(organizationId, doc);
}

export async function listTeamMembers(
  actor: PublicUser,
  siteId: string,
): Promise<TeamMemberRecord[]> {
  const organizationId = requireOrganizationId(actor);
  assertSiteAccess(actor, siteId);

  const docs = await UserModel.find({ organizationId })
    .sort({ name: 1 })
    .lean();

  const members = await Promise.all(
    docs.map((doc) => toTeamMember(organizationId, doc)),
  );

  return members.filter((member) => {
    if (isAdmin(member.role)) return true;
    return member.siteIds.includes(siteId);
  });
}

export async function createTeamMember(
  actor: PublicUser,
  input: CreateTeamMemberInput,
): Promise<TeamMemberRecord> {
  requireTeamManager(actor);
  const organizationId = requireOrganizationId(actor);

  if (isAdmin(input.role) && !canAssignAdmin(actor.role)) {
    throw new HttpError(403, "Only admins can create new admins.", {
      role: "Only admins can create new admins.",
    });
  }

  const siteIds = await resolveSiteIds(actor, input.role, input.siteIds);
  const email = input.email.toLowerCase();

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    throw new HttpError(409, "An account with this email already exists.", {
      email: "An account with this email already exists.",
    });
  }

  try {
    const doc = await UserModel.create({
      name: input.name,
      email,
      role: input.role,
      passwordHash: await hashPassword(input.password),
      gender: input.gender,
      designation: input.designation,
      company: input.company,
      siteIds,
      organizationId,
    });

    await AccessRequestModel.deleteOne({ email });
    return toTeamMember(organizationId, doc);
  } catch (error) {
    if (duplicateEmailError(error)) {
      throw new HttpError(409, "An account with this email already exists.", {
        email: "An account with this email already exists.",
      });
    }
    throw error;
  }
}

export async function updateTeamMember(
  actor: PublicUser,
  userId: string,
  input: UpdateTeamMemberInput,
): Promise<TeamMemberRecord> {
  requireTeamManager(actor);
  const organizationId = requireOrganizationId(actor);
  const doc = await findOrgMember(organizationId, userId);

  if (isAdmin(doc.role) && !canAssignAdmin(actor.role)) {
    throw new HttpError(403, "Only admins can edit admin accounts.");
  }

  if (isAdmin(input.role) && !canAssignAdmin(actor.role)) {
    throw new HttpError(403, "Only admins can create new admins.", {
      role: "Only admins can create new admins.",
    });
  }

  if (doc._id.toString() === actor.id && input.role !== doc.role) {
    throw new HttpError(400, "Please fix the highlighted fields.", {
      role: "You cannot change your own role.",
    });
  }

  const siteIds = await resolveSiteIds(actor, input.role, input.siteIds);
  const email = input.email.toLowerCase();

  const emailTaken = await UserModel.findOne({
    email,
    _id: { $ne: doc._id },
  }).lean();
  if (emailTaken) {
    throw new HttpError(409, "An account with this email already exists.", {
      email: "An account with this email already exists.",
    });
  }

  doc.name = input.name;
  doc.email = email;
  doc.role = input.role;
  doc.set("gender", input.gender);
  doc.set("designation", input.designation);
  doc.set("company", input.company);
  doc.set("siteIds", siteIds);
  if (input.password) {
    doc.passwordHash = await hashPassword(input.password);
  }

  try {
    await doc.save();
  } catch (error) {
    if (duplicateEmailError(error)) {
      throw new HttpError(409, "An account with this email already exists.", {
        email: "An account with this email already exists.",
      });
    }
    throw error;
  }

  await AccessRequestModel.deleteOne({ email });
  return toTeamMember(organizationId, doc);
}

export async function deleteTeamMember(actor: PublicUser, userId: string) {
  requireTeamManager(actor);
  const organizationId = requireOrganizationId(actor);
  const doc = await findOrgMember(organizationId, userId);

  if (doc._id.toString() === actor.id) {
    throw new HttpError(400, "You cannot delete your own account from here.");
  }

  if (isAdmin(doc.role) && !canAssignAdmin(actor.role)) {
    throw new HttpError(403, "Only admins can delete admin accounts.");
  }

  await doc.deleteOne();
}
