import { Schema, model } from "mongoose";

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    collection: "organizations",
  },
);

export const OrganizationModel = model("Organization", organizationSchema);
