/**
 * Phase 3 — Electrical Topology Layer
 *
 * Physical Asset Model (Phase 2) remains the single source of truth for asset
 * identity, position, and physical parent/child hierarchy (Plant → Block → Table → Module).
 *
 * This module builds a separate electrical graph on top of those assets:
 *
 *   MODULE → STRING → COMBINER → INVERTER → TRANSFORMER → FEEDER → SUBSTATION → GRID
 *
 * Rules:
 * - Reuse existing asset IDs (INV-001, TRF-001, CB-001, MOD-001, GRID-001, …).
 * - Only introduce new IDs for entities that do not exist physically: STR-*, FDR-*.
 * - Do not replace parentId with electrical connectivity.
 * - Topology is derived from TwinSpec + AssetModel; never hard-coded demo edges.
 * - Phase 4 telemetry can attach to the same assetId later.
 */

import type { TwinRecord } from "@/lib/api";
import {
  formatAssetId,
  type Asset,
  type AssetModel,
  type AssetStatus,
  type AssetVec3,
} from "@/lib/assetModel";
import type { TwinLayout } from "@/lib/twinLayout";

export const ELECTRICAL_ASSET_TYPES = [
  "MODULE",
  "STRING",
  "COMBINER",
  "INVERTER",
  "TRANSFORMER",
  "FEEDER",
  "SUBSTATION",
  "GRID_INTERCONNECTION",
  "GRID",
] as const;

export type ElectricalAssetType = (typeof ELECTRICAL_ASSET_TYPES)[number];

export type ElectricalConnectionType =
  | "SERIES"
  | "DC"
  | "AC_LV"
  | "AC_MV"
  | "HV";

export type ElectricalNode = {
  electricalId: string;
  assetId: string;
  type: ElectricalAssetType;
  /** Optional block for aggregation / SLD. */
  blockAssetId?: string;
};

export type ElectricalConnectionMeta = {
  voltage?: number;
  current?: number;
  power?: number;
  phase?: string;
  cableType?: string;
  cableLength?: number;
  frequency?: number;
  capacity?: number;
  nominalVoltage?: number;
  ratedPower?: number;
};

export type ElectricalConnection = {
  connectionId: string;
  fromAssetId: string;
  toAssetId: string;
  connectionType: ElectricalConnectionType;
  metadata?: ElectricalConnectionMeta;
  /** Optional 3D polyline in plant coordinates. */
  path3d?: AssetVec3[];
};

export type ElectricalString = {
  stringId: string;
  assetId: string;
  name: string;
  blockAssetId?: string;
  tableAssetId?: string;
  moduleIds: string[];
  moduleCount: number;
  combinerId?: string;
};

export type ElectricalFeeder = {
  feederId: string;
  assetId: string;
  name: string;
  sourceTransformerIds: string[];
  destinationSubstationId?: string;
  voltageKv?: number;
  metadata?: ElectricalConnectionMeta;
};

export type ElectricalConfig = {
  modulesPerString: number;
  stringsPerCombiner: number;
  combinersPerInverter: number;
  invertersPerTransformer: number;
  transformersPerFeeder: number;
  numberOfMvFeeders?: number;
};

export type ElectricalIssueSeverity = "error" | "warning";

export type ElectricalIssue = {
  code:
    | "orphan"
    | "broken_chain"
    | "missing_connection"
    | "invalid_reference"
    | "duplicate_connection"
    | "cycle";
  severity: ElectricalIssueSeverity;
  message: string;
  assetId?: string;
  connectionId?: string;
};

export type ElectricalValidationResult = {
  assetCount: number;
  connectionCount: number;
  validConnections: number;
  errors: ElectricalIssue[];
  warnings: ElectricalIssue[];
};

export type ElectricalCounts = {
  modules: number;
  strings: number;
  combiners: number;
  inverters: number;
  transformers: number;
  feeders: number;
  substations: number;
  gridConnections: number;
};

export type ElectricalModel = {
  plantId: string;
  config: ElectricalConfig;
  nodes: Record<string, ElectricalNode>;
  connections: ElectricalConnection[];
  connectionsById: Record<string, ElectricalConnection>;
  /** Outgoing connection IDs per asset. */
  outEdges: Record<string, string[]>;
  /** Incoming connection IDs per asset. */
  inEdges: Record<string, string[]>;
  strings: Record<string, ElectricalString>;
  stringIds: string[];
  feeders: Record<string, ElectricalFeeder>;
  feederIds: string[];
  counts: ElectricalCounts;
  validation: ElectricalValidationResult;
  generatedAt: string;
  error?: string;
};

/** Soft cap for fully indexed string↔module edges in the connection list. */
const MODULE_EDGE_MATERIALIZE_LIMIT = 50_000;

