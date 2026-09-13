import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CircleAlert,
  Info,
  RefreshCw,
} from "lucide-react";

import type { ProjectDashboardPayload, TwinRecord } from "@/lib/api";
import {
  downloadCsv,
  rangeFromPreset,
  type DateRangeValue,
} from "@/lib/chartActions";
import { usePlantAnalytics } from "@/hooks/usePlantAnalytics";
import { usePanelFullscreen } from "@/hooks/usePanelFullscreen";
import {
  buildScadaSnapshot,
  readScadaConfig,
  type AlarmPriority,
  type ScadaAlarm,
} from "@/lib/scadaModel";
import { AlertsInsightPanel } from "./AlertsInsightPanel";
import { ChartToolbar } from "./ChartToolbar";
import { DateRangePicker } from "./DateRangePicker";
import { iconButtonClass, panelClass, sectionTitleClass } from "./panel";

type AlertsDashboardViewProps = {
  data: ProjectDashboardPayload;
  twin?: TwinRecord | null;
};

const priorityColor: Record<AlarmPriority, string> = {
  P1: "#e06b75",
  P2: "#e8a54b",
  P3: "rgba(232,165,75,0.7)",
  P4: "color-mix(in srgb, var(--alcaster-fg) 45%, transparent)",
};

const severityTone = {
  critical: {
    label: "Critical",
    className: "border-danger/40 bg-danger/10 text-danger",
    Icon: CircleAlert,
  },
  warning: {
    label: "Warning",
    className: "border-accent/40 bg-accent/10 text-accent",
    Icon: AlertTriangle,
  },
  info: {
    label: "Info",
    className: "border-edge bg-fill text-muted",
    Icon: Info,
  },
} as const;

