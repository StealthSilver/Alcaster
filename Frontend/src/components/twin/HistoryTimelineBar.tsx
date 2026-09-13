/**
 * Phase 6 — Historical timeline / playback bar for the Digital Twin.
 */

import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Wrench,
  AlertTriangle,
  Zap,
  Search,
  CircleDot,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { HistoryStoreSnapshot } from "@/lib/historyStore";
import {
  DEMO_HISTORY_LABEL,
  PLAYBACK_SPEEDS,
  formatHistoricalDate,
  formatHistoricalStamp,
  type HistoricalEvent,
  type HistoricalPlaybackSpeed,
  type HistoricalRangePreset,
  type HistoricalSeriesPoint,
} from "@/lib/historyModel";
import {
  formatEnergyKwh,
  formatIrradiance,
  formatPercent,
  formatPowerKw,
  formatTempC,
} from "@/lib/telemetry";

type ChartTab =
  | "power"
  | "energy"
  | "irradiance"
  | "temperature"
  | "availability"
  | "efficiency";

type HistoryTimelineBarProps = {
  state: HistoryStoreSnapshot;
  onSeek: (timestamp: string) => void;
  onPlay: () => void;
  onPause: () => void;
  onStep: (deltaMinutes: number) => void;
  onSpeed: (speed: HistoricalPlaybackSpeed) => void;
  onRangePreset: (
    preset: HistoricalRangePreset,
    custom?: { start: string; end: string },
  ) => void;
  onEventClick: (event: HistoricalEvent) => void;
  onReturnLive: () => void;
};

const RANGE_OPTIONS: { id: HistoricalRangePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last_7_days", label: "Last 7 days" },
  { id: "last_30_days", label: "Last 30 days" },
  { id: "custom", label: "Custom" },
];

