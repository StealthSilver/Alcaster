import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Radio,
  RefreshCw,
  Search,
} from "lucide-react";

import type { ProjectDashboardPayload, TwinRecord } from "@/lib/api";
import {
  downloadCsv,
  rangeFromPreset,
  type DateRangeValue,
} from "@/lib/chartActions";
import { usePanelFullscreen } from "@/hooks/usePanelFullscreen";
import {
  buildScadaSnapshot,
  readScadaConfig,
  type ScadaEvent,
} from "@/lib/scadaModel";
import { ChartToolbar } from "./ChartToolbar";
import { DateRangePicker } from "./DateRangePicker";
import {
  compactSearchClass,
  iconButtonClass,
  panelClass,
  sectionTitleClass,
} from "./panel";

type EventsDashboardViewProps = {
  data: ProjectDashboardPayload;
  twin?: TwinRecord | null;
};

type SortKey = "time" | "source" | "message";
type SourceFilter = "all" | "SCADA" | "HMI" | "SYSTEM";

type EventRow = ScadaEvent & {
  category: string;
};

function seed(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h || 1;
}

function mulberry32(a: number) {
  return () => {
    a += 0x6d2b79f5;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildExtraEvents(
  data: ProjectDashboardPayload,
  tick: number,
  range: DateRangeValue,
): EventRow[] {
  const rand = mulberry32(seed(`${data.project.id}:events:${tick}`));
  const templates = [
    ["SYSTEM", "Historian archive flush completed"],
    ["SYSTEM", "Rule engine evaluated plant thresholds"],
    ["SCADA", "Tag quality GOOD across MET-01"],
    ["HMI", "Operator view switched to overview"],
    ["SCADA", "Breaker status poll completed"],
    ["SYSTEM", "Forecast model delta applied"],
  ] as const;

  return Array.from({ length: 6 }, (_, i) => {
    const [source, message] = templates[i % templates.length];
    const at = new Date(range.end);
    at.setMinutes(at.getMinutes() - Math.floor(rand() * 180) - i * 3);
    return {
      id: `evt-extra-${tick}-${i}`,
      time: at.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
      source,
      message,
      category: source,
    };
  });
}

export function EventsDashboardView({
  data,
  twin = null,
}: EventsDashboardViewProps) {
  const config = useMemo(
    () => readScadaConfig(data.project.id),
    [data.project.id],
  );
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [sortAsc, setSortAsc] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeValue>(() =>
    rangeFromPreset("today"),
  );
  const { ref, active, toggle } = usePanelFullscreen();

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    const ms = Math.max(1000, config.pollIntervalSec * 1000);
    const scan = window.setInterval(() => setTick((n) => n + 1), ms);
    return () => window.clearInterval(scan);
  }, [config.pollIntervalSec]);

  const snapshot = useMemo(
    () =>
      buildScadaSnapshot(data, twin, {
        tick,
        config,
        capturedAt: now,
      }),
    [data, twin, tick, config, now],
  );

  const rows = useMemo(() => {
    const fromLive: EventRow[] = snapshot.events.map((event) => ({
      ...event,
      category: event.source === "SCADA" || event.source === "HMI"
        ? event.source
        : "SYSTEM",
    }));
    const extras = buildExtraEvents(data, tick, dateRange);
    return [...fromLive, ...extras];
  }, [snapshot.events, data, tick, dateRange]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((row) => {
      if (sourceFilter !== "all" && row.source !== sourceFilter) return false;
      if (!q) return true;
      return (
        row.message.toLowerCase().includes(q) ||
        row.source.toLowerCase().includes(q) ||
        row.time.includes(q)
      );
    });
    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [rows, query, sourceFilter, sortKey, sortAsc]);

  const scadaCount = rows.filter((r) => r.source === "SCADA").length;
  const hmiCount = rows.filter((r) => r.source === "HMI").length;
  const systemCount = rows.filter(
    (r) => r.source !== "SCADA" && r.source !== "HMI",
  ).length;

  const clock = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function exportEvents() {
    downloadCsv(`events-${data.project.name}`, [
      ["Time", "Source", "Message"],
      ...filtered.map((row) => [row.time, row.source, row.message]),
    ]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-fg">Events</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-edge px-2.5 py-1 text-xs tabular-nums text-secondary">
            <span className="alcaster-live-dot h-1.5 w-1.5 rounded-full bg-success" />
            Live · {clock}
          </span>
          <button
            type="button"
            onClick={() => setTick((n) => n + 1)}
            className={iconButtonClass}
            aria-label="Refresh events"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Total events"
          value={String(rows.length)}
          Icon={Activity}
        />
        <SummaryCard
          label="SCADA"
          value={String(scadaCount)}
          Icon={Radio}
        />
        <SummaryCard
          label="HMI"
          value={String(hmiCount)}
          Icon={Activity}
        />
        <SummaryCard
          label="System"
          value={String(systemCount)}
          Icon={Radio}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
        <section className={`${panelClass} p-4 xl:col-span-1`}>
          <h2 className={sectionTitleClass}>Channels</h2>
          <ul className="mt-3 space-y-2">
            {snapshot.channels.map((channel) => (
              <li
                key={channel.id}
                className="rounded-md border border-edge px-2.5 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium text-fg">
                    {channel.name}
                  </p>
                  <StatusDot status={channel.status} />
                </div>
                <p className="mt-0.5 font-mono text-[10px] text-muted">
                  {channel.protocol} · {channel.latencyMs.toFixed(0)} ms ·{" "}
                  {channel.lastRx}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section
          ref={ref as React.RefObject<HTMLElement>}
          className={`${panelClass} xl:col-span-3 ${active ? "overflow-auto bg-page p-4" : ""}`}
          aria-label="Sequence of events"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-4 py-3">
            <h2 className={sectionTitleClass}>Sequence of events</h2>
            <ChartToolbar
              onExport={exportEvents}
              onFullscreen={toggle}
              fullscreen={active}
            >
              <div className="flex flex-wrap items-center gap-2">
                <label className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search events"
                    className={`${compactSearchClass} w-40 md:w-52`}
                    aria-label="Search events"
                  />
                </label>
                <select
                  value={sourceFilter}
                  onChange={(e) =>
                    setSourceFilter(e.target.value as SourceFilter)
                  }
                  className="h-8 rounded-md border border-edge-strong bg-input px-2 text-xs text-fg outline-none focus:border-accent/50"
                  aria-label="Filter by source"
                >
                  <option value="all">All sources</option>
                  <option value="SCADA">SCADA</option>
                  <option value="HMI">HMI</option>
                  <option value="SYSTEM">SYSTEM</option>
                </select>
              </div>
            </ChartToolbar>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="border-b border-edge text-[10px] uppercase tracking-wide text-muted">
                  {(
                    [
                      ["time", "Time"],
                      ["source", "Source"],
                      ["message", "Event"],
                    ] as const
                  ).map(([key, label]) => (
                    <th key={key} className="px-3 py-2.5 font-medium">
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className="inline-flex items-center gap-1 hover:text-fg"
                      >
                        {label}
                        {sortKey === key ? (
                          sortAsc ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <span className="inline-flex flex-col opacity-40">
                            <ChevronUp className="h-2.5 w-2.5 -mb-1" />
                            <ChevronDown className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-10 text-center text-sm text-muted"
                    >
                      No events match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-edge/60 hover:bg-fill/40"
                    >
                      <td className="px-3 py-2.5 tabular-nums text-secondary">
                        {row.time}
                      </td>
                      <td className="px-3 py-2.5">
                        <SourcePill source={row.source} />
                      </td>
                      <td className="px-3 py-2.5 text-secondary">
                        {row.message}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className={panelClass} aria-label="Recent activity">
        <div className="border-b border-edge px-4 py-3">
          <h2 className={sectionTitleClass}>Recent activity</h2>
        </div>
        {data.activity.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted">No recent activity.</p>
        ) : (
          <ol className="divide-y divide-edge">
            {data.activity.map((item) => (
              <li key={item.id} className="flex gap-4 px-4 py-3">
                <span className="w-14 shrink-0 text-xs tabular-nums text-muted">
                  {item.time}
                </span>
                <span className="text-sm text-secondary">{item.description}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string;
  Icon: typeof Activity;
}) {
  return (
    <motion.div
      layout
      className={`${panelClass} px-4 py-3`}
      initial={{ opacity: 0.6, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
        <Icon className="h-3.5 w-3.5 text-muted" strokeWidth={1.75} />
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-fg">{value}</p>
    </motion.div>
  );
}

function SourcePill({ source }: { source: string }) {
  const tone =
    source === "SCADA"
      ? "border-[#3b82f6]/40 bg-[#3b82f6]/10 text-[#3b82f6]"
      : source === "HMI"
        ? "border-accent/40 bg-accent/10 text-accent"
        : "border-edge bg-fill text-muted";
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${tone}`}
    >
      {source}
    </span>
  );
}

function StatusDot({
  status,
}: {
  status: "CONNECTED" | "DEGRADED" | "DOWN";
}) {
  const color =
    status === "CONNECTED"
      ? "#3dcf8e"
      : status === "DEGRADED"
        ? "#e8a54b"
        : "#e06b75";
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {status}
    </span>
  );
}
