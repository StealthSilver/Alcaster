import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  FolderTree,
  Maximize2,
  Minimize2,
  Map,
  Network,
  Scan,
  ZoomIn,
  ZoomOut,
  Zap,
} from "lucide-react";

import { iconButtonClass } from "@/components/dashboard/panel";
import { AssetDetailsPanel } from "@/components/twin/AssetDetailsPanel";
import {
  DiagramViewport,
  useDiagramTransform,
} from "@/components/sitemap/DiagramViewport";
import { SitemapDiagram } from "@/components/sitemap/SitemapDiagram";
import { SitemapTree } from "@/components/sitemap/SitemapTree";
import { SingleLineDiagramCanvas } from "@/components/sitemap/SingleLineDiagram";
import { useAssetSelection } from "@/hooks/useAssetSelection";
import { useConditionTwin } from "@/hooks/useConditionTwin";
import { useHistoricalTwin } from "@/hooks/useHistoricalTwin";
import { useLiveTelemetry } from "@/hooks/useLiveTelemetry";
import { usePanelFullscreen } from "@/hooks/usePanelFullscreen";
import type { TwinRecord } from "@/lib/api";
import {
  conditionLabel,
} from "@/lib/conditionModel";
import type { ConditionStoreState } from "@/lib/conditionStore";
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
  type SitemapModel,
  type SitemapStatus,
  type SitemapTreeNode,
} from "@/lib/sitemapModel";
import type { SldLevel } from "@/lib/sldModel";
import {
  formatPowerKw,
  operationalStatusLabel,
  operationalToAssetStatus,
  operationalToSitemapStatus,
  type TelemetrySnapshot,
  type TelemetryStoreSnapshot,
} from "@/lib/telemetry";

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

const VIEW_SCALE: Record<ViewMode, number> = {
  map: 1,
  tree: 1,
  sld: 1.35,
};

