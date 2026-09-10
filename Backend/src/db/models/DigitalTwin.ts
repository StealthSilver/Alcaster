import { Schema, model, Types } from "mongoose";

export const MODULE_TECHS = ["mono_perc", "topcon", "bifacial"] as const;
export const MOUNTING_TYPES = ["fixed_tilt", "single_axis"] as const;
export const INVERTER_TYPES = ["string", "central"] as const;

export type ModuleTech = (typeof MODULE_TECHS)[number];
export type MountingType = (typeof MOUNTING_TYPES)[number];
export type InverterType = (typeof INVERTER_TYPES)[number];

const twinSpecSchema = new Schema(
  {
    capacityMw: { type: Number, required: true, min: 0 },
    landAreaAcres: { type: Number, required: true, min: 0 },
    usableLandPct: { type: Number, required: true, min: 40, max: 100 },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    dcAcRatio: { type: Number, required: true, min: 1, max: 2 },
    moduleWattageW: { type: Number, required: true, min: 200 },
    moduleTech: { type: String, required: true, enum: MODULE_TECHS },
    tiltDeg: { type: Number, required: true, min: 0, max: 60 },
    azimuthDeg: { type: Number, required: true, min: 0, max: 360 },
    mountingType: { type: String, required: true, enum: MOUNTING_TYPES },
    groundCoverageRatio: { type: Number, required: true, min: 0.15, max: 0.8 },
    modulesPerString: { type: Number, required: true, min: 6, max: 40 },
    inverterType: { type: String, required: true, enum: INVERTER_TYPES },
    inverterRatingKw: { type: Number, required: true, min: 10 },
    transformerMva: { type: Number, required: true, min: 0.5 },
    mvVoltageKv: { type: Number, required: true, min: 1 },
    gridVoltageKv: { type: Number, required: true, min: 1 },
    includeBuilding: { type: Boolean, default: true },
    includeWeatherStation: { type: Boolean, default: true },
    includeFence: { type: Boolean, default: true },
    includeRoads: { type: Boolean, default: true },
    intake: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const derivedSchema = new Schema(
  {
    dcCapacityMwp: { type: Number, required: true },
    moduleCount: { type: Number, required: true },
    stringCount: { type: Number, required: true },
    inverterCount: { type: Number, required: true },
    combinerCount: { type: Number, required: true },
    tableCount: { type: Number, required: true },
    siteWidthM: { type: Number, required: true },
    siteDepthM: { type: Number, required: true },
  },
  { _id: false },
);

const digitalTwinSchema = new Schema(
  {
    organizationId: {
      type: Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    projectId: {
      type: Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true,
      index: true,
    },
    spec: { type: twinSpecSchema, required: true },
    derived: { type: derivedSchema, required: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
    collection: "digital_twins",
  },
);

export const DigitalTwinModel = model("DigitalTwin", digitalTwinSchema);
