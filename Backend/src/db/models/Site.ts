import { Schema, model, Types } from "mongoose";

export const SITE_STATUSES = ["active", "pending", "on_hold"] as const;
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
    location: { type: String, required: true, trim: true },
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
  },
);

siteSchema.index({ organizationId: 1, name: 1 }, { unique: true });

export const SiteModel = model("Site", siteSchema);
