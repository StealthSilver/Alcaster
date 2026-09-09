import { Component, type ReactNode } from "react";
import { Box, Map, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

import type { TwinRecord } from "@/lib/api";
import { projectSitemapPath } from "@/lib/paths";

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
  onRebuild: () => void;
};

export function TwinViewer({ twin, projectName, onRebuild }: TwinViewerProps) {
  const { spec, derived } = twin;

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-edge bg-page">
      <div className="absolute inset-0 [&_canvas]:!h-full [&_canvas]:!w-full">
        <TwinErrorBoundary>
          <TwinCanvas twin={twin} />
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
              {spec.mountingType === "single_axis" ? "Single-axis" : "Fixed tilt"}{" "}
              · {spec.moduleWattageW} W
            </p>
          </div>
          <div className="rounded-xl border border-edge-strong bg-page/90 px-3 py-2.5 backdrop-blur-sm">
            <dl className="space-y-1.5 text-[11px]">
              <Row label="AC / DC" value={`${spec.capacityMw} / ${derived.dcCapacityMwp} MW`} />
              <Row label="Land" value={`${spec.landAreaAcres} acres`} />
              <Row label="Modules" value={derived.moduleCount.toLocaleString()} />
              <Row label="Inverters" value={String(derived.inverterCount)} />
              <Row label="Grid" value={`${spec.gridVoltageKv} kV`} />
            </dl>
          </div>
        </div>

        <div className="pointer-events-auto absolute right-3 top-3 flex flex-col items-end gap-2 sm:right-4 sm:top-4">
          <Link
            to={projectSitemapPath(twin.projectId)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-edge-strong bg-page/90 px-3 py-2 text-xs font-medium text-secondary backdrop-blur-sm transition-colors hover:border-edge-strong hover:text-fg"
          >
            <Map className="h-3.5 w-3.5" />
            Sitemap
          </Link>
          <button
            type="button"
            onClick={onRebuild}
            className="inline-flex items-center gap-1.5 rounded-xl border border-edge-strong bg-page/90 px-3 py-2 text-xs font-medium text-secondary backdrop-blur-sm transition-colors hover:border-edge-strong hover:text-fg"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Edit inputs
          </button>
        </div>

        <p className="absolute bottom-3 left-3 text-[11px] text-muted sm:bottom-4 sm:left-4">
          Drag to orbit · scroll to zoom · dummy spatial model
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
