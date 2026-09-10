import { useId, useMemo } from "react";

import type { SitemapComponent, SitemapKind, SitemapModel } from "@/lib/sitemapModel";
import type { Vec3 } from "@/lib/twinLayout";

type SitemapDiagramProps = {
  model: SitemapModel;
  hoveredId: string | null;
  hoveredKind: SitemapKind | null;
  selectedId?: string | null;
  onHover: (id: string | null) => void;
  onSelect?: (id: string) => void;
};

type ViewBox = {
  minX: number;
  minZ: number;
  width: number;
  height: number;
};

function viewBoxOf(model: SitemapModel): ViewBox {
  const { layout } = model;
  let minX = -layout.width / 2;
  let maxX = layout.width / 2;
  let minZ = -layout.depth / 2;
  let maxZ = layout.depth / 2;

  const consider = (x: number, z: number) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  };

  for (const component of model.components) {
    consider(component.x - component.w / 2, component.z - component.d / 2);
    consider(component.x + component.w / 2, component.z + component.d / 2);
  }
  for (const cable of [
    ...layout.dcStrings,
    ...layout.dcFeeders,
    ...layout.acCables,
    ...layout.hvCables,
  ]) {
    for (const point of cable) consider(point[0], point[2]);
  }

  const pad = 8;
  return {
    minX: minX - pad,
    minZ: minZ - pad,
    width: maxX - minX + pad * 2,
    height: maxZ - minZ + pad * 2,
  };
}

function toSvg(x: number, z: number, view: ViewBox) {
  return { sx: x - view.minX, sy: z - view.minZ };
}

function polyline(points: Vec3[], view: ViewBox): string {
  return points
    .map((point, index) => {
      const { sx, sy } = toSvg(point[0], point[2], view);
      return `${index === 0 ? "M" : "L"} ${sx.toFixed(2)} ${sy.toFixed(2)}`;
    })
    .join(" ");
}

function isActive(
  component: SitemapComponent,
  hoveredId: string | null,
  hoveredKind: SitemapKind | null,
  selectedId?: string | null,
) {
  if (selectedId && component.id === selectedId) return true;
  if (hoveredId) return component.id === hoveredId;
  if (hoveredKind) return component.kind === hoveredKind;
  return false;
}

function displaySize(component: SitemapComponent, view: ViewBox) {
  if (component.kind === "road" || component.kind === "fence") {
    return component;
  }
  const min =
    component.kind === "table"
      ? Math.max(10, view.height * 0.014)
      : component.kind === "substation" || component.kind === "grid"
        ? Math.max(48, view.width * 0.05)
        : component.kind === "combiner"
          ? Math.max(10, view.width * 0.01)
          : Math.max(28, view.width * 0.022);
  return {
    ...component,
    w: component.kind === "table" ? component.w : Math.max(component.w, min),
    d:
      component.kind === "table"
        ? Math.max(component.d, min)
        : Math.max(component.d, min * 0.7),
  };
}

function strokeFor(component: SitemapComponent, active: boolean) {
  if (component.status === "OFFLINE") return "rgba(240,113,103,0.9)";
  if (component.status === "WARNING") return "rgba(230,116,10,0.95)";
  if (active) return "#e6740a";
  return "color-mix(in srgb, var(--alcaster-fg) 28%, transparent)";
}