export function HistoryTimelineBar({
  state,
  onSeek,
  onPlay,
  onPause,
  onStep,
  onSpeed,
  onRangePreset,
  onEventClick,
  onReturnLive,
}: HistoryTimelineBarProps) {
  const [chartTab, setChartTab] = useState<ChartTab>("power");
  const [customStart, setCustomStart] = useState(DEMO_DAY_INPUT);
  const [customEnd, setCustomEnd] = useState(DEMO_DAY_INPUT);
  const plant = state.snapshot?.plant;
  const weather = state.snapshot?.weather;
  const selectedEvent = state.events.find(
    (e) => e.eventId === state.selectedEventId,
  );

  const rangeStartMs = Date.parse(state.rangeStart);
  const rangeEndMs = Date.parse(state.rangeEnd);
  const span = Math.max(1, rangeEndMs - rangeStartMs);
  const cursorMs = Date.parse(state.timestamp);
  const cursorPct = Math.max(
    0,
    Math.min(100, ((cursorMs - rangeStartMs) / span) * 100),
  );

  const ticks = useMemo(
    () => buildTicks(state.rangeStart, state.rangeEnd, state.timeScale),
    [state.rangeStart, state.rangeEnd, state.timeScale],
  );

  function seekFromClientX(clientX: number, el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const t = rangeStartMs + ratio * span;
    onSeek(new Date(t).toISOString());
  }

  return (
    <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 max-h-[46%] overflow-y-auto overscroll-contain rounded-xl border border-edge-strong bg-page/95 shadow-lg backdrop-blur-md sm:inset-x-4 sm:bottom-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-3 py-2">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
            Historical mode
          </p>
          <p className="truncate text-sm font-semibold tabular-nums text-fg">
            {formatHistoricalStamp(state.timestamp)}
          </p>
          <p className="text-[10px] text-muted">{DEMO_HISTORY_LABEL}</p>
        </div>
        <button
          type="button"
          onClick={onReturnLive}
          className="inline-flex h-8 items-center rounded-md border border-edge-strong bg-fill-strong px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-fg hover:bg-fill"
        >
          Return to live
        </button>
      </div>

      <div className="space-y-2 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                if (opt.id === "custom") {
                  onRangePreset("custom", {
                    start: `${customStart}T00:00:00.000Z`,
                    end: `${customEnd}T23:59:00.000Z`,
                  });
                  return;
                }
                onRangePreset(opt.id);
              }}
              className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                state.rangePreset === opt.id
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:text-fg"
              }`}
            >
              {opt.label}
            </button>
          ))}
          {state.rangePreset === "custom" ? (
            <span className="flex items-center gap-1 text-[10px] text-muted">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded border border-edge bg-page px-1 py-0.5 text-[10px] text-fg"
              />
              <span>–</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded border border-edge bg-page px-1 py-0.5 text-[10px] text-fg"
              />
              <button
                type="button"
                className="rounded bg-fill-strong px-1.5 py-0.5 text-fg"
                onClick={() =>
                  onRangePreset("custom", {
                    start: `${customStart}T00:00:00.000Z`,
                    end: `${customEnd}T23:59:00.000Z`,
                  })
                }
              >
                Apply
              </button>
            </span>
          ) : null}
        </div>

        <div
          className="relative h-10 cursor-pointer select-none"
          onClick={(e) => seekFromClientX(e.clientX, e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") onStep(-1);
            if (e.key === "ArrowRight") onStep(1);
          }}
          role="slider"
          tabIndex={0}
          aria-valuemin={rangeStartMs}
          aria-valuemax={rangeEndMs}
          aria-valuenow={cursorMs}
          aria-label="Historical timeline"
        >
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-fill-strong" />
          {state.events.map((event) => {
            const pct =
              ((Date.parse(event.timestamp) - rangeStartMs) / span) * 100;
            if (pct < 0 || pct > 100) return null;
            return (
              <button
                key={event.eventId}
                type="button"
                title={event.title}
                className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full p-0.5 hover:scale-110"
                style={{ left: `${pct}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
              >
                <EventMarkerIcon type={event.type} />
              </button>
            );
          })}
          <div
            className="absolute top-1/2 z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-page shadow"
            style={{ left: `${cursorPct}%` }}
          />
          <div className="absolute inset-x-0 bottom-0 flex justify-between text-[9px] tabular-nums text-muted">
            {ticks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onStep(-1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-edge-strong text-muted hover:text-fg"
            aria-label="Step backward"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {state.playing ? (
            <button
              type="button"
              onClick={onPause}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-edge-strong bg-fill-strong px-2.5 text-[11px] font-medium text-fg"
            >
              <Pause className="h-3 w-3" />
              Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={onPlay}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-edge-strong bg-fill-strong px-2.5 text-[11px] font-medium text-fg"
            >
              <Play className="h-3 w-3" />
              Play
            </button>
          )}
          <button
            type="button"
            onClick={() => onStep(1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-edge-strong text-muted hover:text-fg"
            aria-label="Step forward"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] text-muted">Speed</span>
          <div className="flex flex-wrap gap-0.5">
            {PLAYBACK_SPEEDS.map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => onSpeed(speed)}
                className={`rounded px-1.5 py-0.5 text-[10px] tabular-nums ${
                  state.speed === speed
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:text-fg"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
          <span className="ml-auto text-[10px] text-muted">
            {formatHistoricalDate(state.timestamp)}
          </span>
        </div>

        {plant ? (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-edge pt-2 text-[11px] sm:grid-cols-4 lg:grid-cols-5">
            <Kpi label="Plant power" value={formatPowerKw(plant.plantPowerKw)} />
            <Kpi
              label="Today energy"
              value={formatEnergyKwh(plant.energyTodayKwh)}
            />
            <Kpi
              label="Availability"
              value={formatPercent(plant.availabilityPct)}
            />
            <Kpi
              label="Efficiency"
              value={formatPercent(plant.efficiencyPct)}
            />
            <Kpi label="GHI" value={formatIrradiance(plant.ghi)} />
            <Kpi
              label="POA"
              value={formatIrradiance(plant.poaIrradiance)}
            />
            <Kpi label="Ambient" value={formatTempC(plant.ambientTempC)} />
            <Kpi label="Module" value={formatTempC(plant.moduleTempC)} />
            <Kpi
              label="Grid export"
              value={formatPowerKw(plant.gridExportKw)}
            />
            <Kpi
              label="Grid"
              value={
                plant.gridStatus === "CONNECTED" ? "Connected" : "Disconnected"
              }
              accent={plant.gridStatus !== "CONNECTED"}
            />
            <Kpi
              label="Wind"
              value={
                weather?.windSpeed != null
                  ? `${weather.windSpeed.toFixed(1)} m/s`
                  : "N/A"
              }
            />
            <Kpi
              label="Humidity"
              value={
                weather?.humidity != null ? `${weather.humidity}%` : "N/A"
              }
            />
          </dl>
        ) : null}

        <div className="border-t border-edge pt-2">
          <div className="mb-1.5 flex flex-wrap gap-1">
            {(
              [
                ["power", "Power"],
                ["energy", "Energy"],
                ["irradiance", "Irradiance"],
                ["temperature", "Temp"],
                ["availability", "Avail"],
                ["efficiency", "Eff"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setChartTab(id)}
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  chartTab === id
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:text-fg"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <MiniSeriesChart
            series={state.series}
            tab={chartTab}
            cursorIso={state.timestamp}
            rangeStartMs={rangeStartMs}
            rangeEndMs={rangeEndMs}
            onSeek={onSeek}
          />
        </div>

        {selectedEvent ? (
          <div className="rounded-lg border border-edge bg-fill/40 px-2.5 py-2 text-[11px]">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
              Event
            </p>
            <p className="mt-0.5 font-semibold text-fg">{selectedEvent.title}</p>
            <p className="text-muted">
              {formatHistoricalStamp(selectedEvent.timestamp)}
              {selectedEvent.assetId ? ` · ${selectedEvent.assetId}` : ""}
            </p>
            {selectedEvent.description ? (
              <p className="mt-1 text-muted">{selectedEvent.description}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const DEMO_DAY_INPUT = "2026-09-12";

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
    <div className="flex justify-between gap-2 sm:block">
      <dt className="text-muted">{label}</dt>
      <dd
        className={`font-medium tabular-nums ${accent ? "text-danger" : "text-fg"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function EventMarkerIcon({ type }: { type: HistoricalEvent["type"] }) {
  const className = "h-3 w-3";
  switch (type) {
    case "FAULT":
      return <AlertTriangle className={`${className} text-[#f07167]`} />;
    case "WARNING":
      return <AlertTriangle className={`${className} text-[#e6740a]`} />;
    case "MAINTENANCE_START":
    case "MAINTENANCE_END":
    case "REPAIR":
    case "REPLACEMENT":
      return <Wrench className={`${className} text-[#7c8db5]`} />;
    case "INSPECTION":
      return <Search className={`${className} text-accent`} />;
    case "GRID_EVENT":
      return <Zap className={`${className} text-[#e6740a]`} />;
    default:
      return <CircleDot className={`${className} text-muted`} />;
  }
}

function buildTicks(
  startIso: string,
  endIso: string,
  scale: HistoryStoreSnapshot["timeScale"],
): string[] {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return ["00:00", "12:00", "23:59"];
  }
  if (scale === "day") {
    return ["00:00", "06:00", "12:00", "18:00", "23:59"];
  }
  if (scale === "week") {
    return ["Day 1", "Day 3", "Day 5", "Day 7"];
  }
  return ["Start", "Mid", "End"];
}

function seriesValue(
  point: HistoricalSeriesPoint,
  tab: ChartTab,
): number {
  switch (tab) {
    case "energy":
      return point.energyTodayKwh;
    case "irradiance":
      return point.irradianceWm2;
    case "temperature":
      return point.ambientTempC;
    case "availability":
      return point.availabilityPct;
    case "efficiency":
      return point.efficiencyPct;
    case "power":
    default:
      return point.powerKw;
  }
}

function MiniSeriesChart({
  series,
  tab,
  cursorIso,
  rangeStartMs,
  rangeEndMs,
  onSeek,
}: {
  series: HistoricalSeriesPoint[];
  tab: ChartTab;
  cursorIso: string;
  rangeStartMs: number;
  rangeEndMs: number;
  onSeek: (timestamp: string) => void;
}) {
  const width = 320;
  const height = 56;
  const values = series.map((p) => seriesValue(p, tab));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const spanY = Math.max(1e-6, max - min);
  const spanX = Math.max(1, rangeEndMs - rangeStartMs);

  const points = series
    .map((p, i) => {
      const x =
        ((Date.parse(p.timestamp) - rangeStartMs) / spanX) * (width - 4) + 2;
      const y = height - 4 - ((values[i]! - min) / spanY) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const cursorX =
    ((Date.parse(cursorIso) - rangeStartMs) / spanX) * (width - 4) + 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-14 w-full cursor-crosshair"
      role="img"
      aria-label={`Historical ${tab} chart`}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left) / rect.width),
        );
        const t = rangeStartMs + ratio * spanX;
        onSeek(new Date(t).toISOString());
      }}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-accent"
        points={points}
      />
      <line
        x1={cursorX}
        x2={cursorX}
        y1={0}
        y2={height}
        stroke="currentColor"
        strokeWidth="1"
        className="text-fg"
        opacity={0.5}
      />
    </svg>
  );
}