function num(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function mockStatus(seed: string): AssetStatus {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const roll = (hash >>> 0) / 4294967296;
  if (roll > 0.985) return "offline";
  if (roll > 0.96) return "fault";
  if (roll > 0.93) return "warning";
  return "operational";
}

function distributeRoundRobin<T>(items: T[], buckets: number): T[][] {
  const n = Math.max(1, buckets);
  const groups: T[][] = Array.from({ length: n }, () => []);
  items.forEach((item, index) => {
    groups[index % n]?.push(item);
  });
  return groups;
}

function chunk<T>(items: T[], size: number): T[][] {
  const n = Math.max(1, size);
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += n) {
    out.push(items.slice(i, i + n));
  }
  return out;
}

function midpoint(a?: AssetVec3, b?: AssetVec3): AssetVec3 | undefined {
  if (!a && !b) return undefined;
  if (!a) return b ? { ...b } : undefined;
  if (!b) return { ...a };
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
  };
}

function pathBetween(a?: AssetVec3, b?: AssetVec3): AssetVec3[] | undefined {
  if (!a || !b) return undefined;
  return [
    { ...a },
    { x: a.x, y: Math.max(a.y, b.y, 0.3) + 0.2, z: (a.z + b.z) / 2 },
    { ...b },
  ];
}

function connectionId(from: string, to: string): string {
  return `CONN-${from}-${to}`;
}

/**
 * Resolve Phase 3 electrical defaults from TwinSpec + intake.
 * All fields are optional in the form; missing values are derived.
 */
export function resolveElectricalConfig(twin: TwinRecord): ElectricalConfig {
  const intake = twin.spec.intake ?? {};
  const modulesPerString = Math.max(
    1,
    Math.round(num(intake.modulesPerString, twin.spec.modulesPerString || 28)),
  );
  const stringsPerCombiner = Math.max(
    1,
    Math.round(num(intake.stringsPerCombiner, 16)),
  );
  const combinersPerInverter = Math.max(
    1,
    Math.round(num(intake.combinersPerInverter, 4)),
  );
  const invertersPerTransformer = Math.max(
    1,
    Math.round(num(intake.invertersPerTransformer, 4)),
  );
  const transformersPerFeeder = Math.max(
    1,
    Math.round(num(intake.transformersPerFeeder, 2)),
  );
  const numberOfMvFeeders = intake.numberOfMvFeeders?.trim()
    ? Math.max(1, Math.round(num(intake.numberOfMvFeeders, 1)))
    : undefined;

  return {
    modulesPerString,
    stringsPerCombiner,
    combinersPerInverter,
    invertersPerTransformer,
    transformersPerFeeder,
    numberOfMvFeeders,
  };
}

function listByType(model: AssetModel, type: Asset["assetType"]): Asset[] {
  return Object.values(model.assets)
    .filter((asset) => asset.assetType === type)
    .sort((a, b) => a.assetId.localeCompare(b.assetId));
}

function tableModuleIds(table: Asset): string[] {
  if (table.children.length > 0) return [...table.children];
  const start =
    typeof table.metadata.moduleNumberStart === "number"
      ? table.metadata.moduleNumberStart
      : 1;
  const count =
    typeof table.metadata.modules === "number"
      ? table.metadata.modules
      : 0;
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) =>
    formatAssetId("MOD-{number:03d}", start + i),
  );
}

type GraphBuilder = {
  nodes: Record<string, ElectricalNode>;
  connections: ElectricalConnection[];
  connectionsById: Record<string, ElectricalConnection>;
  outEdges: Record<string, string[]>;
  inEdges: Record<string, string[]>;
  edgeKeys: Set<string>;
};

function emptyGraph(): GraphBuilder {
  return {
    nodes: {},
    connections: [],
    connectionsById: {},
    outEdges: {},
    inEdges: {},
    edgeKeys: new Set(),
  };
}

function ensureNode(
  graph: GraphBuilder,
  assetId: string,
  type: ElectricalAssetType,
  blockAssetId?: string,
) {
  if (graph.nodes[assetId]) return;
  graph.nodes[assetId] = {
    electricalId: assetId,
    assetId,
    type,
    blockAssetId,
  };
}

function addConnection(
  graph: GraphBuilder,
  fromAssetId: string,
  toAssetId: string,
  connectionType: ElectricalConnectionType,
  metadata?: ElectricalConnectionMeta,
  path3d?: AssetVec3[],
): ElectricalConnection | null {
  const key = `${fromAssetId}->${toAssetId}`;
  if (graph.edgeKeys.has(key)) return null;
  graph.edgeKeys.add(key);
  const conn: ElectricalConnection = {
    connectionId: connectionId(fromAssetId, toAssetId),
    fromAssetId,
    toAssetId,
    connectionType,
    metadata,
    path3d,
  };
  graph.connections.push(conn);
  graph.connectionsById[conn.connectionId] = conn;
  (graph.outEdges[fromAssetId] ??= []).push(conn.connectionId);
  (graph.inEdges[toAssetId] ??= []).push(conn.connectionId);
  return conn;
}

/**
 * Inject STRING / FEEDER assets into the physical AssetModel and attach
 * electricalConnections stubs on participating assets. Mutates `model`.
 */
