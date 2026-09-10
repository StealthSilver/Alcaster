import type { TwinRecord } from "@/lib/api";
import {
  assetDetailRows,
  assetTypeLabel,
  buildAssetModelFromLayout,
  statusToSitemap,
  type Asset,
  type AssetModel,
  type AssetType,
} from "@/lib/assetModel";
import {
  buildTwinLayout,
  type TwinLayout,
} from "@/lib/twinLayout";
import type { TwinPlant } from "@/lib/twinPlant";

export type SitemapStatus = "ONLINE" | "WARNING" | "OFFLINE";

export type SitemapKind =
  | "table"
  | "combiner"
  | "inverter"
  | "transformer"
  | "substation"
  | "grid"
  | "building"
  | "weather"
  | "road"
  | "fence"
  | "gate";

export type InfoRow = {
  label: string;
  value: string;
};

export type SitemapComponent = {
  id: string;
  /** Canonical asset id — same as Asset Model / 3D userData.assetId. */
  assetId: string;
  kind: SitemapKind;
  name: string;
  typeLabel: string;
  status: SitemapStatus;
  rows: InfoRow[];
  x: number;
  z: number;
  w: number;
  d: number;
  rotY: number;
};

export type SitemapModel = {
  layout: TwinLayout;
  plant: TwinPlant;
  assets: AssetModel;
  components: SitemapComponent[];
  plantRows: InfoRow[];
  exportMw: number;
  plantLoadPct: number;
  irradiance: number;
};

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

function mix(min: number, max: number, seed: string): number {
  return min + (max - min) * unit(seed);
}

function round(value: number, digits = 1): number {
  const place = 10 ** digits;
  return Math.round(value * place) / place;
}

function statusOf(seed: string): SitemapStatus {
  const roll = unit(`${seed}:status`);
  if (roll > 0.985) return "OFFLINE";
  if (roll > 0.93) return "WARNING";
  return "ONLINE";
}

function factorFor(status: SitemapStatus, seed: string): number {
  if (status === "OFFLINE") return 0;
  if (status === "WARNING") return mix(0.52, 0.78, `${seed}:f`);
  return mix(0.92, 1.04, `${seed}:f`);
}

