import type { TwinDerived, TwinSpec } from "@/lib/api";

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
};

export type EquipmentPose = {
  x: number;
  y: number;
  z: number;
  label?: string;
};

export type RoadPatch = {
  x: number;
  z: number;
  w: number;
  d: number;
};

export type TwinLayout = {
  width: number;
  depth: number;
  spec: TwinSpec;
  derived: TwinDerived;
  tables: TablePose[];
  combiners: EquipmentPose[];
  inverters: EquipmentPose[];
  transformers: EquipmentPose[];
  substation: EquipmentPose;
  grid: EquipmentPose;
  building: EquipmentPose | null;
  weather: EquipmentPose | null;
  roads: RoadPatch[];
  dcStrings: Vec3[][];
  dcFeeders: Vec3[][];
  acCables: Vec3[][];
  hvCables: Vec3[][];
  fencePosts: Array<{ x: number; z: number }>;
};

const TABLE_COLS = 8;
const TABLE_ROWS = 2;
const MODULE_W = 1.134;
const MODULE_L = 2.279;
const MODULE_GAP = 0.035;
const RACK_H = 1.15;
const MAX_TABLES = 96;
const DISPLAY_WORLD = 118;

export function tableFootprint(tracker: boolean) {
  if (tracker) {
    return {
      along: TABLE_COLS * MODULE_L + (TABLE_COLS - 1) * MODULE_GAP,
      across: TABLE_ROWS * MODULE_W + (TABLE_ROWS - 1) * MODULE_GAP,
    };
  }
  return {
    along: TABLE_COLS * MODULE_W + (TABLE_COLS - 1) * MODULE_GAP,
    across: TABLE_ROWS * MODULE_L + (TABLE_ROWS - 1) * MODULE_GAP,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function buildTwinLayout(spec: TwinSpec, derived: TwinDerived): TwinLayout {
  const tracker = spec.mountingType === "single_axis";
  const aspect = tracker ? 1.55 : 1.32;
  const width = DISPLAY_WORLD * Math.sqrt(aspect);
  const depth = DISPLAY_WORLD / Math.sqrt(aspect);

  const southYard = depth * 0.2;
  const setback = 5;
  const arrayW = Math.max(20, width - setback * 2);
  const arrayD = Math.max(18, depth - setback - southYard);

  const inverterCount = Math.max(1, derived.inverterCount);
  const blockCount = clamp(inverterCount, 1, 8);
  const nCols = clamp(
    Math.round(Math.sqrt(blockCount * (arrayW / arrayD))),
    1,
    4,
  );
  const nRows = Math.ceil(blockCount / nCols);
  const gapX = 4;
  const gapZ = 5;
  const cellW = (arrayW - (nCols - 1) * gapX) / nCols;
  const cellD = (arrayD - (nRows - 1) * gapZ) / nRows;

  const fp = tableFootprint(tracker);
  const pitch = fp.across / spec.groundCoverageRatio;
  const originX = -width / 2 + setback;
  const originZ = -depth / 2 + setback;

  const tables: TablePose[] = [];
  const combiners: EquipmentPose[] = [];
  const inverters: EquipmentPose[] = [];
  const dcStrings: Vec3[][] = [];
  const dcFeeders: Vec3[][] = [];
  const acCables: Vec3[][] = [];
  const roads: RoadPatch[] = [];

  const tilt = (tracker ? 18 : spec.tiltDeg) * (Math.PI / 180);
  const yaw = ((spec.azimuthDeg - 180) * Math.PI) / 180;

  let blockIndex = 0;
  for (let r = 0; r < nRows; r += 1) {
    for (let c = 0; c < nCols; c += 1) {
      if (blockIndex >= blockCount) break;
      const bx = originX + c * (cellW + gapX);
      const bz = originZ + r * (cellD + gapZ);
      const cx = bx + cellW / 2;
      const cz = bz + cellD / 2;

      const innerW = cellW - 4;
      const innerD = cellD - 6;
      let tablesInBlock = 0;
      const tableAnchors: Array<{ x: number; z: number; end: Vec3 }> = [];

      if (tracker) {
        const naturalAcross = Math.max(2, Math.floor(innerW / pitch));
        const naturalAlong = Math.max(1, Math.floor(innerD / (fp.along + 1.2)));
        const remaining = Math.max(4, MAX_TABLES - tables.length);
        const natural = naturalAcross * naturalAlong;
        const scale =
          natural > remaining ? Math.sqrt(remaining / natural) : 1;
        const nAcross = Math.max(2, Math.round(naturalAcross * scale));
        const nAlong = Math.max(1, Math.round(naturalAlong * scale));
        const stepX = nAcross > 1 ? innerW / (nAcross - 1) : 0;
        const stepZ = nAlong > 1 ? innerD / nAlong : fp.along;
        const startX = cx - innerW / 2;
        const startZ = cz - innerD / 2 + stepZ / 2;
        for (let iz = 0; iz < nAlong; iz += 1) {
          for (let ix = 0; ix < nAcross; ix += 1) {
            const x = startX + ix * stepX;
            const z = startZ + iz * stepZ;
            tables.push({
              x,
              y: RACK_H,
              z,
              rotY: yaw,
              tilt,
              rows: TABLE_ROWS,
              cols: TABLE_COLS,
              tracker: true,
            });
            const end: Vec3 = [x, 0.35, z + fp.along / 2];
            dcStrings.push([
              [x, 0.55, z - fp.along / 2],
              [x, 0.45, z + fp.along / 2],
              end,
            ]);
            tableAnchors.push({ x, z, end });
            tablesInBlock += 1;
          }
        }
      } else {
        const naturalAlong = Math.max(2, Math.floor(innerW / (fp.along + 1.0)));
        const naturalRows = Math.max(1, Math.floor(innerD / pitch));
        const remaining = Math.max(4, MAX_TABLES - tables.length);
        const natural = naturalAlong * naturalRows;
        const scale =
          natural > remaining ? Math.sqrt(remaining / natural) : 1;
        const nAlong = Math.max(2, Math.round(naturalAlong * scale));
        const nRowsT = Math.max(1, Math.round(naturalRows * scale));
        const stepX = nAlong > 1 ? innerW / nAlong : fp.along;
        const stepZ = nRowsT > 1 ? innerD / (nRowsT - 1) : 0;
        const startX = cx - innerW / 2 + stepX / 2;
        const startZ = cz - innerD / 2;
        for (let iz = 0; iz < nRowsT; iz += 1) {
          for (let ix = 0; ix < nAlong; ix += 1) {
            const x = startX + ix * stepX;
            const z = startZ + iz * stepZ;
            tables.push({
              x,
              y: RACK_H,
              z,
              rotY: yaw,
              tilt,
              rows: TABLE_ROWS,
              cols: TABLE_COLS,
              tracker: false,
            });
            const end: Vec3 = [x - fp.along / 2, 0.35, z];
            dcStrings.push([
              [x + fp.along / 2, 0.55, z],
              [x - fp.along / 2, 0.45, z],
              end,
            ]);
            tableAnchors.push({ x, z, end });
            tablesInBlock += 1;
          }
        }
      }

      const invZ = bz + cellD - 1.8;
      const invX = cx;
      const invLabel = `INV-${String(blockIndex + 1).padStart(2, "0")}`;
      inverters.push({ x: invX, y: 0, z: invZ, label: invLabel });

      const combinerGroups = Math.max(1, Math.ceil(tablesInBlock / 8));
      for (let g = 0; g < combinerGroups; g += 1) {
        const slice = tableAnchors.slice(g * 8, (g + 1) * 8);
        if (slice.length === 0) continue;
        const avgX = slice.reduce((s, t) => s + t.x, 0) / slice.length;
        const comb = { x: avgX, y: 0, z: invZ - 4.5 };
        combiners.push(comb);
        for (const t of slice) {
          dcFeeders.push([t.end, [comb.x, 0.3, comb.z]]);
        }
        dcFeeders.push([
          [comb.x, 0.3, comb.z],
          [invX, 0.35, invZ],
        ]);
      }

      acCables.push([
        [invX, 0.25, invZ],
        [invX, 0.2, bz + cellD + gapZ / 2],
        [0, 0.2, bz + cellD + gapZ / 2],
      ]);

      if (spec.includeRoads) {
        roads.push({
          x: cx,
          z: bz + cellD + gapZ / 2,
          w: cellW + gapX,
          d: 3.2,
        });
        roads.push({
          x: bx - 0.8,
          z: cz,
          w: 2.6,
          d: cellD,
        });
      }

      blockIndex += 1;
    }
  }

  const yardZ = depth / 2 - southYard / 2;
  const xfmr = { x: -8, y: 0, z: yardZ - 2 };
  const substation = { x: 5, y: 0, z: yardZ + 4 };
  const grid = { x: 5, y: 0, z: depth / 2 + 10 };
  const transformers = [xfmr];
  const building = spec.includeBuilding
    ? { x: -width / 2 + 10, y: 0, z: depth / 2 - 8 }
    : null;
  const weather = spec.includeWeatherStation
    ? { x: width / 2 - 8, y: 0, z: depth / 2 - 7 }
    : null;

  for (const inv of inverters) {
    acCables.push([
      [inv.x, 0.2, inv.z],
      [0, 0.2, inv.z],
      [0, 0.25, xfmr.z - 8],
      [xfmr.x, 0.35, xfmr.z],
    ]);
  }

  acCables.push([
    [xfmr.x, 0.8, xfmr.z],
    [substation.x - 4, 1.2, substation.z],
    [substation.x, 2.4, substation.z],
  ]);

  const hvCables: Vec3[][] = [
    [
      [substation.x - 2, 7.2, substation.z],
      [grid.x - 3, 9.5, grid.z - 8],
      [grid.x - 3, 11, grid.z],
    ],
    [
      [substation.x, 7.4, substation.z],
      [grid.x, 9.8, grid.z - 8],
      [grid.x, 11.2, grid.z],
    ],
    [
      [substation.x + 2, 7.2, substation.z],
      [grid.x + 3, 9.5, grid.z - 8],
      [grid.x + 3, 11, grid.z],
    ],
  ];

  if (spec.includeRoads) {
    roads.push({ x: 0, z: 0, w: 4.2, d: depth - 4 });
    roads.push({
      x: 0,
      z: depth / 2 - southYard / 2,
      w: width - 8,
      d: 4.5,
    });
    roads.push({
      x: 0,
      z: depth / 2 - 3,
      w: 7,
      d: 10,
    });
  }

  const fencePosts: Array<{ x: number; z: number }> = [];
  if (spec.includeFence) {
    const hw = width / 2;
    const hd = depth / 2;
    const step = 4;
    for (let x = -hw; x <= hw; x += step) {
      fencePosts.push({ x, z: -hd }, { x, z: hd });
    }
    for (let z = -hd + step; z < hd; z += step) {
      fencePosts.push({ x: -hw, z }, { x: hw, z });
    }
  }

  return {
    width,
    depth,
    spec,
    derived,
    tables,
    combiners,
    inverters,
    transformers,
    substation,
    grid,
    building,
    weather,
    roads,
    dcStrings,
    dcFeeders,
    acCables,
    hvCables,
    fencePosts,
  };
}