function commitElectricalAssets(
  model: AssetModel,
  twin: TwinRecord,
  layout: TwinLayout,
  strings: ElectricalString[],
  feeders: ElectricalFeeder[],
  graph: GraphBuilder,
) {
  const plantId = model.plantId;
  const seed = twin.id;

  for (const str of strings) {
    if (model.assets[str.assetId]) continue;
    const table = str.tableAssetId ? model.assets[str.tableAssetId] : undefined;
    const block = str.blockAssetId ? model.assets[str.blockAssetId] : undefined;
    // Parent under plant — do not pollute Block → Table → Module physical tree.
    const parentId = plantId;
    const pos =
      table?.position ??
      block?.position ??
      ({ x: 0, y: 0.4, z: 0 } satisfies AssetVec3);
    const asset: Asset = {
      assetId: str.assetId,
      assetType: "STRING",
      name: str.name,
      parentId,
      plantId,
      children: [],
      status: mockStatus(`${seed}:${str.assetId}`),
      position: { ...pos, y: (pos.y ?? 0) + 0.15 },
      metadata: {
        moduleIds: str.moduleIds,
        moduleCount: str.moduleCount,
        combinerId: str.combinerId,
        tableAssetId: str.tableAssetId,
        blockAssetId: str.blockAssetId,
        electrical: true,
      },
      electricalConnections: [],
    };
    model.assets[str.assetId] = asset;
    model.order.push(str.assetId);
    const parent = model.assets[parentId];
    if (parent && !parent.children.includes(str.assetId)) {
      parent.children.push(str.assetId);
    }
  }

  for (const feeder of feeders) {
    if (model.assets[feeder.assetId]) continue;
    const sources = feeder.sourceTransformerIds
      .map((id) => model.assets[id])
      .filter(Boolean);
    const sub = feeder.destinationSubstationId
      ? model.assets[feeder.destinationSubstationId]
      : undefined;
    const pos =
      midpoint(sources[0]?.position, sub?.position) ??
      layout.substation ??
      ({ x: 0, y: 0, z: 0 } as { x: number; y: number; z: number });
    const asset: Asset = {
      assetId: feeder.assetId,
      assetType: "FEEDER",
      name: feeder.name,
      parentId: plantId,
      plantId,
      children: [],
      status: "operational",
      position: {
        x: "x" in pos ? pos.x : 0,
        y: 1.2,
        z: "z" in pos ? pos.z : 0,
      },
      metadata: {
        sourceTransformerIds: feeder.sourceTransformerIds,
        destinationSubstationId: feeder.destinationSubstationId,
        voltageKv: feeder.voltageKv,
        electrical: true,
      },
      electricalConnections: [],
    };
    model.assets[feeder.assetId] = asset;
    model.order.push(feeder.assetId);
    const plant = model.assets[plantId];
    if (plant && !plant.children.includes(feeder.assetId)) {
      plant.children.push(feeder.assetId);
    }
  }

  // Attach connection ID lists onto assets for Phase 4 readiness.
  for (const conn of graph.connections) {
    for (const id of [conn.fromAssetId, conn.toAssetId]) {
      const asset = model.assets[id];
      if (!asset) continue;
      const list = (asset.electricalConnections ??= []) as string[];
      if (!list.includes(conn.connectionId)) list.push(conn.connectionId);
    }
  }

  // Refresh counts for strings/feeders (modules may be virtual).
  let stringCount = 0;
  let feederCount = 0;
  for (const asset of Object.values(model.assets)) {
    if (asset.assetType === "STRING") stringCount += 1;
    if (asset.assetType === "FEEDER") feederCount += 1;
  }
  model.counts.strings = stringCount;
  model.counts.feeders = feederCount;
}

/**
 * Build the electrical topology from the physical AssetModel + layout + twin config.
 * Mutates `model` to add STRING/FEEDER assets and electricalConnections references.
 * On failure, leaves `model` unchanged where practical and returns an errored model.
 */
