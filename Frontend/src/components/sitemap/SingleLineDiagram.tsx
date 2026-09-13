import { useMemo } from "react";

import type { AssetModel } from "@/lib/assetModel";
import type { ElectricalConnectionType } from "@/lib/electricalModel";
import { buildSldModel, type SldLevel, type SldNode } from "@/lib/sldModel";
import {
  formatPowerKw,
  OPERATIONAL_STATUS_COLOR,
  operationalStatusLabel,
  type TelemetrySnapshot,
} from "@/lib/telemetry";

function edgeStroke(type?: ElectricalConnectionType): string {
  switch (type) {
    case "SERIES":
      return "rgba(251, 146, 60, 0.9)";
    case "DC":
      return "rgba(230, 116, 10, 0.9)";
    case "AC_LV":
      return "rgba(245, 158, 11, 0.9)";
    case "AC_MV":
      return "rgba(59, 130, 246, 0.9)";
    case "HV":
      return "rgba(139, 92, 246, 0.9)";
    default:
      return "rgba(230, 116, 10, 0.75)";
  }
}

function edgeFlow(type?: ElectricalConnectionType): string {
  switch (type) {
    case "SERIES":
      return "#fdba74";
    case "DC":
      return "#ffb14a";
    case "AC_LV":
      return "#fcd34d";
    case "AC_MV":
      return "#93c5fd";
    case "HV":
      return "#c4b5fd";
    default:
      return "#ffb14a";
  }
}

type SingleLineDiagramProps = {
  model: AssetModel;
  selectedAssetId: string | null;
  highlightedIds?: Set<string> | null;
  level?: SldLevel;
  blockAssetId?: string | null;
  onSelect: (assetId: string) => void;
  telemetryByAssetId?: Record<string, TelemetrySnapshot>;
};

/** Intrinsic-size SLD canvas for use inside DiagramViewport. */
export function SingleLineDiagramCanvas({
  model,
  selectedAssetId,
  highlightedIds,
  level = "plant",
  blockAssetId = null,
  onSelect,
  telemetryByAssetId,
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
      <div className="flex h-48 w-[32rem] items-center justify-center text-sm text-muted">
        Electrical topology not available
      </div>
    );
  }

  const highlight = highlightedIds ?? sld.pathAssetIds;

  return (
    <svg
      width={sld.width}
      height={sld.height}
      viewBox={`0 0 ${sld.width} ${sld.height}`}
      className="block max-w-none shrink-0 rounded-lg"
      role="img"
      aria-label="Electrical single-line diagram"
      style={{
        background:
          "color-mix(in oklab, var(--alcaster-page) 92%, #1a1f24)",
      }}
    >
      {sld.edges.map((edge) => {
        const from = sld.nodes.find((n) => n.id === edge.fromId);
        const to = sld.nodes.find((n) => n.id === edge.toId);
        if (!from || !to) return null;
        const active =
          (highlight.has(from.assetId) && highlight.has(to.assetId)) ||
          (edge.connectionId && sld.pathConnectionIds.has(edge.connectionId));
        const x1 = from.x;
        const y1 = from.y + from.h / 2;
        const x2 = to.x;
        const y2 = to.y - to.h / 2;
        const stroke = active
          ? "var(--alcaster-accent)"
          : edgeStroke(edge.connectionType);
        const opacity = highlight.size > 0 && !active ? 0.22 : 0.95;
        return (
          <g key={edge.id} opacity={opacity}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={stroke}
              strokeWidth={active ? 2.8 : 2}
              strokeOpacity={active ? 1 : 0.45}
            />
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={active ? "var(--alcaster-accent)" : edgeFlow(edge.connectionType)}
              strokeWidth={active ? 2.2 : 1.6}
              strokeDasharray="7 9"
              className="alcaster-flow-dash"
            />
          </g>
        );
      })}
      {sld.nodes.map((node) => (
        <SldNodeMark
          key={node.id}
          node={node}
          selected={selectedAssetId === node.assetId}
          highlighted={
            highlight.has(node.assetId) ||
            Boolean(node.memberIds?.some((id) => highlight.has(id)))
          }
          dimmed={highlight.size > 0}
          telemetry={
            telemetryByAssetId
              ? telemetryByAssetId[node.assetId] ??
                (node.memberIds
                  ? aggregateMemberTelemetry(
                      node.memberIds,
                      telemetryByAssetId,
                    )
                  : null)
              : null
          }
          onSelect={onSelect}
        />
      ))}
    </svg>
  );
}

