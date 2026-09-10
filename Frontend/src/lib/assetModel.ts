import type { TwinRecord } from "@/lib/api";
import type { TwinLayout } from "@/lib/twinLayout";
import { buildTwinLayout } from "@/lib/twinLayout";
import type { TwinPlant } from "@/lib/twinPlant";

/** Physical asset types for Phase 2 identity model. */
export const ASSET_TYPES = [
  "PLANT",
  "BLOCK",
  "TABLE",
  "MODULE",
  "STRING",
  "COMBINER",
  "INVERTER",
  "TRANSFORMER",
  "SUBSTATION",
  "BUILDING",
  "CONTROL_ROOM",
  "OM_BUILDING",
  "WAREHOUSE",
  "SECURITY_CABIN",
  "WEATHER_STATION",
  "ROAD",
  "FENCE",
  "GATE",
  "GRID_INTERCONNECTION",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

export type AssetStatus =
  | "operational"
  | "warning"
  | "fault"
  | "offline"
  | "unknown";

export type AssetVec3 = { x: number; y: number; z: number };

export type AssetGeoPosition = {
  latitude?: number;
  longitude?: number;
  elevation?: number;
};

export type Asset = {
  assetId: string;
  assetType: AssetType;
  name: string;
  parentId?: string;
  plantId: string;
  children: string[];
  status: AssetStatus;
  position?: AssetVec3;
  rotation?: AssetVec3;
  geoPosition?: AssetGeoPosition;
  geometry?: { type: string; modelId?: string };
  metadata: Record<string, unknown>;
  /** Extension points for Phase 3+ (intentionally unused in Phase 2). */
  electricalConnections?: unknown[];
  telemetry?: unknown;
  maintenanceRecords?: unknown[];
  inspectionRecords?: unknown[];
  documents?: unknown[];
  history?: unknown[];
  simulationData?: unknown;
};

export type AssetCounts = {
  blocks: number;
  tables: number;
  modules: number;
  strings: number;
  combiners: number;
  inverters: number;
  transformers: number;
  substations: number;
  buildings: number;
  weatherStations: number;
  roads: number;
  fences: number;
  gates: number;
  gridInterconnections: number;
};

export type AssetModel = {
  plantId: string;
  rootId: string;
  assets: Record<string, Asset>;
  order: string[];
  counts: AssetCounts;
  /** Logical table index (1-based) → table assetId */
  tableIndexToId: Record<number, string>;
  /** Visual layout table index → assetId */
  visualTableAssetIds: string[];
  generatedAt: string;
  error?: string;
};

export type AssetIdPatterns = {
  block: string;
  table: string;
  module: string;
  inverter: string;
  transformer: string;
  combiner: string;
  substation: string;
  plant: string;
};

const DEFAULT_PATTERNS: AssetIdPatterns = {
  plant: "PLANT-{number:03d}",
  block: "BLK-{number:03d}",
  table: "TBL-{number:03d}",
  module: "MOD-{number:03d}",
  inverter: "INV-{number:03d}",
  transformer: "TRF-{number:03d}",
  combiner: "CB-{number:03d}",
  substation: "SUB-{number:03d}",
};

/** Soft cap: above this, modules stay virtual (resolved on demand). */
export const MODULE_MATERIALIZE_LIMIT = 25_000;

const ASSET_TYPE_SET = new Set<string>(ASSET_TYPES);

function hash32(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function unit(seed: string): number {
  return hash32(seed) / 4294967296;
}

function mockStatus(seed: string): AssetStatus {
  const roll = unit(`${seed}:status`);
  if (roll > 0.985) return "offline";
  if (roll > 0.96) return "fault";
  if (roll > 0.93) return "warning";
  return "operational";
}

export function formatAssetId(pattern: string, number: number): string {
  const trimmed = pattern.trim() || "ASSET-{number:03d}";
  if (/\{number(?::0?\d+d)?\}/i.test(trimmed)) {
    return trimmed.replace(/\{number(?::0?(\d+)d)?\}/gi, (_, width) => {
      const w = width ? Number(width) : 3;
      return String(number).padStart(Number.isFinite(w) ? w : 3, "0");
    });
  }
  const prefix = trimmed.replace(/-+$/, "");
  return `${prefix}-${String(number).padStart(3, "0")}`;
}

export function resolveAssetIdPatterns(
  intake: Record<string, string> | undefined,
): AssetIdPatterns {
  const i = intake ?? {};
  const withPrefix = (pattern: string | undefined, prefix: string | undefined, fallback: string) => {
    const p = pattern?.trim();
    if (p) return p;
    const pref = prefix?.trim();
    if (pref) return `${pref}-{number:03d}`;
    return fallback;
  };
  return {
    plant: i.plantIdNumberingPattern?.trim() || DEFAULT_PATTERNS.plant,
    block: withPrefix(i.blockNumberingPattern, i.blockIdPrefix, DEFAULT_PATTERNS.block),
    table: withPrefix(i.tableNumberingPattern, i.tableIdPrefix, DEFAULT_PATTERNS.table),
    module: withPrefix(i.moduleNumberingPattern, i.moduleIdPrefix, DEFAULT_PATTERNS.module),
    inverter: withPrefix(
      i.inverterNumberingPattern,
      i.inverterIdPrefix,
      DEFAULT_PATTERNS.inverter,
    ),
    transformer: withPrefix(
      i.transformerNumberingPattern,
      i.transformerIdPrefix,
      DEFAULT_PATTERNS.transformer,
    ),
    combiner: DEFAULT_PATTERNS.combiner,
    substation: DEFAULT_PATTERNS.substation,
  };
}

function title(value: string) {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function distribute(total: number, buckets: number) {
  const n = Math.max(1, buckets);
  const base = Math.floor(total / n);
  const rem = total % n;
  return Array.from({ length: n }, (_, index) => base + (index < rem ? 1 : 0));
}

function emptyCounts(): AssetCounts {
  return {
    blocks: 0,
    tables: 0,
    modules: 0,
    strings: 0,
    combiners: 0,
    inverters: 0,
    transformers: 0,
    substations: 0,
    buildings: 0,
    weatherStations: 0,
    roads: 0,
    fences: 0,
    gates: 0,
    gridInterconnections: 0,
  };
}

function buildingType(kind: string): AssetType {
  if (kind === "control") return "CONTROL_ROOM";
  if (kind === "om") return "OM_BUILDING";
  if (kind === "warehouse") return "WAREHOUSE";
  if (kind === "security") return "SECURITY_CABIN";
  return "BUILDING";
}

function buildingId(kind: string, index: number): string {
  if (kind === "control") return formatAssetId("CTRL-{number:03d}", index);
  if (kind === "om") return formatAssetId("OM-{number:03d}", index);
  if (kind === "warehouse") return formatAssetId("WRH-{number:03d}", index);
  if (kind === "security") return formatAssetId("SEC-{number:03d}", index);
  return formatAssetId("BLDG-{number:03d}", index);
}

function buildingName(kind: string, index: number): string {
  if (kind === "control") return `Control Room ${String(index).padStart(3, "0")}`;
  if (kind === "om") return `O&M Building ${String(index).padStart(3, "0")}`;
  if (kind === "warehouse") return `Warehouse ${String(index).padStart(3, "0")}`;
  if (kind === "security") return `Security Cabin ${String(index).padStart(3, "0")}`;
  return `Building ${String(index).padStart(3, "0")}`;
}

type Builder = {
  assets: Record<string, Asset>;
  order: string[];
  counts: AssetCounts;
  plantId: string;
  errors: string[];
};

function addAsset(
  builder: Builder,
  partial: Omit<Asset, "children" | "plantId" | "status"> & {
    status?: AssetStatus;
    children?: string[];
  },
): Asset | null {
  const assetId = partial.assetId;
  if (!assetId) {
    builder.errors.push("Missing assetId");
    return null;
  }
  if (builder.assets[assetId]) {
    builder.errors.push(`Duplicate assetId: ${assetId}`);
    return null;
  }
  if (!ASSET_TYPE_SET.has(partial.assetType)) {
    builder.errors.push(`Invalid assetType: ${partial.assetType}`);
    return null;
  }
  const asset: Asset = {
    ...partial,
    plantId: builder.plantId,
    children: partial.children ?? [],
    status: partial.status ?? "operational",
    metadata: partial.metadata ?? {},
  };
  builder.assets[assetId] = asset;
  builder.order.push(assetId);
  return asset;
}

function linkChild(builder: Builder, parentId: string, childId: string) {
  const parent = builder.assets[parentId];
  const child = builder.assets[childId];
  if (!parent || !child) return;
  if (!parent.children.includes(childId)) parent.children.push(childId);
  child.parentId = parentId;
}

export function validateAssetModel(model: AssetModel): string[] {
  const errors: string[] = [];
  const { assets, rootId, plantId } = model;
  if (!assets[rootId]) errors.push(`Missing plant root ${rootId}`);
  if (!assets[plantId] && plantId !== rootId) {
    // plantId may equal rootId
  }
  for (const id of Object.keys(assets)) {
    const asset = assets[id];
    if (!asset) continue;
    if (asset.assetId !== id) errors.push(`Key mismatch for ${id}`);
    if (!ASSET_TYPE_SET.has(asset.assetType)) {
      errors.push(`Invalid type on ${id}`);
    }
    if (asset.parentId) {
      if (!assets[asset.parentId]) {
        errors.push(`Orphan asset ${id}: missing parent ${asset.parentId}`);
      }
    } else if (asset.assetType !== "PLANT") {
      errors.push(`Orphan asset ${id}: no parent`);
    }
    for (const childId of asset.children) {
      if (!assets[childId]) {
        // Module children may be virtual — only error if not MODULE parent with virtual kids
        if (asset.assetType !== "TABLE") {
          errors.push(`Broken child link ${id} → ${childId}`);
        }
      }
    }
  }
  return errors;
}

export function countAssets(assets: Record<string, Asset>): AssetCounts {
  const counts = emptyCounts();
  for (const asset of Object.values(assets)) {
    switch (asset.assetType) {
      case "BLOCK":
        counts.blocks += 1;
        break;
      case "TABLE":
        counts.tables += 1;
        break;
      case "MODULE":
        counts.modules += 1;
        break;
      case "STRING":
        counts.strings += 1;
        break;
      case "COMBINER":
        counts.combiners += 1;
        break;
      case "INVERTER":
        counts.inverters += 1;
        break;
      case "TRANSFORMER":
        counts.transformers += 1;
        break;
      case "SUBSTATION":
        counts.substations += 1;
        break;
      case "BUILDING":
      case "CONTROL_ROOM":
      case "OM_BUILDING":
      case "WAREHOUSE":
      case "SECURITY_CABIN":
        counts.buildings += 1;
        break;
      case "WEATHER_STATION":
        counts.weatherStations += 1;
        break;
      case "ROAD":
        counts.roads += 1;
        break;
      case "FENCE":
        counts.fences += 1;
        break;
      case "GATE":
        counts.gates += 1;
        break;
      case "GRID_INTERCONNECTION":
        counts.gridInterconnections += 1;
        break;
      default:
        break;
    }
  }
  return counts;
}

export function assetTypeLabel(type: AssetType): string {
  switch (type) {
    case "PLANT":
      return "Plant";
    case "BLOCK":
      return "Solar Block";
    case "TABLE":
      return "Table";
    case "MODULE":
      return "Module";
    case "STRING":
      return "String";
    case "COMBINER":
      return "Combiner";
    case "INVERTER":
      return "Inverter";
    case "TRANSFORMER":
      return "Transformer";
    case "SUBSTATION":
      return "Substation";
    case "BUILDING":
      return "Building";
    case "CONTROL_ROOM":
      return "Control Room";
    case "OM_BUILDING":
      return "O&M Building";
    case "WAREHOUSE":
      return "Warehouse";
    case "SECURITY_CABIN":
      return "Security Cabin";
    case "WEATHER_STATION":
      return "Weather Station";
    case "ROAD":
      return "Road";
    case "FENCE":
      return "Fence";
    case "GATE":
      return "Gate";
    case "GRID_INTERCONNECTION":
      return "Grid Interconnection";
    default:
      return type;
  }
}

export function statusToSitemap(
  status: AssetStatus,
): "ONLINE" | "WARNING" | "OFFLINE" {
  if (status === "offline" || status === "fault") return "OFFLINE";
  if (status === "warning") return "WARNING";
  return "ONLINE";
}

export function searchAssets(
  model: AssetModel,
  query: string,
  limit = 20,
): Asset[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: Asset[] = [];
  for (const id of model.order) {
    const asset = model.assets[id];
    if (!asset) continue;
    if (
      asset.assetId.toLowerCase().includes(q) ||
      asset.name.toLowerCase().includes(q) ||
      asset.assetType.toLowerCase().includes(q)
    ) {
      results.push(asset);
      if (results.length >= limit) break;
    }
  }
  return results;
}

export function getAsset(model: AssetModel, assetId: string): Asset | null {
  return model.assets[assetId] ?? null;
}

export function getAssetAncestors(model: AssetModel, assetId: string): Asset[] {
  const chain: Asset[] = [];
  let current = model.assets[assetId];
  const seen = new Set<string>();
  while (current?.parentId && !seen.has(current.parentId)) {
    seen.add(current.parentId);
    const parent = model.assets[current.parentId];
    if (!parent) break;
    chain.push(parent);
    current = parent;
  }
  return chain;
}

export function focusableAssetId(
  model: AssetModel,
  assetId: string,
): string | null {
  let current = model.assets[assetId];
  if (!current) return null;
  while (current) {
    if (current.position) return current.assetId;
    if (!current.parentId) break;
    current = model.assets[current.parentId];
  }
  return model.rootId;
}

/**
 * Resolve a module asset on demand when modules were not fully materialized.
 */
export function ensureModuleAsset(
  model: AssetModel,
  tableAssetId: string,
  moduleIndex: number,
  patterns: AssetIdPatterns,
  plant: TwinPlant,
  globalModuleNumber: number,
): Asset | null {
  const table = model.assets[tableAssetId];
  if (!table) return null;
  const assetId = formatAssetId(patterns.module, globalModuleNumber);
  const existing = model.assets[assetId];
  if (existing) return existing;
  const asset: Asset = {
    assetId,
    assetType: "MODULE",
    name: `Module ${String(moduleIndex).padStart(3, "0")}`,
    parentId: tableAssetId,
    plantId: model.plantId,
    children: [],
    status: table.status,
    position: table.position
      ? { ...table.position, y: (table.position.y ?? 0) + 0.05 }
      : undefined,
    rotation: table.rotation,
    metadata: {
      manufacturer: plant ? undefined : undefined,
      ratedPowerW: plant.moduleWattageW,
      moduleIndex,
      tableAssetId,
      virtual: true,
    },
  };
  model.assets[assetId] = asset;
  if (!table.children.includes(assetId)) table.children.push(assetId);
  if (!model.order.includes(assetId)) model.order.push(assetId);
  return asset;
}

export function buildAssetModel(
  twin: TwinRecord,
  layout?: TwinLayout,
): AssetModel {
  try {
    const resolvedLayout = layout ?? buildTwinLayout(twin.spec, twin.derived);
    return buildAssetModelFromLayout(twin, resolvedLayout);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Asset generation failed";
    return {
      plantId: "PLANT-001",
      rootId: "PLANT-001",
      assets: {},
      order: [],
      counts: emptyCounts(),
      tableIndexToId: {},
      visualTableAssetIds: [],
      generatedAt: new Date().toISOString(),
      error: message,
    };
  }
}

export function buildAssetModelFromLayout(
  twin: TwinRecord,
  layout: TwinLayout,
): AssetModel {
  const plant = layout.plant;
  const intake = twin.spec.intake ?? {};
  const patterns = resolveAssetIdPatterns(intake);
  const seed = twin.id;

  const plantAssetId =
    plant.plantId?.trim() ||
    formatAssetId(patterns.plant, 1);

  const builder: Builder = {
    assets: {},
    order: [],
    counts: emptyCounts(),
    plantId: plantAssetId,
    errors: [],
  };

  addAsset(builder, {
    assetId: plantAssetId,
    assetType: "PLANT",
    name: plant.projectName || plant.plantId || "Plant",
    status: "operational",
    position: { x: 0, y: 0, z: 0 },
    geoPosition: {
      latitude: plant.latitude,
      longitude: plant.longitude,
      elevation: plant.elevationM,
    },
    metadata: {
      location: plant.location,
      capacityMw: plant.capacityMw,
      dcCapacityMwp: plant.dcCapacityMwp,
      plantType: plant.plantType,
      status: plant.status,
      owner: intake.developerOwner || "",
    },
  });

  const blockCount = Math.max(1, plant.blockCount);
  const modulesPerTable = Math.max(1, plant.modulesPerTable);
  const registry = layout.tableRegistry ?? [];
  const tableIndexToId: Record<number, string> = {};

  // Prefer layout registry (same IDs as 3D/sitemap). Fall back to intake counts.
  const tablesByBlock = new Map<number, typeof registry>();
  if (registry.length > 0) {
    for (const entry of registry) {
      const list = tablesByBlock.get(entry.blockIndex) ?? [];
      list.push(entry);
      tablesByBlock.set(entry.blockIndex, list);
    }
  } else {
    const totalTables = Math.max(1, plant.totalTables);
    const tablesPerBlockList = distribute(totalTables, blockCount);
    let cursor = 0;
    for (let b = 0; b < blockCount; b += 1) {
      const count = tablesPerBlockList[b] ?? 0;
      const entries = [];
      for (let i = 0; i < count; i += 1) {
        cursor += 1;
        const blockId = formatAssetId(patterns.block, b + 1);
        entries.push({
          logicalIndex: cursor,
          blockIndex: b + 1,
          blockAssetId: blockId,
          assetId: formatAssetId(patterns.table, cursor),
          x: 0,
          y: 0,
          z: 0,
          rotY: 0,
          along: plant.tableLengthM,
          across: plant.tableWidthM,
        });
      }
      tablesByBlock.set(b + 1, entries);
    }
  }

  const totalTables = [...tablesByBlock.values()].reduce(
    (sum, list) => sum + list.length,
    0,
  );
  let moduleNumber = 0;
  const totalModules = Math.max(
    plant.totalModules,
    totalTables * modulesPerTable,
  );
  const materializeModules = totalModules <= MODULE_MATERIALIZE_LIMIT;

  for (let b = 0; b < blockCount; b += 1) {
    const blockNumber = b + 1;
    const blockId = formatAssetId(patterns.block, blockNumber);
    const blockTables = tablesByBlock.get(blockNumber) ?? [];
    const tableCount = blockTables.length;
    const startTable = blockTables[0]?.logicalIndex ?? 0;
    const endTable = blockTables[blockTables.length - 1]?.logicalIndex ?? 0;
    const blockPos = blockTables[0];

    addAsset(builder, {
      assetId: blockId,
      assetType: "BLOCK",
      name: `Block ${String(blockNumber).padStart(3, "0")}`,
      parentId: plantAssetId,
      status: "operational",
      position: blockPos
        ? { x: blockPos.x, y: 0, z: blockPos.z }
        : { x: 0, y: 0, z: 0 },
      metadata: {
        tables: tableCount,
        modules: tableCount * modulesPerTable,
        blockIndex: blockNumber,
        tableRange: { start: startTable, end: endTable },
      },
    });
    linkChild(builder, plantAssetId, blockId);

    for (const entry of blockTables) {
      const tableId = entry.assetId;
      const t = entry.logicalIndex;
      tableIndexToId[t] = tableId;
      const visual = layout.tables.find((row) => row.logicalIndex === t);
      const pose = visual ?? entry;
      addAsset(builder, {
        assetId: tableId,
        assetType: "TABLE",
        name: `Table ${String(t).padStart(3, "0")}`,
        parentId: blockId,
        status: mockStatus(`${seed}:${tableId}`),
        position: { x: pose.x, y: "y" in pose ? Number(pose.y) || 0 : 0, z: pose.z },
        rotation: { x: 0, y: pose.rotY ?? 0, z: 0 },
        geometry: {
          type: "table",
          modelId: visual ? tableId : undefined,
        },
        metadata: {
          modules: modulesPerTable,
          moduleWattageW: plant.moduleWattageW,
          along: pose.along ?? plant.tableLengthM,
          across: pose.across ?? plant.tableWidthM,
          logicalIndex: t,
          blockAssetId: blockId,
          manufacturer: intake.moduleManufacturer || "",
          model: intake.moduleModel || "",
        },
      });
      linkChild(builder, blockId, tableId);

      if (materializeModules) {
        for (let m = 1; m <= modulesPerTable; m += 1) {
          moduleNumber += 1;
          const moduleId = formatAssetId(patterns.module, moduleNumber);
          addAsset(builder, {
            assetId: moduleId,
            assetType: "MODULE",
            name: `Module ${String(m).padStart(3, "0")}`,
            parentId: tableId,
            status: mockStatus(`${seed}:${moduleId}`),
            position: {
              x: pose.x,
              y: ("y" in pose ? Number(pose.y) || 0 : 0) + 0.05,
              z: pose.z,
            },
            metadata: {
              manufacturer: intake.moduleManufacturer || "",
              model: intake.moduleModel || "",
              ratedPowerW: plant.moduleWattageW,
              dimensions: `${plant.moduleLengthM}×${plant.moduleWidthM}×${plant.moduleThicknessM} m`,
              cells: plant.cellCount,
              technology: plant.cellTechnology || plant.solarTechnology,
              moduleIndex: m,
              tableAssetId: tableId,
              blockAssetId: blockId,
              globalIndex: moduleNumber,
            },
          });
          linkChild(builder, tableId, moduleId);
        }
      } else {
        const childIds: string[] = [];
        for (let m = 1; m <= modulesPerTable; m += 1) {
          moduleNumber += 1;
          childIds.push(formatAssetId(patterns.module, moduleNumber));
        }
        const tableAsset = builder.assets[tableId];
        if (tableAsset) {
          tableAsset.children = childIds;
          tableAsset.metadata = {
            ...tableAsset.metadata,
            modulesVirtual: true,
            moduleNumberStart: moduleNumber - modulesPerTable + 1,
            moduleNumberEnd: moduleNumber,
          };
        }
      }
    }
  }

  // Combiners
  layout.combiners.forEach((pose, index) => {
    const n = index + 1;
    const id = pose.assetId || formatAssetId(patterns.combiner, n);
    addAsset(builder, {
      assetId: id,
      assetType: "COMBINER",
      name: `Combiner ${String(n).padStart(3, "0")}`,
      parentId: plantAssetId,
      status: mockStatus(`${seed}:${id}`),
      position: { x: pose.x, y: pose.y, z: pose.z },
      geometry: { type: "combiner", modelId: id },
      metadata: { index: n },
    });
    linkChild(builder, plantAssetId, id);
  });

  // Inverters
  layout.inverters.forEach((pose, index) => {
    const n = index + 1;
    const id = pose.assetId || formatAssetId(patterns.inverter, n);
    addAsset(builder, {
      assetId: id,
      assetType: "INVERTER",
      name: `Inverter ${String(n).padStart(3, "0")}`,
      parentId: plantAssetId,
      status: mockStatus(`${seed}:${id}`),
      position: { x: pose.x, y: pose.y, z: pose.z },
      geometry: { type: "inverter", modelId: id },
      metadata: {
        manufacturer: intake.inverterManufacturer || "",
        model: intake.inverterModel || "",
        serialNumber: intake.inverterSerialNumber || "",
        kind: plant.inverterKind,
        dimensions: `${plant.inverterLengthM}×${plant.inverterWidthM}×${plant.inverterHeightM} m`,
        index: n,
      },
    });
    linkChild(builder, plantAssetId, id);
  });

  // Transformers
  layout.transformers.forEach((pose, index) => {
    const n = index + 1;
    const id = pose.assetId || formatAssetId(patterns.transformer, n);
    addAsset(builder, {
      assetId: id,
      assetType: "TRANSFORMER",
      name: `Transformer ${String(n).padStart(3, "0")}`,
      parentId: plantAssetId,
      status: mockStatus(`${seed}:${id}`),
      position: { x: pose.x, y: pose.y, z: pose.z },
      geometry: { type: "transformer", modelId: id },
      metadata: {
        manufacturer: intake.transformerManufacturer || "",
        model: intake.transformerModel || "",
        serialNumber: intake.transformerSerialNumber || "",
        transformerType: plant.transformerType,
        ratingMva: twin.spec.transformerMva,
        dimensions: `${plant.transformerLengthM}×${plant.transformerWidthM}×${plant.transformerHeightM} m`,
        index: n,
      },
    });
    linkChild(builder, plantAssetId, id);
  });

  // Substations
  if (plant.substationPresent) {
    layout.substations.forEach((pose, index) => {
      const n = index + 1;
      const id = pose.assetId || formatAssetId(patterns.substation, n);
      addAsset(builder, {
        assetId: id,
        assetType: "SUBSTATION",
        name: `Substation ${String(n).padStart(3, "0")}`,
        parentId: plantAssetId,
        status: mockStatus(`${seed}:${id}`),
        position: { x: pose.x, y: pose.y, z: pose.z },
        geoPosition: {
          latitude: Number(intake.substationLatitude) || plant.latitude,
          longitude: Number(intake.substationLongitude) || plant.longitude,
        },
        geometry: { type: "substation", modelId: id },
        metadata: {
          substationType: plant.substationType,
          areaM2: plant.substationAreaM2,
          index: n,
        },
      });
      linkChild(builder, plantAssetId, id);
    });

    const gridId = layout.grid.assetId || "GRID-001";
    addAsset(builder, {
      assetId: gridId,
      assetType: "GRID_INTERCONNECTION",
      name: "Grid Interconnection 001",
      parentId: plantAssetId,
      status: "operational",
      position: { x: layout.grid.x, y: layout.grid.y, z: layout.grid.z },
      geometry: { type: "grid", modelId: gridId },
      metadata: {
        gridVoltageKv: twin.spec.gridVoltageKv,
      },
    });
    linkChild(builder, plantAssetId, gridId);
  }

  // Buildings
  const kindCounters: Record<string, number> = {};
  layout.buildings.forEach((pose) => {
    kindCounters[pose.kind] = (kindCounters[pose.kind] ?? 0) + 1;
    const n = kindCounters[pose.kind];
    const id = pose.assetId || buildingId(pose.kind, n);
    const type = buildingType(pose.kind);
    addAsset(builder, {
      assetId: id,
      assetType: type,
      name: buildingName(pose.kind, n),
      parentId: plantAssetId,
      status: "operational",
      position: { x: pose.x, y: pose.y, z: pose.z },
      geometry: { type: "building", modelId: id },
      metadata: {
        kind: pose.kind,
        dimensions: `${pose.w ?? plant.buildingLengthM}×${pose.d ?? plant.buildingWidthM}×${pose.h ?? plant.buildingHeightM} m`,
        appearance: plant.buildingLook,
      },
    });
    linkChild(builder, plantAssetId, id);
  });

  // Weather
  if (layout.weather) {
    const id = layout.weather.assetId || "WST-001";
    addAsset(builder, {
      assetId: id,
      assetType: "WEATHER_STATION",
      name: "Weather Station 001",
      parentId: plantAssetId,
      status: "operational",
      position: {
        x: layout.weather.x,
        y: layout.weather.y,
        z: layout.weather.z,
      },
      geometry: { type: "weather", modelId: id },
      metadata: { location: plant.location },
    });
    linkChild(builder, plantAssetId, id);
  }

  // Roads
  if (plant.roads) {
    layout.roads.forEach((road, index) => {
      const n = index + 1;
      const id = formatAssetId("ROAD-{number:03d}", n);
      addAsset(builder, {
        assetId: id,
        assetType: "ROAD",
        name:
          index === layout.roads.length - 1 && plant.accessRoad
            ? "Access Road"
            : `Road ${String(n).padStart(3, "0")}`,
        parentId: plantAssetId,
        status: "operational",
        position: { x: road.x, y: 0, z: road.z },
        geometry: { type: "road", modelId: id },
        metadata: {
          widthM: plant.roadWidthM,
          surface: plant.roadSurface,
          footprint: { w: road.w, d: road.d },
        },
      });
      linkChild(builder, plantAssetId, id);
    });
  }

  // Fence
  if (plant.fence) {
    const id = "FNC-001";
    addAsset(builder, {
      assetId: id,
      assetType: "FENCE",
      name: "Perimeter Fence",
      parentId: plantAssetId,
      status: "operational",
      position: { x: 0, y: 0, z: 0 },
      geometry: { type: "fence", modelId: id },
      metadata: {
        fenceType: plant.fenceType,
        heightM: plant.fenceHeightM,
        gates: plant.gateCount,
        boundary: `${Math.round(layout.width)}×${Math.round(layout.depth)} m`,
      },
    });
    linkChild(builder, plantAssetId, id);
  }

  // Gates
  layout.gates.forEach((gate, index) => {
    const n = index + 1;
    const id = gate.assetId || formatAssetId("GATE-{number:03d}", n);
    addAsset(builder, {
      assetId: id,
      assetType: "GATE",
      name: `Gate ${String(n).padStart(3, "0")}`,
      parentId: plantAssetId,
      status: "operational",
      position: { x: gate.x, y: 0, z: gate.z },
      rotation: { x: 0, y: gate.rotY, z: 0 },
      geometry: { type: "gate", modelId: id },
      metadata: { index: n },
    });
    linkChild(builder, plantAssetId, id);
  });

  const visualTableAssetIds = layout.tables.map(
    (table) =>
      table.assetId ||
      (table.logicalIndex
        ? tableIndexToId[table.logicalIndex]
        : formatAssetId(patterns.table, 1)) ||
      "",
  );

  const counts = countAssets(builder.assets);
  if (!materializeModules) {
    counts.modules = totalModules;
    counts.tables = totalTables;
    counts.blocks = blockCount;
  }

  const model: AssetModel = {
    plantId: plantAssetId,
    rootId: plantAssetId,
    assets: builder.assets,
    order: builder.order,
    counts,
    tableIndexToId,
    visualTableAssetIds,
    generatedAt: new Date().toISOString(),
    error: builder.errors.length ? builder.errors[0] : undefined,
  };

  const validation = validateAssetModel(model);
  // Soft-validate: virtual module children are allowed to be absent from assets map
  const hardErrors = validation.filter(
    (msg) => !msg.includes("Broken child link") && !msg.includes("Orphan"),
  );
  if (hardErrors.length && !model.error) {
    model.error = hardErrors[0];
  }

  return model;
}

export function assetDetailRows(asset: Asset, model: AssetModel): Array<{
  label: string;
  value: string;
}> {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Asset ID", value: asset.assetId },
    { label: "Asset Type", value: assetTypeLabel(asset.assetType) },
    { label: "Name", value: asset.name },
    { label: "Status", value: title(asset.status) },
  ];

  if (asset.parentId) {
    const parent = model.assets[asset.parentId];
    rows.push({
      label: "Parent",
      value: parent ? `${parent.name} (${parent.assetId})` : asset.parentId,
    });
  }

  const ancestors = getAssetAncestors(model, asset.assetId);
  const block = ancestors.find((a) => a.assetType === "BLOCK");
  const table = ancestors.find((a) => a.assetType === "TABLE");
  if (block && asset.assetType !== "BLOCK") {
    rows.push({ label: "Block", value: `${block.name} (${block.assetId})` });
  }
  if (table && asset.assetType === "MODULE") {
    rows.push({ label: "Table", value: `${table.name} (${table.assetId})` });
  }

  if (asset.position) {
    rows.push({
      label: "Model position",
      value: `${asset.position.x.toFixed(1)}, ${asset.position.y.toFixed(1)}, ${asset.position.z.toFixed(1)}`,
    });
  }
  if (asset.geoPosition?.latitude != null && asset.geoPosition?.longitude != null) {
    rows.push({
      label: "Geo position",
      value: `${asset.geoPosition.latitude}, ${asset.geoPosition.longitude}`,
    });
  }

  const meta = asset.metadata;
  const pushMeta = (label: string, key: string) => {
    const value = meta[key];
    if (value == null || value === "") return;
    rows.push({ label, value: String(value) });
  };

  pushMeta("Manufacturer", "manufacturer");
  pushMeta("Model", "model");
  pushMeta("Serial number", "serialNumber");
  pushMeta("Rated power", "ratedPowerW");
  pushMeta("Dimensions", "dimensions");
  pushMeta("Technology", "technology");
  pushMeta("Type", "kind");
  pushMeta("Type", "transformerType");
  pushMeta("Type", "substationType");
  pushMeta("Rating", "ratingMva");
  pushMeta("Appearance", "appearance");
  pushMeta("Fence type", "fenceType");
  pushMeta("Surface", "surface");
  pushMeta("Width", "widthM");
  pushMeta("Height", "heightM");
  pushMeta("Area", "areaM2");
  pushMeta("Grid voltage", "gridVoltageKv");

  if (asset.assetType === "BLOCK") {
    pushMeta("Tables", "tables");
    pushMeta("Modules", "modules");
  }
  if (asset.assetType === "TABLE") {
    pushMeta("Modules", "modules");
    pushMeta("Module power", "moduleWattageW");
  }
  if (asset.assetType === "PLANT") {
    pushMeta("Location", "location");
    pushMeta("Owner", "owner");
    pushMeta("AC capacity", "capacityMw");
    pushMeta("DC capacity", "dcCapacityMwp");
  }

  rows.push({
    label: "Children",
    value: String(asset.children.length),
  });

  return rows;
}

/** Map sitemap/legacy ids toward canonical asset ids when possible. */
export function resolveAssetIdFromLegacy(
  model: AssetModel,
  maybeId: string,
): string | null {
  if (model.assets[maybeId]) return maybeId;
  const upper = maybeId.toUpperCase();
  if (model.assets[upper]) return upper;
  // inv-01 → INV-001 style
  const inv = /^inv-?(\d+)$/i.exec(maybeId);
  if (inv) {
    const id = formatAssetId("INV-{number:03d}", Number(inv[1]));
    if (model.assets[id]) return id;
  }
  const tbl = /^tbl-?(\d+)$/i.exec(maybeId);
  if (tbl) {
    const id = formatAssetId("TBL-{number:03d}", Number(tbl[1]));
    if (model.assets[id]) return id;
  }
  const xfmr = /^(?:xfmr|trf)-?(\d+)$/i.exec(maybeId);
  if (xfmr) {
    const id = formatAssetId("TRF-{number:03d}", Number(xfmr[1]));
    if (model.assets[id]) return id;
  }
  return null;
}