export function buildElectricalModel(
  twin: TwinRecord,
  model: AssetModel,
  layout: TwinLayout,
): ElectricalModel {
  const generatedAt = new Date().toISOString();
  const config = resolveElectricalConfig(twin);

  try {
    const graph = emptyGraph();
    const strings: ElectricalString[] = [];
    const stringIds: string[] = [];
    const feedersMap: Record<string, ElectricalFeeder> = {};
    const feederIds: string[] = [];

    const tables = listByType(model, "TABLE");
    const combiners = listByType(model, "COMBINER");
    const inverters = listByType(model, "INVERTER");
    const transformers = listByType(model, "TRANSFORMER");
    const substations = listByType(model, "SUBSTATION");
    const grids = listByType(model, "GRID_INTERCONNECTION");

    // --- Strings from modules (per table, deterministic STR-001…) ---
    let stringNumber = 0;
    let totalModulesRef = 0;
    for (const table of tables) {
      const moduleIds = tableModuleIds(table);
      totalModulesRef += moduleIds.length;
      const blockAssetId =
        (typeof table.metadata.blockAssetId === "string"
          ? table.metadata.blockAssetId
          : table.parentId) || undefined;
      const groups = chunk(moduleIds, config.modulesPerString);
      for (const group of groups) {
        if (group.length === 0) continue;
        stringNumber += 1;
        const stringId = formatAssetId("STR-{number:03d}", stringNumber);
        const record: ElectricalString = {
          stringId,
          assetId: stringId,
          name: `String ${String(stringNumber).padStart(3, "0")}`,
          blockAssetId,
          tableAssetId: table.assetId,
          moduleIds: group,
          moduleCount: group.length,
        };
        strings.push(record);
        stringIds.push(stringId);
        ensureNode(graph, stringId, "STRING", blockAssetId);

        const materializeEdges =
          totalModulesRef <= MODULE_EDGE_MATERIALIZE_LIMIT;
        for (const moduleId of group) {
          ensureNode(graph, moduleId, "MODULE", blockAssetId);
          if (materializeEdges) {
            addConnection(graph, moduleId, stringId, "SERIES", {
              cableType: "module-string",
            });
          }
        }
        // Always keep a compact string→module index even when edges are skipped.
        if (!materializeEdges) {
          // No per-module edges; string metadata still holds moduleIds.
        }
      }
    }

    // Ensure combiner pool is large enough for the string count.
    const neededCombiners = Math.max(
      1,
      Math.ceil(strings.length / Math.max(1, config.stringsPerCombiner)),
    );
    const combinerAssets = [...combiners];
    while (combinerAssets.length < neededCombiners) {
      const n = combinerAssets.length + 1;
      const id = formatAssetId("CB-{number:03d}", n);
      if (model.assets[id]) {
        combinerAssets.push(model.assets[id]!);
        continue;
      }
      // Place near a block or existing combiner.
      const anchor =
        combinerAssets[combinerAssets.length - 1]?.position ??
        tables[combinerAssets.length % Math.max(1, tables.length)]?.position ??
        ({ x: 0, y: 0, z: 0 } satisfies AssetVec3);
      const asset: Asset = {
        assetId: id,
        assetType: "COMBINER",
        name: `Combiner ${String(n).padStart(3, "0")}`,
        parentId: model.plantId,
        plantId: model.plantId,
        children: [],
        status: mockStatus(`${twin.id}:${id}`),
        position: {
          x: (anchor.x ?? 0) + (n % 3) * 1.2,
          y: 0,
          z: (anchor.z ?? 0) + 1.4,
        },
        geometry: { type: "combiner", modelId: id },
        metadata: { index: n, electricalGenerated: true },
        electricalConnections: [],
      };
      model.assets[id] = asset;
      model.order.push(id);
      model.assets[model.plantId]?.children.push(id);
      combinerAssets.push(asset);
      model.counts.combiners += 1;
    }

    // --- Strings → Combiners ---
    const stringGroups = distributeRoundRobin(strings, combinerAssets.length);
    stringGroups.forEach((group, index) => {
      const combiner = combinerAssets[index];
      if (!combiner) return;
      ensureNode(
        graph,
        combiner.assetId,
        "COMBINER",
        typeof combiner.metadata.blockAssetId === "string"
          ? combiner.metadata.blockAssetId
          : undefined,
      );
      for (const str of group) {
        str.combinerId = combiner.assetId;
        addConnection(
          graph,
          str.assetId,
          combiner.assetId,
          "DC",
          { cableType: "string-combiner" },
          pathBetween(
            model.assets[str.assetId]?.position ??
              model.assets[str.tableAssetId ?? ""]?.position,
            combiner.position,
          ),
        );
      }
    });

    // --- Combiners → Inverters ---
    const invPool = inverters.length > 0 ? inverters : [];
    if (invPool.length === 0) {
      // No inverters — leave combiners as leaves (validation will warn).
    } else {
      const combinerGroups = distributeRoundRobin(combinerAssets, invPool.length);
      combinerGroups.forEach((group, index) => {
        const inv = invPool[index];
        if (!inv) return;
        ensureNode(graph, inv.assetId, "INVERTER");
        for (const cb of group) {
          addConnection(
            graph,
            cb.assetId,
            inv.assetId,
            "DC",
            { cableType: "combiner-inverter" },
            pathBetween(cb.position, inv.position),
          );
        }
      });
    }

    // --- Inverters → Transformers ---
    if (transformers.length > 0 && invPool.length > 0) {
      const xfmrCount = transformers.length;
      // Prefer invertersPerTransformer from config when it fits.
      const perXfmr = Math.max(
        1,
        Math.min(
          config.invertersPerTransformer,
          Math.ceil(invPool.length / xfmrCount),
        ),
      );
      // Use round-robin for even load when counts don't divide evenly.
      const invGroups = distributeRoundRobin(invPool, xfmrCount);
      invGroups.forEach((group, index) => {
        const trf = transformers[index];
        if (!trf) return;
        ensureNode(graph, trf.assetId, "TRANSFORMER");
        // Annotate optional electrical metadata on transformer asset.
        trf.metadata = {
          ...trf.metadata,
          lvVoltage: trf.metadata.lvVoltage ?? 0.8,
          mvVoltage: trf.metadata.mvVoltage ?? twin.spec.mvVoltageKv,
          ratingMva: trf.metadata.ratingMva ?? twin.spec.transformerMva,
          transformerType:
            trf.metadata.transformerType ?? twin.spec.intake?.transformerType,
        };
        for (const inv of group) {
          addConnection(
            graph,
            inv.assetId,
            trf.assetId,
            "AC_LV",
            {
              cableType: "inverter-transformer",
              nominalVoltage: 0.8,
              ratedPower: twin.spec.inverterRatingKw,
            },
            pathBetween(inv.position, trf.position),
          );
        }
        void perXfmr;
      });
    }

    // --- Transformers → Feeders → Substation ---
    const feederCount = Math.max(
      1,
      config.numberOfMvFeeders ??
        Math.max(
          1,
          Math.ceil(
            Math.max(1, transformers.length) /
              Math.max(1, config.transformersPerFeeder),
          ),
        ),
    );
    const xfmrGroups = distributeRoundRobin(
      transformers.length > 0 ? transformers : [],
      feederCount,
    );
    const primarySub = substations[0];
    const grid = grids[0];

    xfmrGroups.forEach((group, index) => {
      if (group.length === 0 && transformers.length > 0) return;
      const n = index + 1;
      const feederId = formatAssetId("FDR-{number:03d}", n);
      const destSub =
        substations[index % Math.max(1, substations.length)] ?? primarySub;
      const feeder: ElectricalFeeder = {
        feederId,
        assetId: feederId,
        name: `MV Feeder ${String(n).padStart(3, "0")}`,
        sourceTransformerIds: group.map((t) => t.assetId),
        destinationSubstationId: destSub?.assetId,
        voltageKv: twin.spec.mvVoltageKv,
        metadata: {
          nominalVoltage: twin.spec.mvVoltageKv,
          cableType: "mv-feeder",
        },
      };
      feedersMap[feederId] = feeder;
      feederIds.push(feederId);
      ensureNode(graph, feederId, "FEEDER");

      for (const trf of group) {
        addConnection(
          graph,
          trf.assetId,
          feederId,
          "AC_MV",
          {
            cableType: "transformer-feeder",
            nominalVoltage: twin.spec.mvVoltageKv,
          },
          pathBetween(trf.position, destSub?.position),
        );
      }

      if (destSub) {
        ensureNode(graph, destSub.assetId, "SUBSTATION");
        addConnection(
          graph,
          feederId,
          destSub.assetId,
          "AC_MV",
          {
            cableType: "feeder-substation",
            nominalVoltage: twin.spec.mvVoltageKv,
          },
          pathBetween(
            midpoint(
              group[0]?.position,
              group[group.length - 1]?.position,
            ),
            destSub.position,
          ),
        );
      }
    });

    // If no transformers but substation exists, still create a feeder stub from inverters.
    if (transformers.length === 0 && primarySub && invPool.length > 0) {
      const feederId = formatAssetId("FDR-{number:03d}", 1);
      const feeder: ElectricalFeeder = {
        feederId,
        assetId: feederId,
        name: "MV Feeder 001",
        sourceTransformerIds: [],
        destinationSubstationId: primarySub.assetId,
        voltageKv: twin.spec.mvVoltageKv,
      };
      feedersMap[feederId] = feeder;
      feederIds.push(feederId);
      ensureNode(graph, feederId, "FEEDER");
      ensureNode(graph, primarySub.assetId, "SUBSTATION");
      for (const inv of invPool) {
        addConnection(
          graph,
          inv.assetId,
          feederId,
          "AC_LV",
          { cableType: "inverter-feeder" },
          pathBetween(inv.position, primarySub.position),
        );
      }
      addConnection(
        graph,
        feederId,
        primarySub.assetId,
        "AC_MV",
        { cableType: "feeder-substation" },
        pathBetween({ x: 0, y: 1, z: 0 }, primarySub.position),
      );
    }

    // --- Substation → Grid ---
    if (primarySub && grid) {
      ensureNode(graph, primarySub.assetId, "SUBSTATION");
      ensureNode(graph, grid.assetId, "GRID_INTERCONNECTION");
      addConnection(
        graph,
        primarySub.assetId,
        grid.assetId,
        "HV",
        {
          cableType: "substation-grid",
          nominalVoltage: twin.spec.gridVoltageKv,
        },
        pathBetween(primarySub.position, grid.position),
      );
    } else if (grid && !primarySub) {
      ensureNode(graph, grid.assetId, "GRID_INTERCONNECTION");
    }

    // Persist string combiner IDs onto string records before asset commit.
    commitElectricalAssets(
      model,
      twin,
      layout,
      strings,
      Object.values(feedersMap),
      graph,
    );

    // Update string assets' combiner metadata after assignment.
    for (const str of strings) {
      const asset = model.assets[str.assetId];
      if (asset) {
        asset.metadata.combinerId = str.combinerId;
        asset.metadata.moduleIds = str.moduleIds;
      }
    }

    const electrical: ElectricalModel = {
      plantId: model.plantId,
      config,
      nodes: graph.nodes,
      connections: graph.connections,
      connectionsById: graph.connectionsById,
      outEdges: graph.outEdges,
      inEdges: graph.inEdges,
      strings: Object.fromEntries(strings.map((s) => [s.assetId, s])),
      stringIds,
      feeders: feedersMap,
      feederIds,
      counts: {
        modules: totalModulesRef || model.counts.modules,
        strings: stringIds.length,
        combiners: combinerAssets.length,
        inverters: invPool.length,
        transformers: transformers.length,
        feeders: feederIds.length,
        substations: substations.length,
        gridConnections: grids.length,
      },
      validation: { assetCount: 0, connectionCount: 0, validConnections: 0, errors: [], warnings: [] },
      generatedAt,
    };

    electrical.validation = validateElectricalTopology(electrical, model);
    model.electrical = electrical;
    return electrical;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Electrical topology generation failed";
    const empty: ElectricalModel = {
      plantId: model.plantId,
      config,
      nodes: {},
      connections: [],
      connectionsById: {},
      outEdges: {},
      inEdges: {},
      strings: {},
      stringIds: [],
      feeders: {},
      feederIds: [],
      counts: {
        modules: 0,
        strings: 0,
        combiners: 0,
        inverters: 0,
        transformers: 0,
        feeders: 0,
        substations: 0,
        gridConnections: 0,
      },
      validation: {
        assetCount: 0,
        connectionCount: 0,
        validConnections: 0,
        errors: [
          {
            code: "broken_chain",
            severity: "error",
            message,
          },
        ],
        warnings: [],
      },
      generatedAt,
      error: message,
    };
    model.electrical = empty;
    return empty;
  }
}

