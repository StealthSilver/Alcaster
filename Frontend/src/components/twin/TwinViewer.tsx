import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Box, Zap } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { useAssetSelection } from "@/hooks/useAssetSelection";
import type { TwinRecord } from "@/lib/api";
import type { ElectricalPath } from "@/lib/electricalModel";
import { buildPlantTwinModel } from "@/lib/plantTwin";

import { AssetDetailsPanel } from "./AssetDetailsPanel";
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
    if (!tracedPath) return null;
    return new Set(tracedPath.fullPath);
  }, [tracedPath]);

  const electrical = assets.electrical;

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-edge bg-page">
      <div className="absolute inset-0 [&_canvas]:!h-full [&_canvas]:!w-full">
        <TwinErrorBoundary>
          <TwinCanvas
            twin={twin}
            assets={assets}
            selectedAssetId={selectedAssetId}
            focusToken={focusToken}
            highlightedAssetIds={highlightedAssetIds}
            electricalMode={electricalMode}
            onSelectAsset={(assetId) =>
              selectAsset(assetId, { source: "3d", focus3d: false })
            }
          />
        </TwinErrorBoundary>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto absolute left-3 top-3 max-w-[240px] space-y-2 sm:left-4 sm:top-4">
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
        </div>

        <div className="pointer-events-auto absolute right-3 top-3 sm:right-4 sm:top-4">
          <AssetDetailsPanel
            model={assets}
            selectedAssetId={selectedAssetId}
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

        <p className="absolute bottom-3 left-3 text-[11px] text-muted sm:bottom-4 sm:left-4">
          Click an asset · drag to orbit · scroll to zoom
          {electricalMode ? " · electrical connections visible" : ""}
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
