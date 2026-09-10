import { useMemo } from "react";

import type { AssetModel } from "@/lib/assetModel";
import { buildSldModel, type SldLevel, type SldNode } from "@/lib/sldModel";

type SingleLineDiagramProps = {
  model: AssetModel;
  selectedAssetId: string | null;
  highlightedIds?: Set<string> | null;
  level?: SldLevel;
  blockAssetId?: string | null;
  onSelect: (assetId: string) => void;
  onLevelChange?: (level: SldLevel) => void;
};

export function SingleLineDiagram({
  model,
  selectedAssetId,
  highlightedIds,
  level = "plant",
  blockAssetId = null,
  onSelect,
  onLevelChange,
}: SingleLineDiagramProps) {
  const sld = useMemo(
    () =>
      buildSldModel(model, {
        level,
        focusAssetId: selectedAssetId,
        blockAssetId,
      }),
    [model, level, selectedAssetId, blockAssetId],
  );

  if (!sld) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        Electrical topology not available
      </div>
    );
  }

  const highlight = highlightedIds ?? sld.pathAssetIds;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-edge px-3 py-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
          Single-line diagram
        </p>
        <div className="ml-auto flex gap-1">
          {(["plant", "block", "asset"] as SldLevel[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onLevelChange?.(id)}
              className={`rounded-md px-2 py-1 text-[10px] font-medium capitalize ${
                level === id
                  ? "bg-fill-strong text-fg"
                  : "text-muted hover:text-fg"
              }`}
            >
              {id}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-[color-mix(in_oklab,var(--alcaster-page)_92%,#1a1f24)]">
        <svg
          viewBox={`0 0 ${sld.width} ${sld.height}`}
          className="h-full min-h-[420px] w-full"
          role="img"
          aria-label="Electrical single-line diagram"
        >
          {sld.edges.map((edge) => {
            const from = sld.nodes.find((n) => n.id === edge.fromId);
            const to = sld.nodes.find((n) => n.id === edge.toId);
            if (!from || !to) return null;
            const active =
              (highlight.has(from.assetId) && highlight.has(to.assetId)) ||
              (edge.connectionId && sld.pathConnectionIds.has(edge.connectionId));
            return (
              <line
                key={edge.id}
                x1={from.x}
                y1={from.y + from.h / 2}
                x2={to.x}
                y2={to.y - to.h / 2}
                stroke={active ? "var(--alcaster-accent)" : "var(--alcaster-edge-strong)"}
                strokeWidth={active ? 2.2 : 1.1}
                opacity={highlight.size > 0 && !active ? 0.28 : 0.85}
              />
            );
          })}
          {sld.nodes.map((node) => (
            <SldNodeMark
              key={node.id}
              node={node}
              selected={selectedAssetId === node.assetId}
              highlighted={highlight.has(node.assetId) || Boolean(node.memberIds?.some((id) => highlight.has(id)))}
              dimmed={highlight.size > 0}
              onSelect={onSelect}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

function SldNodeMark({
  node,
  selected,
  highlighted,
  dimmed,
  onSelect,
}: {
  node: SldNode;
  selected: boolean;
  highlighted: boolean;
  dimmed: boolean;
  onSelect: (assetId: string) => void;
}) {
  const opacity = dimmed && !highlighted && !selected ? 0.35 : 1;
  const fill = selected
    ? "color-mix(in oklab, var(--alcaster-accent) 35%, var(--alcaster-page))"
    : highlighted
      ? "color-mix(in oklab, var(--alcaster-accent) 18%, var(--alcaster-page))"
      : "var(--alcaster-page)";
  const stroke = selected || highlighted
    ? "var(--alcaster-accent)"
    : "var(--alcaster-edge-strong)";

  return (
    <g
      opacity={opacity}
      style={{ cursor: "pointer" }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(node.assetId);
      }}
    >
      <rect
        x={node.x - node.w / 2}
        y={node.y - node.h / 2}
        width={node.w}
        height={node.h}
        rx={6}
        fill={fill}
        stroke={stroke}
        strokeWidth={selected ? 2 : 1.2}
      />
      <text
        x={node.x}
        y={node.y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--alcaster-fg)"
        fontSize={10}
        fontWeight={600}
      >
        {node.count != null && node.type === "AGGREGATE"
          ? `${node.count}`
          : node.label.length > 12
            ? `${node.label.slice(0, 10)}…`
            : node.label}
      </text>
      {node.type === "AGGREGATE" ? (
        <text
          x={node.x}
          y={node.y + node.h / 2 + 12}
          textAnchor="middle"
          fill="var(--alcaster-muted)"
          fontSize={8}
        >
          {node.label.length > 28 ? `${node.label.slice(0, 26)}…` : node.label}
        </text>
      ) : null}
    </g>
  );
}