export function getElectricalNode(
  electrical: ElectricalModel,
  assetId: string,
): ElectricalNode | null {
  return electrical.nodes[assetId] ?? null;
}

export function getElectricalConnections(
  electrical: ElectricalModel,
  assetId: string,
): ElectricalConnection[] {
  const out = (electrical.outEdges[assetId] ?? [])
    .map((id) => electrical.connectionsById[id])
    .filter(Boolean) as ElectricalConnection[];
  const inn = (electrical.inEdges[assetId] ?? [])
    .map((id) => electrical.connectionsById[id])
    .filter(Boolean) as ElectricalConnection[];
  return [...inn, ...out];
}

function walk(
  electrical: ElectricalModel,
  startId: string,
  direction: "up" | "down",
): string[] {
  const result: string[] = [];
  const seen = new Set<string>([startId]);
  const queue = [startId];

  // Virtual-module fallback: module→string may not have materialized edges.
  if (direction === "up" || direction === "down") {
    const seedNeighbors = moduleStringNeighbors(electrical, startId);
    for (const next of direction === "down" ? seedNeighbors.down : seedNeighbors.up) {
      if (!seen.has(next)) {
        seen.add(next);
        result.push(next);
        queue.push(next);
      }
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const edgeIds =
      direction === "down"
        ? electrical.outEdges[current] ?? []
        : electrical.inEdges[current] ?? [];
    for (const edgeId of edgeIds) {
      const edge = electrical.connectionsById[edgeId];
      if (!edge) continue;
      const next = direction === "down" ? edge.toAssetId : edge.fromAssetId;
      if (seen.has(next)) continue;
      seen.add(next);
      result.push(next);
      queue.push(next);
    }
    // Also expand via string membership for modules.
    const extra = moduleStringNeighbors(electrical, current);
    for (const next of direction === "down" ? extra.down : extra.up) {
      if (seen.has(next)) continue;
      seen.add(next);
      result.push(next);
      queue.push(next);
    }
  }
  return result;
}

function moduleStringNeighbors(
  electrical: ElectricalModel,
  assetId: string,
): { up: string[]; down: string[] } {
  const up: string[] = [];
  const down: string[] = [];
  // MODULE → STRING (module is upstream of string)
  for (const str of Object.values(electrical.strings)) {
    if (str.moduleIds.includes(assetId)) {
      down.push(str.assetId);
    }
  }
  return { up, down };
}

/** Immediate + recursive upstream assets (toward PV / modules). */
export function getUpstreamAssets(
  electrical: ElectricalModel,
  assetId: string,
): string[] {
  return walk(electrical, assetId, "up");
}

/** Immediate + recursive downstream assets (toward grid). */
export function getDownstreamAssets(
  electrical: ElectricalModel,
  assetId: string,
): string[] {
  return walk(electrical, assetId, "down");
}

export function getConnectedAssets(
  electrical: ElectricalModel,
  assetId: string,
): string[] {
  const set = new Set([
    ...getUpstreamAssets(electrical, assetId),
    ...getDownstreamAssets(electrical, assetId),
  ]);
  return [...set];
}

export type ElectricalPath = {
  assetId: string;
  upstream: string[];
  downstream: string[];
  fullPath: string[];
  connectionIds: string[];
};

/**
 * Trace full electrical path through an asset.
 * Upstream is ordered from farthest (modules/strings) → nearest.
 * Downstream is ordered nearest → farthest (grid).
 */
export function getElectricalPath(
  electrical: ElectricalModel,
  assetId: string,
): ElectricalPath {
  const upstreamAll = getUpstreamAssets(electrical, assetId);
  const downstream = getDownstreamAssets(electrical, assetId);

  // Order upstream as a chain when possible (prefer leaf→…→asset).
  const upstream = orderToward(electrical, upstreamAll, assetId, "down");

  const fullPath = [...upstream, assetId, ...downstream];
  const connectionIds: string[] = [];
  for (let i = 0; i < fullPath.length - 1; i += 1) {
    const from = fullPath[i]!;
    const to = fullPath[i + 1]!;
    const id = connectionId(from, to);
    if (electrical.connectionsById[id]) connectionIds.push(id);
    else {
      // Try reverse / any edge between the pair.
      const alt = connectionId(to, from);
      if (electrical.connectionsById[alt]) connectionIds.push(alt);
    }
  }

  return { assetId, upstream, downstream, fullPath, connectionIds };
}

function orderToward(
  electrical: ElectricalModel,
  members: string[],
  target: string,
  direction: "down" | "up",
): string[] {
  if (members.length === 0) return [];
  const memberSet = new Set(members);
  // Find roots: members with no incoming edge from another member.
  const roots = members.filter((id) => {
    const ins = electrical.inEdges[id] ?? [];
    return !ins.some((edgeId) => {
      const edge = electrical.connectionsById[edgeId];
      return edge && memberSet.has(edge.fromAssetId);
    });
  });
  const start = roots[0] ?? members[0]!;
  const ordered: string[] = [];
  const seen = new Set<string>();
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (seen.has(current)) continue;
    seen.add(current);
    if (memberSet.has(current)) ordered.push(current);
    const edges =
      direction === "down"
        ? electrical.outEdges[current] ?? []
        : electrical.inEdges[current] ?? [];
    for (const edgeId of edges) {
      const edge = electrical.connectionsById[edgeId];
      if (!edge) continue;
      const next = direction === "down" ? edge.toAssetId : edge.fromAssetId;
      if (next === target || memberSet.has(next)) queue.push(next);
    }
  }
  // Append any missed members.
  for (const id of members) {
    if (!seen.has(id)) ordered.push(id);
  }
  return ordered;
}

