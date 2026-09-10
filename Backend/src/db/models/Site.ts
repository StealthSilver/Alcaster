import { Schema, model, Types } from "mongoose";

export const SITE_TYPES = ["solar", "wind", "bess", "hybrid"] as const;
export const SITE_STATUSES = ["active", "inactive"] as const;
export type SiteType = (typeof SITE_TYPES)[number];
export type SiteStatus = (typeof SITE_STATUSES)[number];

const siteSchema = new Schema(
  {
    organizationId: {
      type: Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    location: { type: String, trim: true, default: "" },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    type: {
      type: String,
      required: true,
      enum: SITE_TYPES,
      default: "solar",
    },
    status: {
      type: String,
      required: true,
      enum: SITE_STATUSES,
      default: "active",
    },
    description: { type: String, default: "", trim: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
    collection: "sites",
    strict: false,
  },
);

siteSchema.index({ organizationId: 1, name: 1 }, { unique: true });

export const SiteModel = model("Site", siteSchema);
