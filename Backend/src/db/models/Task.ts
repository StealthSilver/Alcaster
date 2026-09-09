import { Schema, model, Types } from "mongoose";

export const TASK_STATUSES = ["open", "in_progress", "completed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

const taskSchema = new Schema(
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
      index: true,
    },
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: TASK_STATUSES,
      default: "open",
    },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
    collection: "tasks",
  },
);

export const TaskModel = model("Task", taskSchema);
