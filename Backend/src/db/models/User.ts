import { Schema, model, Types } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    gender: { type: String, default: "", trim: true },
    designation: { type: String, default: "", trim: true },
    company: { type: String, default: "", trim: true },
    siteIds: {
      type: [{ type: Types.ObjectId, ref: "Site" }],
      default: [],
    },
    organizationId: {
      type: Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

export const UserModel = model("User", userSchema);
