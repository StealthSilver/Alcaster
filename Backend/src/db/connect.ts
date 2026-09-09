import mongoose from "mongoose";

import { config } from "../config.js";

export async function connectDb(): Promise<void> {
  const uri = config.mongoUri;
  if (!uri) {
    throw new Error("MONGODB_URI must be set.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
