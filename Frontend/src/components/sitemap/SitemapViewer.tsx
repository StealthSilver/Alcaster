import { useEffect, useMemo, useRef, useState } from "react";
import { FolderTree, Map, Network, Zap } from "lucide-react";

import { AssetDetailsPanel } from "@/components/twin/AssetDetailsPanel";
import { SitemapDiagram } from "@/components/sitemap/SitemapDiagram";
import { SitemapTree } from "@/components/sitemap/SitemapTree";
import { SingleLineDiagram } from "@/components/sitemap/SingleLineDiagram";
import { useAssetSelection } from "@/hooks/useAssetSelection";
import type { TwinRecord } from "@/lib/api";
import { buildElectricalTree } from "@/lib/electricalTree";
import type { ElectricalPath } from "@/lib/electricalModel";
import {
  buildSitemapModel,
  buildSitemapTree,
  countByKind,
  findTreeNodeByAssetId,
  SLD_STAGES,
  type SitemapComponent,
  type SitemapKind,
  type SitemapStatus,
  type SitemapTreeNode,
} from "@/lib/sitemapModel";
import type { SldLevel } from "@/lib/sldModel";

type SitemapViewerProps = {
  twin: TwinRecord;
  projectName: string;
};

type ViewMode = "map" | "tree" | "sld";
type TreeMode = "physical" | "electrical";

const statusColor: Record<SitemapStatus, string> = {
  ONLINE: "rgba(120, 180, 140, 0.95)",
  WARNING: "#e6740a",
  OFFLINE: "#f07167",
};

