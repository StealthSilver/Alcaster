import {
  activeAlarms,
  formatClock,
  formatEnergyKwh,
  formatIrradiance,
  formatPercent,
  formatPowerKw,
  formatTempC,
  formatWind,
  operationalStatusLabel,
  SCENARIO_LABELS,
  type SimulationScenario,
  type TelemetryStoreSnapshot,
  OPERATIONAL_STATUS_COLOR,
} from "@/lib/telemetry";

type LivePlantHudProps = {
  state: TelemetryStoreSnapshot;
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string, options?: { focus3d?: boolean }) => void;
  onScenario: (scenario: SimulationScenario) => void;
  onPauseToggle: () => void;
  onReset: () => void;
  onForceSelected?: (condition: "fault" | "clear") => void;
  statusFilter: StatusFilter;
  onStatusFilter: (filter: StatusFilter) => void;
};

export type StatusFilter = "all" | "RUNNING" | "WARNING" | "FAULT" | "OFFLINE";

export function LivePlantHud({
  state,
  selectedAssetId,
  onSelectAsset,
  onScenario,
  onPauseToggle,
  onReset,
  onForceSelected,
  statusFilter,
  onStatusFilter,
}: LivePlantHudProps) {
  const plant = state.plant;
  const alarms = activeAlarms(state.alarms).slice(0, 6);
  const inv = state.inverterCounts;

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-edge-strong bg-page/90 px-3 py-2.5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
            <span
              className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--alcaster-success)]"
              aria-hidden
            />
            Live simulation
          </p>
          <p className="text-[10px] tabular-nums text-muted">
            {formatClock(state.lastUpdated)}
          </p>
        </div>
        <p className="mt-1 text-[10px] text-muted">
          Telemetry · Simulated live
          {state.paused ? " · Paused" : ""}
          {state.error ? ` · ${state.error}` : ""}
        </p>

        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
          <Kpi label="Current" value={formatPowerKw(plant.currentPowerKw)} />
          <Kpi label="Today" value={formatEnergyKwh(plant.energyTodayKwh)} />
          <Kpi label="Availability" value={formatPercent(plant.availabilityPct)} />
          <Kpi label="Efficiency" value={formatPercent(plant.efficiencyPct)} />
          <Kpi label="Irradiance" value={formatIrradiance(plant.irradianceWm2)} />
          <Kpi label="Ambient" value={formatTempC(plant.ambientTempC)} />
          <Kpi label="Wind" value={formatWind(plant.windSpeedMs)} />
          <Kpi
            label="Grid"
            value={plant.gridConnected ? "Connected" : "Disconnected"}
            accent={!plant.gridConnected}
          />
        </dl>

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-edge pt-2 text-[10px]">
          <span className="text-muted">
            Health{" "}
            <span
              className="font-semibold uppercase tracking-[0.08em]"
              style={{
                color:
                  plant.health === "CRITICAL"
                    ? "#f07167"
                    : plant.health === "ATTENTION"
                      ? "#e6740a"
                      : "rgba(120, 180, 140, 0.95)",
              }}
            >
              {plant.health}
            </span>
          </span>
          <span className="tabular-nums text-muted">
            Alarms {plant.activeAlarmCount}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-edge-strong bg-page/90 px-3 py-2 backdrop-blur-sm">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
          Inverters
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {(
            [
              ["RUNNING", inv.running],
              ["WARNING", inv.warning],
              ["FAULT", inv.fault],
              ["OFFLINE", inv.offline + inv.unknown],
            ] as const
          ).map(([key, count]) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                onStatusFilter(statusFilter === key ? "all" : key)
              }
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${
                statusFilter === key
                  ? "bg-fill-strong text-fg"
                  : "bg-fill text-muted hover:text-fg"
              }`}
            >
              <span
                className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: OPERATIONAL_STATUS_COLOR[key] }}
              />
              {operationalStatusLabel(key)} {count}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1 border-t border-edge pt-2">
          {(
            [
              ["all", "All"],
              ["RUNNING", "Run"],
              ["WARNING", "Warn"],
              ["FAULT", "Fault"],
              ["OFFLINE", "Off"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onStatusFilter(id)}
              className={`rounded px-1.5 py-0.5 text-[10px] ${
                statusFilter === id
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:text-fg"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-edge-strong bg-page/90 px-3 py-2 backdrop-blur-sm">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
          Active alarms {alarms.length > 0 ? `· ${state.plant.activeAlarmCount}` : ""}
        </p>
        {alarms.length === 0 ? (
          <p className="mt-1.5 text-[11px] text-muted">No active alarms</p>
        ) : (
          <ul className="mt-1.5 max-h-36 space-y-1 overflow-y-auto">
            {alarms.map((alarm) => (
              <li key={alarm.alarmId}>
                <button
                  type="button"
                  className="flex w-full flex-col rounded-md px-1.5 py-1 text-left hover:bg-fill"
                  onClick={() =>
                    onSelectAsset(alarm.assetId, { focus3d: true })
                  }
                >
                  <span className="flex items-center gap-1.5 text-[10px]">
                    <span
                      className="font-semibold uppercase tracking-[0.08em]"
                      style={{
                        color:
                          alarm.severity === "CRITICAL"
                            ? "#f07167"
                            : alarm.severity === "WARNING"
                              ? "#e6740a"
                              : "#94a3b8",
                      }}
                    >
                      {alarm.severity}
                    </span>
                    <span className="truncate font-medium text-fg">
                      {alarm.assetId}
                    </span>
                  </span>
                  <span className="truncate text-[10px] text-muted">
                    {alarm.message}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-edge-strong bg-page/90 px-3 py-2 backdrop-blur-sm">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
          Simulation
        </p>
        <label className="mt-1.5 block text-[10px] text-muted">
          Scenario
          <select
            className="mt-0.5 h-7 w-full rounded-md border border-edge bg-page px-1.5 text-[11px] text-fg outline-none focus:border-accent"
            value={state.scenario}
            onChange={(e) =>
              onScenario(e.target.value as SimulationScenario)
            }
          >
            {(Object.keys(SCENARIO_LABELS) as SimulationScenario[]).map(
              (key) => (
                <option key={key} value={key}>
                  {SCENARIO_LABELS[key]}
                </option>
              ),
            )}
          </select>
        </label>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={onPauseToggle}
            className="rounded-md bg-fill px-2 py-1 text-[10px] font-medium text-fg hover:bg-fill-strong"
          >
            {state.paused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-md bg-fill px-2 py-1 text-[10px] font-medium text-fg hover:bg-fill-strong"
          >
            Reset
          </button>
          {onForceSelected && selectedAssetId ? (
            <>
              <button
                type="button"
                onClick={() => onForceSelected("fault")}
                className="rounded-md bg-danger/10 px-2 py-1 text-[10px] font-medium text-danger hover:bg-danger/20"
                title={`Force FAULT on ${selectedAssetId}`}
              >
                Fault selected
              </button>
              <button
                type="button"
                onClick={() => onForceSelected("clear")}
                className="rounded-md bg-fill px-2 py-1 text-[10px] font-medium text-muted hover:text-fg"
              >
                Clear forced
              </button>
            </>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 border-t border-edge pt-2 text-[10px] text-muted">
          <LegendDot color={OPERATIONAL_STATUS_COLOR.RUNNING} label="Running" />
          <LegendDot color={OPERATIONAL_STATUS_COLOR.WARNING} label="Warning" />
          <LegendDot color={OPERATIONAL_STATUS_COLOR.FAULT} label="Fault" />
          <LegendDot color={OPERATIONAL_STATUS_COLOR.OFFLINE} label="Offline" />
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted">{label}</dt>
      <dd
        className={`font-medium tabular-nums ${
          accent ? "text-danger" : "text-fg"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
