/**
 * Phase 5 — Deterministic terrain model for visual support of the plant layout.
 * Does not rewrite PV placement; elevation offsets are visual only.
 */

import type { TwinPlant } from "@/lib/twinPlant";
import type { TwinRecord } from "@/lib/api";

export type TerrainKind =
  | "FLAT"
  | "GENTLY_SLOPED"
  | "SLOPED"
  | "HILLY"
  | "MOUNTAINOUS";

export type TerrainSurface =
  | "bare"
  | "grass"
  | "scrub"
  | "desert"
  | "rocky"
  | "unknown";

export type TerrainModel = {
  terrainType: TerrainKind;
  baseElevation: number;
  minElevation?: number;
  maxElevation?: number;
  averageSlope?: number;
  maxSlope?: number;
  surface: TerrainSurface;
  drainage?: string;
  roughness?: "low" | "medium" | "high";
  seed: number;
  elevationScale: number;
  /** Visual slope tilt applied to ground mesh (radians). */
  visualSlope: number;
  hillCount: number;
};

function hash32(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mapIntakeTerrainType(
  raw: string | undefined,
): TerrainKind {
  const t = (raw ?? "flat").toLowerCase();
  if (t === "flat") return "FLAT";
  if (t === "mostly_flat" || t === "gently_sloped") return "GENTLY_SLOPED";
  if (t === "sloped") return "SLOPED";
  if (t === "hilly") return "HILLY";
  if (t === "mountainous") return "MOUNTAINOUS";
  if (t === "unknown") return "GENTLY_SLOPED";
  return "FLAT";
}

export function buildTerrainModel(
  twin: TwinRecord,
  plant: TwinPlant,
): TerrainModel {
  const intake = twin.spec.intake ?? {};
  const kind = mapIntakeTerrainType(
    intake.terrainType || plant.terrainType,
  );
  const seed = hash32(
    `${twin.projectId}|${twin.id}|${plant.latitude}|${plant.longitude}|terrain`,
  );
  const baseElevation = Number(intake.averageSiteElevation) || plant.elevationM || 0;
  const minElevation =
    Number(intake.minSiteElevation) ||
    (baseElevation ? baseElevation - elevationSpread(kind) * 0.4 : undefined);
  const maxElevation =
    Number(intake.maxSiteElevation) ||
    (baseElevation ? baseElevation + elevationSpread(kind) * 0.6 : undefined);
  const averageSlope =
    Number(intake.averageSlopeDeg) || defaultAverageSlope(kind);
  const maxSlope = Number(intake.maxSlopeDeg) || averageSlope * 1.8;
  const surface = (intake.terrainSurface as TerrainSurface) ||
    (plant.terrainLook as TerrainSurface) ||
    "bare";

  return {
    terrainType: kind,
    baseElevation,
    minElevation,
    maxElevation,
    averageSlope,
    maxSlope,
    surface: ["bare", "grass", "scrub", "desert", "rocky"].includes(surface)
      ? surface
      : "bare",
    drainage: intake.drainagePattern?.trim() || undefined,
    roughness:
      kind === "MOUNTAINOUS" || kind === "HILLY"
        ? "high"
        : kind === "SLOPED"
          ? "medium"
          : "low",
    seed,
    elevationScale: elevationScale(kind),
    visualSlope: visualSlope(kind),
    hillCount: hillCount(kind),
  };
}

function elevationSpread(kind: TerrainKind): number {
  switch (kind) {
    case "FLAT":
      return 2;
    case "GENTLY_SLOPED":
      return 8;
    case "SLOPED":
      return 25;
    case "HILLY":
      return 60;
    case "MOUNTAINOUS":
      return 150;
  }
}

function elevationScale(kind: TerrainKind): number {
  switch (kind) {
    case "FLAT":
      return 0.2;
    case "GENTLY_SLOPED":
      return 1.2;
    case "SLOPED":
      return 3.5;
    case "HILLY":
      return 7;
    case "MOUNTAINOUS":
      return 14;
  }
}

function visualSlope(kind: TerrainKind): number {
  switch (kind) {
    case "FLAT":
      return 0;
    case "GENTLY_SLOPED":
      return 0.012;
    case "SLOPED":
      return 0.035;
    case "HILLY":
      return 0.028;
    case "MOUNTAINOUS":
      return 0.045;
  }
}

function hillCount(kind: TerrainKind): number {
  switch (kind) {
    case "FLAT":
      return 0;
    case "GENTLY_SLOPED":
      return 1;
    case "SLOPED":
      return 2;
    case "HILLY":
      return 4;
    case "MOUNTAINOUS":
      return 6;
  }
}

function defaultAverageSlope(kind: TerrainKind): number {
  switch (kind) {
    case "FLAT":
      return 0.5;
    case "GENTLY_SLOPED":
      return 3;
    case "SLOPED":
      return 8;
    case "HILLY":
      return 15;
    case "MOUNTAINOUS":
      return 28;
  }
}

/** Deterministic hill positions from seed — stable across renders. */
export function terrainHillPositions(
  terrain: TerrainModel,
  width: number,
  depth: number,
): Array<{ x: number; y: number; z: number; r: number }> {
  const hills: Array<{ x: number; y: number; z: number; r: number }> = [];
  for (let i = 0; i < terrain.hillCount; i += 1) {
    const u = ((terrain.seed + i * 9973) % 10000) / 10000;
    const v = ((terrain.seed * 3 + i * 7919) % 10000) / 10000;
    const x = (u - 0.5) * width * 0.7;
    const z = (v - 0.5) * depth * 0.7;
    const r = 5 + ((terrain.seed + i * 13) % 7) + terrain.elevationScale * 0.35;
    const y = Math.max(0.8, terrain.elevationScale * (0.25 + u * 0.35));
    hills.push({ x, y, z, r });
  }
  return hills;
}

export function terrainInspectionContext(terrain: TerrainModel): string[] {
  const hints: string[] = [];
  if (
    terrain.terrainType === "SLOPED" ||
    terrain.terrainType === "HILLY" ||
    terrain.terrainType === "MOUNTAINOUS"
  ) {
    hints.push("Elevated slope — structural / civil inspection context");
  }
  if ((terrain.averageSlope ?? 0) >= 10) {
    hints.push("Steeper grades — erosion / foundation inspection context");
  }
  if (terrain.drainage?.toLowerCase().includes("poor")) {
    hints.push("Drainage concern — water accumulation context");
  }
  return hints;
}