function title(value: string) {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function mountingLabel(kind: TwinPlant["mountingKind"]) {
  if (kind === "dual_axis") return "Dual-axis tracker";
  if (kind === "fixed_tilt") return "Fixed tilt";
  return "Single-axis tracker";
}

function buildingLabel(kind: string) {
  if (kind === "control") return "Control room";
  if (kind === "om") return "O&M building";
  if (kind === "warehouse") return "Warehouse";
  if (kind === "security") return "Security cabin";
  return "Building";
}

function inverterLabel(kind: string) {
  if (kind === "string") return "String inverter";
  if (kind === "micro") return "Microinverter";
  return "Central inverter";
}

function transformerLabel(kind: string) {
  if (kind === "dry") return "Dry-type transformer";
  if (kind === "padmount") return "Padmount transformer";
  if (kind === "oil") return "Oil-filled transformer";
  return "Transformer";
}

function pad(value: number, width: number) {
  return String(value).padStart(width, "0");
}

function syntheticTableRows(
  plant: TwinPlant,
  tableIndex: number,
  modules: number,
): InfoRow[] {
  return [
    { label: "Modules", value: String(modules) },
    { label: "Module power", value: `${plant.moduleWattageW} W` },
    {
      label: "Module size",
      value: `${plant.moduleLengthM} × ${plant.moduleWidthM} m`,
    },
    {
      label: "Table size",
      value: `${round(plant.tableLengthM, 1)} × ${round(plant.tableWidthM, 1)} m`,
    },
    { label: "Tilt / Azimuth", value: `${plant.tiltDeg}° / ${plant.azimuthDeg}°` },
    { label: "Row spacing", value: `${plant.rowToRowM} m` },
    { label: "Technology", value: title(plant.solarTechnology) },
    { label: "Index", value: String(tableIndex) },
  ];
}

function assetKind(type: AssetType): SitemapKind | null {
  switch (type) {
    case "TABLE":
      return "table";
    case "COMBINER":
      return "combiner";
    case "INVERTER":
      return "inverter";
    case "TRANSFORMER":
      return "transformer";
    case "SUBSTATION":
      return "substation";
    case "GRID_INTERCONNECTION":
      return "grid";
    case "BUILDING":
    case "CONTROL_ROOM":
    case "OM_BUILDING":
    case "WAREHOUSE":
    case "SECURITY_CABIN":
      return "building";
    case "WEATHER_STATION":
      return "weather";
    case "ROAD":
      return "road";
    case "FENCE":
      return "fence";
    case "GATE":
      return "gate";
    default:
      return null;
  }
}

function rowsFromAsset(asset: Asset, model: AssetModel, extra: InfoRow[] = []): InfoRow[] {
  const base = assetDetailRows(asset, model).filter(
    (row) =>
      row.label !== "Children" &&
      row.label !== "Model position" &&
      row.label !== "Geo position",
  );
  return [...base, ...extra];
}

export function buildSitemapModel(twin: TwinRecord): SitemapModel {
  const layout = buildTwinLayout(twin.spec, twin.derived);
  const assets = buildAssetModelFromLayout(twin, layout);
  const plant = layout.plant;
  const seed = twin.id;
  const irradiance = round(mix(780, 980, `${seed}:ghi`));
  const ambientC = round(mix(28, 38, `${seed}:tamb`));
  const plantLoadPct = round(mix(62, 88, `${seed}:load`), 1);
  const exportMw = round(plant.capacityMw * (plantLoadPct / 100), 2);
  const tableCount = Math.max(1, layout.tables.length);
  const dcPerTableMw = plant.dcCapacityMwp / tableCount;
  const invCount = Math.max(1, layout.inverters.length);
  const acPerInvMw = exportMw / invCount;
  const intake = twin.spec.intake ?? {};
  const components: SitemapComponent[] = [];
  const plantAsset = assets.assets[assets.rootId];

  const plantRows: InfoRow[] = plantAsset
    ? [
        ...rowsFromAsset(plantAsset, assets),
        { label: "Blocks", value: String(assets.counts.blocks) },
        { label: "Tables", value: assets.counts.tables.toLocaleString() },
        { label: "Modules", value: assets.counts.modules.toLocaleString() },
        { label: "Inverters", value: String(assets.counts.inverters) },
        { label: "Transformers", value: String(assets.counts.transformers) },
        { label: "Export", value: `${exportMw} MW` },
        { label: "Plant load", value: `${plantLoadPct}%` },
        { label: "GHI", value: `${irradiance} W/m²` },
        { label: "Grid", value: `${twin.spec.gridVoltageKv} kV` },
      ]
    : [
        { label: "Plant ID", value: plant.plantId || "—" },
        { label: "Owner", value: intake.developerOwner || "—" },
        { label: "Location", value: plant.location || "—" },
      ];

  const pushFromPose = (
    assetId: string | undefined,
    kind: SitemapKind,
    fallbackName: string,
    typeLabel: string,
    x: number,
    z: number,
    w: number,
    d: number,
    rotY: number,
    extra: InfoRow[] = [],
  ) => {
    if (!assetId) return;
    const asset = assets.assets[assetId];
    const status = asset
      ? statusToSitemap(asset.status)
      : statusOf(`${seed}:${assetId}`);
    components.push({
      id: assetId,
      assetId,
      kind,
      name: asset?.name ?? fallbackName,
      typeLabel: asset ? assetTypeLabel(asset.assetType) : typeLabel,
      status,
      x,
      z,
      w,
      d,
      rotY,
      rows: asset ? rowsFromAsset(asset, assets, extra) : extra,
    });
  };

  layout.tables.forEach((table) => {
    const assetId = table.assetId;
    if (!assetId) return;
    const status = statusOf(`${seed}:${assetId}`);
    const dcKw = dcPerTableMw * 1000 * factorFor(status, assetId) * (plantLoadPct / 100);
    pushFromPose(
      assetId,
      "table",
      assetId,
      mountingLabel(plant.mountingKind),
      table.x,
      table.z,
      table.along,
      table.across,
      table.rotY,
      [
        { label: "DC output", value: `${round(dcKw, 1)} kW` },
        { label: "Tilt / Azimuth", value: `${plant.tiltDeg}° / ${plant.azimuthDeg}°` },
      ],
    );
  });

  layout.combiners.forEach((combiner, index) => {
    const assetId = combiner.assetId;
    const strings = Math.max(
      4,
      Math.round(twin.derived.stringCount / Math.max(1, layout.combiners.length)),
    );
    pushFromPose(
      assetId,
      "combiner",
      `CB-${String(index + 1).padStart(3, "0")}`,
      "DC combiner",
      combiner.x,
      combiner.z,
      1.7,
      1.7,
      0,
      [
        { label: "Strings in", value: String(strings) },
        { label: "DC current", value: `${round(mix(180, 420, assetId ?? String(index)))} A` },
      ],
    );
  });

  layout.inverters.forEach((inverter, index) => {
    const assetId = inverter.assetId;
    const pac = acPerInvMw * factorFor("ONLINE", assetId ?? String(index));
    pushFromPose(
      assetId,
      "inverter",
      inverter.label ?? `INV-${String(index + 1).padStart(3, "0")}`,
      inverterLabel(plant.inverterKind),
      inverter.x,
      inverter.z,
      inverter.w ?? plant.inverterLengthM,
      inverter.d ?? plant.inverterWidthM,
      0,
      [{ label: "AC power", value: `${round(pac, 2)} MW` }],
    );
  });

  layout.transformers.forEach((transformer, index) => {
    pushFromPose(
      transformer.assetId,
      "transformer",
      transformer.label ?? `TRF-${String(index + 1).padStart(3, "0")}`,
      transformerLabel(plant.transformerType),
      transformer.x,
      transformer.z,
      transformer.w ?? plant.transformerLengthM,
      transformer.d ?? plant.transformerWidthM,
      0,
    );
  });

  if (plant.substationPresent) {
    layout.substations.forEach((sub, index) => {
      pushFromPose(
        sub.assetId,
        "substation",
        sub.label ?? `SUB-${String(index + 1).padStart(3, "0")}`,
        `${title(plant.substationType)} substation`,
        sub.x,
        sub.z,
        sub.w ?? Math.sqrt(plant.substationAreaM2),
        sub.d ?? Math.sqrt(plant.substationAreaM2) * 0.75,
        0,
        [{ label: "Export", value: `${round(exportMw * 0.995, 2)} MW` }],
      );
    });

    pushFromPose(
      layout.grid.assetId ?? "GRID-001",
      "grid",
      "GRID-001",
      "Grid interconnection",
      layout.grid.x,
      layout.grid.z,
      7.2,
      5.4,
      0,
      [
        { label: "POI export", value: `${exportMw} MW` },
        { label: "Ambient", value: `${ambientC} °C` },
      ],
    );
  }

  layout.buildings.forEach((building) => {
    pushFromPose(
      building.assetId,
      "building",
      buildingLabel(building.kind),
      title(plant.buildingLook) || "Building",
      building.x,
      building.z,
      building.w ?? plant.buildingLengthM,
      building.d ?? plant.buildingWidthM,
      0,
    );
  });

  if (layout.weather) {
    pushFromPose(
      layout.weather.assetId ?? "WST-001",
      "weather",
      "WST-001",
      "Weather station",
      layout.weather.x,
      layout.weather.z,
      3.2,
      3.2,
      0,
      [
        { label: "GHI", value: `${irradiance} W/m²` },
        { label: "Ambient", value: `${ambientC} °C` },
      ],
    );
  }

  if (plant.roads) {
    layout.roads.forEach((road, index) => {
      pushFromPose(
        road.assetId,
        "road",
        index === layout.roads.length - 1 && plant.accessRoad
          ? "Access road"
          : `ROAD-${String(index + 1).padStart(3, "0")}`,
        title(plant.roadSurface) || "Road",
        road.x,
        road.z,
        road.w,
        road.d,
        0,
      );
    });
  }

  if (plant.fence) {
    pushFromPose(
      "FNC-001",
      "fence",
      "Perimeter fence",
      title(plant.fenceType) || "Fence",
      0,
      0,
      layout.width,
      layout.depth,
      0,
    );
  }

  layout.gates.forEach((gate, index) => {
    pushFromPose(
      gate.assetId,
      "gate",
      `GATE-${String(index + 1).padStart(3, "0")}`,
      "Site gate",
      gate.x,
      gate.z,
      8,
      3,
      gate.rotY,
    );
  });

  return {
    layout,
    plant,
    assets,
    components,
    plantRows,
    exportMw,
    plantLoadPct,
    irradiance,
  };
}

export const SLD_STAGES: Array<{
  kind: SitemapKind;
  label: string;
}> = [
  { kind: "table", label: "PV arrays" },
  { kind: "combiner", label: "Combiners" },
  { kind: "inverter", label: "Inverters" },
  { kind: "transformer", label: "Transformers" },
  { kind: "substation", label: "Substation" },
  { kind: "building", label: "Buildings" },
  { kind: "road", label: "Roads" },
  { kind: "fence", label: "Fence" },
  { kind: "gate", label: "Gates" },
];

export function countByKind(components: SitemapComponent[]) {
  const counts: Partial<Record<SitemapKind, number>> = {};
  for (const component of components) {
    counts[component.kind] = (counts[component.kind] ?? 0) + 1;
  }
  return counts;
}

export type SitemapTreeKind =
  | "plant"
  | "block"
  | "folder"
  | "module"
  | SitemapKind;

export type SitemapTreeNode = {
  id: string;
  label: string;
  kind: SitemapTreeKind;
  typeLabel: string;
  status?: SitemapStatus;
  rows: InfoRow[];
  count?: number;
  children?: SitemapTreeNode[];
  /** Canonical asset id (same as 3D / sitemap component). */
  assetId?: string;
  /** Links to a layout component when one exists in the 2D map. */
  componentId?: string;
  /** Inclusive table index range for lazy block → table expansion. */
  tableRange?: { start: number; end: number };
};

function byId(components: SitemapComponent[]) {
  const map = new Map<string, SitemapComponent>();
  for (const component of components) map.set(component.id, component);
  return map;
}

function fromAsset(
  asset: Asset,
  model: AssetModel,
  components: Map<string, SitemapComponent>,
): Pick<SitemapTreeNode, "typeLabel" | "status" | "rows" | "componentId" | "assetId"> {
  const component = components.get(asset.assetId);
  return {
    assetId: asset.assetId,
    typeLabel: assetTypeLabel(asset.assetType),
    status: statusToSitemap(asset.status),
    rows: component?.rows ?? rowsFromAsset(asset, model),
    componentId: component?.id,
  };
}

function treeKindFromAsset(type: AssetType): SitemapTreeKind {
  if (type === "PLANT") return "plant";
  if (type === "BLOCK") return "block";
  if (type === "MODULE") return "module";
  return assetKind(type) ?? "folder";
}

/**
 * Hierarchical plant tree from the canonical Asset Model.
 * Equipment leaves prefer live 2D-map component rows when available.
 */
export function buildSitemapTree(model: SitemapModel): SitemapTreeNode {
  const { assets, components, plantRows } = model;
  const lookup = byId(components);
  const root = assets.assets[assets.rootId];

  const blocksFolderChildren: SitemapTreeNode[] = Object.values(assets.assets)
    .filter((asset) => asset.assetType === "BLOCK")
    .sort((a, b) => a.assetId.localeCompare(b.assetId))
    .map((block) => {
      const range = block.metadata.tableRange as
        | { start: number; end: number }
        | undefined;
      const tableCount =
        typeof block.metadata.tables === "number"
          ? block.metadata.tables
          : block.children.filter((id) => assets.assets[id]?.assetType === "TABLE")
              .length;
      return {
        id: block.assetId,
        label: block.name,
        kind: "block" as const,
        ...fromAsset(block, assets, lookup),
        count: tableCount,
        tableRange: range,
        children: undefined,
      };
    });

  function folder(
    id: string,
    label: string,
    children: SitemapTreeNode[],
  ): SitemapTreeNode | null {
    if (children.length === 0) return null;
    return {
      id,
      label,
      kind: "folder",
      typeLabel: label,
      count: children.length,
      rows: [
        { label: "Count", value: String(children.length) },
        { label: "Type", value: label },
      ],
      children,
    };
  }

  function leaves(types: AssetType[]): SitemapTreeNode[] {
    return Object.values(assets.assets)
      .filter((asset) => types.includes(asset.assetType))
      .sort((a, b) => a.assetId.localeCompare(b.assetId))
      .map((asset) => ({
        id: asset.assetId,
        label: asset.assetId,
        kind: treeKindFromAsset(asset.assetType),
        ...fromAsset(asset, assets, lookup),
      }));
  }

  const topChildren: SitemapTreeNode[] = [
    {
      id: "blocks",
      label: "Blocks",
      kind: "folder",
      typeLabel: "Solar blocks",
      count: blocksFolderChildren.length,
      rows: [
        { label: "Blocks", value: String(assets.counts.blocks) },
        { label: "Tables", value: assets.counts.tables.toLocaleString() },
        { label: "Modules", value: assets.counts.modules.toLocaleString() },
      ],
      children: blocksFolderChildren,
    },
  ];

  for (const node of [
    folder("combiners", "Combiners", leaves(["COMBINER"])),
    folder("inverters", "Inverters", leaves(["INVERTER"])),
    folder("transformers", "Transformers", leaves(["TRANSFORMER"])),
    folder(
      "substations",
      "Substation",
      leaves(["SUBSTATION", "GRID_INTERCONNECTION"]),
    ),
    folder(
      "buildings",
      "Buildings",
      leaves([
        "BUILDING",
        "CONTROL_ROOM",
        "OM_BUILDING",
        "WAREHOUSE",
        "SECURITY_CABIN",
      ]),
    ),
    folder(
      "infrastructure",
      "Infrastructure",
      leaves(["ROAD", "FENCE", "GATE", "WEATHER_STATION"]),
    ),
  ]) {
    if (node) topChildren.push(node);
  }

  return {
    id: root?.assetId ?? "plant",
    label: root?.name ?? (model.plant.projectName || model.plant.plantId || "Plant"),
    kind: "plant",
    typeLabel: title(model.plant.plantType) || "Plant",
    status: "ONLINE",
    assetId: root?.assetId,
    rows: plantRows,
    count: topChildren.length,
    children: topChildren,
  };
}

export function findTreeNode(
  root: SitemapTreeNode,
  id: string,
): SitemapTreeNode | null {
  if (root.id === id) return root;
  if (root.assetId === id) return root;
  for (const child of root.children ?? []) {
    const found = findTreeNode(child, id);
    if (found) return found;
  }
  return null;
}

export function findTreeNodeByAssetId(
  root: SitemapTreeNode,
  assetId: string,
): SitemapTreeNode | null {
  if (root.assetId === assetId || root.id === assetId) return root;
  for (const child of root.children ?? []) {
    const found = findTreeNodeByAssetId(child, assetId);
    if (found) return found;
  }
  return null;
}

/** Lazy module leaves under a table node (only built when the table is expanded). */
export function tableModuleChildren(
  model: SitemapModel,
  tableNode: SitemapTreeNode,
): SitemapTreeNode[] {
  const tableAssetId = tableNode.assetId ?? tableNode.id;
  const tableAsset = model.assets.assets[tableAssetId];
  const lookup = byId(model.components);
  if (!tableAsset) return [];

  const modulesPerTable = Math.max(1, model.plant.modulesPerTable);
  const virtual = Boolean(tableAsset.metadata.modulesVirtual);
  const start =
    typeof tableAsset.metadata.moduleNumberStart === "number"
      ? tableAsset.metadata.moduleNumberStart
      : 1;

  if (!virtual && tableAsset.children.length > 0) {
    return tableAsset.children
      .map((id) => model.assets.assets[id])
      .filter((asset): asset is Asset => Boolean(asset && asset.assetType === "MODULE"))
      .map((asset) => ({
        id: asset.assetId,
        label: asset.assetId,
        kind: "module" as const,
        ...fromAsset(asset, model.assets, lookup),
      }));
  }

  // Virtual modules: resolve IDs without materializing entire plant.
  return Array.from({ length: modulesPerTable }, (_, moduleIdx) => {
    const globalIndex = start + moduleIdx;
    const assetId =
      tableAsset.children[moduleIdx] ??
      `MOD-${String(globalIndex).padStart(3, "0")}`;
    const existing = model.assets.assets[assetId];
    if (existing) {
      return {
        id: existing.assetId,
        label: existing.assetId,
        kind: "module" as const,
        ...fromAsset(existing, model.assets, lookup),
      };
    }
    return {
      id: assetId,
      label: assetId,
      kind: "module" as const,
      assetId,
      typeLabel: `${model.plant.moduleWattageW} W module`,
      status: tableNode.status ?? "ONLINE",
      rows: [
        { label: "Asset ID", value: assetId },
        { label: "Asset Type", value: "Module" },
        { label: "Parent", value: tableAssetId },
        { label: "Rated power", value: `${model.plant.moduleWattageW} W` },
      ],
    };
  });
}

/** Lazy tables under a block node (grouped when the block is large). */
export function blockTableChildren(
  model: SitemapModel,
  blockNode: SitemapTreeNode,
): SitemapTreeNode[] {
  const range = blockNode.tableRange;
  if (!range || range.end < range.start) {
    const block = model.assets.assets[blockNode.assetId ?? blockNode.id];
    if (!block) return [];
    const lookup = byId(model.components);
    return block.children
      .map((id) => model.assets.assets[id])
      .filter((asset): asset is Asset => Boolean(asset && asset.assetType === "TABLE"))
      .map((asset) => ({
        id: asset.assetId,
        label: asset.assetId,
        kind: "table" as const,
        ...fromAsset(asset, model.assets, lookup),
        count: model.plant.modulesPerTable,
        children: undefined,
      }));
  }

  const total = range.end - range.start + 1;
  const GROUP = 100;
  if (total <= GROUP) {
    return buildTableNodes(model, range.start, range.end);
  }

  const groups: SitemapTreeNode[] = [];
  for (let start = range.start; start <= range.end; start += GROUP) {
    const end = Math.min(start + GROUP - 1, range.end);
    const count = end - start + 1;
    groups.push({
      id: `${blockNode.id}-tables-${pad(start, 3)}-${pad(end, 3)}`,
      label: `Tables ${pad(start, 3)}–${pad(end, 3)}`,
      kind: "folder",
      typeLabel: "Table group",
      count,
      tableRange: { start, end },
      rows: [
        { label: "From", value: model.assets.tableIndexToId[start] ?? `TBL-${pad(start, 3)}` },
        { label: "To", value: model.assets.tableIndexToId[end] ?? `TBL-${pad(end, 3)}` },
        { label: "Tables", value: String(count) },
        { label: "Block", value: blockNode.label },
      ],
      children: undefined,
    });
  }
  return groups;
}

function buildTableNodes(
  model: SitemapModel,
  start: number,
  end: number,
): SitemapTreeNode[] {
  const { assets, plant, components } = model;
  const lookup = byId(components);
  const modulesPerTable = Math.max(1, plant.modulesPerTable);
  const tables: SitemapTreeNode[] = [];
  for (let tableIndex = start; tableIndex <= end; tableIndex += 1) {
    const tableId =
      assets.tableIndexToId[tableIndex] ?? `TBL-${pad(tableIndex, 3)}`;
    const asset = assets.assets[tableId];
    if (asset) {
      tables.push({
        id: asset.assetId,
        label: asset.assetId,
        kind: "table",
        ...fromAsset(asset, assets, lookup),
        count: modulesPerTable,
        children: undefined,
      });
    } else {
      tables.push({
        id: tableId,
        label: tableId,
        kind: "table",
        assetId: tableId,
        typeLabel: mountingLabel(plant.mountingKind),
        status: "ONLINE",
        rows: syntheticTableRows(plant, tableIndex, modulesPerTable),
        componentId: lookup.get(tableId)?.id,
        count: modulesPerTable,
        children: undefined,
      });
    }
  }
  return tables;
}

export function treeNodeHasChildren(node: SitemapTreeNode): boolean {
  if (node.kind === "table") return (node.count ?? 0) > 0;
  if (node.kind === "block") return (node.count ?? 0) > 0;
  if (node.tableRange) return node.tableRange.end >= node.tableRange.start;
  return (node.children?.length ?? 0) > 0;
}
