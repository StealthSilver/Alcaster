import { Search, X, Zap, Activity, ClipboardCheck } from "lucide-react";
import { useMemo, useState } from "react";

import {
  assetDetailRows,
  assetTypeLabel,
  searchAssets,
  type Asset,
  type AssetModel,
  type AssetStatus,
} from "@/lib/assetModel";
import {
  CONDITION_COLORS,
  conditionLabel,
  defectsForAsset,
  searchDefects,
  type ConditionRecord,
  type AssetDefect,
} from "@/lib/conditionModel";
import type { ConditionStoreState } from "@/lib/conditionStore";
import {
  getElectricalPath,
  getImmediateDownstream,
  getImmediateUpstream,
  searchElectricalAssets,
  type ElectricalPath,
} from "@/lib/electricalModel";
import {
  INSPECTION_TYPE_LABELS,
  latestInspection,
  searchInspections,
  type InspectionCondition,
  type InspectionType,
} from "@/lib/inspectionModel";
import {
  formatClock,
  formatCurrent,
  formatEnergyKwh,
  formatFrequency,
  formatIrradiance,
  formatPercent,
  formatPowerFactor,
  formatPowerKw,
  formatRelativeAge,
  formatTempC,
  formatVoltage,
  formatWind,
  operationalStatusLabel,
  operationalToAssetStatus,
  OPERATIONAL_STATUS_COLOR,
  type TelemetryConnectionState,
  type TelemetrySnapshot,
} from "@/lib/telemetry";

const statusColor: Record<AssetStatus, string> = {
  operational: "rgba(120, 180, 140, 0.95)",
  warning: "#e6740a",
  fault: "#f07167",
  offline: "#f07167",
  unknown: "#94a3b8",
};

type AssetDetailsPanelProps = {
  model: AssetModel;
  selectedAssetId: string | null;
  onSelect: (assetId: string | null, options?: { focus3d?: boolean }) => void;
  showSearch?: boolean;
  showCounts?: boolean;
  onTracePath?: (path: ElectricalPath | null) => void;
  tracedPath?: ElectricalPath | null;
  telemetry?: TelemetrySnapshot | null;
  telemetryConnection?: TelemetryConnectionState;
  /** Phase 5 condition / inspection bundle */
  conditionState?: ConditionStoreState | null;
  onAddInspection?: (input: {
    assetId: string;
    inspectionType: InspectionType;
    inspectionDate: string;
    condition: InspectionCondition;
    notes?: string;
    finding?: string;
  }) => { ok: boolean; error?: string };
};

