/**
 * Data-driven Single-Line Diagram layout derived from ElectricalModel.
 * Never hard-codes plant topology — always reads electrical connections.
 */

import type { AssetModel } from "@/lib/assetModel";
import {
  electricalTypeLabel,
  getConnectedAssets,
  getElectricalPath,
  type ElectricalAssetType,
  type ElectricalModel,
} from "@/lib/electricalModel";

export type SldLevel = "plant" | "block" | "asset";

export type SldNode = {
  id: string;
  assetId: string;
  label: string;
  type: ElectricalAssetType | "AGGREGATE";
  x: number;
  y: number;
  w: number;
  h: number;
  count?: number;
  blockAssetId?: string;
  /** Child asset IDs when this is an aggregate. */
  memberIds?: string[];
};

export type SldEdge = {
  id: string;
  fromId: string;
  toId: string;
  connectionId?: string;
};

export type SldModel = {
  level: SldLevel;
  focusAssetId: string | null;
  blockAssetId: string | null;
  nodes: SldNode[];
  edges: SldEdge[];
  width: number;
  height: number;
  pathAssetIds: Set<string>;
  pathConnectionIds: Set<string>;
};

const ROW_ORDER: ElectricalAssetType[] = [
  "MODULE",
  "STRING",
  "COMBINER",
  "INVERTER",
  "TRANSFORMER",
  "FEEDER",
  "SUBSTATION",
  "GRID_INTERCONNECTION",
];

const ROW_Y: Record<string, number> = {
  MODULE: 40,
  STRING: 120,
  COMBINER: 200,
  INVERTER: 280,
  TRANSFORMER: 360,
  FEEDER: 440,
  SUBSTATION: 520,
  GRID_INTERCONNECTION: 600,
  AGGREGATE: 40,
};

const MAX_NODES_PER_ROW = 48;

function nodesOfType(
  electrical: ElectricalModel,
  type: ElectricalAssetType,
  blockFilter?: string | null,
): string[] {
  return Object.values(electrical.nodes)
    .filter((n) => {
      if (n.type !== type) return false;
      if (blockFilter && n.blockAssetId && n.blockAssetId !== blockFilter) {
        return false;
      }
      return true;
    })
    .map((n) => n.assetId)
    .sort((a, b) => a.localeCompare(b));
}

function layoutRow(
  ids: string[],
  type: ElectricalAssetType | "AGGREGATE",
  y: number,
  electrical: ElectricalModel,
  aggregateLabel?: string,
): SldNode[] {
  if (ids.length === 0) return [];

  // Aggregate modules / large string rows for plant-level SLD.
  if (
    (type === "MODULE" || type === "STRING") &&
    ids.length > MAX_NODES_PER_ROW
  ) {
    const byBlock = new Map<string, string[]>();
    for (const id of ids) {
      const block = electrical.nodes[id]?.blockAssetId ?? "plant";
      const list = byBlock.get(block) ?? [];
      list.push(id);
      byBlock.set(block, list);
    }
    const blocks = [...byBlock.entries()];
    const width = Math.max(720, blocks.length * 140);
    const gap = width / (blocks.length + 1);
    return blocks.map(([blockId, members], index) => ({
      id: `agg-${type}-${blockId}`,
      assetId: members[0]!,
      label:
        aggregateLabel ??
        `${blockId === "plant" ? "Array" : blockId} · ${members.length} ${electricalTypeLabel(type)}s`,
      type: "AGGREGATE" as const,
      x: gap * (index + 1),
      y,
      w: 120,
      h: 36,
      count: members.length,
      blockAssetId: blockId === "plant" ? undefined : blockId,
      memberIds: members,
    }));
  }

  const visible = ids.slice(0, MAX_NODES_PER_ROW);
  const width = Math.max(720, visible.length * 88);
  const gap = width / (visible.length + 1);
  return visible.map((id, index) => ({
    id,
    assetId: id,
    label: id,
    type,
    x: gap * (index + 1),
    y,
    w: type === "SUBSTATION" || type === "GRID_INTERCONNECTION" ? 100 : 72,
    h: 34,
    blockAssetId: electrical.nodes[id]?.blockAssetId,
  }));
}

function buildEdges(
  nodes: SldNode[],
  electrical: ElectricalModel,
): SldEdge[] {
  const nodeByAsset = new Map<string, SldNode>();
  for (const node of nodes) {
    nodeByAsset.set(node.assetId, node);
    for (const member of node.memberIds ?? []) {
      nodeByAsset.set(member, node);
    }
  }

  const edges: SldEdge[] = [];
  const seen = new Set<string>();

  for (const conn of electrical.connections) {
    const fromNode = nodeByAsset.get(conn.fromAssetId);
    const toNode = nodeByAsset.get(conn.toAssetId);
    if (!fromNode || !toNode) continue;
    if (fromNode.id === toNode.id) continue;
    const key = `${fromNode.id}->${toNode.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({
      id: key,
      fromId: fromNode.id,
      toId: toNode.id,
      connectionId: conn.connectionId,
    });
  }

  // Ensure row-to-row links exist even when aggregates hide individual edges.
  const byType = new Map<string, SldNode[]>();
  for (const node of nodes) {
    const list = byType.get(node.type) ?? [];
    list.push(node);
    byType.set(node.type, list);
  }
  for (let i = 0; i < ROW_ORDER.length - 1; i += 1) {
    const aType = ROW_ORDER[i]!;
    const bType = ROW_ORDER[i + 1]!;
    const aNodes = byType.get(aType) ?? [];
    const bNodes = byType.get(bType) ?? [];
    if (aNodes.length === 0 || bNodes.length === 0) continue;
    // If no real edges between these rows, add representative links.
    const hasLink = edges.some((e) => {
      const a = nodes.find((n) => n.id === e.fromId);
      const b = nodes.find((n) => n.id === e.toId);
      return (
        (a?.type === aType || a?.type === "AGGREGATE") &&
        (b?.type === bType || b?.type === "AGGREGATE")
      );
    });
    if (!hasLink) {
      const count = Math.min(aNodes.length, bNodes.length, 12);
      for (let n = 0; n < count; n += 1) {
        const from = aNodes[n % aNodes.length]!;
        const to = bNodes[n % bNodes.length]!;
        const key = `${from.id}->${to.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({ id: key, fromId: from.id, toId: to.id });
      }
    }
  }

  return edges;
}