export function AlertsDashboardView({
  data,
  twin = null,
}: AlertsDashboardViewProps) {
  const config = useMemo(
    () => readScadaConfig(data.project.id),
    [data.project.id],
  );
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [acks, setAcks] = useState<Record<string, true>>({});
  const [priorityFilter, setPriorityFilter] = useState<"all" | AlarmPriority>(
    "all",
  );
  const [stateFilter, setStateFilter] = useState<"all" | "UNACK" | "ACK">(
    "all",
  );
  const [dateRange, setDateRange] = useState<DateRangeValue>(() =>
    rangeFromPreset("today"),
  );
  const analytics = usePlantAnalytics(data, tick);
  const alarmFs = usePanelFullscreen();

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

  const alarms = useMemo(
    () =>
      snapshot.alarms.map((alarm) =>
        acks[alarm.id] ? { ...alarm, state: "ACK" as const } : alarm,
      ),
    [snapshot.alarms, acks],
  );

  const filteredAlarms = useMemo(() => {
    return alarms.filter((alarm) => {
      if (priorityFilter !== "all" && alarm.priority !== priorityFilter) {
        return false;
      }
      if (stateFilter !== "all" && alarm.state !== stateFilter) return false;
      return true;
    });
  }, [alarms, priorityFilter, stateFilter]);

  const openCount = alarms.filter((a) => a.state === "UNACK").length;
  const p1Count = alarms.filter((a) => a.priority === "P1").length;
  const p2Count = alarms.filter((a) => a.priority === "P2").length;
  const ackCount = alarms.filter((a) => a.state === "ACK").length;

  const ranking = useMemo(() => {
    const daily = analytics?.exportMetrics[0];
    return [
      {
        name: data.project.name,
        paPct: data.kpis.availabilityPct,
        prPct: daily?.prPct ?? 82,
        yieldMwhPerMwp: daily?.yieldMwhPerMwp ?? 3.8,
      },
    ];
  }, [analytics, data.project.name, data.kpis.availabilityPct]);

  const clock = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  function ackAlarm(id: string) {
    setAcks((prev) => ({ ...prev, [id]: true }));
  }

  function ackAll() {
    const next: Record<string, true> = { ...acks };
    for (const alarm of alarms) {
      if (alarm.state === "UNACK") next[alarm.id] = true;
    }
    setAcks(next);
  }

  function exportAlarms() {
    downloadCsv(`alerts-${data.project.name}`, [
      ["Time", "Priority", "State", "Tag", "Message", "Quality"],
      ...filteredAlarms.map((a) => [
        a.time,
        a.priority,
        a.state,
        a.tag,
        a.message,
        a.quality,
      ]),
    ]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-fg">Alerts</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-edge px-2.5 py-1 text-xs tabular-nums text-secondary">
            <span className="alcaster-live-dot h-1.5 w-1.5 rounded-full bg-success" />
            Live · {clock}
          </span>
          <button
            type="button"
            onClick={() => setTick((n) => n + 1)}
            className={iconButtonClass}
            aria-label="Refresh alerts"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Open alarms"
          value={String(openCount)}
          tone={openCount > 0 ? "danger" : "ok"}
          Icon={Bell}
        />
        <SummaryCard
          label="Critical (P1)"
          value={String(p1Count)}
          tone={p1Count > 0 ? "danger" : "ok"}
          Icon={CircleAlert}
        />
        <SummaryCard
          label="Warning (P2)"
          value={String(p2Count)}
          tone={p2Count > 0 ? "warn" : "ok"}
          Icon={AlertTriangle}
        />
        <SummaryCard
          label="Acknowledged"
          value={String(ackCount)}
          tone="ok"
          Icon={CheckCircle2}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
        <section
          ref={alarmFs.ref as React.RefObject<HTMLElement>}
          className={`${panelClass} xl:col-span-3 ${alarmFs.active ? "overflow-auto bg-page p-4" : ""}`}
          aria-label="Active alarm list"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-4 py-3">
            <h2 className={sectionTitleClass}>Active alarms</h2>
            <ChartToolbar
              onExport={exportAlarms}
              onFullscreen={alarmFs.toggle}
              fullscreen={alarmFs.active}
            >
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(e.target.value as "all" | AlarmPriority)
                  }
                  className="h-8 rounded-md border border-edge-strong bg-input px-2 text-xs text-fg outline-none focus:border-accent/50"
                  aria-label="Filter by priority"
                >
                  <option value="all">All priorities</option>
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                  <option value="P3">P3</option>
                  <option value="P4">P4</option>
                </select>
                <select
                  value={stateFilter}
                  onChange={(e) =>
                    setStateFilter(e.target.value as "all" | "UNACK" | "ACK")
                  }
                  className="h-8 rounded-md border border-edge-strong bg-input px-2 text-xs text-fg outline-none focus:border-accent/50"
                  aria-label="Filter by state"
                >
                  <option value="all">All states</option>
                  <option value="UNACK">UNACK</option>
                  <option value="ACK">ACK</option>
                </select>
                {openCount > 0 ? (
                  <button
                    type="button"
                    onClick={ackAll}
                    className="rounded-md border border-edge-strong px-2.5 py-1 text-[11px] text-muted hover:text-fg"
                  >
                    ACK all
                  </button>
                ) : null}
              </div>
            </ChartToolbar>
          </div>

          <ul className="max-h-[420px] divide-y divide-edge overflow-y-auto">
            {filteredAlarms.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-muted">
                No alarms match the current filters.
              </li>
            ) : (
              filteredAlarms.map((alarm) => (
                <AlarmRow
                  key={alarm.id}
                  alarm={alarm}
                  onAck={() => ackAlarm(alarm.id)}
                />
              ))
            )}
          </ul>
        </section>

        <section
          className={`${panelClass} xl:col-span-2`}
          aria-label="Operational alerts"
        >
          <div className="border-b border-edge px-4 py-3">
            <h2 className={sectionTitleClass}>Operational alerts</h2>
          </div>
          {data.alerts.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted">No alerts right now.</p>
          ) : (
            <ul className="divide-y divide-edge">
              {data.alerts.map((alert) => {
                const tone = severityTone[alert.severity];
                const { Icon } = tone;
                return (
                  <li key={alert.id} className="flex gap-3 px-4 py-3">
                    <span
                      className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${tone.className}`}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm text-fg">{alert.title}</p>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${tone.className}`}
                        >
                          {tone.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {alert.plant}
                        <span className="text-subtle"> · </span>
                        {alert.timeAgo}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <AlertsInsightPanel
        project={data.project}
        alerts={data.alerts}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        ranking={ranking}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  Icon,
}: {
  label: string;
  value: string;
  tone: "ok" | "warn" | "danger";
  Icon: typeof Bell;
}) {
  const toneClass =
    tone === "danger"
      ? "text-danger"
      : tone === "warn"
        ? "text-accent"
        : "text-success";
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
        <Icon className={`h-3.5 w-3.5 ${toneClass}`} strokeWidth={1.75} />
      </div>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </p>
    </motion.div>
  );
}

function AlarmRow({
  alarm,
  onAck,
}: {
  alarm: ScadaAlarm;
  onAck: () => void;
}) {
  return (
    <li className="flex items-start gap-3 px-4 py-3 hover:bg-fill/40">
      <span
        className={`mt-0.5 text-[10px] font-semibold ${
          alarm.state === "UNACK" ? "alcaster-live-dot" : ""
        }`}
        style={{ color: priorityColor[alarm.priority] }}
      >
        {alarm.priority}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-fg">{alarm.message}</p>
        <p className="mt-0.5 font-mono text-[10px] text-muted">
          {alarm.time} · {alarm.tag} · {alarm.state} · {alarm.quality}
        </p>
      </div>
      {alarm.state === "UNACK" ? (
        <button
          type="button"
          onClick={onAck}
          className="rounded-md border border-edge-strong px-2 py-1 text-[10px] text-muted hover:text-fg"
        >
          ACK
        </button>
      ) : (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success">
          <CheckCircle2 className="h-3 w-3" />
          ACK
        </span>
      )}
    </li>
  );
}