export function findElectricalPath(
  electrical: ElectricalModel,
  fromAssetId: string,
  toAssetId: string,
): string[] | null {
  if (fromAssetId === toAssetId) return [fromAssetId];
  const queue: string[][] = [[fromAssetId]];
  const seen = new Set<string>([fromAssetId]);
  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1]!;
    const outs = electrical.outEdges[current] ?? [];
    const inns = electrical.inEdges[current] ?? [];
    const neighbors: string[] = [];
    for (const id of outs) {
      const e = electrical.connectionsById[id];
      if (e) neighbors.push(e.toAssetId);
    }
    for (const id of inns) {
      const e = electrical.connectionsById[id];
      if (e) neighbors.push(e.fromAssetId);
    }
    for (const next of neighbors) {
      if (seen.has(next)) continue;
      const nextPath = [...path, next];
      if (next === toAssetId) return nextPath;
      seen.add(next);
      queue.push(nextPath);
    }
  }
  return null;
}

export function validateElectricalTopology(
  electrical: ElectricalModel,
  model: AssetModel,
): ElectricalValidationResult {
  const errors: ElectricalIssue[] = [];
  const warnings: ElectricalIssue[] = [];
  const seenPairs = new Set<string>();

  for (const conn of electrical.connections) {
    const pair = `${conn.fromAssetId}->${conn.toAssetId}`;
    if (seenPairs.has(pair)) {
      errors.push({
        code: "duplicate_connection",
        severity: "error",
        message: `Duplicate connection ${pair}`,
        connectionId: conn.connectionId,
        assetId: conn.fromAssetId,
      });
    }
    seenPairs.add(pair);

    if (!electrical.nodes[conn.fromAssetId] && !model.assets[conn.fromAssetId]) {
      errors.push({
        code: "invalid_reference",
        severity: "error",
        message: `Connection ${conn.connectionId} references missing from-asset ${conn.fromAssetId}`,
        connectionId: conn.connectionId,
        assetId: conn.fromAssetId,
      });
    }
    if (!electrical.nodes[conn.toAssetId] && !model.assets[conn.toAssetId]) {
      errors.push({
        code: "invalid_reference",
        severity: "error",
        message: `Connection ${conn.connectionId} references missing to-asset ${conn.toAssetId}`,
        connectionId: conn.connectionId,
        assetId: conn.toAssetId,
      });
    }
  }

  // Cycle detection (directed).
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycleFrom = (node: string): boolean => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const edgeId of electrical.outEdges[node] ?? []) {
      const edge = electrical.connectionsById[edgeId];
      if (edge && cycleFrom(edge.toAssetId)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  };
  for (const assetId of Object.keys(electrical.nodes)) {
    if (cycleFrom(assetId)) {
      errors.push({
        code: "cycle",
        severity: "error",
        message: `Circular electrical connection involving ${assetId}`,
        assetId,
      });
      break;
    }
  }

  for (const node of Object.values(electrical.nodes)) {
    if (node.type === "MODULE") continue; // modules may be virtual
    const hasIn = (electrical.inEdges[node.assetId] ?? []).length > 0;
    const hasOut = (electrical.outEdges[node.assetId] ?? []).length > 0;
    if (!hasIn && !hasOut && node.type !== "GRID") {
      // Strings always should have out; modules may skip edges when capped.
      if (node.type === "STRING" || node.type === "COMBINER" || node.type === "INVERTER") {
        warnings.push({
          code: "orphan",
          severity: "warning",
          message: `${node.assetId} has no electrical connections`,
          assetId: node.assetId,
        });
      }
    }
    if (node.type === "COMBINER" && !hasOut) {
      warnings.push({
        code: "missing_connection",
        severity: "warning",
        message: `${node.assetId} has no inverter connection`,
        assetId: node.assetId,
      });
    }
    if (node.type === "INVERTER" && !hasOut) {
      warnings.push({
        code: "broken_chain",
        severity: "warning",
        message: `${node.assetId} has no downstream transformer/feeder`,
        assetId: node.assetId,
      });
    }
    if (node.type === "TRANSFORMER" && !hasOut) {
      warnings.push({
        code: "broken_chain",
        severity: "warning",
        message: `${node.assetId} has no downstream feeder`,
        assetId: node.assetId,
      });
    }
    if (node.type === "FEEDER" && !hasOut) {
      warnings.push({
        code: "broken_chain",
        severity: "warning",
        message: `${node.assetId} has no substation connection`,
        assetId: node.assetId,
      });
    }
  }

  const invalid = errors.filter((e) =>
    e.code === "invalid_reference" || e.code === "duplicate_connection" || e.code === "cycle",
  ).length;

  return {
    assetCount: Object.keys(electrical.nodes).length,
    connectionCount: electrical.connections.length,
    validConnections: Math.max(0, electrical.connections.length - invalid),
    errors,
    warnings,
  };
}