export function SitemapViewer({ twin, projectName }: SitemapViewerProps) {
  const model = useMemo(() => buildSitemapModel(twin), [twin]);
  const { state: liveTelemetry } = useLiveTelemetry(twin, model.assets, true);
  const { state: history } = useHistoricalTwin(twin, model.assets, true);
  const telemetry =
    history.isHistorical && history.telemetry
      ? history.telemetry
      : liveTelemetry;
  const { state: condition, controls: conditionControls } = useConditionTwin(
    twin,
    model.assets,
    true,
  );
  const liveModel = useMemo(
    () => applyLiveStatusToSitemap(model, telemetry, condition),
    [model, telemetry, condition],
  );
  const physicalTree = useMemo(() => buildSitemapTree(liveModel), [liveModel]);
  const electricalTree = useMemo(
    () => buildElectricalTree(liveModel.assets),
    [liveModel.assets],
  );
  const frameRef = useRef<HTMLDivElement>(null);
  const {
    ref: fullscreenRef,
    active: fullscreen,
    toggle: toggleFullscreen,
  } = usePanelFullscreen();
  const {
    transform,
    setTransform,
    zoomBy,
    zoomIn,
    zoomOut,
    resetForView,
  } = useDiagramTransform(1);
  const [view, setView] = useState<ViewMode>("map");
  const [treeMode, setTreeMode] = useState<TreeMode>("physical");
  const [sldLevel, setSldLevel] = useState<SldLevel>("plant");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredKind, setHoveredKind] = useState<SitemapKind | null>(null);
  const [pointer, setPointer] = useState({ x: 24, y: 24 });
  const [tracedPath, setTracedPath] = useState<ElectricalPath | null>(null);
  const { selectedAssetId, selectAsset } = useAssetSelection(twin.projectId);
  const counts = useMemo(
    () => countByKind(liveModel.components),
    [liveModel.components],
  );
  const plantName = liveModel.plant.projectName || projectName;

  const tree = treeMode === "electrical" ? electricalTree : physicalTree;

  const selectedNode: SitemapTreeNode | null = useMemo(() => {
    if (!selectedAssetId) return tree;
    return findTreeNodeByAssetId(tree, selectedAssetId) ?? tree;
  }, [selectedAssetId, tree]);

  const hovered = hoveredId
    ? liveModel.components.find((component) => component.id === hoveredId) ??
      null
    : null;

  const hoveredTelemetry = hovered
    ? telemetry.byAssetId[hovered.assetId] ?? null
    : null;

  const pathHighlight = useMemo(() => {
    if (!tracedPath) return null;
    return new Set(tracedPath.fullPath);
  }, [tracedPath]);

  const selectedDetailId =
    selectedAssetId && liveModel.assets.assets[selectedAssetId]
      ? selectedAssetId
      : selectedNode?.assetId && liveModel.assets.assets[selectedNode.assetId]
        ? selectedNode.assetId
        : null;

  useEffect(() => {
    setTracedPath(null);
  }, [twin.id]);

  function setFrameNode(node: HTMLDivElement | null) {
    frameRef.current = node;
    (fullscreenRef as MutableRefObject<HTMLElement | null>).current = node;
  }

  function handleHover(id: string | null) {
    setHoveredId(id);
    if (id) {
      const match = liveModel.components.find((component) => component.id === id);
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
    resetForView(VIEW_SCALE[next]);
  }

  const zoomEnabled = view === "map" || view === "sld";

  const hint =
    view === "map"
      ? "Scroll to zoom · drag to pan · click a component"
      : view === "sld"
        ? "Scroll to zoom · drag to pan · click a node for asset details"
        : "Expand folders · select a node for details";

  return (
    <div
      ref={setFrameNode}
      className={`relative min-h-0 flex-1 overflow-hidden border border-edge bg-page ${
        fullscreen ? "h-screen w-screen rounded-none" : "rounded-2xl"
      }`}
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
        <div className="absolute inset-0 pb-[88px]">
          <DiagramViewport
            transform={transform}
            onTransformChange={setTransform}
            onZoomBy={zoomBy}
            className="bg-[var(--alcaster-diagram)]"
          >
            <div className="h-[min(72vh,680px)] w-[min(92vw,1080px)]">
              <SitemapDiagram
                model={liveModel}
                hoveredId={hoveredId}
                hoveredKind={hoveredId ? null : hoveredKind}
                selectedId={selectedAssetId}
                onHover={handleHover}
                onSelect={selectFromMap}
              />
            </div>
          </DiagramViewport>
        </div>
      ) : null}

      {view === "tree" ? (
        <div className="absolute inset-0 pb-3 pt-14 pr-[min(252px,42%)] sm:pt-16">
          <SitemapTree
            root={tree}
            model={liveModel}
            selectedId={selectedNode?.id ?? tree.id}
            onSelect={selectFromTree}
          />
        </div>
      ) : null}

      {view === "sld" ? (
        <div className="absolute inset-0 pb-3 pt-14 pr-[min(252px,42%)] sm:pt-16">
          <DiagramViewport
            transform={transform}
            onTransformChange={setTransform}
            onZoomBy={zoomBy}
            className="rounded-xl border border-edge bg-[color-mix(in_oklab,var(--alcaster-page)_92%,#1a1f24)]"
          >
            <SingleLineDiagramCanvas
              model={liveModel.assets}
              selectedAssetId={selectedAssetId}
              highlightedIds={pathHighlight}
              level={sldLevel}
              telemetryByAssetId={telemetry.byAssetId}
              onSelect={(assetId) =>
                selectAsset(assetId, { source: "sitemap", focus3d: true })
              }
            />
          </DiagramViewport>
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
              {history.isHistorical
                ? "Historical state · synced with Digital Twin timeline"
                : view === "map"
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
          {view === "sld" ? (
            <div className="pointer-events-auto mt-2 rounded-xl border border-edge-strong bg-page/90 p-0.5 backdrop-blur-sm">
              <div className="flex" role="group" aria-label="SLD level">
                {(["plant", "block", "asset"] as SldLevel[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSldLevel(id);
                      resetForView(VIEW_SCALE.sld);
                    }}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium capitalize ${
                      sldLevel === id
                        ? "bg-fill-strong text-fg"
                        : "text-muted hover:text-fg"
                    }`}
                  >
                    {id}
                  </button>
                ))}
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
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <ViewToggle view={view} onChange={setViewMode} />
            {zoomEnabled ? (
              <div className="inline-flex items-center gap-0.5 rounded-xl border border-edge-strong bg-page/90 p-1 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={zoomOut}
                  className={iconButtonClass}
                  title="Zoom out"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[2.75rem] text-center text-[11px] tabular-nums text-muted">
                  {Math.round(transform.scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={zoomIn}
                  className={iconButtonClass}
                  title="Zoom in"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => resetForView(VIEW_SCALE[view])}
                  className={iconButtonClass}
                  title="Fit view"
                  aria-label="Fit view"
                >
                  <Scan className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className={`${iconButtonClass} bg-page/90 backdrop-blur-sm`}
              title={fullscreen ? "Exit full screen" : "Full screen"}
              aria-label={fullscreen ? "Exit full screen" : "Full screen"}
            >
              {fullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <AssetDetailsPanel
            model={liveModel.assets}
            selectedAssetId={selectedDetailId}
            tracedPath={tracedPath}
            telemetry={
              selectedDetailId
                ? telemetry.byAssetId[selectedDetailId] ?? null
                : null
            }
            telemetryConnection={telemetry.connection}
            conditionState={condition}
            historicalMode={history.isHistorical}
            historicalTimestamp={
              history.isHistorical ? history.timestamp : null
            }
            historicalStatusLabel={
              history.isHistorical && selectedDetailId
                ? history.snapshot?.assets.find(
                    (a) => a.assetId === selectedDetailId,
                  )?.operationalStatus ?? null
                : null
            }
            onAddInspection={(input) => {
              if (history.isHistorical) {
                return {
                  ok: false,
                  error: "Inspections are read-only in historical mode",
                };
              }
              const result = conditionControls.addInspection(input);
              return result.ok
                ? { ok: true }
                : { ok: false, error: result.error };
            }}
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
              electrical={liveModel.assets.electrical}
              hoveredKind={hoveredKind}
              onHoverKind={(kind) => {
                setHoveredId(null);
                setHoveredKind(kind);
              }}
            />
          </div>
        ) : (
          <p className="pointer-events-none absolute bottom-3 left-3 max-w-[min(100%,28rem)] text-[11px] text-muted sm:bottom-4 sm:left-4">
            {hint}
            {fullscreen ? " · Esc exits full screen" : ""}
          </p>
        )}
      </div>

      {view === "map" && hovered ? (
        <HoverCard
          component={hovered}
          telemetry={hoveredTelemetry}
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
      className="inline-flex rounded-xl border border-edge-strong bg-page/90 p-1 backdrop-blur-sm"
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
  telemetry,
  x,
  y,
  bounds,
}: {
  component: SitemapComponent;
  telemetry?: TelemetrySnapshot | null;
  x: number;
  y: number;
  bounds: DOMRect | null;
}) {
  const width = 280;
  const maxLeft = Math.max(12, (bounds?.width ?? 720) - width - 12);
  const maxTop = Math.max(12, (bounds?.height ?? 480) - 320);
  const left = Math.min(Math.max(12, x + 16), maxLeft);
  const top = Math.min(Math.max(12, y + 16), maxTop);
  const liveStatus = telemetry
    ? operationalToSitemapStatus(telemetry.status)
    : component.status;
  const liveLabel = telemetry
    ? operationalStatusLabel(telemetry.status)
    : component.status;
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
            color: statusColor[liveStatus],
            background: `${statusColor[liveStatus]}22`,
          }}
        >
          {liveLabel}
        </span>
      </div>
      <dl className="mt-2 max-h-56 space-y-1.5 overflow-y-auto border-t border-edge pt-2 text-[11px]">
        {telemetry?.measurements.activePower != null ? (
          <Row
            label="Power"
            value={formatPowerKw(telemetry.measurements.activePower)}
          />
        ) : null}
        {telemetry?.measurements.temperature != null ? (
          <Row
            label="Temp"
            value={`${telemetry.measurements.temperature.toFixed(1)} °C`}
          />
        ) : null}
        {component.rows.slice(0, 8).map((row) => (
          <Row key={row.label} label={row.label} value={row.value} />
        ))}
      </dl>
    </div>
  );
}

function applyLiveStatusToSitemap(
  model: SitemapModel,
  telemetry: TelemetryStoreSnapshot,
  condition: ConditionStoreState,
): SitemapModel {
  if (!telemetry.lastUpdated && !condition.generatedAt) return model;

  const assets = { ...model.assets.assets };
  for (const [assetId, snap] of Object.entries(telemetry.byAssetId)) {
    const asset = assets[assetId];
    if (!asset) continue;
    assets[assetId] = {
      ...asset,
      status: operationalToAssetStatus(snap.status),
    };
  }

  return {
    ...model,
    assets: { ...model.assets, assets },
    components: model.components.map((component) => {
      const snap = telemetry.byAssetId[component.assetId];
      const cond = condition.latestByAsset[component.assetId];
      let status = component.status;
      const rows = [
        ...component.rows.filter(
          (r) => r.label !== "Live power" && r.label !== "Condition",
        ),
      ];
      if (snap) {
        status = operationalToSitemapStatus(snap.status);
        const power = snap.measurements.activePower;
        if (power != null) {
          rows.unshift({ label: "Live power", value: formatPowerKw(power) });
        }
      }
      if (cond) {
        rows.unshift({
          label: "Condition",
          value: `${conditionLabel(cond.condition)} (${cond.score})`,
        });
        if (cond.condition === "CRITICAL") status = "OFFLINE";
        else if (cond.condition === "DEGRADED" && status === "ONLINE")
          status = "WARNING";
      }
      return { ...component, status, rows };
    }),
  };
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
