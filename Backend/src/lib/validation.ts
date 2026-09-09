import { z, type ZodType } from "zod";

import { HttpError } from "../errors.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailSchema = z
  .string({ error: "Email is required." })
  .trim()
  .min(1, "Email is required.")
  .max(254, "Email is too long.")
  .refine((value) => EMAIL_RE.test(value), "Enter a valid email address.")
  .transform((value) => value.toLowerCase());

export const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: "Password is required." })
    .min(1, "Password is required.")
    .max(128, "Password is too long."),
});

export const requestAccessSchema = z.object({
  fullName: z
    .string({ error: "Full name is required." })
    .trim()
    .min(1, "Full name is required.")
    .min(2, "Enter your full name.")
    .max(80, "Full name is too long."),
  email: emailSchema,
  company: z
    .string({ error: "Company is required." })
    .trim()
    .min(1, "Company is required.")
    .min(2, "Enter your company name.")
    .max(100, "Company name is too long."),
  message: z
    .string({ error: "Message is required." })
    .trim()
    .min(1, "Message is required.")
    .min(10, "Tell us a bit more about why you need access.")
    .max(2000, "Message is too long."),
});

export const updateProfileSchema = z
  .object({
    name: z
      .string({ error: "Full name is required." })
      .trim()
      .min(1, "Full name is required.")
      .min(2, "Enter your full name.")
      .max(80, "Full name is too long."),
    currentPassword: z
      .string()
      .max(128, "Password is too long.")
      .optional()
      .transform((value) => value?.trim() ?? ""),
    newPassword: z
      .string()
      .max(128, "Password is too long.")
      .optional()
      .transform((value) => value?.trim() ?? ""),
  })
  .superRefine((data, ctx) => {
    if (!data.newPassword) return;
    if (data.newPassword.length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "New password must be at least 8 characters.",
      });
    }
    if (!data.currentPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["currentPassword"],
        message: "Enter your current password to set a new one.",
      });
    }
  });

export const deleteAccountSchema = z.object({
  password: z
    .string({ error: "Password is required." })
    .min(1, "Password is required.")
    .max(128, "Password is too long."),
});

export const createSiteSchema = z.object({
  name: z
    .string({ error: "Site name is required." })
    .trim()
    .min(1, "Site name is required.")
    .min(2, "Enter a site name.")
    .max(80, "Site name is too long."),
  location: z
    .string({ error: "Location is required." })
    .trim()
    .min(1, "Location is required.")
    .min(2, "Enter a location.")
    .max(80, "Location is too long."),
  status: z
    .enum(["active", "pending", "on_hold"], {
      error: "Select a site status.",
    })
    .default("active"),
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long.")
    .optional()
    .transform((value) => value ?? ""),
});

export const createProjectSchema = z.object({
  siteId: z
    .string({ error: "Select a site." })
    .trim()
    .min(1, "Select a site."),
  name: z
    .string({ error: "Project name is required." })
    .trim()
    .min(1, "Project name is required.")
    .min(2, "Enter a project name.")
    .max(80, "Project name is too long."),
  location: z
    .string({ error: "Location is required." })
    .trim()
    .min(1, "Location is required.")
    .min(2, "Enter a location.")
    .max(80, "Location is too long."),
  type: z.enum(["solar", "wind", "hybrid", "bess"], {
    error: "Select a project type.",
  }),
  status: z
    .enum(["active", "pending", "on_hold", "completed"], {
      error: "Select a project status.",
    })
    .default("pending"),
  capacityMw: z.coerce
    .number({ error: "Capacity is required." })
    .min(0, "Capacity cannot be negative.")
    .max(10000, "Capacity is too large."),
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long.")
    .optional()
    .transform((value) => value ?? ""),
});

export const createTwinSchema = z.object({
  capacityMw: z.coerce
    .number({ error: "Capacity is required." })
    .min(0.1, "Capacity must be greater than 0.")
    .max(5000, "Capacity is too large."),
  landAreaAcres: z.coerce
    .number({ error: "Land area is required." })
    .min(0.5, "Enter a valid land area.")
    .max(50000, "Land area is too large."),
  usableLandPct: z.coerce
    .number({ error: "Usable land is required." })
    .min(40, "Usable land must be at least 40%.")
    .max(100, "Usable land cannot exceed 100%."),
  latitude: z.coerce
    .number({ error: "Latitude is required." })
    .min(-90, "Enter a valid latitude.")
    .max(90, "Enter a valid latitude."),
  longitude: z.coerce
    .number({ error: "Longitude is required." })
    .min(-180, "Enter a valid longitude.")
    .max(180, "Enter a valid longitude."),
  dcAcRatio: z.coerce
    .number({ error: "DC/AC ratio is required." })
    .min(1, "DC/AC ratio must be at least 1.0.")
    .max(1.8, "DC/AC ratio cannot exceed 1.8."),
  moduleWattageW: z.coerce
    .number({ error: "Module wattage is required." })
    .min(250, "Module wattage is too low.")
    .max(800, "Module wattage is too high."),
  moduleTech: z.enum(["mono_perc", "topcon", "bifacial"], {
    error: "Select a module technology.",
  }),
  tiltDeg: z.coerce
    .number({ error: "Tilt is required." })
    .min(0, "Tilt cannot be negative.")
    .max(60, "Tilt cannot exceed 60°."),
  azimuthDeg: z.coerce
    .number({ error: "Azimuth is required." })
    .min(0, "Azimuth cannot be negative.")
    .max(360, "Azimuth cannot exceed 360°."),
  mountingType: z.enum(["fixed_tilt", "single_axis"], {
    error: "Select a mounting type.",
  }),
  groundCoverageRatio: z.coerce
    .number({ error: "Ground coverage ratio is required." })
    .min(0.2, "GCR must be at least 0.20.")
    .max(0.7, "GCR cannot exceed 0.70."),
  modulesPerString: z.coerce
    .number({ error: "Modules per string is required." })
    .int("Modules per string must be a whole number.")
    .min(8, "Need at least 8 modules per string.")
    .max(40, "Modules per string is too high."),
  inverterType: z.enum(["string", "central"], {
    error: "Select an inverter type.",
  }),
  inverterRatingKw: z.coerce
    .number({ error: "Inverter rating is required." })
    .min(20, "Inverter rating is too low.")
    .max(5000, "Inverter rating is too high."),
  transformerMva: z.coerce
    .number({ error: "Transformer rating is required." })
    .min(1, "Transformer rating is too low.")
    .max(1000, "Transformer rating is too high."),
  mvVoltageKv: z.coerce
    .number({ error: "MV voltage is required." })
    .min(11, "MV voltage is too low.")
    .max(66, "MV voltage is too high."),
  gridVoltageKv: z.coerce
    .number({ error: "Grid voltage is required." })
    .min(33, "Grid voltage is too low.")
    .max(400, "Grid voltage is too high."),
  includeBuilding: z.boolean().default(true),
  includeWeatherStation: z.boolean().default(true),
  includeFence: z.boolean().default(true),
  includeRoads: z.boolean().default(true),
});

export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Invalid request body.");
  }

  const result = schema.safeParse(body);
  if (result.success) return result.data;

  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fields[key]) {
      fields[key] = issue.message;
    }
  }

  throw new HttpError(400, "Please fix the highlighted fields.", fields);
}
