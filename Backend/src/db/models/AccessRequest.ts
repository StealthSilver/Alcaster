import { Schema, model } from "mongoose";

const accessRequestSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    company: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    collection: "access_requests",
  },
);

export const AccessRequestModel = model("AccessRequest", accessRequestSchema);
