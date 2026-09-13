import type { TwinDerived, TwinSpec } from "@/lib/api";
import {
  formatAssetId,
  resolveAssetIdPatterns,
} from "@/lib/assetModel";
import { resolveTwinPlant, type TwinPlant } from "@/lib/twinPlant";

export type Vec3 = [number, number, number];

export type TablePose = {
  x: number;
  y: number;
  z: number;
  rotY: number;
  tilt: number;
  rows: number;
  cols: number;
  tracker: boolean;
  dualAxis: boolean;
  along: number;
  across: number;
  height: number;
  /** Canonical asset id (e.g. TBL-001). */
  assetId?: string;
  /** 1-based logical table index across the plant. */
  logicalIndex?: number;
  blockAssetId?: string;
  blockIndex?: number;
};

export type EquipmentPose = {
  x: number;
  y: number;
  z: number;
  label?: string;
  w?: number;
  d?: number;
  h?: number;
  assetId?: string;
};

export type BuildingPose = EquipmentPose & {
  kind: "control" | "om" | "warehouse" | "security" | "other";
};

export type RoadPatch = {
  x: number;
  z: number;
  w: number;
  d: number;
  assetId?: string;
};

export type TableRegistryEntry = {
  logicalIndex: number;
  blockIndex: number;
  blockAssetId: string;
  assetId: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  along: number;
  across: number;
};

