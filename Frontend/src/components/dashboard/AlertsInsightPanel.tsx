import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronDown, ChevronUp, Menu } from "lucide-react";

import type { OperationalAlert, Project } from "@/lib/api";
import {
  daysBetween,
  downloadCsv,
  formatDisplayRange,
  type DateRangeValue,
} from "@/lib/chartActions";
import { usePanelFullscreen } from "@/hooks/usePanelFullscreen";
import { ChartToolbar } from "./ChartToolbar";
import { DateRangePicker } from "./DateRangePicker";
import { panelClass, sectionTitleClass } from "./panel";

type AlertsInsightPanelProps = {
  project: Project;
  alerts: OperationalAlert[];
  dateRange: DateRangeValue;
  onDateRangeChange: (next: DateRangeValue) => void;
  ranking: {
    name: string;
    paPct: number;
    prPct: number;
    yieldMwhPerMwp: number;
  }[];
};

type AlarmTab = "alarms" | "heatmap" | "ranking";
type HeatMetric = "pa" | "pr" | "yield" | "cuf";
type SortKey =
  | "plant"
  | "block"
  | "device"
  | "description"
  | "start"
  | "duration"
  | "status";

type AlarmRow = {
  id: string;
  plant: string;
  block: string;
  device: string;
  description: string;
  startTime: string;
  duration: string;
  status: "OPEN" | "CLOSE";
  plantType: string;
};

const TABS: { id: AlarmTab; label: string }[] = [
  { id: "alarms", label: "Alarm Logs" },
  { id: "heatmap", label: "Heatmap" },
  { id: "ranking", label: "Plant Ranking" },
];

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

function buildAlarmRows(
  project: Project,
  alerts: OperationalAlert[],
  range: DateRangeValue,
): AlarmRow[] {
  const rand = mulberry32(seed(`${project.id}:alarms:${range.start.toISOString()}`));
  const blocks = ["Block A", "Block B", "Block C", "North Yard", "South Yard"];
  const devices = [
    "INV-01",
    "INV-04",
    "INV-12",
    "MET-01",
    "TRF-02",
    "CB-07",
  ];
  const descriptions = [
    "Inverter high DC voltage",
    "String underperformance",
    "Communication timeout",
    "Transformer oil temp high",
    "Grid under-frequency",
    "Pyranometer dirty glass",
    "Breaker trip — feeder 2",
  ];

  const fromAlerts: AlarmRow[] = alerts.map((alert, i) => {
    const open = alert.severity !== "info" && rand() > 0.35;
    const start = new Date(range.end);
    start.setHours(8 + (i % 8), (i * 7) % 60, 0, 0);
    const mins = open ? 15 + Math.floor(rand() * 180) : Math.floor(rand() * 40);
    const hh = String(Math.floor(mins / 60)).padStart(2, "0");
    const mm = String(mins % 60).padStart(2, "0");
    return {
      id: alert.id,
      plant: alert.plant || project.name,
      block: blocks[i % blocks.length],
      device: devices[i % devices.length],
      description: alert.title,
      startTime: start.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      duration: `${hh}:${mm}`,
      status: open ? "OPEN" : "CLOSE",
      plantType: project.type,
    };
  });

  const extras = Array.from({ length: Math.max(0, 4 - fromAlerts.length) }, (_, i) => {
    const open = rand() > 0.55;
    const start = new Date(range.end);
    start.setDate(start.getDate() - Math.floor(rand() * Math.max(1, daysBetween(range.start, range.end))));
    start.setHours(6 + Math.floor(rand() * 10), Math.floor(rand() * 60), 0, 0);
    const mins = open ? 20 + Math.floor(rand() * 200) : Math.floor(rand() * 25);
    return {
      id: `gen-${i}`,
      plant: project.name,
      block: blocks[Math.floor(rand() * blocks.length)],
      device: devices[Math.floor(rand() * devices.length)],
      description: descriptions[Math.floor(rand() * descriptions.length)],
      startTime: start.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      duration: `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`,
      status: (open ? "OPEN" : "CLOSE") as "OPEN" | "CLOSE",
      plantType: project.type,
    };
  });

  return [...fromAlerts, ...extras];
}

function buildTimeline(
  project: Project,
  range: DateRangeValue,
  metric: HeatMetric,
) {
  const days = Math.min(45, Math.max(7, daysBetween(range.start, range.end) + 1));
  const rand = mulberry32(seed(`${project.id}:${metric}:${days}`));
  const cells: { date: Date; value: number }[] = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(range.end);
    d.setDate(range.end.getDate() - (days - 1 - i));
    const base =
      metric === "pa"
        ? 92
        : metric === "pr"
          ? 80
          : metric === "cuf"
            ? 22
            : 3.6;
    const jitter =
      metric === "yield" ? (rand() - 0.5) * 1.2 : (rand() - 0.5) * 12;
    cells.push({ date: d, value: Math.max(0, base + jitter) });
  }
  return cells;
}