export function AssetDetailsPanel({
  model,
  selectedAssetId,
  onSelect,
  showSearch = true,
  showCounts = true,
  onTracePath,
  tracedPath,
  telemetry = null,
  telemetryConnection,
  conditionState = null,
  onAddInspection,
}: AssetDetailsPanelProps) {
  const [query, setQuery] = useState("");
  const [showIssues, setShowIssues] = useState(false);
  const [showAddInspection, setShowAddInspection] = useState(false);
  const [inspType, setInspType] = useState<InspectionType>("VISUAL");
  const [inspCondition, setInspCondition] =
    useState<InspectionCondition>("GOOD");
  const [inspNotes, setInspNotes] = useState("");
  const [inspFinding, setInspFinding] = useState("");
  const [inspError, setInspError] = useState<string | null>(null);
  const asset = selectedAssetId ? model.assets[selectedAssetId] ?? null : null;
  const rows = asset ? assetDetailRows(asset, model) : plantCountRows(model);
  const electrical = model.electrical;

  const conditionRecord: ConditionRecord | null =
    asset && conditionState
      ? conditionState.latestByAsset[asset.assetId] ?? null
      : null;
  const assetDefects: AssetDefect[] =
    asset && conditionState
      ? defectsForAsset(conditionState.defects, asset.assetId)
      : [];
  const lastInsp =
    asset && conditionState
      ? latestInspection(conditionState.inspections, asset.assetId)
      : null;

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const physical = searchAssets(model, query, 6);
    const elec = searchElectricalAssets(model, query, 6);
    const seen = new Set(physical.map((a) => a.assetId));
    const merged = [...physical];
    for (const hit of elec) {
      if (seen.has(hit.assetId)) continue;
      const existing = model.assets[hit.assetId];
      if (existing) merged.push(existing);
      else {
        merged.push({
          assetId: hit.assetId,
          assetType: hit.assetType as Asset["assetType"],
          name: hit.name,
          plantId: model.plantId,
          children: [],
          status: "operational",
          metadata: {},
        });
      }
      if (merged.length >= 8) break;
    }
    // Phase 5: inspection / finding search → resolve to assets
    if (conditionState && merged.length < 8) {
      for (const insp of searchInspections(conditionState.inspections, query, 4)) {
        if (seen.has(insp.assetId)) continue;
        const existing = model.assets[insp.assetId];
        if (existing) {
          seen.add(insp.assetId);
          merged.push(existing);
        }
        if (merged.length >= 8) break;
      }
      for (const def of searchDefects(conditionState.defects, query, 4)) {
        if (seen.has(def.assetId)) continue;
        const existing = model.assets[def.assetId];
        if (existing) {
          seen.add(def.assetId);
          merged.push(existing);
        }
        if (merged.length >= 8) break;
      }
    }
    return merged;
  }, [model, query, conditionState]);

  const upstream = useMemo(() => {
    if (!asset || !electrical) return [];
    return getImmediateUpstream(electrical, asset.assetId);
  }, [asset, electrical]);

  const downstream = useMemo(() => {
    if (!asset || !electrical) return [];
    return getImmediateDownstream(electrical, asset.assetId);
  }, [asset, electrical]);

  const pathActive =
    tracedPath && asset && tracedPath.assetId === asset.assetId
      ? tracedPath
      : null;

  function handleTrace() {
    if (!asset || !electrical) return;
    if (pathActive) {
      onTracePath?.(null);
      return;
    }
    const path = getElectricalPath(electrical, asset.assetId);
    onTracePath?.(path);
  }

  const validation = electrical?.validation;

  return (
    <div className="flex w-[236px] flex-col gap-2">
      {showSearch ? (
        <div className="rounded-xl border border-edge-strong bg-page/90 px-2.5 py-2 backdrop-blur-sm">
          <label className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
            <Search className="h-3 w-3" />
            Asset search
          </label>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="INV-001, STR-002…"
            className="mt-1.5 h-8 w-full rounded-md border border-edge bg-page px-2 text-xs text-fg outline-none focus:border-accent"
          />
          {results.length > 0 ? (
            <ul className="mt-1.5 max-h-40 overflow-y-auto border-t border-edge pt-1.5">
              {results.map((item) => (
                <li key={item.assetId}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded-md px-1.5 py-1 text-left text-[11px] hover:bg-fill"
                    onClick={() => {
                      onSelect(item.assetId, { focus3d: true });
                      setQuery(item.assetId);
                    }}
                  >
                    <span className="truncate font-medium text-fg">{item.assetId}</span>
                    <span className="shrink-0 text-muted">
                      {assetTypeLabel(item.assetType)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="max-h-[min(58vh,480px)] overflow-y-auto rounded-xl border border-edge-strong bg-page/90 px-3 py-2.5 backdrop-blur-sm">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg">
              {asset?.assetId ?? "Plant assets"}
            </p>
            <p className="text-[11px] text-muted">
              {asset ? assetTypeLabel(asset.assetType) : "Overview"}
            </p>
          </div>
          {asset ? (
            <div className="flex shrink-0 items-center gap-1">
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
                style={{
                  color: telemetry
                    ? OPERATIONAL_STATUS_COLOR[telemetry.status] ??
                      statusColor[operationalToAssetStatus(telemetry.status)]
                    : statusColor[asset.status],
                  background: `${
                    telemetry
                      ? OPERATIONAL_STATUS_COLOR[telemetry.status] ??
                        statusColor[operationalToAssetStatus(telemetry.status)]
                      : statusColor[asset.status]
                  }22`,
                }}
              >
                {telemetry
                  ? operationalStatusLabel(telemetry.status)
                  : asset.status}
              </span>
              <button
                type="button"
                aria-label="Clear selection"
                className="rounded-md p-0.5 text-muted hover:bg-fill hover:text-fg"
                onClick={() => {
                  onTracePath?.(null);
                  onSelect(null);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </div>
        <dl className="space-y-1.5 border-t border-edge pt-2 text-[11px]">
          {rows.map((row) => (
            <div key={`${row.label}-${row.value}`} className="flex justify-between gap-3">
              <dt className="text-muted">{row.label}</dt>
              <dd className="max-w-[58%] truncate text-right font-medium tabular-nums text-fg">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        {asset && telemetry ? (
          <div className="mt-3 border-t border-edge pt-2">
            <p className="mb-1.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-accent">
              <Activity className="h-3 w-3" />
              Live
            </p>
            <dl className="space-y-1.5 text-[11px]">
              {liveTelemetryRows(telemetry).map((row) => (
                <div
                  key={`${row.label}-${row.value}`}
                  className="flex justify-between gap-3"
                >
                  <dt className="text-muted">{row.label}</dt>
                  <dd className="max-w-[58%] truncate text-right font-medium tabular-nums text-fg">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[10px] text-muted">
              Telemetry {telemetry.quality}
              {telemetryConnection === "simulated"
                ? " · Simulated"
                : telemetryConnection
                  ? ` · ${telemetryConnection}`
                  : ""}
              {" · "}
              {formatRelativeAge(telemetry.timestamp)}
            </p>
          </div>
        ) : null}

        {asset && conditionState ? (
          <div className="mt-3 border-t border-edge pt-2">
            <p className="mb-1.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-accent">
              <ClipboardCheck className="h-3 w-3" />
              Condition
            </p>
            <dl className="space-y-1.5 text-[11px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Status</dt>
                <dd
                  className="font-medium"
                  style={{
                    color:
                      CONDITION_COLORS[conditionRecord?.condition ?? "UNKNOWN"],
                  }}
                >
                  {conditionLabel(conditionRecord?.condition ?? "UNKNOWN")}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Score</dt>
                <dd className="font-medium tabular-nums text-fg">
                  {conditionRecord?.score ?? "—"} / 100
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Last inspection</dt>
                <dd className="font-medium tabular-nums text-fg">
                  {lastInsp
                    ? new Date(lastInsp.inspectionDate).toLocaleDateString()
                    : "—"}
                </dd>
              </div>
              {lastInsp ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Type</dt>
                  <dd className="font-medium text-fg">
                    {INSPECTION_TYPE_LABELS[lastInsp.inspectionType]}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Open findings</dt>
                <dd className="font-medium tabular-nums text-fg">
                  {assetDefects.length}
                </dd>
              </div>
            </dl>
            {assetDefects.length > 0 ? (
              <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto border-t border-edge pt-2 text-[10px]">
                {assetDefects.slice(0, 5).map((d) => (
                  <li key={d.defectId}>
                    <span
                      className="font-semibold uppercase tracking-[0.08em]"
                      style={{
                        color:
                          d.severity === "CRITICAL" || d.severity === "HIGH"
                            ? "#f07167"
                            : d.severity === "MEDIUM"
                              ? "#e6740a"
                              : "#94a3b8",
                      }}
                    >
                      {d.severity}
                    </span>{" "}
                    <span className="text-fg">
                      {d.description || d.defectType}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[10px] text-muted">No open findings</p>
            )}
            {onAddInspection ? (
              <div className="mt-2">
                <button
                  type="button"
                  className="w-full rounded-md bg-fill px-2 py-1.5 text-[11px] font-medium text-fg hover:bg-fill-strong"
                  onClick={() => {
                    setShowAddInspection((v) => !v);
                    setInspError(null);
                  }}
                >
                  {showAddInspection ? "Cancel inspection" : "Add inspection"}
                </button>
                {showAddInspection ? (
                  <div className="mt-2 space-y-1.5 rounded-md border border-edge bg-fill/40 p-2">
                    <label className="block text-[10px] text-muted">
                      Type
                      <select
                        className="mt-0.5 h-7 w-full rounded border border-edge bg-page px-1 text-[11px] text-fg"
                        value={inspType}
                        onChange={(e) =>
                          setInspType(e.target.value as InspectionType)
                        }
                      >
                        {Object.entries(INSPECTION_TYPE_LABELS).map(
                          ([k, label]) => (
                            <option key={k} value={k}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                    <label className="block text-[10px] text-muted">
                      Condition
                      <select
                        className="mt-0.5 h-7 w-full rounded border border-edge bg-page px-1 text-[11px] text-fg"
                        value={inspCondition}
                        onChange={(e) =>
                          setInspCondition(
                            e.target.value as InspectionCondition,
                          )
                        }
                      >
                        {(
                          [
                            "GOOD",
                            "MINOR_ISSUE",
                            "DEGRADED",
                            "CRITICAL",
                            "UNKNOWN",
                          ] as InspectionCondition[]
                        ).map((c) => (
                          <option key={c} value={c}>
                            {conditionLabel(c)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <input
                      value={inspFinding}
                      onChange={(e) => setInspFinding(e.target.value)}
                      placeholder="Finding (optional)"
                      className="h-7 w-full rounded border border-edge bg-page px-1.5 text-[11px] text-fg"
                    />
                    <input
                      value={inspNotes}
                      onChange={(e) => setInspNotes(e.target.value)}
                      placeholder="Notes (optional)"
                      className="h-7 w-full rounded border border-edge bg-page px-1.5 text-[11px] text-fg"
                    />
                    {inspError ? (
                      <p className="text-[10px] text-danger">{inspError}</p>
                    ) : null}
                    <button
                      type="button"
                      className="w-full rounded-md bg-accent/15 px-2 py-1.5 text-[11px] font-medium text-accent"
                      onClick={() => {
                        if (!asset || !onAddInspection) return;
                        const result = onAddInspection({
                          assetId: asset.assetId,
                          inspectionType: inspType,
                          inspectionDate: new Date().toISOString(),
                          condition: inspCondition,
                          notes: inspNotes || undefined,
                          finding: inspFinding || undefined,
                        });
                        if (!result.ok) {
                          setInspError(result.error ?? "Failed");
                          return;
                        }
                        setShowAddInspection(false);
                        setInspNotes("");
                        setInspFinding("");
                        setInspError(null);
                      }}
                    >
                      Save inspection
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
            {telemetry && conditionRecord ? (
              <p className="mt-2 text-[10px] text-muted">
                Operational {operationalStatusLabel(telemetry.status)} ·
                Condition {conditionLabel(conditionRecord.condition)} — separate
              </p>
            ) : null}
          </div>
        ) : null}

        {asset && electrical && !electrical.error ? (
          <div className="mt-3 border-t border-edge pt-2">
            <p className="mb-1.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-accent">
              <Zap className="h-3 w-3" />
              Electrical
            </p>
            <p className="mb-1 text-[10px] text-muted">Upstream</p>
            <AssetIdList
              ids={upstream}
              empty="—"
              onSelect={(id) => onSelect(id, { focus3d: true })}
            />
            <p className="mb-1 mt-2 text-[10px] text-muted">Downstream</p>
            <AssetIdList
              ids={downstream}
              empty="—"
              onSelect={(id) => onSelect(id, { focus3d: true })}
            />
            <p className="mt-2 text-[10px] text-muted">
              Connections: {upstream.length} up · {downstream.length} down
            </p>
            <button
              type="button"
              onClick={handleTrace}
              className={`mt-2 w-full rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
                pathActive
                  ? "bg-accent/15 text-accent"
                  : "bg-fill text-fg hover:bg-fill-strong"
              }`}
            >
              {pathActive ? "Clear electrical path" : "Trace electrical path"}
            </button>
            {pathActive ? (
              <ol className="mt-2 max-h-36 space-y-0.5 overflow-y-auto border-t border-edge pt-2 text-[10px]">
                {pathActive.fullPath.map((id, index) => (
                  <li key={`${id}-${index}`} className="flex items-center gap-1">
                    {index > 0 ? (
                      <span className="w-3 text-center text-muted">↓</span>
                    ) : (
                      <span className="w-3" />
                    )}
                    <button
                      type="button"
                      className={`truncate font-medium hover:text-accent ${
                        id === asset.assetId ? "text-accent" : "text-fg"
                      }`}
                      onClick={() => onSelect(id, { focus3d: true })}
                    >
                      {id}
                    </button>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        ) : null}

        {showCounts && !asset && electrical ? (
          <div className="mt-3 border-t border-edge pt-2">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
              Electrical configuration
            </p>
            <dl className="space-y-1 text-[11px]">
              <CountRow label="Strings" value={electrical.counts.strings} />
              <CountRow label="Combiners" value={electrical.counts.combiners} />
              <CountRow label="Inverters" value={electrical.counts.inverters} />
              <CountRow
                label="Transformers"
                value={electrical.counts.transformers}
              />
              <CountRow label="MV feeders" value={electrical.counts.feeders} />
              <CountRow
                label="Substations"
                value={electrical.counts.substations}
              />
              <CountRow
                label="Grid"
                value={electrical.counts.gridConnections}
              />
            </dl>
            {validation ? (
              <div className="mt-2 rounded-md bg-fill/60 px-2 py-1.5 text-[10px]">
                <p className="font-medium text-fg">Electrical validation</p>
                <p className="mt-0.5 text-muted">
                  {validation.assetCount.toLocaleString()} nodes ·{" "}
                  {validation.validConnections.toLocaleString()} connections
                </p>
                <p className="mt-0.5 text-muted">
                  Warnings: {validation.warnings.length} · Errors:{" "}
                  {validation.errors.length}
                </p>
                {validation.errors.length + validation.warnings.length > 0 ? (
                  <button
                    type="button"
                    className="mt-1 text-accent hover:underline"
                    onClick={() => setShowIssues((v) => !v)}
                  >
                    {showIssues ? "Hide issues" : "View issues"}
                  </button>
                ) : (
                  <p className="mt-1 text-[color:var(--alcaster-success)]">
                    Topology OK
                  </p>
                )}
                {showIssues ? (
                  <ul className="mt-1 max-h-28 space-y-1 overflow-y-auto">
                    {[...validation.errors, ...validation.warnings]
                      .slice(0, 12)
                      .map((issue, index) => (
                        <li key={`${issue.code}-${index}`}>
                          <button
                            type="button"
                            className="text-left text-fg hover:text-accent"
                            onClick={() => {
                              if (issue.assetId) {
                                onSelect(issue.assetId, { focus3d: true });
                              }
                            }}
                          >
                            <span className="text-muted">{issue.severity}: </span>
                            {issue.message}
                          </button>
                        </li>
                      ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {showCounts && !asset ? (
          <p className="mt-2 text-[10px] text-muted">
            Counts are derived from the asset model.
          </p>
        ) : null}
        {model.error ? (
          <p className="mt-2 text-[11px] text-danger">{model.error}</p>
        ) : null}
        {electrical?.error ? (
          <p className="mt-2 text-[11px] text-danger">{electrical.error}</p>
        ) : null}
      </div>
    </div>
  );
}

function AssetIdList({
  ids,
  empty,
  onSelect,
}: {
  ids: string[];
  empty: string;
  onSelect: (id: string) => void;
}) {
  if (ids.length === 0) {
    return <p className="text-[11px] text-muted">{empty}</p>;
  }
  return (
    <ul className="flex flex-wrap gap-1">
      {ids.slice(0, 8).map((id) => (
        <li key={id}>
          <button
            type="button"
            className="rounded bg-fill px-1.5 py-0.5 text-[10px] font-medium text-fg hover:bg-fill-strong hover:text-accent"
            onClick={() => onSelect(id)}
          >
            {id}
          </button>
        </li>
      ))}
      {ids.length > 8 ? (
        <li className="text-[10px] text-muted">+{ids.length - 8}</li>
      ) : null}
    </ul>
  );
}

function CountRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium tabular-nums text-fg">
        {value.toLocaleString()}
      </dd>
    </div>
  );
}

function plantCountRows(model: AssetModel) {
  const c = model.counts;
  return [
    { label: "Blocks", value: String(c.blocks) },
    { label: "Tables", value: c.tables.toLocaleString() },
    { label: "Modules", value: c.modules.toLocaleString() },
    { label: "Strings", value: c.strings.toLocaleString() },
    { label: "Combiners", value: String(c.combiners) },
    { label: "Inverters", value: String(c.inverters) },
    { label: "Transformers", value: String(c.transformers) },
    { label: "MV feeders", value: String(c.feeders) },
    { label: "Substations", value: String(c.substations) },
    { label: "Buildings", value: String(c.buildings) },
    { label: "Weather", value: String(c.weatherStations) },
    { label: "Roads", value: String(c.roads) },
    { label: "Fence", value: String(c.fences) },
    { label: "Gates", value: String(c.gates) },
  ];
}

function liveTelemetryRows(
  snap: TelemetrySnapshot,
): Array<{ label: string; value: string }> {
  const m = snap.measurements;
  const rows: Array<{ label: string; value: string }> = [
    { label: "Status", value: operationalStatusLabel(snap.status) },
  ];
  if (m.activePower != null)
    rows.push({ label: "AC Power", value: formatPowerKw(m.activePower) });
  if (m.dcPower != null)
    rows.push({ label: "DC Power", value: formatPowerKw(m.dcPower) });
  if (m.dcVoltage != null)
    rows.push({ label: "DC Voltage", value: formatVoltage(m.dcVoltage) });
  if (m.dcCurrent != null)
    rows.push({ label: "DC Current", value: formatCurrent(m.dcCurrent) });
  if (m.acVoltage != null)
    rows.push({ label: "AC Voltage", value: formatVoltage(m.acVoltage) });
  if (m.acCurrent != null)
    rows.push({ label: "AC Current", value: formatCurrent(m.acCurrent) });
  if (m.voltage != null && m.acVoltage == null)
    rows.push({ label: "Voltage", value: formatVoltage(m.voltage) });
  if (m.current != null && m.acCurrent == null)
    rows.push({ label: "Current", value: formatCurrent(m.current) });
  if (m.temperature != null)
    rows.push({ label: "Temperature", value: formatTempC(m.temperature) });
  if (m.efficiency != null)
    rows.push({ label: "Efficiency", value: formatPercent(m.efficiency) });
  if (m.energyToday != null)
    rows.push({ label: "Today", value: formatEnergyKwh(m.energyToday) });
  if (m.loadPercent != null)
    rows.push({ label: "Load", value: formatPercent(m.loadPercent) });
  if (m.irradiance != null)
    rows.push({ label: "GHI", value: formatIrradiance(m.irradiance) });
  if (m.poaIrradiance != null)
    rows.push({ label: "POA", value: formatIrradiance(m.poaIrradiance) });
  if (m.windSpeed != null)
    rows.push({ label: "Wind", value: formatWind(m.windSpeed) });
  if (m.frequency != null)
    rows.push({ label: "Frequency", value: formatFrequency(m.frequency) });
  if (m.powerFactor != null)
    rows.push({ label: "PF", value: formatPowerFactor(m.powerFactor) });
  if (m.gridConnected != null)
    rows.push({
      label: "Grid",
      value: m.gridConnected ? "Connected" : "Disconnected",
    });
  if (m.breakerClosed != null)
    rows.push({
      label: "Breaker",
      value: m.breakerClosed ? "Closed" : "Open",
    });
  if (m.exportPower != null)
    rows.push({ label: "Export", value: formatPowerKw(m.exportPower) });
  rows.push({ label: "Last update", value: formatClock(snap.timestamp) });
  rows.push({ label: "Quality", value: snap.quality });
  return rows;
}

export function assetSummary(asset: Asset | null) {
  if (!asset) return null;
  return `${asset.assetId} · ${assetTypeLabel(asset.assetType)}`;
}
