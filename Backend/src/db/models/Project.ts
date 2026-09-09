import { Schema, model, Types } from "mongoose";

export const PROJECT_TYPES = ["solar", "wind", "hybrid", "bess"] as const;
export const PROJECT_STATUSES = [
  "active",
  "pending",
  "on_hold",
  "completed",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

const projectSchema = new Schema(
  {
    organizationId: {
      type: Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    siteId: {
      type: Types.ObjectId,
      ref: "Site",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: PROJECT_TYPES,
    },
    status: {
      type: String,
      required: true,
      enum: PROJECT_STATUSES,
      default: "pending",
    },
    capacityMw: { type: Number, required: true, min: 0 },
    description: { type: String, default: "", trim: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
    collection: "projects",
  },
);

projectSchema.index({ siteId: 1, name: 1 }, { unique: true });

export const ProjectModel = model("Project", projectSchema);