function SldNodeMark({
  node,
  selected,
  highlighted,
  dimmed,
  telemetry,
  onSelect,
}: {
  node: SldNode;
  selected: boolean;
  highlighted: boolean;
  dimmed: boolean;
  telemetry?: TelemetrySnapshot | null;
  onSelect: (assetId: string) => void;
}) {
  const opacity = dimmed && !highlighted && !selected ? 0.35 : 1;
  const statusColor = telemetry
    ? OPERATIONAL_STATUS_COLOR[telemetry.status]
    : null;
  const fill = selected
    ? "color-mix(in oklab, var(--alcaster-accent) 35%, var(--alcaster-page))"
    : highlighted
      ? "color-mix(in oklab, var(--alcaster-accent) 18%, var(--alcaster-page))"
      : "var(--alcaster-page)";
  const stroke = selected || highlighted
    ? "var(--alcaster-accent)"
    : statusColor &&
        (telemetry?.status === "FAULT" ||
          telemetry?.status === "WARNING" ||
          telemetry?.status === "OFFLINE")
      ? statusColor
      : "var(--alcaster-edge-strong)";

  const powerLabel =
    telemetry?.measurements.activePower != null
      ? formatPowerKw(telemetry.measurements.activePower)
      : null;

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
        rx={8}
        fill={fill}
        stroke={stroke}
        strokeWidth={selected ? 2.4 : 1.5}
      />
      {statusColor ? (
        <circle
          cx={node.x - node.w / 2 + 10}
          cy={node.y - node.h / 2 + 10}
          r={3.5}
          fill={statusColor}
        />
      ) : null}
      <text
        x={node.x}
        y={node.y + (powerLabel ? -4 : 1)}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--alcaster-fg)"
        fontSize={13}
        fontWeight={600}
      >
        {node.count != null && node.type === "AGGREGATE"
          ? `${node.count}`
          : node.label.length > 14
            ? `${node.label.slice(0, 12)}…`
            : node.label}
      </text>
      {powerLabel ? (
        <text
          x={node.x}
          y={node.y + 12}
          textAnchor="middle"
          fill="var(--alcaster-muted)"
          fontSize={10}
        >
          {powerLabel}
          {telemetry ? ` · ${operationalStatusLabel(telemetry.status)}` : ""}
        </text>
      ) : null}
      {node.type === "AGGREGATE" ? (
        <text
          x={node.x}
          y={node.y + node.h / 2 + 16}
          textAnchor="middle"
          fill="var(--alcaster-muted)"
          fontSize={11}
        >
          {node.label.length > 32 ? `${node.label.slice(0, 30)}…` : node.label}
        </text>
      ) : null}
    </g>
  );
}

function aggregateMemberTelemetry(
  memberIds: string[],
  byAssetId: Record<string, TelemetrySnapshot>,
): TelemetrySnapshot | null {
  let power = 0;
  let found = 0;
  let worst = byAssetId[memberIds[0] ?? ""]?.status;
  for (const id of memberIds) {
    const snap = byAssetId[id];
    if (!snap) continue;
    found += 1;
    power += snap.measurements.activePower ?? 0;
    if (
      !worst ||
      statusRank(snap.status) > statusRank(worst)
    ) {
      worst = snap.status;
    }
  }
  if (found === 0 || !worst) return null;
  return {
    assetId: memberIds[0]!,
    timestamp: new Date().toISOString(),
    status: worst,
    quality: "GOOD",
    measurements: { activePower: power },
    alarms: [],
  };
}

function statusRank(status: string): number {
  if (status === "FAULT") return 100;
  if (status === "WARNING") return 80;
  if (status === "OFFLINE") return 60;
  if (status === "UNKNOWN") return 50;
  if (status === "IDLE") return 20;
  return 10;
}