export function SitemapViewer({ twin, projectName }: SitemapViewerProps) {
  const model = useMemo(() => buildSitemapModel(twin), [twin]);
  const physicalTree = useMemo(() => buildSitemapTree(model), [model]);
  const electricalTree = useMemo(
    () => buildElectricalTree(model.assets),
    [model.assets],
  );
  const frameRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ViewMode>("map");
  const [treeMode, setTreeMode] = useState<TreeMode>("physical");
  const [sldLevel, setSldLevel] = useState<SldLevel>("plant");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredKind, setHoveredKind] = useState<SitemapKind | null>(null);
  const [pointer, setPointer] = useState({ x: 24, y: 24 });
  const [tracedPath, setTracedPath] = useState<ElectricalPath | null>(null);
  const { selectedAssetId, selectAsset } = useAssetSelection(twin.projectId);
  const counts = useMemo(() => countByKind(model.components), [model.components]);
  const plantName = model.plant.projectName || projectName;

  const tree = treeMode === "electrical" ? electricalTree : physicalTree;

  const selectedNode: SitemapTreeNode | null = useMemo(() => {
    if (!selectedAssetId) return tree;
    return findTreeNodeByAssetId(tree, selectedAssetId) ?? tree;
  }, [selectedAssetId, tree]);

  const hovered = hoveredId
    ? model.components.find((component) => component.id === hoveredId) ?? null
    : null;

  const pathHighlight = useMemo(() => {
    if (!tracedPath) return null;
    return new Set(tracedPath.fullPath);
  }, [tracedPath]);

  useEffect(() => {
    setTracedPath(null);
  }, [twin.id]);

  function handleHover(id: string | null) {
    setHoveredId(id);
    if (id) {
      const match = model.components.find((component) => component.id === id);
      setHoveredKind(match?.kind ?? null);
    } else {
      setHoveredKind(null);
    }
  }

  function selectFromMap(id: string) {
    selectAsset(id, { source: "sitemap", focus3d: true });
  }

  function selectFromTree(node: SitemapTreeNode) {
    const assetId = node.assetId ?? node.componentId ?? null;
    if (node.kind === "folder") {
      selectAsset(null, { source: "tree" });
      return;
    }
    selectAsset(assetId ?? node.id, {
      source: "tree",
      focus3d: Boolean(assetId || node.componentId),
    });
  }

  function setViewMode(next: ViewMode) {
    setView(next);
  }

  return (
    <div
      ref={frameRef}
      className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-edge bg-page"
      onMouseMove={(event) => {
        if (view !== "map") return;
        const box = frameRef.current?.getBoundingClientRect();
        if (!box) return;
        setPointer({
          x: event.clientX - box.left,
          y: event.clientY - box.top,
        });
      }}
    >
      {view === "map" ? (
        <div className="absolute inset-0 pb-[88px] pt-1">
          <SitemapDiagram
            model={model}
            hoveredId={hoveredId}
            hoveredKind={hoveredId ? null : hoveredKind}
            selectedId={selectedAssetId}
            onHover={handleHover}
            onSelect={selectFromMap}
          />
        </div>
      ) : null}

      {view === "tree" ? (
        <div className="absolute inset-0 pb-3 pt-14 pr-[min(252px,42%)] sm:pt-16">
          <SitemapTree
            root={tree}
            model={model}
            selectedId={selectedNode?.id ?? tree.id}
            onSelect={selectFromTree}
          />
        </div>
      ) : null}

      {view === "sld" ? (
        <div className="absolute inset-0 pb-3 pt-14 pr-[min(252px,42%)] sm:pt-16">
          <SingleLineDiagram
            model={model.assets}
            selectedAssetId={selectedAssetId}
            highlightedIds={pathHighlight}
            level={sldLevel}
            onLevelChange={setSldLevel}
            onSelect={(assetId) =>
              selectAsset(assetId, { source: "sitemap", focus3d: true })
            }
          />
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-none absolute left-3 top-3 max-w-[220px] sm:left-4 sm:top-4">
          <div className="rounded-xl border border-edge-strong bg-page/90 px-3 py-2.5 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
              {view === "map" ? (
                <Map className="h-3 w-3" />
              ) : view === "sld" ? (
                <Zap className="h-3 w-3" />
              ) : (
                <FolderTree className="h-3 w-3" />
              )}
              {view === "map"
                ? "Sitemap"
                : view === "sld"
                  ? "SLD"
                  : treeMode === "electrical"
                    ? "Electrical"
                    : "Hierarchy"}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-fg">
              {plantName}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              {view === "map"
                ? "Click a component to select its asset"
                : view === "sld"
                  ? "Data-driven single-line diagram"
                  : "Expand folders · select a node for details"}
            </p>
          </div>
          {view === "tree" ? (
            <div className="pointer-events-auto mt-2 rounded-xl border border-edge-strong bg-page/90 p-0.5 backdrop-blur-sm">
              <div className="flex" role="group" aria-label="Tree mode">
                <button
                  type="button"
                  onClick={() => setTreeMode("physical")}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium ${
                    treeMode === "physical"
                      ? "bg-fill-strong text-fg"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  Physical
                </button>
                <button
                  type="button"
                  onClick={() => setTreeMode("electrical")}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium ${
                    treeMode === "electrical"
                      ? "bg-fill-strong text-fg"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  Electrical
                </button>
              </div>
            </div>
          ) : null}
          {view === "map" && pathHighlight && selectedAssetId ? (
            <div className="pointer-events-auto mt-2 max-h-40 overflow-y-auto rounded-xl border border-edge-strong bg-page/90 px-3 py-2 backdrop-blur-sm">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-accent">
                Electrical path
              </p>
              <ol className="mt-1.5 space-y-0.5 text-[10px]">
                {tracedPath?.fullPath.map((id, index) => (
                  <li key={`${id}-${index}`} className="flex items-center gap-1">
                    {index > 0 ? (
                      <span className="text-muted">↓</span>
                    ) : null}
                    <button
                      type="button"
                      className={`font-medium hover:text-accent ${
                        id === selectedAssetId ? "text-accent" : "text-fg"
                      }`}
                      onClick={() =>
                        selectAsset(id, { source: "sitemap", focus3d: true })
                      }
                    >
                      {id}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>

        <div className="pointer-events-auto absolute right-3 top-3 flex w-[236px] flex-col items-stretch gap-2 sm:right-4 sm:top-4">
          <ViewToggle view={view} onChange={setViewMode} />
          <AssetDetailsPanel
            model={model.assets}
            selectedAssetId={
              selectedAssetId && model.assets.assets[selectedAssetId]
                ? selectedAssetId
                : selectedNode?.assetId && model.assets.assets[selectedNode.assetId]
                  ? selectedNode.assetId
                  : null
            }
            tracedPath={tracedPath}
            onTracePath={setTracedPath}
            onSelect={(assetId, options) =>
              selectAsset(assetId, {
                source: "search",
                focus3d: options?.focus3d ?? Boolean(assetId),
              })
            }
          />
        </div>

        {view === "map" ? (
          <div className="pointer-events-auto absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
            <SldStrip
              modelCounts={counts}
              electrical={model.assets.electrical}
              hoveredKind={hoveredKind}
              onHoverKind={(kind) => {
                setHoveredId(null);
                setHoveredKind(kind);
              }}
            />
          </div>
        ) : null}
      </div>

      {view === "map" && hovered ? (
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

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}) {
  return (
    <div
      className="inline-flex self-end rounded-lg border border-edge-strong bg-page/90 p-0.5 backdrop-blur-sm"
      role="group"
      aria-label="Sitemap view"
    >
      <button
        type="button"
        onClick={() => onChange("map")}
        className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
          view === "map"
            ? "bg-fill-strong text-fg"
            : "text-muted hover:text-fg"
        }`}
        aria-pressed={view === "map"}
      >
        <Map className="h-3.5 w-3.5" />
        Map
      </button>
      <button
        type="button"
        onClick={() => onChange("tree")}
        className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
          view === "tree"
            ? "bg-fill-strong text-fg"
            : "text-muted hover:text-fg"
        }`}
        aria-pressed={view === "tree"}
      >
        <Network className="h-3.5 w-3.5" />
        Tree
      </button>
      <button
        type="button"
        onClick={() => onChange("sld")}
        className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
          view === "sld"
            ? "bg-fill-strong text-fg"
            : "text-muted hover:text-fg"
        }`}
        aria-pressed={view === "sld"}
      >
        <Zap className="h-3.5 w-3.5" />
        SLD
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-right font-medium tabular-nums text-fg">
        {value}
      </dd>
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
  const width = 280;
  const maxLeft = Math.max(12, (bounds?.width ?? 720) - width - 12);
  const maxTop = Math.max(12, (bounds?.height ?? 480) - 320);
  const left = Math.min(Math.max(12, x + 16), maxLeft);
  const top = Math.min(Math.max(12, y + 16), maxTop);
  return (
    <div
      className="pointer-events-none absolute z-20 w-[280px] rounded-xl border border-edge-strong bg-page/95 px-3 py-2.5 shadow-[var(--alcaster-shadow)] backdrop-blur-md"
      style={{ left, top }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fg">{component.name}</p>
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
      <dl className="mt-2 max-h-56 space-y-1.5 overflow-y-auto border-t border-edge pt-2 text-[11px]">
        {component.rows.slice(0, 8).map((row) => (
          <Row key={row.label} label={row.label} value={row.value} />
        ))}
      </dl>
    </div>
  );
}

function SldStrip({
  modelCounts,
  electrical,
  hoveredKind,
  onHoverKind,
}: {
  modelCounts: Partial<Record<SitemapKind, number>>;
  electrical: ReturnType<typeof buildSitemapModel>["assets"]["electrical"];
  hoveredKind: SitemapKind | null;
  onHoverKind: (kind: SitemapKind | null) => void;
}) {
  const stages = SLD_STAGES.filter((stage) => (modelCounts[stage.kind] ?? 0) > 0);
  return (
    <div className="rounded-xl border border-edge-strong bg-page/92 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-edge px-3 py-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
          Power path
        </p>
        {electrical ? (
          <p className="text-[10px] text-muted">
            {electrical.counts.strings.toLocaleString()} strings ·{" "}
            {electrical.counts.feeders} feeders
          </p>
        ) : null}
      </div>
      <div
        className="flex items-stretch gap-0 overflow-x-auto px-1.5 py-1.5"
        onMouseLeave={() => onHoverKind(null)}
      >
        {stages.map((stage, index) => {
          const active = hoveredKind === stage.kind;
          const count = modelCounts[stage.kind] ?? 0;
          return (
            <div key={stage.kind} className="flex min-w-0 items-center">
              {index > 0 ? (
                <span
                  aria-hidden
                  className="mx-0.5 h-px w-3 shrink-0 bg-edge-strong sm:w-5"
                />
              ) : null}
              <button
                type="button"
                onMouseEnter={() => onHoverKind(stage.kind)}
                onFocus={() => onHoverKind(stage.kind)}
                onBlur={() => onHoverKind(null)}
                className={`flex min-w-[4.5rem] flex-col items-start gap-0.5 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                  active
                    ? "bg-accent/12 text-fg"
                    : "text-secondary hover:bg-fill hover:text-fg"
                }`}
              >
                <span className="text-[11px] font-medium leading-none">
                  {stage.label}
                </span>
                <span
                  className={`text-sm font-semibold tabular-nums leading-none ${
                    active ? "text-accent" : "text-fg"
                  }`}
                >
                  {count.toLocaleString()}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