export function buildSldModel(
  assets: AssetModel,
  options?: {
    level?: SldLevel;
    focusAssetId?: string | null;
    blockAssetId?: string | null;
  },
): SldModel | null {
  const electrical = assets.electrical;
  if (!electrical || electrical.error) return null;

  const focusAssetId = options?.focusAssetId ?? null;
  let level: SldLevel = options?.level ?? "plant";
  let blockAssetId = options?.blockAssetId ?? null;

  if (focusAssetId && level === "plant") {
    const node = electrical.nodes[focusAssetId];
    if (node?.type === "MODULE" || node?.type === "STRING") {
      level = "asset";
      blockAssetId = node.blockAssetId ?? null;
    }
  }

  const path = focusAssetId
    ? getElectricalPath(electrical, focusAssetId)
    : null;
  const pathAssetIds = new Set(path?.fullPath ?? []);
  const pathConnectionIds = new Set(path?.connectionIds ?? []);
  if (focusAssetId) {
    for (const id of getConnectedAssets(electrical, focusAssetId)) {
      pathAssetIds.add(id);
    }
    pathAssetIds.add(focusAssetId);
  }

  const blockFilter = level === "plant" ? null : blockAssetId;

  const nodes: SldNode[] = [];

  if (level === "plant") {
    // Plant level: aggregate PV, show inverters → grid.
    const stringIds = nodesOfType(electrical, "STRING");
    nodes.push(
      ...layoutRow(stringIds, "STRING", ROW_Y.STRING!, electrical, "PV arrays"),
    );
    for (const type of ROW_ORDER.slice(2)) {
      const ids = nodesOfType(electrical, type);
      nodes.push(...layoutRow(ids, type, ROW_Y[type] ?? 200, electrical));
    }
  } else if (level === "block") {
    for (const type of ROW_ORDER) {
      if (type === "MODULE") continue;
      const ids = nodesOfType(electrical, type, blockFilter);
      nodes.push(...layoutRow(ids, type, ROW_Y[type] ?? 200, electrical));
    }
  } else {
    // Asset-level: show the traced path as a vertical chain plus siblings.
    const chain = path?.fullPath ?? (focusAssetId ? [focusAssetId] : []);
    const typesInPath = new Set(
      chain.map((id) => electrical.nodes[id]?.type).filter(Boolean),
    );
    for (const type of ROW_ORDER) {
      if (!typesInPath.has(type) && type !== "MODULE") {
        // Still show same-type siblings in the block for context (capped).
        if (type === "STRING" || type === "COMBINER") {
          const ids = nodesOfType(electrical, type, blockFilter).slice(0, 24);
          nodes.push(...layoutRow(ids, type, ROW_Y[type] ?? 200, electrical));
        }
        continue;
      }
      if (type === "MODULE" && focusAssetId) {
        const str = electrical.strings[
          path?.fullPath.find((id) => electrical.strings[id]) ?? ""
        ];
        const mods = (str?.moduleIds ?? []).slice(0, 26);
        if (mods.includes(focusAssetId) || mods.length) {
          nodes.push(
            ...layoutRow(
              mods.length ? mods : [focusAssetId],
              "MODULE",
              ROW_Y.MODULE!,
              electrical,
            ),
          );
        }
        continue;
      }
      const ids = chain.filter((id) => electrical.nodes[id]?.type === type);
      const extras = nodesOfType(electrical, type, blockFilter)
        .filter((id) => !ids.includes(id))
        .slice(0, 8);
      nodes.push(
        ...layoutRow([...ids, ...extras], type, ROW_Y[type] ?? 200, electrical),
      );
    }
  }

  const edges = buildEdges(nodes, electrical);
  const width = Math.max(
    720,
    ...nodes.map((n) => n.x + n.w / 2 + 40),
    800,
  );
  const height = 680;

  return {
    level,
    focusAssetId,
    blockAssetId,
    nodes,
    edges,
    width,
    height,
    pathAssetIds,
    pathConnectionIds,
  };
}

export function sldStageLabels(electrical: ElectricalModel) {
  return [
    { key: "strings", label: "Strings", count: electrical.counts.strings },
    { key: "combiners", label: "Combiners", count: electrical.counts.combiners },
    { key: "inverters", label: "Inverters", count: electrical.counts.inverters },
    {
      key: "transformers",
      label: "Transformers",
      count: electrical.counts.transformers,
    },
    { key: "feeders", label: "MV Feeders", count: electrical.counts.feeders },
    {
      key: "substations",
      label: "Substation",
      count: electrical.counts.substations,
    },
    {
      key: "grid",
      label: "Grid",
      count: electrical.counts.gridConnections,
    },
  ];
}
