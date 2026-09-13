import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Cloud,
  Droplets,
  LineChart,
  RefreshCw,
  Sun,
  Table2,
  Thermometer,
  Wind,
} from "lucide-react";

import type { ProjectDashboardPayload } from "@/lib/api";
import {
  downloadCsv,
  type DateRangeValue,
} from "@/lib/chartActions";
import {
  buildForecastSeries,
  buildWeatherParamSeries,
  FORECAST_SERIES,
  FORECAST_VIEW_POINTS,
  formatDateKey,
  plantCodeFromName,
  summarizeForecast,
  weatherSnapshotFromSeries,
  type ForecastSeriesId,
} from "@/lib/forecastData";
import { usePanelFullscreen } from "@/hooks/usePanelFullscreen";
import { ChartToolbar } from "./ChartToolbar";
import { DateRangePicker } from "./DateRangePicker";
import {
  iconButtonClass,
  panelClass,
  sectionHintClass,
  sectionTitleClass,
} from "./panel";

type ForecastDashboardViewProps = {
  data: ProjectDashboardPayload;
};

type ChartMode = "line" | "bar" | "table";

const WIDTH = 920;
const HEIGHT = 420;
const PAD = { top: 20, right: 52, bottom: 40, left: 48 };
const VIEW = FORECAST_VIEW_POINTS;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function pathFrom(
  values: number[],
  toX: (i: number) => number,
  toY: (v: number) => number,
) {
  return values
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`,
    )
    .join(" ");
}

function bandPath(
  lows: number[],
  highs: number[],
  toX: (i: number) => number,
  toY: (v: number) => number,
) {
  if (lows.length === 0) return "";
  const up = highs
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`,
    )
    .join(" ");
  const down = [...lows]
    .reverse()
    .map((v, i) => {
      const idx = lows.length - 1 - i;
      return `L ${toX(idx).toFixed(1)} ${toY(v).toFixed(1)}`;
    })
    .join(" ");
  return `${up} ${down} Z`;
}

/** Default: last 3 days so drag-pan has room across periods. */
function defaultForecastRange(): DateRangeValue {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 2);
  return { start, end, preset: "custom" };
}