export type TwinLayout = {
  width: number;
  depth: number;
  spec: TwinSpec;
  derived: TwinDerived;
  plant: TwinPlant;
  tables: TablePose[];
  /** All logical tables (including those not drawn in 3D due to stride). */
  tableRegistry: TableRegistryEntry[];
  combiners: EquipmentPose[];
  inverters: EquipmentPose[];
  transformers: EquipmentPose[];
  substation: EquipmentPose;
  substations: EquipmentPose[];
  grid: EquipmentPose;
  building: EquipmentPose | null;
  buildings: BuildingPose[];
  weather: EquipmentPose | null;
  roads: RoadPatch[];
  dcStrings: Vec3[][];
  dcFeeders: Vec3[][];
  acCables: Vec3[][];
  hvCables: Vec3[][];
  fencePosts: Array<{ x: number; z: number; h: number }>;
  gates: Array<{ x: number; z: number; rotY: number; assetId?: string }>;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function tableFootprint(
  tracker: boolean,
  size?: { along: number; across: number },
) {
  if (size) return size;
  return tracker
    ? { along: 18.5, across: 2.3 }
    : { along: 9.3, across: 4.6 };
}

function buildingAssetId(kind: BuildingPose["kind"], index: number) {
  if (kind === "control") return formatAssetId("CTRL-{number:03d}", index);
  if (kind === "om") return formatAssetId("OM-{number:03d}", index);
  if (kind === "warehouse") return formatAssetId("WRH-{number:03d}", index);
  if (kind === "security") return formatAssetId("SEC-{number:03d}", index);
  return formatAssetId("BLDG-{number:03d}", index);
}

export function buildTwinLayout(spec: TwinSpec, derived: TwinDerived): TwinLayout {
  const plant = resolveTwinPlant(spec, derived);
  const patterns = resolveAssetIdPatterns(spec.intake);
  const tracker = plant.mountingKind !== "fixed_tilt";
  const dualAxis = plant.mountingKind === "dual_axis";
  const cols = Math.min(12, Math.max(2, Math.ceil(plant.modulesPerTable / 2)));
  const rowsOnTable = Math.max(1, Math.min(4, Math.ceil(plant.modulesPerTable / cols)));
  const along = Math.max(0.8, plant.tableLengthM);
  const across = Math.max(0.8, plant.tableWidthM);
  const tableY = Math.max(0.6, plant.structureHeightM || plant.tableHeightM || 1.8);
  const yaw = ((plant.rowOrientationDeg - 180) * Math.PI) / 180;
  const tilt = (tracker
    ? plant.trackerType === "tilted"
      ? plant.tiltDeg
      : Math.min(plant.tiltDeg, 18)
    : plant.tiltDeg) * (Math.PI / 180);

  const blockCount = Math.max(1, plant.blockCount);
  const blockCols = clamp(Math.round(Math.sqrt(blockCount * 1.4)), 1, 8);
  const blockRows = Math.ceil(blockCount / blockCols);
  const roadW = Math.max(3.2, plant.roadWidthM);
  const blockGap = Math.max(
    plant.roads ? roadW + 4 : plant.blockGapM,
    plant.blockGapM,
  );

  // Demo-sized array — fewer tables so the whole plant stays readable.
  const gapAlong = Math.max(0.4, Math.min(plant.tableToTableM, 0.85));
  const gapAcross = Math.max(2.8, Math.min(plant.rowToRowM * 0.48, 4.8));
  const pitchAlong = along + gapAlong;
  const pitchAcross = across + gapAcross;

  const tablesPerRow = clamp(
    Math.min(plant.tablesPerRow, Math.ceil(plant.tablesPerBlock / Math.max(1, plant.rowsPerBlock))),
    5,
    12,
  );
  const rowsPerBlock = clamp(
    Math.min(
      Math.ceil(plant.numberOfRows / blockRows),
      Math.ceil(plant.tablesPerBlock / tablesPerRow),
    ),
    5,
    10,
  );

  const padX = 2.8;
  const padZ = 2.2;
  const inverterBand = 5.5;
  const blockW = tablesPerRow * pitchAlong - gapAlong + padX * 2;
  const blockD = rowsPerBlock * pitchAcross - gapAcross + padZ * 2 + inverterBand;

  const arrayW = blockCols * blockW + (blockCols - 1) * blockGap;
  const arrayD = blockRows * blockD + (blockRows - 1) * blockGap;
  const setback = 6;
  const yardD = plant.substationPresent
    ? Math.max(20, Math.sqrt(Math.max(plant.substationAreaM2, 64)) + 10)
    : 12;
  const buildingBand = plant.controlRoom || plant.omBuilding || plant.warehouse ? 12 : 5;
  const width = Math.max(arrayW + setback * 2, 48);
  const depth = arrayD + setback + yardD + buildingBand;
  const blockPadX = padX;
  const blockPadZ = padZ;
  const originX = -arrayW / 2;
  const originZ = -depth / 2 + setback;
  const visualCap = 480;
  const plannedTables = blockCount * rowsPerBlock * tablesPerRow;
  const stride = Math.max(1, Math.ceil(plannedTables / visualCap));

  const tables: TablePose[] = [];
  const tableRegistry: TableRegistryEntry[] = [];
  const combiners: EquipmentPose[] = [];
  const inverterList: EquipmentPose[] = [];
  const dcStrings: Vec3[][] = [];
  const dcFeeders: Vec3[][] = [];
  const acCables: Vec3[][] = [];
  const roads: RoadPatch[] = [];

  let blockIndex = 0;
  let tableIndex = 0;
  for (let br = 0; br < blockRows; br += 1) {
    for (let bc = 0; bc < blockCols; bc += 1) {
      if (blockIndex >= blockCount) break;
      const blockNumber = blockIndex + 1;
      const blockAssetId = formatAssetId(patterns.block, blockNumber);
      const bx = originX + bc * (blockW + blockGap);
      const bz = originZ + br * (blockD + blockGap);
      const tableAnchors: Vec3[] = [];

      for (let r = 0; r < rowsPerBlock; r += 1) {
        for (let c = 0; c < tablesPerRow; c += 1) {
          const x = bx + blockPadX + along / 2 + c * pitchAlong;
          const z = bz + blockPadZ + across / 2 + r * pitchAcross;
          const logicalIndex = tableIndex + 1;
          const tableAssetId = formatAssetId(patterns.table, logicalIndex);
          tableRegistry.push({
            logicalIndex,
            blockIndex: blockNumber,
            blockAssetId,
            assetId: tableAssetId,
            x,
            y: tableY,
            z,
            rotY: yaw,
            along,
            across,
          });
          if (tableIndex % stride === 0) {
            tables.push({
              x,
              y: tableY,
              z,
              rotY: yaw,
              tilt,
              rows: rowsOnTable,
              cols,
              tracker,
              dualAxis,
              along,
              across,
              height: tableY,
              assetId: tableAssetId,
              logicalIndex,
              blockAssetId,
              blockIndex: blockNumber,
            });
            const end: Vec3 = [x, 0.35, z + (tracker ? along : across) / 2];
            if (dcStrings.length < 240) {
              dcStrings.push([
                [x, 0.5, z - (tracker ? along : across) / 2],
                end,
              ]);
            }
            if (tableAnchors.length < 80) tableAnchors.push(end);
          }
          tableIndex += 1;
        }
      }

      const remainingBlocks = blockCount - blockIndex;
      const remainingInv = plant.inverterCount - inverterList.length;
      const invInBlock = Math.max(1, Math.ceil(remainingInv / remainingBlocks));
      for (let n = 0; n < invInBlock; n += 1) {
        const t = invInBlock === 1 ? 0.5 : n / (invInBlock - 1);
        const invX = bx + padX + t * Math.max(blockW - padX * 2, 1);
        const invZ = bz + blockD - inverterBand * 0.45;
        const invNumber = inverterList.length + 1;
        const invId = formatAssetId(patterns.inverter, invNumber);
        inverterList.push({
          x: invX,
          y: 0,
          z: invZ,
          label: invId,
          assetId: invId,
          w: plant.inverterLengthM,
          d: plant.inverterWidthM,
          h: plant.inverterHeightM,
        });
      }

      const combCount = Math.max(1, Math.ceil(tableAnchors.length / 10));
      for (let g = 0; g < combCount; g += 1) {
        const slice = tableAnchors.slice(g * 10, (g + 1) * 10);
        if (slice.length === 0) continue;
        const avgX = slice.reduce((s, p) => s + p[0], 0) / slice.length;
        const combNumber = combiners.length + 1;
        const combId = formatAssetId(patterns.combiner, combNumber);
        const comb = {
          x: avgX,
          y: 0,
          z: bz + blockD - inverterBand + 1.2,
          assetId: combId,
          label: combId,
        };
        combiners.push(comb);
        if (dcFeeders.length < 120) {
          for (const p of slice) dcFeeders.push([p, [comb.x, 0.3, comb.z]]);
        }
      }

      if (plant.roads) {
        // Corridor roads only — never draw a spine through the array field.
        if (br < blockRows - 1 || blockRows === 1) {
          roads.push({
            x: bx + blockW / 2,
            z: bz + blockD + blockGap / 2,
            w: blockW + (bc < blockCols - 1 ? blockGap : 0),
            d: Math.min(roadW, blockGap * 0.85),
          });
        }
        if (bc > 0) {
          roads.push({
            x: bx - blockGap / 2,
            z: bz + blockD / 2,
            w: Math.min(roadW, blockGap * 0.85),
            d: blockD + blockGap,
          });
        }
      }

      blockIndex += 1;
    }
  }

  const yardZ = depth / 2 - yardD / 2;
  const transformers: EquipmentPose[] = [];
  const xfmrCount = plant.transformerCount;
  for (let n = 0; n < xfmrCount; n += 1) {
    const t = xfmrCount === 1 ? 0 : n / (xfmrCount - 1);
    const trfId = formatAssetId(patterns.transformer, n + 1);
    transformers.push({
      x: -12 + t * 10,
      y: 0,
      z: yardZ - 4,
      w: plant.transformerLengthM,
      d: plant.transformerWidthM,
      h: plant.transformerHeightM,
      label: trfId,
      assetId: trfId,
    });
  }

  const substations: EquipmentPose[] = [];
  if (plant.substationPresent) {
    const side = Math.max(8, Math.sqrt(Math.max(plant.substationAreaM2, 64)));
    for (let n = 0; n < plant.substationCount; n += 1) {
      const subId = formatAssetId(patterns.substation, n + 1);
      substations.push({
        x: 8 + n * (side + 6),
        y: 0,
        z: yardZ + 3,
        w: side,
        d: side * 0.75,
        h: plant.substationType === "gis" ? 5 : 7,
        label: subId,
        assetId: subId,
      });
    }
  }
  const substation = substations[0] ?? { x: 8, y: 0, z: yardZ + 3, w: 0, d: 0, h: 0 };
  const grid: EquipmentPose = {
    x: substation.x,
    y: 0,
    z: depth / 2 + 12,
    assetId: "GRID-001",
    label: "GRID-001",
  };

  const buildings: BuildingPose[] = [];
  let buildX = -width / 2 + 10;
  const buildZ = depth / 2 - 8;
  const bw = plant.buildingLengthM;
  const bd = plant.buildingWidthM;
  const bh = plant.buildingHeightM;
  const kindCounters: Record<string, number> = {};
  const pushBuilding = (pose: Omit<BuildingPose, "assetId" | "label">) => {
    kindCounters[pose.kind] = (kindCounters[pose.kind] ?? 0) + 1;
    const id = buildingAssetId(pose.kind, kindCounters[pose.kind]);
    buildings.push({ ...pose, assetId: id, label: id });
  };
  if (plant.controlRoom) {
    pushBuilding({ kind: "control", x: buildX, y: 0, z: buildZ, w: bw, d: bd, h: bh });
    buildX += bw + 4;
  }
  if (plant.omBuilding) {
    pushBuilding({
      kind: "om",
      x: buildX,
      y: 0,
      z: buildZ,
      w: bw * 0.9,
      d: bd * 0.85,
      h: bh * 0.9,
    });
    buildX += bw + 3;
  }
  if (plant.warehouse) {
    pushBuilding({
      kind: "warehouse",
      x: buildX,
      y: 0,
      z: buildZ,
      w: bw * 1.3,
      d: bd * 1.1,
      h: bh * 1.15,
    });
    buildX += bw * 1.3 + 3;
  }
  if (plant.securityCabin) {
    pushBuilding({
      kind: "security",
      x: 0,
      y: 0,
      z: depth / 2 - 4,
      w: 4.2,
      d: 3.2,
      h: 3,
    });
  }
  for (let n = 0; n < plant.otherBuildings; n += 1) {
    pushBuilding({
      kind: "other",
      x: buildX + n * 8,
      y: 0,
      z: buildZ,
      w: Math.max(5, bw * 0.6),
      d: Math.max(4, bd * 0.6),
      h: Math.max(3, bh * 0.7),
    });
  }
  const building = buildings[0] ?? null;
  const weather: EquipmentPose | null = spec.includeWeatherStation
    ? { x: width / 2 - 10, y: 0, z: depth / 2 - 8, assetId: "WST-001", label: "WST-001" }
    : plant.controlRoom
      ? { x: width / 2 - 10, y: 0, z: depth / 2 - 8, assetId: "WST-001", label: "WST-001" }
      : null;

  for (const inv of inverterList) {
    const xfmr = transformers[0];
    if (!xfmr) continue;
    acCables.push([
      [inv.x, 0.25, inv.z],
      [inv.x, 0.2, yardZ - 10],
      [xfmr.x, 0.35, xfmr.z],
    ]);
  }
  const hvCables: Vec3[][] = [];
  if (plant.substationPresent && substations[0]) {
    const ss = substations[0];
    for (const xfmr of transformers) {
      acCables.push([
        [xfmr.x, 0.8, xfmr.z],
        [ss.x - 3, 1.2, ss.z],
        [ss.x, 2.2, ss.z],
      ]);
    }
    hvCables.push(
      [
        [ss.x - 2, 6.2, ss.z],
        [grid.x - 3, 9, grid.z],
      ],
      [
        [ss.x, 6.4, ss.z],
        [grid.x, 9.2, grid.z],
      ],
      [
        [ss.x + 2, 6.2, ss.z],
        [grid.x + 3, 9, grid.z],
      ],
    );
  }

  if (plant.roads) {
    // Yard collector + access only (no full-depth road under panels).
    roads.push({
      x: 0,
      z: yardZ,
      w: Math.min(width - 12, arrayW + 16),
      d: roadW + 0.8,
    });
    if (plant.accessRoad) {
      roads.push({ x: 0, z: depth / 2 + 6, w: roadW + 2, d: 16 });
      // Short stub from yard to gate — stays south of the array.
      roads.push({
        x: 0,
        z: (yardZ + depth / 2) / 2,
        w: roadW,
        d: Math.max(8, depth / 2 - yardZ + 4),
      });
    }
  }
  roads.forEach((road, index) => {
    road.assetId = formatAssetId("ROAD-{number:03d}", index + 1);
  });

  const fencePosts: Array<{ x: number; z: number; h: number }> = [];
  const gates: Array<{ x: number; z: number; rotY: number; assetId?: string }> = [];
  const hw = width / 2;
  const hd = depth / 2;
  const gateCount = plant.fence ? plant.gateCount : 0;
  const gateWidth = 8;
  const southGates: number[] = [];
  for (let g = 0; g < gateCount; g += 1) {
    const t = gateCount === 1 ? 0 : (g / (gateCount - 1) - 0.5) * Math.min(width * 0.5, 40);
    southGates.push(t);
    gates.push({
      x: t,
      z: hd,
      rotY: 0,
      assetId: formatAssetId("GATE-{number:03d}", g + 1),
    });
  }
  if (plant.fence) {
    const step = plant.fenceType === "palisade" ? 1.2 : plant.fenceType === "concrete" ? 3.2 : 4;
    const isGateX = (x: number) =>
      southGates.some((gx) => Math.abs(x - gx) < gateWidth / 2);
    for (let x = -hw; x <= hw; x += step) {
      fencePosts.push({ x, z: -hd, h: plant.fenceHeightM });
      if (!isGateX(x)) fencePosts.push({ x, z: hd, h: plant.fenceHeightM });
    }
    for (let z = -hd + step; z < hd; z += step) {
      fencePosts.push({ x: -hw, z, h: plant.fenceHeightM });
      fencePosts.push({ x: hw, z, h: plant.fenceHeightM });
    }
  }

  return {
    width,
    depth,
    spec,
    derived,
    plant,
    tables,
    tableRegistry,
    combiners,
    inverters: inverterList,
    transformers,
    substation,
    substations,
    grid,
    building,
    buildings,
    weather,
    roads,
    dcStrings,
    dcFeeders,
    acCables,
    hvCables,
    fencePosts,
    gates,
  };
}
