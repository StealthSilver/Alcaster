/**
 * Electrical tree for Site Diagram (separate from physical Block→Table→Module).
 * Derived from ElectricalModel — not a second hand-maintained tree.
 */

import type { AssetModel } from "@/lib/assetModel";
import { assetTypeLabel, statusToSitemap } from "@/lib/assetModel";
import {
  electricalTypeLabel,
  getImmediateDownstream,
  getImmediateUpstream,
} from "@/lib/electricalModel";
import type {
  InfoRow,
  SitemapStatus,
  SitemapTreeNode,
} from "@/lib/sitemapModel";

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

function leaf(
  assetId: string,
  model: AssetModel,
  typeLabel: string,
  kind: SitemapTreeNode["kind"] = "string",
): SitemapTreeNode {
  const asset = model.assets[assetId];
  const electrical = model.electrical;
  const up = electrical ? getImmediateUpstream(electrical, assetId) : [];
  const down = electrical ? getImmediateDownstream(electrical, assetId) : [];
  const rows: InfoRow[] = [
    { label: "Asset ID", value: assetId },
    { label: "Asset Type", value: typeLabel },
  ];
  if (up.length) rows.push({ label: "Upstream", value: up.slice(0, 4).join(", ") });
  if (down.length) {
    rows.push({ label: "Downstream", value: down.slice(0, 4).join(", ") });
  }
  return {
    id: `elec-${assetId}`,
    label: assetId,
    kind,
    typeLabel,
    assetId,
    status: asset
      ? statusToSitemap(asset.status)
      : ("ONLINE" as SitemapStatus),
    rows,
  };
}

const GROUP = 100;

function groupedLeaves(
  ids: string[],
  model: AssetModel,
  typeLabel: string,
  folderId: string,
  kind: SitemapTreeNode["kind"] = "string",
): SitemapTreeNode[] {
  const sorted = [...ids].sort((a, b) => a.localeCompare(b));
  if (sorted.length <= GROUP) {
    return sorted.map((id) => leaf(id, model, typeLabel, kind));
  }
  const groups: SitemapTreeNode[] = [];
  for (let i = 0; i < sorted.length; i += GROUP) {
    const slice = sorted.slice(i, i + GROUP);
    groups.push({
      id: `${folderId}-${i}`,
      label: `${slice[0]} – ${slice[slice.length - 1]}`,
      kind: "folder",
      typeLabel: `${typeLabel} group`,
      count: slice.length,
      rows: [
        { label: "From", value: slice[0]! },
        { label: "To", value: slice[slice.length - 1]! },
        { label: "Count", value: String(slice.length) },
      ],
      children: slice.map((id) => leaf(id, model, typeLabel, kind)),
    });
  }
  return groups;
}

/** Electrical hierarchy tree for Site Diagram Electrical mode. */
export function buildElectricalTree(model: AssetModel): SitemapTreeNode {
  const electrical = model.electrical;
  const root = model.assets[model.rootId];

  if (!electrical) {
    return {
      id: "electrical-empty",
      label: "Electrical Network",
      kind: "plant",
      typeLabel: "Electrical",
      assetId: root?.assetId,
      rows: [{ label: "Status", value: "No electrical model" }],
      children: [],
    };
  }

  const byType = (type: string) =>
    Object.values(electrical.nodes)
      .filter((n) => n.type === type)
      .map((n) => n.assetId);

  const topChildren: SitemapTreeNode[] = [];
  for (const node of [
    folder(
      "elec-strings",
      "Strings",
      groupedLeaves(electrical.stringIds, model, "String", "elec-strings", "string"),
    ),
    folder(
      "elec-combiners",
      "Combiners",
      groupedLeaves(byType("COMBINER"), model, "Combiner", "elec-combiners", "combiner"),
    ),
    folder(
      "elec-inverters",
      "Inverters",
      groupedLeaves(byType("INVERTER"), model, "Inverter", "elec-inverters", "inverter"),
    ),
    folder(
      "elec-transformers",
      "Transformers",
      groupedLeaves(
        byType("TRANSFORMER"),
        model,
        "Transformer",
        "elec-transformers",
        "transformer",
      ),
    ),
    folder(
      "elec-feeders",
      "MV Feeders",
      groupedLeaves(electrical.feederIds, model, "MV Feeder", "elec-feeders", "feeder"),
    ),
    folder(
      "elec-substation",
      "Substation & Grid",
      [
        ...groupedLeaves(
          byType("SUBSTATION"),
          model,
          "Substation",
          "elec-sub",
          "substation",
        ),
        ...groupedLeaves(
          byType("GRID_INTERCONNECTION"),
          model,
          "Grid Interconnection",
          "elec-grid",
          "grid",
        ),
      ],
    ),
  ]) {
    if (node) topChildren.push(node);
  }

  const v = electrical.validation;
  return {
    id: "electrical-root",
    label: "Electrical Network",
    kind: "plant",
    typeLabel: "Electrical topology",
    assetId: root?.assetId,
    status: "ONLINE",
    rows: [
      { label: "Strings", value: String(electrical.counts.strings) },
      { label: "Combiners", value: String(electrical.counts.combiners) },
      { label: "Inverters", value: String(electrical.counts.inverters) },
      { label: "Transformers", value: String(electrical.counts.transformers) },
      { label: "Feeders", value: String(electrical.counts.feeders) },
      {
        label: "Connections",
        value: String(electrical.counts ? electrical.validation.connectionCount : 0),
      },
      {
        label: "Validation",
        value: `${v.errors.length} errors · ${v.warnings.length} warnings`,
      },
    ],
    count: topChildren.length,
    children: topChildren,
  };
}

/** Limit strings in the physical tree so large plants stay usable. */
export function physicalStringFolder(
  model: AssetModel,
): SitemapTreeNode | null {
  const ids = Object.values(model.assets)
    .filter((a) => a.assetType === "STRING")
    .map((a) => a.assetId)
    .sort((a, b) => a.localeCompare(b));
  if (ids.length === 0) return null;
  return folder(
    "strings",
    "Strings",
    groupedLeaves(ids, model, assetTypeLabel("STRING"), "strings"),
  );
}

export { electricalTypeLabel };
