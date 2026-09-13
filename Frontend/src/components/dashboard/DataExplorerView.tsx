import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Play,
  RefreshCw,
  Save,
  Search,
  Trash2,
} from "lucide-react";

import type { ProjectDashboardPayload } from "@/lib/api";
import {
  downloadCsv,
  rangeFromPreset,
  type DateRangeValue,
} from "@/lib/chartActions";
import {
  buildExplorerSeries,
  buildTagCatalog,
  loadSavedQueries,
  persistSavedQueries,
  readExplorerConfig,
  seriesColor,
  type ExplorerTag,
  type QueryResolution,
  type SavedQuery,
} from "@/lib/dataExplorerData";
import { usePanelFullscreen } from "@/hooks/usePanelFullscreen";
import { ChartToolbar } from "./ChartToolbar";
import { DateRangePicker } from "./DateRangePicker";
import {
  compactSearchClass,
  iconButtonClass,
  panelClass,
  sectionHintClass,
  sectionTitleClass,
} from "./panel";

type DataExplorerViewProps = {
  data: ProjectDashboardPayload;
};

const WIDTH = 720;
const HEIGHT = 280;
const PAD = { top: 16, right: 16, bottom: 32, left: 44 };

export function DataExplorerView({ data }: DataExplorerViewProps) {
  const config = useMemo(
    () => readExplorerConfig(data.project.id),
    [data.project.id],
  );
  const catalog = useMemo(
    () => buildTagCatalog(data, config),
    [data, config],
  );

  const [now, setNow] = useState(() => new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [tagQuery, setTagQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeValue>(() =>
    rangeFromPreset("today"),
  );
  const [resolution, setResolution] = useState<QueryResolution>("15m");
  const [ran, setRan] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [saved, setSaved] = useState<SavedQuery[]>(() =>
    loadSavedQueries(data.project.id),
  );
  const chartFs = usePanelFullscreen();
  const tableFs = usePanelFullscreen();

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    // Preselect first two generation/power tags for a working default
    const defaults = catalog
      .filter((t) => t.unit === "MW" || t.unit === "W/m²")
      .slice(0, 3)
      .map((t) => t.tag);
    if (defaults.length && selected.length === 0) {
      setSelected(defaults);
      setRan(true);
    }
  }, [catalog]);

  const filteredTags = useMemo(() => {
    const q = tagQuery.trim().toLowerCase();
    return catalog.filter((t) => {
      if (groupFilter !== "all" && t.group !== groupFilter) return false;
      if (!q) return true;
      return (
        t.tag.toLowerCase().includes(q) ||
        t.label.toLowerCase().includes(q) ||
        t.group.toLowerCase().includes(q)
      );
    });
  }, [catalog, groupFilter, tagQuery]);

  const selectedTags = useMemo(
    () =>
      selected
        .map((tag) => catalog.find((t) => t.tag === tag))
        .filter((t): t is ExplorerTag => Boolean(t)),
    [selected, catalog],
  );

  const series = useMemo(() => {
    if (!ran || selectedTags.length === 0) return [];
    return buildExplorerSeries(
      data,
      selectedTags,
      dateRange.start,
      dateRange.end,
      resolution,
      refreshKey,
    );
  }, [data, selectedTags, dateRange, resolution, refreshKey, ran]);

  const chart = useMemo(() => {
    if (series.length === 0 || selectedTags.length === 0) return null;
    const allVals = series.flatMap((p) =>
      selectedTags.map((t) => p.values[t.tag] ?? 0),
    );
    const maxY = Math.max(...allVals, 1);
    const yMax = Math.ceil(maxY * 1.12) || 1;
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const n = Math.max(series.length - 1, 1);
    const toX = (i: number) => PAD.left + (i / n) * innerW;
    const toY = (v: number) => PAD.top + innerH - (v / yMax) * innerH;

    const paths = selectedTags.map((tag, si) => {
      const d = series
        .map((p, i) => {
          const v = p.values[tag.tag] ?? 0;
          return `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`;
        })
        .join(" ");
      return {
        tag,
        color: seriesColor(si),
        d,
        pts: series.map((p, i) => ({
          x: toX(i),
          y: toY(p.values[tag.tag] ?? 0),
          v: p.values[tag.tag] ?? 0,
        })),
      };
    });

    const ticks = [0, 0.5, 1].map((t) => ({
      y: PAD.top + innerH * (1 - t),
      label: Math.round(yMax * t * 10) / 10,
    }));

    return { paths, ticks, toX, baseline: PAD.top + innerH, yMax };
  }, [series, selectedTags]);

  const stamp = now.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  function toggleTag(tag: string) {
    setSelected((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length >= 6
          ? prev
          : [...prev, tag],
    );
  }

  function runQuery() {
    setRan(true);
    setRefreshKey((k) => k + 1);
    setHover(null);
  }

  function refresh() {
    setSpinning(true);
    setRefreshKey((k) => k + 1);
    window.setTimeout(() => setSpinning(false), 650);
  }

  function exportResults() {
    if (series.length === 0) return;
    downloadCsv(`data-explorer-${data.project.id}`, [
      ["Time", ...selectedTags.map((t) => `${t.tag} (${t.unit})`)],
      ...series.map((p) => [
        p.label,
        ...selectedTags.map((t) => String(p.values[t.tag] ?? "")),
      ]),
    ]);
  }

  function saveQuery() {
    if (selected.length === 0) return;
    const next: SavedQuery = {
      id: `q-${Date.now()}`,
      name: `Query ${saved.length + 1} · ${selected.length} tags`,
      tags: [...selected],
      resolution,
      createdAt: new Date().toISOString(),
    };
    const list = [next, ...saved].slice(0, 12);
    setSaved(list);
    persistSavedQueries(data.project.id, list);
  }

  function loadQuery(q: SavedQuery) {
    setSelected(q.tags);
    setResolution(q.resolution);
    setRan(true);
    setRefreshKey((k) => k + 1);
  }

  function removeQuery(id: string) {
    const list = saved.filter((q) => q.id !== id);
    setSaved(list);
    persistSavedQueries(data.project.id, list);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-fg">Data Explorer</h2>
          <p className={sectionHintClass}>
            Ad-hoc historian queries · tag catalog · trends
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs tabular-nums text-muted">{stamp}</span>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            type="button"
            className={iconButtonClass}
            aria-label="Refresh"
            onClick={refresh}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        <MetaTile label="Historian" value={config.historian} />
        <MetaTile
          label="Retention"
          value={`${config.retentionDays} days`}
        />
        <MetaTile
          label="Catalog"
          value={config.catalogReady ? "Ready" : "Pending"}
        />
        <MetaTile label="Tags" value={String(catalog.length)} />
        <MetaTile
          label="Export"
          value={config.exportFormats.join(", ") || "CSV"}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <section className={`${panelClass} xl:col-span-4`}>
          <div className="border-b border-edge px-3 py-2.5">
            <h3 className={sectionTitleClass}>Data catalog</h3>
            <p className={sectionHintClass}>
              Select up to 6 tags · {selected.length} selected
            </p>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-edge px-3 py-2">
            <div className="relative min-w-[140px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                value={tagQuery}
                onChange={(e) => setTagQuery(e.target.value)}
                placeholder="Search tags"
                className={compactSearchClass}
              />
            </div>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="h-8 rounded-md border border-edge-strong bg-input px-2 text-xs text-fg outline-none"
              aria-label="Measurement group"
            >
              <option value="all">All groups</option>
              {config.measurementGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <ul className="max-h-[360px] overflow-auto">
            {filteredTags.map((t) => {
              const on = selected.includes(t.tag);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => toggleTag(t.tag)}
                    className={[
                      "flex w-full items-start gap-2 border-b border-edge/50 px-3 py-2 text-left text-xs transition-colors",
                      on ? "bg-accent/10" : "hover:bg-fill",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border",
                        on
                          ? "border-accent bg-accent text-on-accent"
                          : "border-edge-strong",
                      ].join(" ")}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-fg">{t.tag}</span>
                      <span className="block text-[10px] text-muted">
                        {t.label} · {t.group}
                        {t.unit ? ` · ${t.unit}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] text-muted">
                      {t.quality}
                    </span>
                  </button>
                </li>
              );
            })}
            {filteredTags.length === 0 ? (
              <li className="px-3 py-8 text-center text-xs text-muted">
                No tags match this filter.
              </li>
            ) : null}
          </ul>
        </section>

        <div className="flex flex-col gap-3 xl:col-span-8">
          <section className={panelClass}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-3 py-2.5">
              <div>
                <h3 className={sectionTitleClass}>Query builder</h3>
                <p className={sectionHintClass}>
                  Resolution and range applied on Run
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <select
                  value={resolution}
                  onChange={(e) =>
                    setResolution(e.target.value as QueryResolution)
                  }
                  className="h-8 rounded-md border border-edge-strong bg-input px-2 text-xs text-fg outline-none"
                  aria-label="Resolution"
                >
                  <option value="1m">1 min</option>
                  <option value="5m">5 min</option>
                  <option value="15m">15 min</option>
                  <option value="1h">1 hour</option>
                </select>
                <button
                  type="button"
                  onClick={saveQuery}
                  className={iconButtonClass}
                  title="Save query"
                  aria-label="Save query"
                  disabled={selected.length === 0}
                >
                  <Save className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={runQuery}
                  disabled={selected.length === 0}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-xs font-medium text-on-accent disabled:opacity-40"
                >
                  <Play className="h-3.5 w-3.5" />
                  Run
                </button>
              </div>
            </div>
            {saved.length > 0 ? (
              <div className="flex flex-wrap gap-2 border-b border-edge px-3 py-2">
                {saved.map((q) => (
                  <div
                    key={q.id}
                    className="inline-flex items-center gap-1 rounded-md border border-edge px-2 py-1 text-[10px] text-secondary"
                  >
                    <button
                      type="button"
                      onClick={() => loadQuery(q)}
                      className="hover:text-fg"
                    >
                      {q.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuery(q.id)}
                      className="text-muted hover:text-danger"
                      aria-label={`Delete ${q.name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-1.5 px-3 py-2">
              {selectedTags.length === 0 ? (
                <p className="text-xs text-muted">
                  Pick tags from the catalog, then Run.
                </p>
              ) : (
                selectedTags.map((t, i) => (
                  <span
                    key={t.tag}
                    className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] text-secondary"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: seriesColor(i) }}
                    />
                    {t.tag}
                  </span>
                ))
              )}
            </div>
          </section>

          <section
            ref={chartFs.ref as React.RefObject<HTMLElement>}
            className={`${panelClass} ${chartFs.active ? "overflow-auto bg-page p-3" : ""}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-3 py-2.5">
              <div>
                <h3 className={sectionTitleClass}>Trend</h3>
                <p className={sectionHintClass}>
                  {series.length
                    ? `${series.length} points · ${resolution}`
                    : "No results yet"}
                </p>
              </div>
              <ChartToolbar
                onExport={exportResults}
                onFullscreen={chartFs.toggle}
                fullscreen={chartFs.active}
                exportLabel="Export CSV"
              >
                <button
                  type="button"
                  className={iconButtonClass}
                  onClick={refresh}
                  aria-label="Refresh series"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`}
                  />
                </button>
              </ChartToolbar>
            </div>

            <div className="relative px-2 pt-2">
              {!chart ? (
                <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-sm text-muted">
                  <Database className="h-8 w-8 opacity-40" />
                  Select tags and run a query to plot trends.
                </div>
              ) : (
                <>
                  {hover !== null && series[hover] ? (
                    <div className="pointer-events-none absolute left-3 top-2 z-10 min-w-[150px] rounded-md border border-edge bg-page/95 px-2.5 py-2 text-[11px] shadow-lg">
                      <p className="font-medium text-secondary">
                        {series[hover].label}
                      </p>
                      {chart.paths.map((s) => (
                        <p
                          key={s.tag.tag}
                          className="mt-0.5 flex items-center gap-1.5 text-fg"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.tag.tag}:{" "}
                          <span className="font-semibold tabular-nums">
                            {s.pts[hover]?.v.toFixed(
                              s.tag.unit === "W/m²" ? 0 : 2,
                            )}{" "}
                            {s.tag.unit}
                          </span>
                        </p>
                      ))}
                    </div>
                  ) : null}
                  <svg
                    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                    className="h-auto w-full"
                    role="img"
                    aria-label="Explorer trend chart"
                  >
                    {chart.ticks.map((t) => (
                      <g key={t.label}>
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
                          {t.label}
                        </text>
                      </g>
                    ))}
                    {chart.paths.map((s, idx) => (
                      <motion.path
                        key={`${s.tag.tag}-${refreshKey}`}
                        d={s.d}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={2}
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.85, delay: idx * 0.05 }}
                      />
                    ))}
                    {series.map((p, i) => (
                      <g key={p.time}>
                        {i % Math.ceil(series.length / 6) === 0 ? (
                          <text
                            x={chart.toX(i)}
                            y={HEIGHT - 10}
                            textAnchor="middle"
                            className="fill-subtle"
                            fontSize={8}
                          >
                            {p.label.split(",").pop()?.trim() ?? p.label}
                          </text>
                        ) : null}
                        <rect
                          x={chart.toX(i) - 8}
                          y={PAD.top}
                          width={16}
                          height={chart.baseline - PAD.top}
                          fill="transparent"
                          className="cursor-crosshair"
                          onMouseEnter={() => setHover(i)}
                          onMouseLeave={() => setHover(null)}
                        />
                      </g>
                    ))}
                  </svg>
                </>
              )}
            </div>
          </section>

          <section
            ref={tableFs.ref as React.RefObject<HTMLElement>}
            className={`${panelClass} ${tableFs.active ? "overflow-auto bg-page p-3" : ""}`}
          >
            <div className="flex items-center justify-between border-b border-edge px-3 py-2.5">
              <h3 className={sectionTitleClass}>Results table</h3>
              <ChartToolbar
                onExport={exportResults}
                onFullscreen={tableFs.toggle}
                fullscreen={tableFs.active}
              />
            </div>
            {series.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-muted">
                No rows to display.
              </p>
            ) : (
              <div className="max-h-[280px] overflow-auto">
                <table className="w-full min-w-[520px] border-collapse text-left text-[11px]">
                  <thead className="sticky top-0 bg-surface">
                    <tr className="border-b border-edge text-muted">
                      <th className="px-3 py-2 font-medium">Time</th>
                      {selectedTags.map((t, i) => (
                        <th key={t.tag} className="px-2 py-2 font-medium">
                          <span
                            className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: seriesColor(i) }}
                          />
                          {t.tag}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {series.map((p) => (
                      <tr
                        key={p.time}
                        className="border-b border-edge/60 text-secondary hover:bg-fill/60"
                      >
                        <td className="whitespace-nowrap px-3 py-1.5 tabular-nums">
                          {p.label}
                        </td>
                        {selectedTags.map((t) => (
                          <td
                            key={t.tag}
                            className="px-2 py-1.5 tabular-nums text-fg"
                          >
                            {(p.values[t.tag] ?? 0).toFixed(
                              t.unit === "W/m²" || t.unit === "%" ? 1 : 2,
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <article className={`${panelClass} px-3 py-2.5`}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-fg" title={value}>
        {value}
      </p>
    </article>
  );
}