export type ElectricalSearchHit = {
  assetId: string;
  assetType: string;
  name: string;
  upstream: string[];
  downstream: string[];
};

export function searchElectricalAssets(
  model: AssetModel,
  query: string,
  limit = 20,
): ElectricalSearchHit[] {
  const electrical = model.electrical;
  const q = query.trim().toLowerCase();
  if (!q || !electrical) return [];
  const hits: ElectricalSearchHit[] = [];

  const consider = (assetId: string, assetType: string, name: string) => {
    if (
      assetId.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q) ||
      assetType.toLowerCase().includes(q)
    ) {
      hits.push({
        assetId,
        assetType,
        name,
        upstream: getUpstreamAssets(electrical, assetId).slice(0, 6),
        downstream: getDownstreamAssets(electrical, assetId).slice(0, 6),
      });
    }
  };

  for (const id of electrical.stringIds) {
    const str = electrical.strings[id];
    if (str) consider(id, "STRING", str.name);
    if (hits.length >= limit) return hits;
  }
  for (const id of electrical.feederIds) {
    const f = electrical.feeders[id];
    if (f) consider(id, "FEEDER", f.name);
    if (hits.length >= limit) return hits;
  }
  for (const node of Object.values(electrical.nodes)) {
    if (node.type === "STRING" || node.type === "FEEDER") continue;
    const asset = model.assets[node.assetId];
    consider(node.assetId, node.type, asset?.name ?? node.assetId);
    if (hits.length >= limit) return hits;
  }
  return hits;
}