export function SitemapDiagram({
  model,
  hoveredId,
  hoveredKind,
  selectedId = null,
  onHover,
  onSelect,
}: SitemapDiagramProps) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const view = useMemo(() => viewBoxOf(model), [model]);
  const { layout, components } = model;
  const dimmed = Boolean(hoveredId || hoveredKind || selectedId);
  const byKind = (kind: SitemapKind) =>
    components
      .filter((component) => component.kind === kind)
      .map((component) => displaySize(component, view));

  const activeOf = (component: SitemapComponent) =>
    isActive(component, hoveredId, hoveredKind, selectedId);

  return (
    <svg
      viewBox={`0 0 ${view.width} ${view.height}`}
      className="h-full w-full"
      role="img"
      aria-label="Project sitemap single-line diagram"
      onMouseLeave={() => onHover(null)}
    >
      <defs>
        <linearGradient id={`${uid}-site`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--alcaster-diagram-site-start)" />
          <stop offset="100%" stopColor="var(--alcaster-diagram-site-end)" />
        </linearGradient>
      </defs>

      <rect width={view.width} height={view.height} fill="var(--alcaster-diagram)" />

      {(() => {
        const origin = toSvg(-layout.width / 2, -layout.depth / 2, view);
        return (
          <rect
            x={origin.sx}
            y={origin.sy}
            width={layout.width}
            height={layout.depth}
            rx={1.4}
            fill={`url(#${uid}-site)`}
            stroke="color-mix(in srgb, var(--alcaster-fg) 8%, transparent)"
            strokeWidth={0.35}
          />
        );
      })()}

      {byKind("road").map((component) => (
        <RoadSymbol
          key={component.id}
          component={component}
          view={view}
          active={activeOf(component)}
          dimmed={dimmed && !activeOf(component)}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}

      {byKind("fence").map((component) => (
        <FenceSymbol
          key={component.id}
          component={component}
          view={view}
          active={activeOf(component)}
          dimmed={dimmed && !activeOf(component)}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}

      <CableLayer
        paths={layout.dcStrings}
        view={view}
        stroke="rgba(230,116,10,0.16)"
        width={0.08}
      />
      <CableLayer
        paths={layout.dcFeeders}
        view={view}
        stroke="rgba(230,116,10,0.28)"
        width={0.12}
      />
      <CableLayer
        paths={layout.acCables}
        view={view}
        stroke="color-mix(in srgb, var(--alcaster-fg) 16%, transparent)"
        width={0.16}
        flow
      />
      <CableLayer
        paths={layout.hvCables}
        view={view}
        stroke="rgba(230,116,10,0.55)"
        width={0.22}
        flow
      />

      <ZoneLabel
        view={view}
        x={0}
        z={-layout.depth / 2 + 6}
        text="ARRAY FIELD"
      />
      {layout.plant.substationPresent ? (
        <ZoneLabel
          view={view}
          x={-8}
          z={layout.depth / 2 - layout.depth * 0.12}
          text="SWITCHYARD"
        />
      ) : null}

      {byKind("table").map((component) => (
        <TableSymbol
          key={component.id}
          component={component}
          view={view}
          active={activeOf(component)}
          dimmed={dimmed && !activeOf(component)}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
      {byKind("combiner").map((component) => (
        <BoxSymbol
          key={component.id}
          component={component}
          view={view}
          active={activeOf(component)}
          dimmed={dimmed && !activeOf(component)}
          onHover={onHover}
          onSelect={onSelect}
          fill="var(--alcaster-diagram-equipment-alt)"
        />
      ))}
      {byKind("inverter").map((component) => (
        <InverterSymbol
          key={component.id}
          component={component}
          view={view}
          active={activeOf(component)}
          dimmed={dimmed && !activeOf(component)}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
      {byKind("transformer").map((component) => (
        <TransformerSymbol
          key={component.id}
          component={component}
          view={view}
          active={activeOf(component)}
          dimmed={dimmed && !activeOf(component)}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
      {byKind("substation").map((component) => (
        <SubstationSymbol
          key={component.id}
          component={component}
          view={view}
          active={activeOf(component)}
          dimmed={dimmed && !activeOf(component)}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
      {byKind("grid").map((component) => (
        <GridSymbol
          key={component.id}
          component={component}
          view={view}
          active={activeOf(component)}
          dimmed={dimmed && !activeOf(component)}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
      {byKind("building").map((component) => (
        <BuildingSymbol
          key={component.id}
          component={component}
          view={view}
          active={activeOf(component)}
          dimmed={dimmed && !activeOf(component)}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
      {byKind("weather").map((component) => (
        <WeatherSymbol
          key={component.id}
          component={component}
          view={view}
          active={activeOf(component)}
          dimmed={dimmed && !activeOf(component)}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
      {byKind("gate").map((component) => (
        <GateSymbol
          key={component.id}
          component={component}
          view={view}
          active={activeOf(component)}
          dimmed={dimmed && !activeOf(component)}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}

      <NorthArrow view={view} layoutWidth={layout.width} layoutDepth={layout.depth} />
    </svg>
  );
}

function CableLayer({
  paths,
  view,
  stroke,
  width,
  flow = false,
}: {
  paths: Vec3[][];
  view: ViewBox;
  stroke: string;
  width: number;
  flow?: boolean;
}) {
  return (
    <g pointerEvents="none">
      {paths.map((points, index) => {
        const d = polyline(points, view);
        return (
          <g key={`${stroke}-${index}`}>
            <path d={d} fill="none" stroke={stroke} strokeWidth={width} />
            {flow ? (
              <path
                d={d}
                fill="none"
                stroke="rgba(230,116,10,0.7)"
                strokeWidth={width * 0.7}
                strokeDasharray="1.4 2.2"
                className="alcaster-flow-dash"
              />
            ) : null}
          </g>
        );
      })}
    </g>
  );
}

function ZoneLabel({
  view,
  x,
  z,
  text,
}: {
  view: ViewBox;
  x: number;
  z: number;
  text: string;
}) {
  const { sx, sy } = toSvg(x, z, view);
  return (
    <text
      x={sx}
      y={sy}
      textAnchor="middle"
      fill="color-mix(in srgb, var(--alcaster-fg) 22%, transparent)"
      fontSize={2.1}
      fontFamily="Inter, system-ui, sans-serif"
      letterSpacing={0.35}
      pointerEvents="none"
    >
      {text}
    </text>
  );
}

type SymbolProps = {
  component: SitemapComponent;
  view: ViewBox;
  active: boolean;
  dimmed: boolean;
  onHover: (id: string | null) => void;
  onSelect?: (id: string) => void;
};

function hitHandlers(
  id: string,
  onHover: (id: string | null) => void,
  onSelect?: (id: string) => void,
) {
  return {
    onMouseEnter: () => onHover(id),
    onMouseLeave: () => onHover(null),
    onClick: (event: { stopPropagation: () => void }) => {
      event.stopPropagation();
      onSelect?.(id);
    },
  };
}

function TableSymbol({ component, view, active, dimmed, onHover, onSelect }: SymbolProps) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  const yaw = (component.rotY * 180) / Math.PI;
  const stroke = strokeFor(component, active);
  return (
    <g
      transform={`translate(${sx} ${sy}) rotate(${yaw})`}
      opacity={dimmed ? 0.28 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover, onSelect)}
    >
      <rect
        x={-component.w / 2}
        y={-component.d / 2}
        width={component.w}
        height={component.d}
        rx={0.12}
        fill={
          active
            ? "var(--alcaster-diagram-module-active)"
            : "color-mix(in srgb, var(--alcaster-diagram-module) 88%, #4d8ec8)"
        }
        stroke={stroke}
        strokeWidth={active ? 0.18 : 0.08}
      />
      <line
        x1={-component.w / 2 + 0.15}
        y1={0}
        x2={component.w / 2 - 0.15}
        y2={0}
        stroke="rgba(180,210,230,0.18)"
        strokeWidth={0.06}
      />
    </g>
  );
}

function BoxSymbol({
  component,
  view,
  active,
  dimmed,
  onHover,
  onSelect,
  fill,
}: SymbolProps & { fill: string }) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  return (
    <g
      transform={`translate(${sx} ${sy})`}
      opacity={dimmed ? 0.28 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover, onSelect)}
    >
      <rect
        x={-component.w / 2}
        y={-component.d / 2}
        width={component.w}
        height={component.d}
        rx={0.18}
        fill={fill}
        stroke={strokeFor(component, active)}
        strokeWidth={active ? 0.2 : 0.1}
      />
    </g>
  );
}

function InverterSymbol({ component, view, active, dimmed, onHover, onSelect }: SymbolProps) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  const stroke = strokeFor(component, active);
  return (
    <g
      transform={`translate(${sx} ${sy})`}
      opacity={dimmed ? 0.28 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover, onSelect)}
    >
      <rect
        x={-component.w / 2}
        y={-component.d / 2}
        width={component.w}
        height={component.d}
        rx={0.28}
        fill="var(--alcaster-diagram-equipment)"
        stroke={stroke}
        strokeWidth={active ? 0.22 : 0.12}
      />
      <line
        x1={-component.w / 2}
        y1={-0.28}
        x2={-component.w / 2 + 0.55}
        y2={-0.28}
        stroke="rgba(230,116,10,0.8)"
        strokeWidth={0.12}
      />
      <line
        x1={-component.w / 2}
        y1={0.28}
        x2={-component.w / 2 + 0.55}
        y2={0.28}
        stroke="rgba(230,116,10,0.8)"
        strokeWidth={0.12}
      />
      <path
        d="M -0.55 0 Q -0.28 -0.55 0 0 Q 0.28 0.55 0.55 0"
        fill="none"
        stroke="color-mix(in srgb, var(--alcaster-fg) 62%, transparent)"
        strokeWidth={0.12}
      />
      <text
        y={component.d / 2 + 1.15}
        textAnchor="middle"
        fill="color-mix(in srgb, var(--alcaster-fg) 55%, transparent)"
        fontSize={0.95}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {component.name}
      </text>
    </g>
  );
}

function TransformerSymbol({ component, view, active, dimmed, onHover, onSelect }: SymbolProps) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  const stroke = strokeFor(component, active);
  return (
    <g
      transform={`translate(${sx} ${sy})`}
      opacity={dimmed ? 0.28 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover, onSelect)}
    >
      <rect
        x={-component.w / 2}
        y={-component.d / 2}
        width={component.w}
        height={component.d}
        fill="transparent"
      />
      <circle cx={-1.15} cy={0} r={1.65} fill="var(--alcaster-diagram-equipment)" stroke={stroke} strokeWidth={0.18} />
      <circle cx={1.15} cy={0} r={1.65} fill="var(--alcaster-diagram-equipment)" stroke={stroke} strokeWidth={0.18} />
      <text
        y={component.d / 2 + 0.2}
        textAnchor="middle"
        fill="color-mix(in srgb, var(--alcaster-fg) 55%, transparent)"
        fontSize={0.95}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {component.name}
      </text>
    </g>
  );
}

function SubstationSymbol({ component, view, active, dimmed, onHover, onSelect }: SymbolProps) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  const stroke = strokeFor(component, active);
  return (
    <g
      transform={`translate(${sx} ${sy})`}
      opacity={dimmed ? 0.28 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover, onSelect)}
    >
      <rect
        x={-component.w / 2}
        y={-component.d / 2}
        width={component.w}
        height={component.d}
        rx={0.3}
        fill="var(--alcaster-diagram-yard)"
        stroke={stroke}
        strokeWidth={active ? 0.22 : 0.12}
      />
      <line
        x1={-component.w / 2 + 0.7}
        y1={-0.9}
        x2={component.w / 2 - 0.7}
        y2={-0.9}
        stroke="rgba(230,116,10,0.85)"
        strokeWidth={0.22}
      />
      <line
        x1={-component.w / 2 + 0.7}
        y1={0.15}
        x2={component.w / 2 - 0.7}
        y2={0.15}
        stroke="color-mix(in srgb, var(--alcaster-fg) 35%, transparent)"
        strokeWidth={0.16}
      />
      {[-1.8, 0, 1.8].map((x) => (
        <line
          key={x}
          x1={x}
          y1={-0.9}
          x2={x}
          y2={1.4}
          stroke="color-mix(in srgb, var(--alcaster-fg) 28%, transparent)"
          strokeWidth={0.12}
        />
      ))}
      <text
        y={component.d / 2 + 1.15}
        textAnchor="middle"
        fill="color-mix(in srgb, var(--alcaster-fg) 55%, transparent)"
        fontSize={0.95}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {component.name}
      </text>
    </g>
  );
}

function GridSymbol({ component, view, active, dimmed, onHover, onSelect }: SymbolProps) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  const stroke = strokeFor(component, active);
  return (
    <g
      transform={`translate(${sx} ${sy})`}
      opacity={dimmed ? 0.28 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover, onSelect)}
    >
      <circle r={2.35} fill="var(--alcaster-diagram-equipment)" stroke={stroke} strokeWidth={0.18} />
      <path
        d="M -1.4 0 Q -0.7 -1.35 0 0 Q 0.7 1.35 1.4 0"
        fill="none"
        stroke="color-mix(in srgb, var(--alcaster-fg) 70%, transparent)"
        strokeWidth={0.16}
      />
      <line x1={0} y1={2.35} x2={0} y2={3.6} stroke={stroke} strokeWidth={0.14} />
      <line x1={-1.1} y1={3.6} x2={1.1} y2={3.6} stroke={stroke} strokeWidth={0.14} />
      <text
        y={5.1}
        textAnchor="middle"
        fill="color-mix(in srgb, var(--alcaster-fg) 55%, transparent)"
        fontSize={0.95}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {component.name}
      </text>
    </g>
  );
}

function BuildingSymbol({ component, view, active, dimmed, onHover, onSelect }: SymbolProps) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  return (
    <g
      transform={`translate(${sx} ${sy})`}
      opacity={dimmed ? 0.28 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover, onSelect)}
    >
      <rect
        x={-component.w / 2}
        y={-component.d / 2 + 0.5}
        width={component.w}
        height={component.d - 0.5}
        fill="var(--alcaster-diagram-building)"
        stroke={strokeFor(component, active)}
        strokeWidth={0.12}
      />
      <polygon
        points={`${-component.w / 2 - 0.2},${-component.d / 2 + 0.55} 0,${-component.d / 2 - 0.7} ${component.w / 2 + 0.2},${-component.d / 2 + 0.55}`}
        fill="var(--alcaster-diagram-roof)"
        stroke={strokeFor(component, active)}
        strokeWidth={0.1}
      />
      <text
        y={component.d / 2 + 1.05}
        textAnchor="middle"
        fill="color-mix(in srgb, var(--alcaster-fg) 50%, transparent)"
        fontSize={0.85}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {component.name}
      </text>
    </g>
  );
}

function RoadSymbol({ component, view, active, dimmed, onHover, onSelect }: SymbolProps) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  return (
    <g
      transform={`translate(${sx} ${sy})`}
      opacity={dimmed ? 0.22 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover, onSelect)}
    >
      <rect
        x={-component.w / 2}
        y={-component.d / 2}
        width={component.w}
        height={component.d}
        fill={
          active
            ? "color-mix(in srgb, var(--alcaster-fg) 14%, transparent)"
            : "color-mix(in srgb, var(--alcaster-fg) 6%, transparent)"
        }
        stroke={active ? "rgba(230,116,10,0.55)" : "transparent"}
        strokeWidth={active ? 0.16 : 0}
      />
    </g>
  );
}

function FenceSymbol({ component, view, active, dimmed, onHover, onSelect }: SymbolProps) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  const stroke = active ? "#e6740a" : "rgba(180,190,170,0.34)";
  return (
    <g
      transform={`translate(${sx} ${sy})`}
      opacity={dimmed ? 0.35 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover, onSelect)}
    >
      <rect
        x={-component.w / 2}
        y={-component.d / 2}
        width={component.w}
        height={component.d}
        fill="none"
        stroke="transparent"
        strokeWidth={2.4}
      />
      <rect
        x={-component.w / 2}
        y={-component.d / 2}
        width={component.w}
        height={component.d}
        fill="none"
        stroke={stroke}
        strokeWidth={active ? 0.42 : 0.22}
        strokeDasharray="1.2 0.8"
        pointerEvents="none"
      />
    </g>
  );
}

function GateSymbol({ component, view, active, dimmed, onHover, onSelect }: SymbolProps) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  const yaw = (component.rotY * 180) / Math.PI;
  return (
    <g
      transform={`translate(${sx} ${sy}) rotate(${yaw})`}
      opacity={dimmed ? 0.28 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover, onSelect)}
    >
      <rect
        x={-component.w / 2}
        y={-component.d / 2}
        width={component.w}
        height={component.d}
        rx={0.2}
        fill={
          active
            ? "var(--alcaster-diagram-equipment)"
            : "var(--alcaster-diagram-building)"
        }
        stroke={strokeFor(component, active)}
        strokeWidth={active ? 0.2 : 0.1}
      />
      <text
        y={component.d / 2 + 1.05}
        textAnchor="middle"
        fill="color-mix(in srgb, var(--alcaster-fg) 50%, transparent)"
        fontSize={0.85}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {component.name}
      </text>
    </g>
  );
}

function WeatherSymbol({ component, view, active, dimmed, onHover, onSelect }: SymbolProps) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  const stroke = strokeFor(component, active);
  return (
    <g
      transform={`translate(${sx} ${sy})`}
      opacity={dimmed ? 0.28 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover, onSelect)}
    >
      <circle r={0.45} fill="#e6740a" stroke={stroke} strokeWidth={0.1} />
      <line x1={0} y1={0} x2={0} y2={-2.4} stroke={stroke} strokeWidth={0.12} />
      <circle cx={0} cy={-2.6} r={0.55} fill="none" stroke={stroke} strokeWidth={0.12} />
      <text
        y={1.8}
        textAnchor="middle"
        fill="color-mix(in srgb, var(--alcaster-fg) 50%, transparent)"
        fontSize={0.8}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {component.name}
      </text>
    </g>
  );
}

function NorthArrow({
  view,
  layoutWidth,
  layoutDepth,
}: {
  view: ViewBox;
  layoutWidth: number;
  layoutDepth: number;
}) {
  const { sx, sy } = toSvg(-layoutWidth / 2 + 6, -layoutDepth / 2 + 8, view);
  return (
    <g transform={`translate(${sx} ${sy})`} pointerEvents="none">
      <polygon points="0,-1.6 0.7,1.1 -0.7,1.1" fill="#e6740a" />
      <text
        y={2.3}
        textAnchor="middle"
        fill="color-mix(in srgb, var(--alcaster-fg) 45%, transparent)"
        fontSize={1.1}
        fontFamily="Inter, system-ui, sans-serif"
      >
        N
      </text>
    </g>
  );
}
