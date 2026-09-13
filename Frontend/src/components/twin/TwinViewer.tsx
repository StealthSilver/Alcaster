import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Box, Maximize2, Minimize2, Zap } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { iconButtonClass } from "@/components/dashboard/panel";
import { useAssetSelection } from "@/hooks/useAssetSelection";
import {
  assetsWithOpenDefects,
  conditionMapFromStore,
  useConditionTwin,
} from "@/hooks/useConditionTwin";
import {
  statusMapFromTelemetry,
  useLiveTelemetry,
} from "@/hooks/useLiveTelemetry";
import { usePanelFullscreen } from "@/hooks/usePanelFullscreen";
import type { TwinRecord } from "@/lib/api";
import type { ElectricalPath } from "@/lib/electricalModel";
import { environmentFromWeatherTelemetry } from "@/lib/environmentModel";
import { buildPlantTwinModel } from "@/lib/plantTwin";
import { activeAlarms, type AssetOperationalStatus } from "@/lib/telemetry";

import { AssetDetailsPanel } from "./AssetDetailsPanel";
import {
  ConditionHud,
  type ConditionFilter,
  type TwinOverlayMode,
} from "./ConditionHud";
import { LivePlantHud, type StatusFilter } from "./LivePlantHud";
import { TwinCanvas } from "./TwinCanvas";

class TwinErrorBoundary extends Component<
  { children: ReactNode },
  { message: string | null }
