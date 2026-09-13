import {
  CONDITION_COLORS,
  conditionLabel,
  type ConditionStatus,
} from "@/lib/conditionModel";
import type { ConditionStoreState } from "@/lib/conditionStore";
import {
  terrainInspectionContext,
  type TerrainModel,
} from "@/lib/terrainModel";
import {
  weatherInspectionContext,
  type EnvironmentalSnapshot,
} from "@/lib/environmentModel";
import { formatClock } from "@/lib/telemetry";

export type ConditionFilter =
  | "all"
  | "GOOD"
  | "MINOR_ISSUE"
  | "DEGRADED"
  | "CRITICAL"
  | "UNKNOWN";

export type TwinOverlayMode = "plant" | "condition" | "terrain" | "weather";

type ConditionHudProps = {
  state: ConditionStoreState;
  overlay: TwinOverlayMode;
  onOverlay: (mode: TwinOverlayMode) => void;
  conditionFilter: ConditionFilter;
  onConditionFilter: (filter: ConditionFilter) => void;
  environment: EnvironmentalSnapshot | null;
  onSelectAsset: (assetId: string, options?: { focus3d?: boolean }) => void;
};

export function ConditionHud({
  state,
  overlay,
  onOverlay,
  conditionFilter,
  onConditionFilter,
  environment,
  onSelectAsset,
}: ConditionHudProps) {
  const plant = state.plant;
  const counts = plant.counts;
  const openCritical = state.defects
    .filter(
      (d) =>
        (d.status === "OPEN" ||
          d.status === "ACKNOWLEDGED" ||
          d.status === "IN_PROGRESS") &&
        (d.severity === "CRITICAL" || d.severity === "HIGH"),
    )
    .slice(0, 4);

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-edge-strong bg-page/90 p-0.5 backdrop-blur-sm">
        <div className="flex flex-wrap" role="group" aria-label="Overlay mode">
          {(
            [
              ["plant", "Plant"],
              ["condition", "Condition"],
              ["terrain", "Terrain"],
              ["weather", "Weather"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onOverlay(id)}
              className={`flex-1 rounded-lg px-1.5 py-1.5 text-[10px] font-medium ${
                overlay === id
                  ? "bg-fill-strong text-fg"
                  : "text-muted hover:text-fg"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-edge-strong bg-page/90 px-3 py-2.5 backdrop-blur-sm">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
          Plant condition
        </p>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <p className="text-lg font-semibold tabular-nums text-fg">
            {plant.score}
            <span className="text-xs font-medium text-muted"> / 100</span>
          </p>
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]"
            style={{
              color: CONDITION_COLORS[plant.condition],
              background: `${CONDITION_COLORS[plant.condition]}22`,
            }}
          >
            {conditionLabel(plant.condition)}
          </span>
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <CountRow label="Good" value={counts.good} status="GOOD" />
          <CountRow label="Minor" value={counts.minorIssue} status="MINOR_ISSUE" />
          <CountRow label="Degraded" value={counts.degraded} status="DEGRADED" />
          <CountRow label="Critical" value={counts.critical} status="CRITICAL" />
        </dl>
        <p className="mt-2 text-[10px] text-muted">
          Open findings {plant.openFindings}
          {plant.criticalFindings
            ? ` · ${plant.criticalFindings} high/critical`
            : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-1 border-t border-edge pt-2">
          {(
            [
              ["all", "All"],
              ["GOOD", "Good"],
              ["MINOR_ISSUE", "Minor"],
              ["DEGRADED", "Degraded"],
              ["CRITICAL", "Critical"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onConditionFilter(id)}
              className={`rounded px-1.5 py-0.5 text-[10px] ${
                conditionFilter === id
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:text-fg"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted">
          <LegendDot color={CONDITION_COLORS.GOOD} label="Good" />
          <LegendDot color={CONDITION_COLORS.MINOR_ISSUE} label="Minor" />
          <LegendDot color={CONDITION_COLORS.DEGRADED} label="Degraded" />
          <LegendDot color={CONDITION_COLORS.CRITICAL} label="Critical" />
        </div>
      </div>

      {openCritical.length > 0 ? (
        <div className="rounded-xl border border-edge-strong bg-page/90 px-3 py-2 backdrop-blur-sm">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
            Condition findings
          </p>
          <ul className="mt-1.5 max-h-28 space-y-1 overflow-y-auto">
            {openCritical.map((d) => (
              <li key={d.defectId}>
                <button
                  type="button"
                  className="flex w-full flex-col rounded-md px-1.5 py-1 text-left hover:bg-fill"
                  onClick={() =>
                    onSelectAsset(d.assetId, { focus3d: true })
                  }
                >
                  <span className="flex items-center gap-1.5 text-[10px]">
                    <span
                      className="font-semibold uppercase tracking-[0.08em]"
                      style={{
                        color:
                          d.severity === "CRITICAL"
                            ? "#f07167"
                            : "#e6740a",
                      }}
                    >
                      {d.severity}
                    </span>
                    <span className="truncate font-medium text-fg">
                      {d.assetId}
                    </span>
                  </span>
                  <span className="truncate text-[10px] text-muted">
                    {d.description || d.defectType}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {overlay === "terrain" ? (
        <TerrainCard terrain={state.terrain} />
      ) : null}

      {overlay === "weather" && environment ? (
        <WeatherCard environment={environment} />
      ) : null}
    </div>
  );
}

function CountRow({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: ConditionStatus;
}) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="flex items-center gap-1 text-muted">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: CONDITION_COLORS[status] }}
        />
        {label}
      </dt>
      <dd className="font-medium tabular-nums text-fg">{value}</dd>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function TerrainCard({ terrain }: { terrain: TerrainModel }) {
  const hints = terrainInspectionContext(terrain);
  return (
    <div className="rounded-xl border border-edge-strong bg-page/90 px-3 py-2 backdrop-blur-sm">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
        Terrain
      </p>
      <dl className="mt-1.5 space-y-1 text-[11px]">
        <Row label="Type" value={terrain.terrainType.replace(/_/g, " ")} />
        <Row
          label="Elevation"
          value={
            terrain.minElevation != null && terrain.maxElevation != null
              ? `${terrain.minElevation.toFixed(0)}–${terrain.maxElevation.toFixed(0)} m`
              : `${terrain.baseElevation.toFixed(0)} m`
          }
        />
        <Row
          label="Avg slope"
          value={
            terrain.averageSlope != null
              ? `${terrain.averageSlope.toFixed(1)}°`
              : "—"
          }
        />
        <Row label="Surface" value={terrain.surface} />
      </dl>
      {hints.length > 0 ? (
        <ul className="mt-2 space-y-0.5 border-t border-edge pt-2 text-[10px] text-muted">
          {hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function WeatherCard({ environment }: { environment: EnvironmentalSnapshot }) {
  const hints = weatherInspectionContext(environment);
  return (
    <div className="rounded-xl border border-edge-strong bg-page/90 px-3 py-2 backdrop-blur-sm">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
        Weather context
      </p>
      <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        <Row
          label="GHI"
          value={
            environment.ghi != null ? `${Math.round(environment.ghi)} W/m²` : "—"
          }
        />
        <Row
          label="POA"
          value={
            environment.poaIrradiance != null
              ? `${Math.round(environment.poaIrradiance)} W/m²`
              : "—"
          }
        />
        <Row
          label="Ambient"
          value={
            environment.ambientTemperature != null
              ? `${environment.ambientTemperature.toFixed(1)} °C`
              : "—"
          }
        />
        <Row
          label="Module"
          value={
            environment.moduleTemperature != null
              ? `${environment.moduleTemperature.toFixed(1)} °C`
              : "—"
          }
        />
        <Row
          label="Wind"
          value={
            environment.windSpeed != null
              ? `${environment.windSpeed.toFixed(1)} m/s`
              : "—"
          }
        />
        <Row
          label="Humidity"
          value={
            environment.relativeHumidity != null
              ? `${Math.round(environment.relativeHumidity)}%`
              : "—"
          }
        />
        <Row
          label="Cloud"
          value={
            environment.cloudCover != null
              ? `${Math.round(environment.cloudCover)}%`
              : "—"
          }
        />
        <Row
          label="Rain"
          value={
            environment.rainfall != null
              ? `${environment.rainfall.toFixed(1)} mm`
              : "—"
          }
        />
      </dl>
      <p className="mt-1.5 text-[10px] text-muted">
        Updated {formatClock(environment.timestamp)}
      </p>
      {hints.length > 0 ? (
        <ul className="mt-2 space-y-0.5 border-t border-edge pt-2 text-[10px] text-muted">
          {hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[10px] text-muted">
          Context only — not a defect diagnosis
        </p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium tabular-nums text-fg">{value}</dd>
    </div>
  );
}
