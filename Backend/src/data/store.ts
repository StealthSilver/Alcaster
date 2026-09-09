import { isValidObjectId, type Types } from "mongoose";

import { config } from "../config.js";
import { AccessRequestModel } from "../db/models/AccessRequest.js";
import { OrganizationModel } from "../db/models/Organization.js";
import { UserModel } from "../db/models/User.js";
import { hashPassword } from "../lib/crypto.js";
import { seedProjectsForOrganization } from "../services/projects.js";
import type { AccessRequestRecord, RequestAccessInput, UserRecord } from "../types.js";

let dummyPasswordHash = "";

export function getDummyPasswordHash(): string {
  return dummyPasswordHash;
}

type OrgRef = {
  _id: Types.ObjectId;
  name: string;
} | null;

function organizationFrom(value: unknown): {
  organizationId: string | null;
  organizationName: string | null;
} {
  if (!value) return { organizationId: null, organizationName: null };
  if (typeof value === "object" && value !== null && "name" in value && "_id" in value) {
    const org = value as { _id: { toString(): string }; name: string };
    return {
      organizationId: org._id.toString(),
      organizationName: org.name,
    };
  }
  return {
    organizationId: String(value),
    organizationName: null,
  };
}

function toUserRecord(doc: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: string;
  passwordHash: string;
  organizationId?: unknown;
  createdAt?: Date;
}): UserRecord {
  const org = organizationFrom(doc.organizationId);
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    passwordHash: doc.passwordHash,
    organizationId: org.organizationId,
    organizationName: org.organizationName,
    createdAt: (doc.createdAt ?? new Date()).toISOString(),
  };
}

function toAccessRequestRecord(doc: {
  _id: { toString(): string };
  fullName: string;
  email: string;
  company: string;
  message: string;
  createdAt?: Date;
}): AccessRequestRecord {
  return {
    id: doc._id.toString(),
    fullName: doc.fullName,
    email: doc.email,
    company: doc.company,
    message: doc.message,
    createdAt: (doc.createdAt ?? new Date()).toISOString(),
  };
}

export async function findUserById(id: string): Promise<UserRecord | undefined> {
  if (!isValidObjectId(id)) return undefined;
  const doc = await UserModel.findById(id)
    .populate<{ organizationId: OrgRef }>("organizationId", "name")
    .lean();
  return doc ? toUserRecord(doc) : undefined;
}

export async function findUserByEmail(
  email: string,
): Promise<UserRecord | undefined> {
  const doc = await UserModel.findOne({ email: email.toLowerCase() })
    .populate<{ organizationId: OrgRef }>("organizationId", "name")
    .lean();
  return doc ? toUserRecord(doc) : undefined;
}

export async function updateUserProfile(
  id: string,
  updates: { name: string; passwordHash?: string },
): Promise<UserRecord | undefined> {
  if (!isValidObjectId(id)) return undefined;
  const set: { name: string; passwordHash?: string } = { name: updates.name };
  if (updates.passwordHash) set.passwordHash = updates.passwordHash;
  const doc = await UserModel.findByIdAndUpdate(id, { $set: set }, { new: true })
    .populate<{ organizationId: OrgRef }>("organizationId", "name")
    .lean();
  return doc ? toUserRecord(doc) : undefined;
}

export async function deleteUserById(id: string): Promise<boolean> {
  if (!isValidObjectId(id)) return false;
  const result = await UserModel.findByIdAndDelete(id);
  return Boolean(result);
}

export async function findAccessRequestByEmail(
  email: string,
): Promise<AccessRequestRecord | undefined> {
  const doc = await AccessRequestModel.findOne({
    email: email.toLowerCase(),
  }).lean();
  return doc ? toAccessRequestRecord(doc) : undefined;
}

export async function createAccessRequest(
  input: RequestAccessInput,
): Promise<AccessRequestRecord> {
  const doc = await AccessRequestModel.create({
    fullName: input.fullName,
    email: input.email,
    company: input.company,
    message: input.message,
  });
  return toAccessRequestRecord(doc);
}

export async function seedAuthStore(): Promise<void> {
  dummyPasswordHash = await hashPassword("timing-safe-dummy");

  let organization = await OrganizationModel.findOne({
    name: config.demo.organizationName,
  });
  if (!organization) {
    organization = await OrganizationModel.create({
      name: config.demo.organizationName,
    });
  }

  const existing = await UserModel.findOne({ email: config.demo.email });
  const user =
    existing ??
    (await UserModel.create({
      name: config.demo.name,
      email: config.demo.email,
      role: config.demo.role,
      passwordHash: await hashPassword(config.demo.password),
      organizationId: organization._id,
    }));

  if (existing) {
    existing.role = config.demo.role;
    existing.organizationId = organization._id;
    await existing.save();
  }

  await seedProjectsForOrganization(
    organization._id.toString(),
    user._id.toString(),
  );
}