function heatColor(metric: HeatMetric, value: number) {
  const norm =
    metric === "yield"
      ? Math.min(1, value / 6)
      : metric === "cuf"
        ? Math.min(1, value / 35)
        : Math.min(1, Math.max(0, (value - 60) / 40));
  const g = Math.round(90 + norm * 120);
  const r = Math.round(40 + (1 - norm) * 80);
  return `rgb(${r}, ${g}, 110)`;
}

export function AlertsInsightPanel({
  project,
  alerts,
  dateRange,
  onDateRangeChange,
  ranking,
}: AlertsInsightPanelProps) {
  const [tab, setTab] = useState<AlarmTab>("alarms");
  const [plantType, setPlantType] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("start");
  const [sortAsc, setSortAsc] = useState(false);
  const [metric, setMetric] = useState<HeatMetric>("pr");
  const [rankSort, setRankSort] = useState<"paPct" | "prPct" | "yieldMwhPerMwp" | "name">("prPct");
  const [rankAsc, setRankAsc] = useState(false);
  const { ref, active, toggle } = usePanelFullscreen();

  const rows = useMemo(
    () => buildAlarmRows(project, alerts, dateRange),
    [project, alerts, dateRange],
  );

  const filtered = useMemo(() => {
    const list =
      plantType === "all"
        ? rows
        : rows.filter((r) => r.plantType === plantType);
    const sorted = [...list].sort((a, b) => {
      const map: Record<SortKey, string> = {
        plant: a.plant,
        block: a.block,
        device: a.device,
        description: a.description,
        start: a.startTime,
        duration: a.duration,
        status: a.status,
      };
      const mapB: Record<SortKey, string> = {
        plant: b.plant,
        block: b.block,
        device: b.device,
        description: b.description,
        start: b.startTime,
        duration: b.duration,
        status: b.status,
      };
      const cmp = map[sortKey].localeCompare(mapB[sortKey], undefined, {
        numeric: true,
      });
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [rows, plantType, sortKey, sortAsc]);

  const timeline = useMemo(
    () => buildTimeline(project, dateRange, metric),
    [project, dateRange, metric],
  );

  const ranked = useMemo(() => {
    const list = [...ranking];
    list.sort((a, b) => {
      if (rankSort === "name") {
        return rankAsc
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      const av = a[rankSort];
      const bv = b[rankSort];
      return rankAsc ? av - bv : bv - av;
    });
    return list;
  }, [ranking, rankSort, rankAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function exportCurrent() {
    if (tab === "alarms") {
      downloadCsv(`alarm-logs-${project.name}`, [
        [
          "Plant",
          "Block Name",
          "Device Name",
          "Alarm Description",
          "Start Time",
          "Duration (HH:mm)",
          "Current Status",
        ],
        ...filtered.map((r) => [
          r.plant,
          r.block,
          r.device,
          r.description,
          r.startTime,
          r.duration,
          r.status,
        ]),
      ]);
      return;
    }
    if (tab === "heatmap") {
      downloadCsv(`heatmap-${metric}-${project.name}`, [
        ["Plant", "Date", metric.toUpperCase()],
        ...timeline.map((c) => [
          project.name,
          c.date.toISOString().slice(0, 10),
          c.value.toFixed(2),
        ]),
      ]);
      return;
    }
    downloadCsv(`plant-ranking-${project.name}`, [
      ["Plant Name", "PA(%)", "PR(%)", "Yield(MWh/MWp)"],
      ...ranked.map((r) => [
        r.name,
        r.paPct.toFixed(2),
        r.prPct.toFixed(2),
        r.yieldMwhPerMwp.toFixed(2),
      ]),
    ]);
  }

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`${panelClass} ${active ? "overflow-auto bg-page p-4" : ""}`}
      aria-label="Alarms and plant insights"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-3 pt-2">
        <nav className="inline-flex gap-1" aria-label="Alarm views">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={[
                "relative px-3 py-2 text-sm transition-colors",
                tab === item.id ? "text-fg" : "text-muted hover:text-fg",
              ].join(" ")}
            >
              {item.label}
              {tab === item.id ? (
                <motion.span
                  layoutId="alarm-tab"
                  className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-[#3b82f6]"
                />
              ) : null}
            </button>
          ))}
        </nav>
        <ChartToolbar
          onExport={exportCurrent}
          onFullscreen={toggle}
          fullscreen={active}
        >
          <DateRangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            compact
          />
        </ChartToolbar>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-4 py-2.5">
        <h2 className={sectionTitleClass}>
          {tab === "alarms"
            ? "Alarm Logs"
            : tab === "heatmap"
              ? "Heatmap"
              : "Plant Ranking"}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {tab === "alarms" ? (
            <>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-edge text-muted hover:bg-fill hover:text-fg"
                title="Export menu"
                aria-label="Export menu"
                onClick={exportCurrent}
              >
                <Menu className="h-3.5 w-3.5" />
              </button>
              <label className="sr-only" htmlFor="plant-type">
                Plant type
              </label>
              <select
                id="plant-type"
                value={plantType}
                onChange={(e) => setPlantType(e.target.value)}
                className="h-8 rounded-md border border-edge-strong bg-input px-2.5 text-xs text-fg outline-none focus:border-accent/50"
              >
                <option value="all">Select a Plant Type</option>
                <option value="solar">Solar</option>
                <option value="wind">Wind</option>
                <option value="hybrid">Hybrid</option>
                <option value="bess">BESS</option>
              </select>
            </>
          ) : null}
          {tab === "heatmap" ? (
            <div className="inline-flex rounded-md border border-edge p-0.5">
              {(
                [
                  ["pa", "PA"],
                  ["pr", "PR"],
                  ["yield", "YIELD"],
                  ["cuf", "CUF"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMetric(id)}
                  className={[
                    "rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
                    metric === id
                      ? "bg-[#3b82f6] text-white"
                      : "text-muted hover:text-fg",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          <span className="text-[10px] tabular-nums text-muted">
            {formatDisplayRange(dateRange.start, dateRange.end)}
          </span>
        </div>
      </div>

      {tab === "alarms" ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-xs">
            <thead>
              <tr className="border-b border-edge text-[10px] uppercase tracking-wide text-muted">
                {(
                  [
                    ["plant", "Plant"],
                    ["block", "Block Name"],
                    ["device", "Device Name"],
                    ["description", "Alarm Description"],
                    ["start", "Start Time"],
                    ["duration", "Duration (HH:mm)"],
                    ["status", "Current Status"],
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
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-edge/60 hover:bg-fill/40"
                >
                  <td className="px-3 py-2.5 font-medium text-fg">{row.plant}</td>
                  <td className="px-3 py-2.5 text-secondary">{row.block}</td>
                  <td className="px-3 py-2.5 text-secondary">{row.device}</td>
                  <td className="px-3 py-2.5 text-secondary">{row.description}</td>
                  <td className="px-3 py-2.5 tabular-nums text-secondary">
                    {row.startTime}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-secondary">
                    {row.duration}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusPill status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "heatmap" ? (
        <div className="overflow-x-auto p-4">
          <div className="min-w-[720px]">
            <div className="mb-2 flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-[11px] font-medium text-secondary">
                {project.name.slice(0, 18).toUpperCase().replace(/\s+/g, "-")}
              </span>
              <div className="grid flex-1 grid-flow-col gap-0.5" style={{ gridTemplateColumns: `repeat(${timeline.length}, minmax(14px, 1fr))` }}>
                {timeline.map((cell) => (
                  <button
                    key={cell.date.toISOString()}
                    type="button"
                    title={`${cell.date.toLocaleDateString("en-GB")}: ${cell.value.toFixed(2)}`}
                    className="h-10 rounded-sm transition-transform hover:scale-y-110"
                    style={{ backgroundColor: heatColor(metric, cell.value) }}
                  />
                ))}
              </div>
            </div>
            <div className="ml-28 flex justify-between text-[10px] tabular-nums text-muted">
              <span>
                {timeline[0]?.date.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
              <span>
                {timeline[timeline.length - 1]?.date.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "ranking" ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead>
              <tr className="border-b border-edge text-[10px] uppercase tracking-wide text-muted">
                {(
                  [
                    ["name", "Plant Name"],
                    ["paPct", "PA(%)"],
                    ["prPct", "PR(%)"],
                    ["yieldMwhPerMwp", "Yield(MWh/MWp)"],
                  ] as const
                ).map(([key, label]) => (
                  <th key={key} className="px-3 py-2.5 font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        if (rankSort === key) setRankAsc((v) => !v);
                        else {
                          setRankSort(key);
                          setRankAsc(false);
                        }
                      }}
                      className="inline-flex items-center gap-1 hover:text-fg"
                    >
                      {label}
                      {rankSort === key ? (
                        rankAsc ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )
                      ) : null}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.map((row) => (
                <tr
                  key={row.name}
                  className="border-b border-edge/60 hover:bg-fill/40"
                >
                  <td className="px-3 py-2.5 font-medium text-fg">{row.name}</td>
                  <td className="px-3 py-2.5 tabular-nums text-secondary">
                    {row.paPct.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-secondary">
                    {row.prPct.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-secondary">
                    {row.yieldMwhPerMwp.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function StatusPill({ status }: { status: "OPEN" | "CLOSE" }) {
  if (status === "CLOSE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-success/50 px-2 py-1 text-[10px] font-semibold tracking-wide text-success">
        <CheckCircle2 className="h-3 w-3" />
        CLOSE
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-danger/50 px-2 py-1 text-[10px] font-semibold tracking-wide text-danger">
      OPEN
    </span>
  );
}
