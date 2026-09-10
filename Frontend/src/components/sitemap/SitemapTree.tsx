import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Building2,
  Cable,
  ChevronDown,
  ChevronRight,
  DoorOpen,
  Fence,
  FolderTree,
  Grid2x2,
  Layers,
  LayoutGrid,
  MapPin,
  PanelTop,
  Road,
  Zap,
} from "lucide-react";

import {
  blockTableChildren,
  tableModuleChildren,
  treeNodeHasChildren,
  type SitemapModel,
  type SitemapStatus,
  type SitemapTreeKind,
  type SitemapTreeNode,
} from "@/lib/sitemapModel";

type SitemapTreeProps = {
  root: SitemapTreeNode;
  model: SitemapModel;
  selectedId: string | null;
  onSelect: (node: SitemapTreeNode) => void;
};

const statusDot: Record<SitemapStatus, string> = {
  ONLINE: "bg-[color:var(--alcaster-success)]",
  WARNING: "bg-accent",
  OFFLINE: "bg-danger",
};

function kindIcon(kind: SitemapTreeKind) {
  switch (kind) {
    case "plant":
      return MapPin;
    case "block":
    case "folder":
      return FolderTree;
    case "table":
      return LayoutGrid;
    case "module":
      return PanelTop;
    case "combiner":
      return Cable;
    case "inverter":
      return Zap;
    case "transformer":
      return Box;
    case "substation":
    case "grid":
      return Grid2x2;
    case "building":
      return Building2;
    case "road":
      return Road;
    case "fence":
      return Fence;
    case "gate":
      return DoorOpen;
    default:
      return Layers;
  }
}

export function SitemapTree({
  root,
  model,
  selectedId,
  onSelect,
}: SitemapTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([root.id, "blocks", "inverters"]),
  );

  useEffect(() => {
    if (!selectedId) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(root.id);
      next.add("blocks");
      // Expand equipment folders when a matching asset is selected.
      if (/^INV-/i.test(selectedId)) next.add("inverters");
      if (/^TRF-/i.test(selectedId)) next.add("transformers");
      if (/^CB-/i.test(selectedId)) next.add("combiners");
      if (/^SUB-|^GRID-/i.test(selectedId)) next.add("substations");
      if (/^(CTRL|OM|WRH|SEC|BLDG)-/i.test(selectedId)) next.add("buildings");
      if (/^(ROAD|FNC|GATE|WST)-/i.test(selectedId)) next.add("infrastructure");
      if (/^BLK-/i.test(selectedId)) next.add(selectedId);
      if (/^TBL-/i.test(selectedId)) {
        const table = model.assets.assets[selectedId];
        if (table?.parentId) next.add(table.parentId);
      }
      return next;
    });
  }, [selectedId, root.id, model.assets.assets]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="absolute inset-0 overflow-auto bg-[color:var(--alcaster-diagram)] px-3 py-3 sm:px-4 sm:py-4">
      <div className="mx-auto min-w-[280px] max-w-3xl rounded-xl border border-edge bg-page/80 py-2 backdrop-blur-sm">
        <TreeRow
          node={root}
          model={model}
          depth={0}
          expanded={expanded}
          selectedId={selectedId}
          onToggle={toggle}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}

function TreeRow({
  node,
  model,
  depth,
  expanded,
  selectedId,
  onToggle,
  onSelect,
}: {
  node: SitemapTreeNode;
  model: SitemapModel;
  depth: number;
  expanded: Set<string>;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onSelect: (node: SitemapTreeNode) => void;
}) {
  const open = expanded.has(node.id);
  const hasChildren = treeNodeHasChildren(node);
  const selected = selectedId === node.id;
  const Icon = kindIcon(node.kind);

  const children = useMemo(() => {
    if (!open) return [] as SitemapTreeNode[];
    if (node.kind === "block") return blockTableChildren(model, node);
    if (node.kind === "folder" && node.tableRange) {
      return blockTableChildren(model, node);
    }
    if (node.kind === "table") return tableModuleChildren(model, node);
    return node.children ?? [];
  }, [model, node, open]);

  return (
    <div>
      <div
        className={`group flex items-center gap-1 pr-2 ${
          selected ? "bg-accent/10" : "hover:bg-fill"
        }`}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={open ? `Collapse ${node.label}` : `Expand ${node.label}`}
            onClick={() => onToggle(node.id)}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted transition-colors hover:bg-fill-strong hover:text-fg"
          >
            {open ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="inline-flex h-7 w-7 shrink-0" />
        )}

        <button
          type="button"
          onClick={() => onSelect(node)}
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
        >
          <Icon
            className={`h-3.5 w-3.5 shrink-0 ${
              selected ? "text-accent" : "text-muted"
            }`}
            strokeWidth={1.7}
          />
          <span
            className={`min-w-0 truncate text-sm ${
              selected ? "font-medium text-fg" : "text-secondary"
            }`}
          >
            {node.label}
          </span>
          {node.count != null ? (
            <span className="shrink-0 rounded bg-fill px-1.5 py-0.5 text-[10px] tabular-nums text-muted">
              {node.count.toLocaleString()}
            </span>
          ) : null}
          {node.status ? (
            <span
              className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[node.status]}`}
              title={node.status}
            />
          ) : (
            <span className="ml-auto" />
          )}
        </button>
      </div>

      {open && children.length > 0 ? (
        <div>
          {children.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              model={model}
              depth={depth + 1}
              expanded={expanded}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
