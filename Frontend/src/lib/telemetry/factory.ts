import type { AssetModel } from "@/lib/assetModel";
import type { TwinRecord } from "@/lib/api";
import { DEFAULT_SIMULATION_CONFIG } from "./config";
import { MockTelemetryProvider } from "./mockProvider";
import type { TelemetryPlantContext, TelemetryProvider } from "./provider";
import type {
  TelemetryFreshness,
  TelemetryProviderId,
  TelemetryQuality,
} from "./types";

/**
 * Provider factory — swap mock → SCADA without rewriting Digital Twin UI.
 */
export function createTelemetryProvider(
  id: TelemetryProviderId = resolveDefaultProviderId(),
): TelemetryProvider {
  switch (id) {
    case "scada":
      // Phase 4: real SCADA not connected — fall back to mock with clear id path
      return new MockTelemetryProvider();
    case "mock":
    default:
      return new MockTelemetryProvider();
  }
}

export function resolveDefaultProviderId(): TelemetryProviderId {
  const env =
    typeof import.meta !== "undefined"
      ? (import.meta as ImportMeta & { env?: Record<string, string> }).env
      : undefined;
  const flag = env?.VITE_TELEMETRY_PROVIDER?.toLowerCase();
  if (flag === "scada" || flag === "real") return "scada";
  return "mock";
}

export function buildTelemetryContext(
  twin: TwinRecord,
  model: AssetModel,
): TelemetryPlantContext {
  const intake = twin.spec.intake;
  const capacityMw = Number(intake?.plantAcCapacity) || twin.spec.capacityMw || 1;
  const dcCapacityMwp =
    Number(intake?.plantDcCapacity) || twin.derived.dcCapacityMwp || capacityMw * 1.3;
  const gridVoltageKv =
    Number(intake?.gridVoltageKv) || twin.spec.gridVoltageKv || 33;
  const inverterRatingKw =
    Number(intake?.inverterRatingKw) ||
    Number(twin.spec.inverterRatingKw) ||
    undefined;
  return {
    model,
    capacityMw,
    dcCapacityMwp,
    gridVoltageKv,
    inverterRatingKw,
  };
}

export function freshnessOf(
  timestamp: string | null | undefined,
  now = Date.now(),
  staleMs = DEFAULT_SIMULATION_CONFIG.staleThresholdMs,
  offlineMs = DEFAULT_SIMULATION_CONFIG.offlineThresholdMs,
): TelemetryFreshness {
  if (!timestamp) return "offline";
  const age = now - new Date(timestamp).getTime();
  if (!Number.isFinite(age) || age < 0) return "offline";
  if (age > offlineMs) return "offline";
  if (age > staleMs) return "stale";
  return "fresh";
}

export function qualityWithFreshness(
  quality: TelemetryQuality,
  freshness: TelemetryFreshness,
): TelemetryQuality {
  if (quality === "BAD") return "BAD";
  if (freshness === "offline") return "BAD";
  if (freshness === "stale") return "STALE";
  return quality;
}

/** Status colors aligned with existing twin visual language. */
export const OPERATIONAL_STATUS_COLOR: Record<string, string> = {
  RUNNING: "rgba(120, 180, 140, 0.95)",
  IDLE: "#94a3b8",
  WARNING: "#e6740a",
  FAULT: "#f07167",
  OFFLINE: "#6b7280",
  MAINTENANCE: "#7c8db5",
  STARTING: "rgba(120, 180, 140, 0.75)",
  STOPPING: "#94a3b8",
  UNKNOWN: "#94a3b8",
};

export const OPERATIONAL_MESH_COLOR: Record<string, string> = {
  RUNNING: "#86a892",
  IDLE: "#9ca3af",
  WARNING: "#e6740a",
  FAULT: "#f07167",
  OFFLINE: "#6b7280",
  MAINTENANCE: "#7c8db5",
  STARTING: "#86a892",
  STOPPING: "#9ca3af",
  UNKNOWN: "#94a3b8",
};
