import { DigitalTwinModel } from "../db/models/DigitalTwin.js";
import { HttpError } from "../errors.js";
import type {
  CreateTwinInput,
  PublicUser,
  TwinDerived,
  TwinRecord,
  TwinSpec,
} from "../types.js";
import { findProjectForOrg } from "./projects.js";
import { requireOrganizationId } from "./sites.js";

const ACRES_TO_M2 = 4046.8564224;

export function deriveTwinStats(spec: TwinSpec): TwinDerived {
  const dcCapacityMwp =
    Math.round(spec.capacityMw * spec.dcAcRatio * 100) / 100;
  const moduleCount = Math.max(
    1,
    Math.round((dcCapacityMwp * 1_000_000) / spec.moduleWattageW),
  );
  const stringCount = Math.max(
    1,
    Math.ceil(moduleCount / spec.modulesPerString),
  );
  const inverterCount = Math.max(
    1,
    Math.round((spec.capacityMw * 1000) / spec.inverterRatingKw),
  );
  const combinerCount = Math.max(1, Math.ceil(stringCount / 16));
  const tableCount = Math.max(1, Math.ceil(moduleCount / 56));

  const usableM2 =
    spec.landAreaAcres * ACRES_TO_M2 * (spec.usableLandPct / 100);
  const aspect = spec.mountingType === "single_axis" ? 1.7 : 1.35;
  const siteWidthM = Math.round(Math.sqrt(usableM2 * aspect));
  const siteDepthM = Math.round(usableM2 / Math.max(siteWidthM, 1));

  return {
    dcCapacityMwp,
    moduleCount,
    stringCount,
    inverterCount,
    combinerCount,
    tableCount,
    siteWidthM,
    siteDepthM,
  };
}

function toTwinRecord(doc: {
  _id: { toString(): string };
  organizationId: { toString(): string };
  projectId: { toString(): string };
  spec: TwinSpec;
  derived: TwinDerived;
  createdBy: { toString(): string };
  createdAt?: Date;
  updatedAt?: Date;
}): TwinRecord {
  const createdAt = (doc.createdAt ?? new Date()).toISOString();
  return {
    id: doc._id.toString(),
    organizationId: doc.organizationId.toString(),
    projectId: doc.projectId.toString(),
    spec: doc.spec,
    derived: doc.derived,
    createdBy: doc.createdBy.toString(),
    createdAt,
    updatedAt: (doc.updatedAt ?? doc.createdAt ?? new Date()).toISOString(),
  };
}

export async function getTwin(
  user: PublicUser,
  projectId: string,
): Promise<TwinRecord | null> {
  const organizationId = requireOrganizationId(user);
  await findProjectForOrg(organizationId, projectId);
  const doc = await DigitalTwinModel.findOne({
    organizationId,
    projectId,
  }).lean();
  if (!doc) return null;
  return toTwinRecord(doc);
}

export async function upsertTwin(
  user: PublicUser,
  projectId: string,
  input: CreateTwinInput,
): Promise<TwinRecord> {
  const organizationId = requireOrganizationId(user);
  const project = await findProjectForOrg(organizationId, projectId);
  const derived = deriveTwinStats(input);

  const doc = await DigitalTwinModel.findOneAndUpdate(
    { organizationId, projectId: project._id },
    {
      organizationId,
      projectId: project._id,
      spec: input,
      derived,
      createdBy: user.id,
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();

  if (!doc) {
    throw new HttpError(500, "Unable to save the digital twin.");
  }

  return toTwinRecord(doc);
}
