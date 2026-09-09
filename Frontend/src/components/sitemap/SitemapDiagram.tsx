import { useId, useMemo } from "react";

import type { SitemapComponent, SitemapKind, SitemapModel } from "@/lib/sitemapModel";
import type { Vec3 } from "@/lib/twinLayout";

type SitemapDiagramProps = {
  model: SitemapModel;
  hoveredId: string | null;
  hoveredKind: SitemapKind | null;
  onHover: (id: string | null) => void;
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
) {
  if (hoveredId) return component.id === hoveredId;
  if (hoveredKind) return component.kind === hoveredKind;
  return false;
}

function strokeFor(component: SitemapComponent, active: boolean) {
  if (component.status === "OFFLINE") return "rgba(240,113,103,0.9)";
  if (component.status === "WARNING") return "rgba(230,116,10,0.95)";
  if (active) return "#e6740a";
  return "rgba(255,255,255,0.28)";
}

export function SitemapDiagram({
  model,
  hoveredId,
  hoveredKind,
  onHover,
}: SitemapDiagramProps) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const view = useMemo(() => viewBoxOf(model), [model]);
  const { layout, components } = model;
  const dimmed = Boolean(hoveredId || hoveredKind);
  const byKind = (kind: SitemapKind) =>
    components.filter((component) => component.kind === kind);

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
          <stop offset="0%" stopColor="#243328" />
          <stop offset="100%" stopColor="#1a241c" />
        </linearGradient>
      </defs>

      <rect width={view.width} height={view.height} fill="#121814" />

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
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={0.35}
          />
        );
      })()}

      {layout.spec.includeRoads
        ? layout.roads.map((road, index) => {
            const { sx, sy } = toSvg(road.x, road.z, view);
            return (
              <rect
                key={`road-${index}`}
                x={sx - road.w / 2}
                y={sy - road.d / 2}
                width={road.w}
                height={road.d}
                fill="rgba(255,255,255,0.045)"
              />
            );
          })
        : null}

      {layout.spec.includeFence
        ? (() => {
            const a = toSvg(-layout.width / 2, -layout.depth / 2, view);
            return (
              <rect
                x={a.sx}
                y={a.sy}
                width={layout.width}
                height={layout.depth}
                fill="none"
                stroke="rgba(180,190,170,0.28)"
                strokeWidth={0.22}
                strokeDasharray="1.2 0.8"
              />
            );
          })()
        : null}

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
        stroke="rgba(255,255,255,0.16)"
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
      <ZoneLabel
        view={view}
        x={-8}
        z={layout.depth / 2 - layout.depth * 0.12}
        text="SWITCHYARD"
      />

      {byKind("table").map((component) => (
        <TableSymbol
          key={component.id}
          component={component}
          view={view}
          active={isActive(component, hoveredId, hoveredKind)}
          dimmed={dimmed && !isActive(component, hoveredId, hoveredKind)}
          onHover={onHover}
        />
      ))}
      {byKind("combiner").map((component) => (
        <BoxSymbol
          key={component.id}
          component={component}
          view={view}
          active={isActive(component, hoveredId, hoveredKind)}
          dimmed={dimmed && !isActive(component, hoveredId, hoveredKind)}
          onHover={onHover}
          fill="#141a16"
        />
      ))}
      {byKind("inverter").map((component) => (
        <InverterSymbol
          key={component.id}
          component={component}
          view={view}
          active={isActive(component, hoveredId, hoveredKind)}
          dimmed={dimmed && !isActive(component, hoveredId, hoveredKind)}
          onHover={onHover}
        />
      ))}
      {byKind("transformer").map((component) => (
        <TransformerSymbol
          key={component.id}
          component={component}
          view={view}
          active={isActive(component, hoveredId, hoveredKind)}
          dimmed={dimmed && !isActive(component, hoveredId, hoveredKind)}
          onHover={onHover}
        />
      ))}
      {byKind("substation").map((component) => (
        <SubstationSymbol
          key={component.id}
          component={component}
          view={view}
          active={isActive(component, hoveredId, hoveredKind)}
          dimmed={dimmed && !isActive(component, hoveredId, hoveredKind)}
          onHover={onHover}
        />
      ))}
      {byKind("grid").map((component) => (
        <GridSymbol
          key={component.id}
          component={component}
          view={view}
          active={isActive(component, hoveredId, hoveredKind)}
          dimmed={dimmed && !isActive(component, hoveredId, hoveredKind)}
          onHover={onHover}
        />
      ))}
      {byKind("building").map((component) => (
        <BuildingSymbol
          key={component.id}
          component={component}
          view={view}
          active={isActive(component, hoveredId, hoveredKind)}
          dimmed={dimmed && !isActive(component, hoveredId, hoveredKind)}
          onHover={onHover}
        />
      ))}
      {byKind("weather").map((component) => (
        <WeatherSymbol
          key={component.id}
          component={component}
          view={view}
          active={isActive(component, hoveredId, hoveredKind)}
          dimmed={dimmed && !isActive(component, hoveredId, hoveredKind)}
          onHover={onHover}
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
      fill="rgba(255,255,255,0.22)"
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
};

function hitHandlers(id: string, onHover: (id: string | null) => void) {
  return {
    onMouseEnter: () => onHover(id),
    onMouseLeave: () => onHover(null),
  };
}

function TableSymbol({ component, view, active, dimmed, onHover }: SymbolProps) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  const yaw = (component.rotY * 180) / Math.PI;
  const stroke = strokeFor(component, active);
  return (
    <g
      transform={`translate(${sx} ${sy}) rotate(${yaw})`}
      opacity={dimmed ? 0.28 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover)}
    >
      <rect
        x={-component.w / 2}
        y={-component.d / 2}
        width={component.w}
        height={component.d}
        rx={0.12}
        fill={active ? "#16344f" : "#102a42"}
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
  fill,
}: SymbolProps & { fill: string }) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  return (
    <g
      transform={`translate(${sx} ${sy})`}
      opacity={dimmed ? 0.28 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover)}
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

