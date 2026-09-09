import { useMemo, useRef, useState } from "react";
import { Box, Map } from "lucide-react";
import { Link } from "react-router-dom";

import { SitemapDiagram } from "@/components/sitemap/SitemapDiagram";
import type { TwinRecord } from "@/lib/api";
import { projectTwinPath } from "@/lib/paths";
import {
  buildSitemapModel,
  SLD_STAGES,
  type SitemapComponent,
  type SitemapKind,
  type SitemapStatus,
} from "@/lib/sitemapModel";

type SitemapViewerProps = {
  twin: TwinRecord;
  projectName: string;
};

const statusColor: Record<SitemapStatus, string> = {
  ONLINE: "rgba(120, 180, 140, 0.95)",
  WARNING: "#e6740a",
  OFFLINE: "#f07167",
};

export function SitemapViewer({ twin, projectName }: SitemapViewerProps) {
  const model = useMemo(() => buildSitemapModel(twin), [twin]);
  const frameRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredKind, setHoveredKind] = useState<SitemapKind | null>(null);
  const [pointer, setPointer] = useState({ x: 24, y: 24 });
  const { spec, derived } = twin;

  const hovered = hoveredId
    ? model.components.find((component) => component.id === hoveredId) ?? null
    : null;

  function handleHover(id: string | null) {
    setHoveredId(id);
    if (id) {
      const match = model.components.find((component) => component.id === id);
      setHoveredKind(match?.kind ?? null);
    } else {
      setHoveredKind(null);
    }
  }

  return (
    <div
      ref={frameRef}
      className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-edge bg-page"
      onMouseMove={(event) => {
        const box = frameRef.current?.getBoundingClientRect();
        if (!box) return;
        setPointer({
          x: event.clientX - box.left,
          y: event.clientY - box.top,
        });
      }}
    >
      <div className="absolute inset-0 pb-[92px] pt-1">
        <SitemapDiagram
          model={model}
          hoveredId={hoveredId}
          hoveredKind={hoveredId ? null : hoveredKind}
          onHover={handleHover}
        />
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-none absolute left-3 top-3 max-w-[240px] space-y-2 sm:left-4 sm:top-4">
          <div className="rounded-xl border border-edge-strong bg-page/90 px-3 py-2.5 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
              <Map className="h-3 w-3" />
              Sitemap
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-fg">
              {projectName}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              2D SLD of the digital twin
            </p>
          </div>
          <div className="rounded-xl border border-edge-strong bg-page/90 px-3 py-2.5 backdrop-blur-sm">
            <dl className="space-y-1.5 text-[11px]">
              <Row label="Export" value={`${model.exportMw} MW`} />
              <Row label="Plant load" value={`${model.plantLoadPct}%`} />
              <Row label="GHI" value={`${model.irradiance} W/m²`} />
              <Row label="Modules" value={derived.moduleCount.toLocaleString()} />
              <Row label="Grid" value={`${spec.gridVoltageKv} kV`} />
            </dl>
          </div>
        </div>

        <div className="pointer-events-auto absolute right-3 top-3 sm:right-4 sm:top-4">
          <Link
            to={projectTwinPath(twin.projectId)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-edge-strong bg-page/90 px-3 py-2 text-xs font-medium text-secondary backdrop-blur-sm transition-colors hover:border-edge-strong hover:text-fg"
          >
            <Box className="h-3.5 w-3.5" />
            Open 3D twin
          </Link>
        </div>

        <div className="pointer-events-auto absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
          <SldStrip
            modelCounts={{
              table: model.layout.tables.length,
              combiner: model.layout.combiners.length,
              inverter: model.layout.inverters.length,
              transformer: model.layout.transformers.length,
              substation: 1,
              grid: 1,
            }}
            hoveredKind={hoveredKind}
            onHoverKind={(kind) => {
              setHoveredId(null);
              setHoveredKind(kind);
            }}
          />
        </div>
      </div>

      {hovered ? (
        <HoverCard
          component={hovered}
          x={pointer.x}
          y={pointer.y}
          bounds={frameRef.current?.getBoundingClientRect() ?? null}
        />
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium tabular-nums text-fg">{value}</dd>
    </div>
  );
}

function HoverCard({
  component,
  x,
  y,
  bounds,
}: {
  component: SitemapComponent;
  x: number;
  y: number;
  bounds: DOMRect | null;
}) {
  const width = 236;
  const maxLeft = Math.max(12, (bounds?.width ?? 720) - width - 12);
  const maxTop = Math.max(12, (bounds?.height ?? 480) - 280);
  const left = Math.min(Math.max(12, x + 16), maxLeft);
  const top = Math.min(Math.max(12, y + 16), maxTop);
  return (
    <div
      className="pointer-events-none absolute z-20 w-[236px] rounded-xl border border-edge-strong bg-page/95 px-3 py-2.5 shadow-[var(--alcaster-shadow)] backdrop-blur-md"
      style={{ left, top }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-fg">{component.name}</p>
          <p className="text-[11px] text-muted">{component.typeLabel}</p>
        </div>
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
          style={{
            color: statusColor[component.status],
            background: `${statusColor[component.status]}22`,
          }}
        >
          {component.status}
        </span>
      </div>
      <dl className="mt-2 space-y-1.5 border-t border-edge pt-2 text-[11px]">
        {component.rows.map((row) => (
          <Row key={row.label} label={row.label} value={row.value} />
        ))}
      </dl>
    </div>
  );
}

function SldStrip({
  modelCounts,
  hoveredKind,
  onHoverKind,
}: {
  modelCounts: Partial<Record<SitemapKind, number>>;
  hoveredKind: SitemapKind | null;
  onHoverKind: (kind: SitemapKind | null) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-edge-strong bg-page/90 px-3 py-2.5 backdrop-blur-sm">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
        Single-line · arrays to grid
      </p>
      <div
        className="flex items-center gap-1 overflow-x-auto"
        onMouseLeave={() => onHoverKind(null)}
      >
        {SLD_STAGES.map((stage, index) => {
          const active = hoveredKind === stage.kind;
          return (
            <div key={stage.kind} className="flex min-w-0 items-center">
              {index > 0 ? (
                <span className="mx-1 h-px w-4 shrink-0 bg-fill-strong sm:w-7" />
              ) : null}
              <button
                type="button"
                onMouseEnter={() => onHoverKind(stage.kind)}
                onFocus={() => onHoverKind(stage.kind)}
                onBlur={() => onHoverKind(null)}
                className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
                  active
                    ? "border-[#e6740a]/50 bg-accent/12"
                    : "border-edge-strong bg-fill hover:border-edge-strong"
                }`}
              >
                <p className="text-[11px] font-medium text-fg">{stage.label}</p>
                <p className="text-[10px] tabular-nums text-muted">
                  {modelCounts[stage.kind] ?? 0}
                </p>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