export function ForecastDashboardView({ data }: ForecastDashboardViewProps) {
  const [dateRange, setDateRange] = useState<DateRangeValue>(defaultForecastRange);
  const [refreshKey, setRefreshKey] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState<ChartMode>("line");
  const [now, setNow] = useState(() => new Date());
  const [enabled, setEnabled] = useState<Record<ForecastSeriesId, boolean>>(
    () =>
      Object.fromEntries(
        FORECAST_SERIES.map((s) => [s.id, true]),
      ) as Record<ForecastSeriesId, boolean>,
  );
  const chartFs = usePanelFullscreen();
  const dragRef = useRef<{ x: number; offset: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const plantCode = plantCodeFromName(data.project.name);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const points = useMemo(
    () =>
      buildForecastSeries(data, dateRange.start, dateRange.end, refreshKey),
    [data, dateRange.start, dateRange.end, refreshKey],
  );
  const weatherSeries = useMemo(
    () =>
      buildWeatherParamSeries(
        data,
        dateRange.start,
        dateRange.end,
        refreshKey,
      ),
    [data, dateRange.start, dateRange.end, refreshKey],
  );

  const maxOffset = Math.max(0, points.length - VIEW);

  useEffect(() => {
    setOffset(maxOffset);
    setHover(null);
  }, [dateRange.start, dateRange.end, maxOffset, refreshKey]);

  const visible = useMemo(
    () => points.slice(offset, offset + VIEW),
    [points, offset],
  );

  const summary = useMemo(() => summarizeForecast(visible), [visible]);
  const liveWeather = useMemo(
    () => weatherSnapshotFromSeries(weatherSeries, data.weather),
    [weatherSeries, data.weather],
  );

  const chart = useMemo(() => {
    const mwIds = FORECAST_SERIES.filter(
      (s) => s.axis === "mw" && enabled[s.id],
    ).map((s) => s.id);
    const mwValues = visible.flatMap((p) => [
      ...mwIds.map((id) => p[id]),
      enabled.forecast ? p.bandHigh : 0,
      enabled.forecast ? p.bandLow : 0,
    ]);
    const maxMw = Math.max(...mwValues, 1);
    const maxIrr = Math.max(...visible.map((p) => p.irradiance), 1);
    const yMax = Math.ceil(maxMw * 1.12);
    const irrMax = Math.ceil((maxIrr * 1.08) / 100) * 100;

    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const n = Math.max(visible.length - 1, 1);
    const toX = (i: number) => PAD.left + (i / n) * innerW;
    const toY = (v: number) => PAD.top + innerH - (v / yMax) * innerH;
    const toIrr = (v: number) => PAD.top + innerH - (v / irrMax) * innerH;

    const seriesPaths = FORECAST_SERIES.filter((s) => enabled[s.id]).map(
      (s) => {
        const vals = visible.map((p) => p[s.id]);
        const yFn = s.axis === "irr" ? toIrr : toY;
        return {
          ...s,
          d: pathFrom(vals, toX, yFn),
          pts: vals.map((v, i) => ({ x: toX(i), y: yFn(v), v })),
          vals,
        };
      },
    );

    const band = enabled.forecast
      ? bandPath(
          visible.map((p) => p.bandLow),
          visible.map((p) => p.bandHigh),
          toX,
          toY,
        )
      : "";

    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      y: PAD.top + innerH * (1 - t),
      mw: Math.round(yMax * t),
      irr: Math.round(irrMax * t),
    }));

    const xLabels = [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const i = Math.min(visible.length - 1, Math.round(t * n));
      return { i, x: toX(i), label: visible[i]?.label ?? "" };
    });

    return {
      toX,
      yMax,
      irrMax,
      baseline: PAD.top + innerH,
      seriesPaths,
      band,
      ticks,
      xLabels,
      innerW,
    };
  }, [visible, enabled]);

  const stamp = now.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const windowLabel =
    visible.length > 0
      ? `${visible[0].label} → ${visible[visible.length - 1].label}`
      : "—";

  function onDateRangeChange(next: DateRangeValue) {
    setDateRange(next);
  }

  function refresh() {
    setSpinning(true);
    setHover(null);
    setRefreshKey((k) => k + 1);
    window.setTimeout(() => setSpinning(false), 650);
  }

  function exportCsv() {
    downloadCsv(
      `forecast-${formatDateKey(dateRange.start)}-${formatDateKey(dateRange.end)}`,
      [
        [
          "Time",
          ...FORECAST_SERIES.map((s) => s.label),
          "Band Low (MW)",
          "Band High (MW)",
        ],
        ...points.map((p) => [
          p.label,
          ...FORECAST_SERIES.map((s) => String(p[s.id])),
          String(p.bandLow),
          String(p.bandHigh),
        ]),
      ],
    );
  }

  function exportWeatherCsv() {
    downloadCsv(
      `weather-params-${formatDateKey(dateRange.start)}-${formatDateKey(dateRange.end)}`,
      [
        [
          "Time",
          "GHI W/m²",
          "POA W/m²",
          "Temp °C",
          "Wind km/h",
          "Humidity %",
          "Cloud %",
        ],
        ...weatherSeries.map((p) => [
          p.label,
          String(p.ghi),
          String(p.poa),
          String(p.temperatureC),
          String(p.windKmh),
          String(p.humidityPct),
          String(p.cloudCoverPct),
        ]),
      ],
    );
  }

  function beginDrag(clientX: number) {
    dragRef.current = { x: clientX, offset };
    setDragging(true);
    setHover(null);
  }

  function moveDrag(clientX: number) {
    if (!dragRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const plotW = rect.width * (chart.innerW / WIDTH);
    if (plotW <= 0) return;
    const pxPerPoint = plotW / Math.max(VIEW - 1, 1);
    const delta = Math.round((dragRef.current.x - clientX) / pxPerPoint);
    setOffset(clamp(dragRef.current.offset + delta, 0, maxOffset));
  }

  function endDrag() {
    dragRef.current = null;
    setDragging(false);
  }

  const weatherCards = [
    {
      label: "GHI",
      value: liveWeather.irradianceWm2,
      unit: "W/m²",
      Icon: Sun,
      hint: "Global horizontal",
    },
    {
      label: "Temperature",
      value: liveWeather.temperatureC,
      unit: "°C",
      Icon: Thermometer,
      hint: "Ambient",
    },
    {
      label: "Wind",
      value: liveWeather.windKmh,
      unit: "km/h",
      Icon: Wind,
      hint: "Site anemometer",
    },
    {
      label: "Cloud cover",
      value: liveWeather.cloudCoverPct,
      unit: "%",
      Icon: Cloud,
      hint: "WMS estimate",
    },
    {
      label: "Humidity",
      value:
        weatherSeries.find((p) => p.ghi > 50)?.humidityPct ??
        weatherSeries[weatherSeries.length - 1]?.humidityPct ??
        48,
      unit: "%",
      Icon: Droplets,
      hint: "Relative",
    },
    {
      label: "POA",
      value:
        weatherSeries.find((p) => p.poa > 50)?.poa ??
        Math.round(liveWeather.irradianceWm2 * 1.08),
      unit: "W/m²",
      Icon: Sun,
      hint: "Plane of array",
    },
  ];

  const canPan = maxOffset > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-fg">Forecast</h2>
          <p className={sectionHintClass}>
            Forecast &amp; Scheduling · drag chart to pan time · date range
            picker
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs tabular-nums text-muted">{stamp}</span>
          <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
          <select
            className="h-8 rounded-md border border-edge bg-surface px-2 text-[11px] font-medium text-secondary outline-none focus:border-accent/50"
            defaultValue={plantCode}
            aria-label="Plant site"
          >
            <option value={plantCode}>{plantCode}</option>
            <option value="DEMO-SOLAR-01">DEMO-SOLAR-01</option>
            <option value="DEMO-SOLAR-02">DEMO-SOLAR-02</option>
          </select>
          <button
            type="button"
            className={iconButtonClass}
            aria-label="Refresh forecast"
            title="Refresh"
            onClick={refresh}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {weatherCards.map((c) => (
          <article key={c.label} className={`${panelClass} px-3 py-2.5`}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                {c.label}
              </p>
              <c.Icon className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
            </div>
            <p className="mt-1.5 text-lg font-semibold tabular-nums text-fg">
              {typeof c.value === "number" && c.value % 1 !== 0
                ? c.value.toFixed(1)
                : c.value}
              <span className="ml-1 text-[10px] font-medium text-muted">
                {c.unit}
              </span>
            </p>
            <p className="mt-0.5 text-[10px] text-muted">{c.hint}</p>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <SummaryTile
          label="Peak actual"
          value={`${summary.peakMw.toFixed(1)} MW`}
        />
        <SummaryTile
          label="Window energy"
          value={`${summary.energyMwh.toFixed(1)} MWh`}
        />
        <SummaryTile
          label="vs forecast"
          value={`${summary.vsActualPct >= 0 ? "+" : ""}${summary.vsActualPct}%`}
        />
        <SummaryTile
          label="Peak GHI"
          value={`${summary.peakIrradiance} W/m²`}
        />
        <SummaryTile
          label="Schedule compliance"
          value={`${summary.scheduleCompliancePct.toFixed(1)}%`}
        />
        <SummaryTile
          label="Twin Δ"
          value={`${summary.twinDeltaMw >= 0 ? "+" : ""}${summary.twinDeltaMw} MW`}
        />
      </div>

      <section
        ref={chartFs.ref as React.RefObject<HTMLElement>}
        className={`${panelClass} ${chartFs.active ? "overflow-auto bg-page p-3" : ""}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-3 py-2.5">
          <div>
            <h3 className={sectionTitleClass}>Generation forecast</h3>
            <p className={sectionHintClass}>
              {windowLabel}
              {canPan ? " · drag to pan" : ""}
            </p>
          </div>
          <ChartToolbar
            onExport={exportCsv}
            onFullscreen={chartFs.toggle}
            fullscreen={chartFs.active}
            exportLabel="Export forecast CSV"
          >
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              compact
            />
            <button
              type="button"
              className={[
                iconButtonClass,
                mode === "line" ? "border-accent/50 text-fg" : "",
              ].join(" ")}
              title="Line chart"
              aria-label="Line chart"
              aria-pressed={mode === "line"}
              onClick={() => setMode("line")}
            >
              <LineChart className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={[
                iconButtonClass,
                mode === "bar" ? "border-accent/50 text-fg" : "",
              ].join(" ")}
              title="Bar chart"
              aria-label="Bar chart"
              aria-pressed={mode === "bar"}
              onClick={() => setMode("bar")}
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={[
                iconButtonClass,
                mode === "table" ? "border-accent/50 text-fg" : "",
              ].join(" ")}
              title="Table view"
              aria-label="Table view"
              aria-pressed={mode === "table"}
              onClick={() => setMode("table")}
            >
              <Table2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={iconButtonClass}
              title="Export weather CSV"
              aria-label="Export weather CSV"
              onClick={exportWeatherCsv}
            >
              <Cloud className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={iconButtonClass}
              title="Refresh"
              aria-label="Refresh chart"
              onClick={refresh}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`}
              />
            </button>
          </ChartToolbar>
        </div>

        {mode === "table" ? (
          <div className="max-h-[480px] overflow-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-[11px]">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-edge text-muted">
                  <th className="px-3 py-2 font-medium">Time</th>
                  {FORECAST_SERIES.map((s) => (
                    <th key={s.id} className="px-2 py-2 font-medium">
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr
                    key={p.time}
                    className="border-b border-edge/60 text-secondary hover:bg-fill/60"
                  >
                    <td className="whitespace-nowrap px-3 py-1.5 tabular-nums">
                      {p.label}
                    </td>
                    {FORECAST_SERIES.map((s) => (
                      <td
                        key={s.id}
                        className="px-2 py-1.5 tabular-nums"
                        style={{ color: s.color }}
                      >
                        {s.axis === "irr"
                          ? p[s.id].toFixed(0)
                          : p[s.id].toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="relative px-2 pt-2">
            {hover !== null && visible[hover] && !dragging ? (
              <div className="pointer-events-none absolute left-3 top-2 z-10 max-h-[70%] min-w-[180px] overflow-auto rounded-md border border-edge bg-page/95 px-2.5 py-2 text-[11px] shadow-lg backdrop-blur-sm">
                <p className="font-medium text-secondary">
                  {visible[hover].label}
                </p>
                {FORECAST_SERIES.filter((s) => enabled[s.id]).map((s) => (
                  <p
                    key={s.id}
                    className="mt-0.5 flex items-center gap-1.5 text-fg"
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="min-w-0 truncate">{s.label}</span>
                    <span className="ml-auto font-semibold tabular-nums">
                      {s.axis === "irr"
                        ? `${visible[hover][s.id].toFixed(0)} W/m²`
                        : `${visible[hover][s.id].toFixed(2)} MW`}
                    </span>
                  </p>
                ))}
              </div>
            ) : null}

            <svg
              ref={svgRef}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className={`h-auto w-full touch-none select-none ${
                dragging ? "cursor-grabbing" : canPan ? "cursor-grab" : "cursor-crosshair"
              }`}
              role="img"
              aria-label="Generation forecast chart — drag to pan time"
              onPointerDown={(e) => {
                if (e.button !== 0 || !canPan) return;
                (e.currentTarget as SVGSVGElement).setPointerCapture(
                  e.pointerId,
                );
                beginDrag(e.clientX);
              }}
              onPointerMove={(e) => {
                if (dragRef.current) moveDrag(e.clientX);
              }}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <text
                x={14}
                y={HEIGHT / 2}
                textAnchor="middle"
                className="fill-subtle"
                fontSize={10}
                transform={`rotate(-90 14 ${HEIGHT / 2})`}
              >
                MW
              </text>
              <text
                x={WIDTH - 12}
                y={HEIGHT / 2}
                textAnchor="middle"
                className="fill-subtle"
                fontSize={10}
                transform={`rotate(90 ${WIDTH - 12} ${HEIGHT / 2})`}
              >
                W/m²
              </text>

              {chart.ticks.map((t) => (
                <g key={`${t.mw}-${t.irr}`}>
                  <line
                    x1={PAD.left}
                    x2={WIDTH - PAD.right}
                    y1={t.y}
                    y2={t.y}
                    stroke="color-mix(in srgb, var(--alcaster-fg) 6%, transparent)"
                  />
                  <text
                    x={PAD.left - 8}
                    y={t.y + 3}
                    textAnchor="end"
                    className="fill-subtle"
                    fontSize={9}
                  >
                    {t.mw}
                  </text>
                  <text
                    x={WIDTH - PAD.right + 8}
                    y={t.y + 3}
                    textAnchor="start"
                    className="fill-subtle"
                    fontSize={9}
                  >
                    {t.irr}
                  </text>
                </g>
              ))}

              {chart.band ? (
                <path
                  d={chart.band}
                  fill="color-mix(in srgb, var(--alcaster-fg) 7%, transparent)"
                  stroke="none"
                />
              ) : null}

              {mode === "bar"
                ? chart.seriesPaths
                    .filter((s) => s.axis === "mw")
                    .flatMap((s, si) => {
                      const group = chart.seriesPaths.filter(
                        (x) => x.axis === "mw",
                      ).length;
                      const barW = Math.max(
                        1.5,
                        ((WIDTH - PAD.left - PAD.right) /
                          Math.max(visible.length, 1) -
                          2) /
                          group,
                      );
                      return s.pts.map((pt, i) => (
                        <rect
                          key={`${s.id}-${i}`}
                          x={pt.x - (group * barW) / 2 + si * barW}
                          y={pt.y}
                          width={barW}
                          height={Math.max(0, chart.baseline - pt.y)}
                          fill={s.color}
                          opacity={0.85}
                        />
                      ));
                    })
                : null}

              {mode === "line"
                ? chart.seriesPaths.map((s, idx) => (
                    <motion.path
                      key={`${s.id}-${refreshKey}-${offset}`}
                      d={s.d}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={s.axis === "irr" ? 1.75 : 2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={
                        dragging
                          ? false
                          : { pathLength: 0, opacity: 0 }
                      }
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{
                        duration: dragging ? 0 : 0.45,
                        delay: dragging ? 0 : idx * 0.02,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  ))
                : chart.seriesPaths
                    .filter((s) => s.axis === "irr")
                    .map((s) => (
                      <path
                        key={`${s.id}-irr-overlay`}
                        d={s.d}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={1.75}
                      />
                    ))}

              {mode === "line"
                ? chart.seriesPaths.map((s) =>
                    s.pts
                      .filter((_, i) => i % 3 === 0)
                      .map((pt, i) => (
                        <circle
                          key={`${s.id}-m-${i}`}
                          cx={pt.x}
                          cy={pt.y}
                          r={2.2}
                          fill="var(--alcaster-page)"
                          stroke={s.color}
                          strokeWidth={1.4}
                        />
                      )),
                  )
                : null}

              {chart.xLabels.map((x) => (
                <text
                  key={x.i}
                  x={x.x}
                  y={HEIGHT - 12}
                  textAnchor="middle"
                  className="fill-subtle"
                  fontSize={8}
                >
                  {x.label}
                </text>
              ))}

              {/* Hit layer for hover (ignored while dragging) */}
              {!dragging
                ? visible.map((_, i) => (
                    <rect
                      key={`hit-${i}`}
                      x={chart.toX(i) - 8}
                      y={PAD.top}
                      width={16}
                      height={chart.baseline - PAD.top}
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                    />
                  ))
                : null}

              {hover !== null && !dragging ? (
                <line
                  x1={chart.toX(hover)}
                  x2={chart.toX(hover)}
                  y1={PAD.top}
                  y2={chart.baseline}
                  stroke="color-mix(in srgb, var(--alcaster-fg) 20%, transparent)"
                  strokeDasharray="3 3"
                />
              ) : null}
            </svg>

            <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1 pt-1">
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
                {FORECAST_SERIES.map((s) => {
                  const on = enabled[s.id];
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        setEnabled((prev) => ({
                          ...prev,
                          [s.id]: !prev[s.id],
                        }))
                      }
                      className={[
                        "inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-[10px] transition-opacity",
                        on ? "text-secondary" : "text-muted opacity-40",
                      ].join(" ")}
                      title={on ? `Hide ${s.label}` : `Show ${s.label}`}
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full border"
                        style={{
                          backgroundColor: on ? s.color : "transparent",
                          borderColor: s.color,
                        }}
                      />
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={offset <= 0}
                  onClick={() => setOffset((o) => Math.max(0, o - 8))}
                  className="rounded border border-edge px-2 py-0.5 text-[10px] text-muted disabled:opacity-30 hover:text-fg"
                  aria-label="Pan earlier"
                  title="Earlier"
                >
                  ‹
                </button>
                <span className="min-w-[64px] text-center text-[10px] tabular-nums text-muted">
                  {offset + 1}–{Math.min(offset + VIEW, points.length)} /{" "}
                  {points.length}
                </span>
                <button
                  type="button"
                  disabled={offset >= maxOffset}
                  onClick={() =>
                    setOffset((o) => Math.min(maxOffset, o + 8))
                  }
                  className="rounded border border-edge px-2 py-0.5 text-[10px] text-muted disabled:opacity-30 hover:text-fg"
                  aria-label="Pan later"
                  title="Later"
                >
                  ›
                </button>
                <button
                  type="button"
                  disabled={!canPan}
                  onClick={() => setOffset(0)}
                  className="rounded border border-edge px-2 py-0.5 text-[10px] text-muted disabled:opacity-30 hover:text-fg"
                  title="Jump to start"
                >
                  Start
                </button>
                <button
                  type="button"
                  disabled={!canPan}
                  onClick={() => setOffset(maxOffset)}
                  className="rounded border border-edge px-2 py-0.5 text-[10px] text-muted disabled:opacity-30 hover:text-fg"
                  title="Jump to end"
                >
                  End
                </button>
              </div>
            </div>

            <p className="pb-3 text-center text-[11px] text-muted">
              Note : All Value In MW · Drag chart or use ‹ › to move across
              time
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <article className={`${panelClass} px-3 py-2.5`}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-fg">{value}</p>
    </article>
  );
}