> {
  state = { message: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }

  render() {
    if (this.state.message) {
      return (
        <div className="flex h-full items-center justify-center bg-page px-6">
          <p
            role="alert"
            className="rounded-md border border-danger/25 bg-danger/10 px-4 py-3 text-center text-sm text-danger"
          >
            {this.state.message}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

type TwinViewerProps = {
  twin: TwinRecord;
  projectName: string;
};

export function TwinViewer({ twin, projectName }: TwinViewerProps) {
  const { spec, derived } = twin;
  const intake = spec.intake;
  const assets = useMemo(() => buildPlantTwinModel(twin), [twin]);
  const { selectedAssetId, selectAsset, focusToken } = useAssetSelection(
    twin.projectId,
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const hydratedUrl = useRef(false);
  const [electricalMode, setElectricalMode] = useState(false);
  const [tracedPath, setTracedPath] = useState<ElectricalPath | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [conditionFilter, setConditionFilter] =
    useState<ConditionFilter>("all");
  const [overlay, setOverlay] = useState<TwinOverlayMode>("plant");
  const { state: telemetry, controls: telemetryControls } = useLiveTelemetry(
    twin,
    assets,
    true,
  );
  const { state: condition, controls: conditionControls } = useConditionTwin(
    twin,
    assets,
    true,
  );
  const statusByAssetId = useMemo(
    () => statusMapFromTelemetry(telemetry),
    [telemetry],
  );
  const conditionByAssetId = useMemo(
    () => conditionMapFromStore(condition),
    [condition],
  );
  const defectAssetIds = useMemo(
    () => assetsWithOpenDefects(condition),
    [condition],
  );
  const mergedTelemetry = useMemo(() => {
    const alarms = [
      ...telemetry.alarms.map((a) => ({
        ...a,
        source: a.source ?? ("TELEMETRY" as const),
      })),
      ...condition.alarms,
    ];
    return {
      ...telemetry,
      alarms,
      plant: {
        ...telemetry.plant,
        activeAlarmCount: activeAlarms(alarms).length,
      },
    };
  }, [telemetry, condition.alarms]);

  const environment = useMemo(() => {
    const weatherId = assets.order.find(
      (id) => assets.assets[id]?.assetType === "WEATHER_STATION",
    );
    const snap = weatherId ? telemetry.byAssetId[weatherId] : null;
    if (!snap) {
      return environmentFromWeatherTelemetry(
        {
          irradiance: telemetry.plant.irradianceWm2,
          temperature: telemetry.plant.ambientTempC,
          windSpeed: telemetry.plant.windSpeedMs,
        },
        {
          cloudCover: Math.max(
            0,
            Math.min(100, 100 - telemetry.plant.irradianceWm2 / 10),
          ),
          rainfall: 0,
        },
        telemetry.plant.timestamp,
      );
    }
    return environmentFromWeatherTelemetry(
      snap.measurements,
      {
        cloudCover: Math.max(
          0,
          Math.min(100, 100 - (snap.measurements.irradiance ?? 0) / 10),
        ),
        rainfall: 0,
        atmosphericPressure: 1013,
      },
      snap.timestamp,
    );
  }, [assets, telemetry]);

  const filteredHighlightIds = useMemo(() => {
    if (statusFilter !== "all") {
      const set = new Set<string>();
      for (const [id, snap] of Object.entries(telemetry.byAssetId)) {
        const status = snap.status as AssetOperationalStatus;
        if (statusFilter === "OFFLINE") {
          if (status === "OFFLINE" || status === "UNKNOWN") set.add(id);
        } else if (status === statusFilter) {
          set.add(id);
        }
      }
      return set;
    }
    if (conditionFilter !== "all") {
      const set = new Set<string>();
      for (const [id, c] of Object.entries(conditionByAssetId)) {
        if (c === conditionFilter) set.add(id);
      }
      return set;
    }
    return null;
  }, [
    statusFilter,
    conditionFilter,
    telemetry.byAssetId,
    conditionByAssetId,
  ]);
  const {
    ref: fullscreenRef,
    active: fullscreen,
    toggle: toggleFullscreen,
  } = usePanelFullscreen();

  useEffect(() => {
    if (hydratedUrl.current) return;
    const fromUrl = searchParams.get("asset");
    if (!fromUrl) {
      hydratedUrl.current = true;
      return;
    }
    if (assets.assets[fromUrl]) {
      selectAsset(fromUrl, { source: "external", focus3d: true });
      hydratedUrl.current = true;
      const next = new URLSearchParams(searchParams);
      next.delete("asset");
      setSearchParams(next, { replace: true });
    }
  }, [assets.assets, searchParams, selectAsset, setSearchParams]);

  useEffect(() => {
    setTracedPath(null);
  }, [twin.id]);

  const highlightedAssetIds = useMemo(() => {
    if (tracedPath) return new Set(tracedPath.fullPath);
    return filteredHighlightIds;
  }, [tracedPath, filteredHighlightIds]);

  const electrical = assets.electrical;

  return (
    <div
      ref={fullscreenRef as React.RefObject<HTMLDivElement>}
      className={`relative min-h-0 flex-1 overflow-hidden border border-edge bg-page ${
        fullscreen ? "h-screen w-screen rounded-none" : "rounded-2xl"
      }`}
    >
      <div className="absolute inset-0 [&_canvas]:!h-full [&_canvas]:!w-full">
        <TwinErrorBoundary>
          <TwinCanvas
            twin={twin}
            assets={assets}
            selectedAssetId={selectedAssetId}
            focusToken={focusToken}
            highlightedAssetIds={highlightedAssetIds}
            electricalMode={electricalMode}
            statusByAssetId={statusByAssetId}
            conditionByAssetId={
              overlay === "condition" || conditionFilter !== "all"
                ? conditionByAssetId
                : null
            }
            defectAssetIds={defectAssetIds}
            terrain={condition.terrain}
            overlayMode={overlay}
            onSelectAsset={(assetId) =>
              selectAsset(assetId, { source: "3d", focus3d: false })
            }
          />
        </TwinErrorBoundary>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto absolute left-3 top-3 max-h-[calc(100%-5rem)] max-w-[240px] space-y-2 overflow-y-auto overscroll-contain sm:left-4 sm:top-4">
          <div className="rounded-xl border border-edge-strong bg-page/90 px-3 py-2.5 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
              <Box className="h-3 w-3" />
              Digital twin
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-fg">
              {projectName}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              {intake?.mountingKind === "dual_axis"
                ? "Dual-axis"
                : intake?.mountingKind === "fixed_tilt" ||
                    spec.mountingType === "fixed_tilt"
                  ? "Fixed tilt"
                  : "Single-axis"}{" "}
              · {intake?.moduleRatedPowerW || spec.moduleWattageW} W
            </p>
          </div>
          <div className="rounded-xl border border-edge-strong bg-page/90 px-3 py-2.5 backdrop-blur-sm">
            <dl className="space-y-1.5 text-[11px]">
              <Row
                label="AC / DC"
                value={`${intake?.plantAcCapacity || spec.capacityMw} / ${intake?.plantDcCapacity || derived.dcCapacityMwp} MW`}
              />
              <Row label="Blocks" value={String(assets.counts.blocks)} />
              <Row
                label="Tables"
                value={assets.counts.tables.toLocaleString()}
              />
              <Row
                label="Modules"
                value={assets.counts.modules.toLocaleString()}
              />
              <Row
                label="Strings"
                value={(electrical?.counts.strings ?? assets.counts.strings).toLocaleString()}
              />
              <Row
                label="Inverters"
                value={String(assets.counts.inverters)}
              />
            </dl>
          </div>
          <div className="rounded-xl border border-edge-strong bg-page/90 p-0.5 backdrop-blur-sm">
            <div className="flex" role="group" aria-label="View mode">
              <button
                type="button"
                onClick={() => setElectricalMode(false)}
                className={`flex-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
                  !electricalMode
                    ? "bg-fill-strong text-fg"
                    : "text-muted hover:text-fg"
                }`}
              >
                Physical
              </button>
              <button
                type="button"
                onClick={() => setElectricalMode(true)}
                className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
                  electricalMode
                    ? "bg-fill-strong text-fg"
                    : "text-muted hover:text-fg"
                }`}
              >
                <Zap className="h-3 w-3" />
                Electrical
              </button>
            </div>
          </div>
          <LivePlantHud
            state={mergedTelemetry}
            selectedAssetId={selectedAssetId}
            statusFilter={statusFilter}
            onStatusFilter={(filter) => {
              setStatusFilter(filter);
              if (filter !== "all") setConditionFilter("all");
            }}
            onSelectAsset={(assetId, options) =>
              selectAsset(assetId, {
                source: "search",
                focus3d: options?.focus3d ?? true,
              })
            }
            onScenario={(scenario) => telemetryControls.setScenario(scenario)}
            onPauseToggle={() =>
              telemetryControls.setPaused(!telemetry.paused)
            }
            onReset={() => telemetryControls.resetSimulation()}
            onForceSelected={(condition) => {
              if (!selectedAssetId) return;
              telemetryControls.forceAssetCondition(selectedAssetId, condition);
            }}
          />
          <ConditionHud
            state={condition}
            overlay={overlay}
            onOverlay={setOverlay}
            conditionFilter={conditionFilter}
            onConditionFilter={(filter) => {
              setConditionFilter(filter);
              if (filter !== "all") setStatusFilter("all");
            }}
            environment={environment}
            onSelectAsset={(assetId, options) =>
              selectAsset(assetId, {
                source: "search",
                focus3d: options?.focus3d ?? true,
              })
            }
          />
        </div>

        <div className="pointer-events-auto absolute right-3 top-3 flex max-h-[calc(100%-5rem)] flex-col items-end gap-2 overflow-y-auto overscroll-contain sm:right-4 sm:top-4">
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

          <AssetDetailsPanel
            model={assets}
            selectedAssetId={selectedAssetId}
            tracedPath={tracedPath}
            telemetry={
              selectedAssetId
                ? telemetry.byAssetId[selectedAssetId] ?? null
                : null
            }
            telemetryConnection={telemetry.connection}
            conditionState={condition}
            onAddInspection={(input) => {
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

        <p className="pointer-events-none absolute bottom-3 left-3 max-w-[min(100%,28rem)] text-[11px] text-muted sm:bottom-4 sm:left-4">
          Click an asset · drag to orbit · scroll to zoom
          {electricalMode ? " · electrical connections visible" : ""}
          {overlay === "condition" ? " · condition overlay" : ""}
          {overlay === "terrain" ? " · terrain overlay" : ""}
          {overlay === "weather" ? " · weather overlay" : ""}
          {fullscreen ? " · Esc exits full screen" : ""}
        </p>
      </div>
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