/** Immediate upstream neighbors only. */
export function getImmediateUpstream(
  electrical: ElectricalModel,
  assetId: string,
): string[] {
  const fromEdges = (electrical.inEdges[assetId] ?? [])
    .map((id) => electrical.connectionsById[id]?.fromAssetId)
    .filter((id): id is string => Boolean(id));
  if (fromEdges.length > 0) return fromEdges;
  // When walking up into a string without materialized module edges, do not
  // expand tens of thousands of modules in the details panel.
  return [];
}

/** Immediate downstream neighbors only. */
export function getImmediateDownstream(
  electrical: ElectricalModel,
  assetId: string,
): string[] {
  const fromEdges = (electrical.outEdges[assetId] ?? [])
    .map((id) => electrical.connectionsById[id]?.toAssetId)
    .filter((id): id is string => Boolean(id));
  if (fromEdges.length > 0) return fromEdges;
  // Virtual-module fallback: MODULE → STRING via membership index.
  for (const str of Object.values(electrical.strings)) {
    if (str.moduleIds.includes(assetId)) return [str.assetId];
  }
  return [];
}

export function electricalTypeLabel(type: ElectricalAssetType | string): string {
  switch (type) {
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
    case "FEEDER":
      return "MV Feeder";
    case "SUBSTATION":
      return "Substation";
    case "GRID_INTERCONNECTION":
      return "Grid Interconnection";
    case "GRID":
      return "Grid";
    default:
      return type;
  }
}
