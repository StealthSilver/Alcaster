import type { TwinDerived, TwinSpec } from "@/lib/api";

function num(value: string | number | undefined, fallback: number) {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function text(value: string | undefined, fallback = "") {
  return (value ?? fallback).trim();
}

function yes(value: string | undefined, fallback = false) {
  if (value == null || value === "") return fallback;
  return value === "yes";
}

function areaToM2(area: number, unit: string) {
  if (unit === "hectares") return area * 10_000;
  if (unit === "acres") return area * 4046.8564224;
  return area;
}

export type TwinPlant = {
  projectName: string;
  plantId: string;
  location: string;
  plantType: string;
  status: string;
  capacityMw: number;
  dcCapacityMwp: number;
  areaM2: number;
  areaAcres: number;
  latitude: number;
  longitude: number;
  terrainType: "flat" | "mostly_flat" | "sloped" | "hilly" | "unknown";
  elevationM: number;

  solarTechnology: string;
  mountingKind: "fixed_tilt" | "single_axis" | "dual_axis";
  trackerType: string;
  tiltDeg: number;
  azimuthDeg: number;

  moduleLengthM: number;
  moduleWidthM: number;
  moduleThicknessM: number;
  moduleWattageW: number;
  totalModules: number;
  modulesPerTable: number;
  cellCount: number;
  cellTechnology: string;

  totalTables: number;
  tableLengthM: number;
  tableWidthM: number;
  tableHeightM: number;
  rowToRowM: number;
  tableToTableM: number;
  numberOfRows: number;
  tablesPerRow: number;
  rowOrientationDeg: number;
  structureHeightM: number;

  blockCount: number;
  tablesPerBlock: number;
  rowsPerBlock: number;
  blockGapM: number;

  inverterCount: number;
  inverterKind: string;
  inverterLengthM: number;
  inverterWidthM: number;
  inverterHeightM: number;
  invertersPerBlock: number;

  transformerCount: number;
  transformerType: string;
  transformerLengthM: number;
  transformerWidthM: number;
  transformerHeightM: number;

  substationPresent: boolean;
  substationCount: number;
  substationAreaM2: number;
  substationType: string;

  roads: boolean;
  accessRoad: boolean;
  roadWidthM: number;
  roadSurface: string;

  controlRoom: boolean;
  omBuilding: boolean;
  warehouse: boolean;
  securityCabin: boolean;
  otherBuildings: number;
  buildingLengthM: number;
  buildingWidthM: number;
  buildingHeightM: number;

  fence: boolean;
  fenceHeightM: number;
  fenceType: string;
  gateCount: number;

  visualStyle: "simple" | "standard" | "realistic";
  terrainLook: string;
  moduleLook: string;
  structureLook: string;
  buildingLook: string;
  dayNight: "day" | "night" | "dusk";
};

export function resolveTwinPlant(
  spec: TwinSpec,
  derived?: TwinDerived,
): TwinPlant {
  const i = spec.intake ?? {};
  const capacity = num(i.plantAcCapacity, spec.capacityMw);
  const dc = num(i.plantDcCapacity, spec.capacityMw * spec.dcAcRatio);
  const moduleW = num(i.moduleRatedPowerW, spec.moduleWattageW);
  const totalModules = Math.max(
    1,
    Math.round(num(i.totalModules, derived?.moduleCount ?? (dc * 1_000_000) / moduleW)),
  );
  const modulesPerTable = Math.max(1, Math.round(num(i.modulesPerTable, 56)));
  const totalTables = Math.max(
    1,
    Math.round(num(i.totalTables, derived?.tableCount ?? Math.ceil(totalModules / modulesPerTable))),
  );
  const numberOfRows = Math.max(
    1,
    Math.round(num(i.numberOfRows, Math.round(Math.sqrt(totalTables / 1.6)))),
  );
  const tablesPerRow = Math.max(
    1,
    Math.round(num(i.tablesPerRow, Math.ceil(totalTables / numberOfRows))),
  );
  const blockCount = Math.max(1, Math.round(num(i.numberOfSolarBlocks, derived ? Math.max(1, Math.round(spec.capacityMw / 25)) : 1)));
  const mountingKind =
    i.mountingKind === "fixed_tilt" || i.mountingKind === "dual_axis"
      ? i.mountingKind
      : spec.mountingType === "fixed_tilt"
        ? "fixed_tilt"
        : "single_axis";
  const moduleLengthM = num(i.moduleLengthM, 2.279);
  const moduleWidthM = num(i.moduleWidthM, 1.134);
  const tracker = mountingKind !== "fixed_tilt";
  const cols = Math.min(12, Math.max(4, Math.ceil(modulesPerTable / 2)));
  const rowsOnTable = Math.max(1, Math.min(4, Math.ceil(modulesPerTable / cols)));
  const computedAlong = tracker
    ? cols * moduleLengthM + (cols - 1) * 0.035
    : cols * moduleWidthM + (cols - 1) * 0.035;
  const computedAcross = tracker
    ? rowsOnTable * moduleWidthM + (rowsOnTable - 1) * 0.035
    : rowsOnTable * moduleLengthM + (rowsOnTable - 1) * 0.035;
  const area = num(i.totalPlantArea, spec.landAreaAcres);
  const areaM2 = areaToM2(area, i.areaUnit || "acres");
  const terrain =
    i.terrainType === "mostly_flat" ||
    i.terrainType === "sloped" ||
    i.terrainType === "hilly" ||
    i.terrainType === "unknown"
      ? i.terrainType
      : "flat";
  const style =
    i.modelVisualStyle === "simple" || i.modelVisualStyle === "realistic"
      ? i.modelVisualStyle
      : "standard";
  const dayNight =
    i.dayNight === "night" || i.dayNight === "dusk" ? i.dayNight : "day";

  return {
    projectName: text(i.projectName),
    plantId: text(i.plantId),
    location: text(i.location),
    plantType: text(i.plantType, "solar"),
    status: text(i.status),
    capacityMw: capacity,
    dcCapacityMwp: dc,
    areaM2,
    areaAcres: areaM2 / 4046.8564224,
    latitude: num(i.latitude, spec.latitude),
    longitude: num(i.longitude, spec.longitude),
    terrainType: terrain,
    elevationM: num(i.averageSiteElevation, 0),

    solarTechnology: text(i.solarTechnology, spec.moduleTech),
    mountingKind,
    trackerType: text(i.trackerType),
    tiltDeg: num(i.tiltDeg, spec.tiltDeg),
    azimuthDeg: num(i.azimuthDeg, spec.azimuthDeg),

    moduleLengthM,
    moduleWidthM,
    moduleThicknessM: num(i.moduleThicknessMm, 35) / 1000,
    moduleWattageW: moduleW,
    totalModules,
    modulesPerTable,
    cellCount: Math.max(0, Math.round(num(i.numberOfCells, 144))),
    cellTechnology: text(i.cellTechnology),

    totalTables,
    tableLengthM: num(i.tableLengthM, computedAlong),
    tableWidthM: num(i.tableWidthM, computedAcross),
    tableHeightM: num(i.tableHeightM, 0),
    rowToRowM: num(i.rowToRowDistanceM, tracker ? 8 : 6.5),
    tableToTableM: num(i.tableToTableDistanceM, 0.4),
    numberOfRows,
    tablesPerRow,
    rowOrientationDeg: num(i.rowOrientationDeg, spec.azimuthDeg),
    structureHeightM: num(i.structureHeightM, tracker ? 2.2 : 1.8),

    blockCount,
    tablesPerBlock: Math.max(1, Math.round(num(i.tablesPerBlock, Math.ceil(totalTables / blockCount)))),
    rowsPerBlock: Math.max(1, Math.round(num(i.rowsPerBlock, Math.ceil(numberOfRows / blockCount)))),
    blockGapM: num(i.blockToBlockDistanceM, 12),

    inverterCount: Math.max(1, Math.round(num(i.numberOfInverters, derived?.inverterCount ?? 1))),
    inverterKind: text(i.inverterKind, spec.inverterType),
    inverterLengthM: num(i.inverterLengthM, spec.inverterType === "string" ? 1.1 : 3.6),
    inverterWidthM: num(i.inverterWidthM, spec.inverterType === "string" ? 0.7 : 1.8),
    inverterHeightM: num(i.inverterHeightM, spec.inverterType === "string" ? 0.9 : 2.5),
    invertersPerBlock: Math.max(1, Math.round(num(i.invertersPerBlock, 1))),

    transformerCount: Math.max(1, Math.round(num(i.numberOfTransformers, 1))),
    transformerType: text(i.transformerType),
    transformerLengthM: num(i.transformerLengthM, 5.2),
    transformerWidthM: num(i.transformerWidthM, 3.4),
    transformerHeightM: num(i.transformerHeightM, 2.8),

    substationPresent: yes(i.substationPresent, true),
    substationCount: Math.max(1, Math.round(num(i.numberOfSubstations, 1))),
    substationAreaM2: num(i.substationAreaM2, 180),
    substationType: text(i.substationType, "ais"),

    roads: yes(i.internalRoadsPresent, spec.includeRoads),
    accessRoad: yes(i.mainAccessRoadPresent, spec.includeRoads),
    roadWidthM: num(i.approximateRoadWidthM, 4),
    roadSurface: text(i.roadSurfaceType, "gravel"),

    controlRoom: yes(i.controlRoomPresent, spec.includeBuilding),
    omBuilding: yes(i.omBuildingPresent, spec.includeBuilding),
    warehouse: yes(i.warehousePresent, false),
    securityCabin: yes(i.securityCabinPresent, false),
    otherBuildings: Math.max(0, Math.round(num(i.otherBuildings, 0))),
    buildingLengthM: num(i.buildingLengthM, 12),
    buildingWidthM: num(i.buildingWidthM, 8),
    buildingHeightM: num(i.buildingHeightM, 4.2),

    fence: yes(i.perimeterFencePresent, spec.includeFence),
    fenceHeightM: num(i.fenceHeightM, 2.4),
    fenceType: text(i.fenceType, "chain_link"),
    gateCount: Math.max(0, Math.round(num(i.numberOfGates, spec.includeFence ? 2 : 0))),

    visualStyle: style,
    terrainLook: text(i.terrainAppearance, "bare"),
    moduleLook: text(i.moduleAppearance, "dark"),
    structureLook: text(i.structureAppearance, "galvanized"),
    buildingLook: text(i.buildingAppearance, "concrete"),
    dayNight,
  };
}