function InverterSymbol({ component, view, active, dimmed, onHover }: SymbolProps) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  const stroke = strokeFor(component, active);
  return (
    <g
      transform={`translate(${sx} ${sy})`}
      opacity={dimmed ? 0.28 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover)}
    >
      <rect
        x={-component.w / 2}
        y={-component.d / 2}
        width={component.w}
        height={component.d}
        rx={0.28}
        fill="#0d1210"
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
        stroke="rgba(255,255,255,0.62)"
        strokeWidth={0.12}
      />
      <text
        y={component.d / 2 + 1.15}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontSize={0.95}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {component.name}
      </text>
    </g>
  );
}

function TransformerSymbol({ component, view, active, dimmed, onHover }: SymbolProps) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  const stroke = strokeFor(component, active);
  return (
    <g
      transform={`translate(${sx} ${sy})`}
      opacity={dimmed ? 0.28 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover)}
    >
      <rect
        x={-component.w / 2}
        y={-component.d / 2}
        width={component.w}
        height={component.d}
        fill="transparent"
      />
      <circle cx={-1.15} cy={0} r={1.65} fill="#0d1210" stroke={stroke} strokeWidth={0.18} />
      <circle cx={1.15} cy={0} r={1.65} fill="#0d1210" stroke={stroke} strokeWidth={0.18} />
      <text
        y={component.d / 2 + 0.2}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontSize={0.95}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {component.name}
      </text>
    </g>
  );
}

function SubstationSymbol({ component, view, active, dimmed, onHover }: SymbolProps) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  const stroke = strokeFor(component, active);
  return (
    <g
      transform={`translate(${sx} ${sy})`}
      opacity={dimmed ? 0.28 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover)}
    >
      <rect
        x={-component.w / 2}
        y={-component.d / 2}
        width={component.w}
        height={component.d}
        rx={0.3}
        fill="#10140f"
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
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={0.16}
      />
      {[-1.8, 0, 1.8].map((x) => (
        <line
          key={x}
          x1={x}
          y1={-0.9}
          x2={x}
          y2={1.4}
          stroke="rgba(255,255,255,0.28)"
          strokeWidth={0.12}
        />
      ))}
      <text
        y={component.d / 2 + 1.15}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontSize={0.95}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {component.name}
      </text>
    </g>
  );
}

function GridSymbol({ component, view, active, dimmed, onHover }: SymbolProps) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  const stroke = strokeFor(component, active);
  return (
    <g
      transform={`translate(${sx} ${sy})`}
      opacity={dimmed ? 0.28 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover)}
    >
      <circle r={2.35} fill="#0d1210" stroke={stroke} strokeWidth={0.18} />
      <path
        d="M -1.4 0 Q -0.7 -1.35 0 0 Q 0.7 1.35 1.4 0"
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth={0.16}
      />
      <line x1={0} y1={2.35} x2={0} y2={3.6} stroke={stroke} strokeWidth={0.14} />
      <line x1={-1.1} y1={3.6} x2={1.1} y2={3.6} stroke={stroke} strokeWidth={0.14} />
      <text
        y={5.1}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontSize={0.95}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {component.name}
      </text>
    </g>
  );
}

function BuildingSymbol({ component, view, active, dimmed, onHover }: SymbolProps) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  return (
    <g
      transform={`translate(${sx} ${sy})`}
      opacity={dimmed ? 0.28 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover)}
    >
      <rect
        x={-component.w / 2}
        y={-component.d / 2 + 0.5}
        width={component.w}
        height={component.d - 0.5}
        fill="#161c18"
        stroke={strokeFor(component, active)}
        strokeWidth={0.12}
      />
      <polygon
        points={`${-component.w / 2 - 0.2},${-component.d / 2 + 0.55} 0,${-component.d / 2 - 0.7} ${component.w / 2 + 0.2},${-component.d / 2 + 0.55}`}
        fill="#1c2420"
        stroke={strokeFor(component, active)}
        strokeWidth={0.1}
      />
      <text
        y={component.d / 2 + 1.05}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={0.85}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {component.name}
      </text>
    </g>
  );
}

function WeatherSymbol({ component, view, active, dimmed, onHover }: SymbolProps) {
  const { sx, sy } = toSvg(component.x, component.z, view);
  const stroke = strokeFor(component, active);
  return (
    <g
      transform={`translate(${sx} ${sy})`}
      opacity={dimmed ? 0.28 : 1}
      className="cursor-pointer"
      {...hitHandlers(component.id, onHover)}
    >
      <circle r={0.45} fill="#e6740a" stroke={stroke} strokeWidth={0.1} />
      <line x1={0} y1={0} x2={0} y2={-2.4} stroke={stroke} strokeWidth={0.12} />
      <circle cx={0} cy={-2.6} r={0.55} fill="none" stroke={stroke} strokeWidth={0.12} />
      <text
        y={1.8}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
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
        fill="rgba(255,255,255,0.45)"
        fontSize={1.1}
        fontFamily="Inter, system-ui, sans-serif"
      >
        N
      </text>
    </g>
  );
}
