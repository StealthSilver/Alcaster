import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Box,
  Gauge,
  Map,
  Radio,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { AnimatedMetric } from "@/components/dashboard/AnimatedMetric";
import { InteractiveLineChart } from "@/components/dashboard/InteractiveLineChart";
import {
  panelClass,
  sectionHintClass,
  sectionTitleClass,
} from "@/components/dashboard/panel";
import { ScadaMimic } from "@/components/scada/ScadaMimic";
import { rangeFromPreset, type DateRangeValue } from "@/lib/chartActions";
import type { ProjectDashboardPayload, TwinRecord } from "@/lib/api";
import { projectSitemapPath, projectTwinPath } from "@/lib/paths";
import {
  buildScadaSnapshot,
  readScadaConfig,
  type AlarmPriority,
  type ScadaAlarm,
  type ScadaStatus,
} from "@/lib/scadaModel";

type ScadaViewerProps = {
  dashboard: ProjectDashboardPayload;
  twin: TwinRecord | null;
};

type ScadaTab = "overview" | "mimic" | "devices" | "alarms" | "comms";

const TABS: { id: ScadaTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "mimic", label: "Mimic" },
  { id: "devices", label: "Devices" },
  { id: "alarms", label: "Alarms" },
  { id: "comms", label: "Comms" },
];

const statusColor: Record<ScadaStatus, string> = {
  RUN: "#3dcf8e",
  WARN: "#e8a54b",
  FAULT: "#e06b75",
  STOP: "color-mix(in srgb, var(--alcaster-fg) 45%, transparent)",
};

const priorityColor: Record<AlarmPriority, string> = {
  P1: "#e06b75",
  P2: "#e8a54b",
  P3: "rgba(232,165,75,0.7)",
  P4: "color-mix(in srgb, var(--alcaster-fg) 45%, transparent)",
};

export function ScadaViewer({ dashboard, twin }: ScadaViewerProps) {
  const config = useMemo(
    () => readScadaConfig(dashboard.project.id),
    [dashboard.project.id],
  );
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [tab, setTab] = useState<ScadaTab>("overview");
  const [acks, setAcks] = useState<Record<string, true>>({});
  const [dateRange, setDateRange] = useState<DateRangeValue>(() =>
    rangeFromPreset("today"),
  );

  const snapshot = useMemo(
    () =>
      buildScadaSnapshot(dashboard, twin, {
        tick,
        config,
      }),
    [dashboard, twin, tick, config],
  );

  const [selectedId, setSelectedId] = useState(
    () => snapshot.nodes.find((n) => n.kind === "inverter")?.id ?? "inverter",
  );

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    const ms = Math.max(1000, config.pollIntervalSec * 1000);
    const scan = window.setInterval(() => setTick((n) => n + 1), ms);
    return () => window.clearInterval(scan);
  }, [config.pollIntervalSec]);

  const selected =
    snapshot.nodes.find((node) => node.id === selectedId) ?? snapshot.nodes[0];
  const alarms = snapshot.alarms.map((alarm) =>
    acks[alarm.id] ? { ...alarm, state: "ACK" as const } : alarm,
  );
  const unack = alarms.filter((alarm) => alarm.state === "UNACK").length;

  const powerSeries = snapshot.chartSeries.filter((s) =>
    ["pac", "pdc", "target"].includes(s.id),
  );
  const gridSeries = snapshot.chartSeries.filter((s) =>
    ["pac", "q", "ghi"].includes(s.id),
  );

  const clock = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  function ackAll() {
    const next: Record<string, true> = { ...acks };
    for (const alarm of alarms) {
      if (alarm.state === "UNACK") next[alarm.id] = true;
    }
    setAcks(next);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-3">
        <Hero
          plantName={snapshot.plantName}
          pacMw={snapshot.kpis.pacMw}
          loadSharePct={snapshot.kpis.loadSharePct}
          clock={clock}
          scanMs={snapshot.scanMs}
          mode={snapshot.mode}
          unack={unack}
          protocol={snapshot.config.protocolLabel}
          endpoint={snapshot.config.endpoint}
          projectId={snapshot.projectId}
          capacityMw={dashboard.project.capacityMw}
          location={dashboard.project.location}
        />

        <MetricStrip metrics={snapshot.metrics} />

        <nav
          className="inline-flex gap-1 border-b border-edge"
          aria-label="SCADA views"
        >
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
                  layoutId="scada-tab"
                  className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-accent"
                />
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pb-4">
      {tab === "overview" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <ScadaMimic
                nodes={snapshot.nodes}
                selectedId={selectedId}
                onSelect={setSelectedId}
                compact
              />
            </div>
            <div className="flex flex-col gap-3 xl:col-span-2">
              <TagInspector node={selected} />
              <AlarmList
                alarms={alarms.slice(0, 6)}
                onAck={(id) => setAcks((c) => ({ ...c, [id]: true }))}
                onAckAll={ackAll}
                compact
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <InteractiveLineChart
              title="Active / DC power"
              hours={snapshot.chartHours}
              series={powerSeries}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
            <InteractiveLineChart
              title="Grid · Q · GHI"
              hours={snapshot.chartHours}
              series={gridSeries}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </div>
      ) : null}

      {tab === "mimic" ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="space-y-3 xl:col-span-2">
            <ScadaMimic
              nodes={snapshot.nodes}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <BreakerTable rows={snapshot.breakers} />
          </div>
          <div className="space-y-3">
            <TagInspector node={selected} />
            <MetCard weather={snapshot.weather} ghi={snapshot.kpis.ghi} />
          </div>
        </div>
      ) : null}

      {tab === "devices" ? (
        <div className="space-y-3">
          <InverterBayGrid
            rows={snapshot.inverters}
            onSelect={(tag) => {
              setSelectedId("inverter");
              void tag;
            }}
          />
          <InverterTable rows={snapshot.inverters} />
          <BreakerTable rows={snapshot.breakers} />
        </div>
      ) : null}

      {tab === "alarms" ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <AlarmList
              alarms={alarms}
              onAck={(id) => setAcks((c) => ({ ...c, [id]: true }))}
              onAckAll={ackAll}
            />
          </div>
          <EventLog events={snapshot.events} />
        </div>
      ) : null}

      {tab === "comms" ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <CommsPanel channels={snapshot.channels} config={snapshot.config} />
          <SetpointPanel setpoints={snapshot.setpoints} />
          <EventLog events={snapshot.events} />
        </div>
      ) : null}
      </div>
    </div>
  );
}

function Hero({
  plantName,
  pacMw,
  loadSharePct,
  clock,
  scanMs,
  mode,
  unack,
  protocol,
  endpoint,
  projectId,
  capacityMw,
  location,
}: {
  plantName: string;
  pacMw: number;
  loadSharePct: number;
  clock: string;
  scanMs: number;
  mode: string;
  unack: number;
  protocol: string;
  endpoint: string;
  projectId: string;
  capacityMw: number;
  location: string;
}) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, loadSharePct) / 100);

  return (
    <section className={`${panelClass} px-4 py-4`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-edge pb-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="truncate text-sm font-semibold text-fg">{plantName}</h2>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/35 bg-accent/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
            <span className="alcaster-live-dot h-1.5 w-1.5 rounded-full bg-accent" />
            Live
          </span>
          <span className="rounded-md border border-[rgba(61,207,142,0.35)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-[rgba(61,207,142,0.95)]">
            {mode}
          </span>
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] ${
              unack > 0
                ? "border border-[#e8a54b]/40 bg-accent/12 text-accent"
                : "border border-edge-strong text-muted"
            }`}
          >
            {unack} UNACK
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] tabular-nums text-muted">
          <span>SYS {clock}</span>
          <span>{scanMs} ms</span>
          <span className="hidden sm:inline">
            {protocol} · {endpoint}
          </span>
          <Link
            to={projectTwinPath(projectId)}
            className="inline-flex items-center gap-1 rounded-md border border-edge-strong px-2 py-1 text-muted hover:text-fg"
          >
            <Box className="h-3 w-3" />
            Twin
          </Link>
          <Link
            to={projectSitemapPath(projectId)}
            className="inline-flex items-center gap-1 rounded-md border border-edge-strong px-2 py-1 text-muted hover:text-fg"
          >
            <Map className="h-3 w-3" />
            Sitemap
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative h-[76px] w-[76px] shrink-0">
          <svg width="76" height="76" className="-rotate-90">
            <circle
              cx="38"
              cy="38"
              r={r}
              fill="none"
              stroke="color-mix(in srgb, var(--alcaster-fg) 8%, transparent)"
              strokeWidth="5"
            />
            <motion.circle
              cx="38"
              cy="38"
              r={r}
              fill="none"
              stroke="#e6740a"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-accent">
            <Zap className="h-5 w-5" fill="currentColor" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
            Plant export · live scan
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            <AnimatedMetric value={pacMw} decimals={2} unit="MW" />
          </p>
          <p className="mt-2 text-[11px] text-muted">
            {capacityMw} MW capacity · {loadSharePct}% load · {location}
          </p>
        </div>
      </div>
    </section>
  );
}

function MetricStrip({
  metrics,
}: {
  metrics: ReturnType<typeof buildScadaSnapshot>["metrics"];
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {metrics.map((metric) => {
        const up = metric.deltaPct >= 0;
        const toneClass =
          metric.tone === "fault"
            ? "text-danger"
            : metric.tone === "warn"
              ? "text-accent"
              : metric.tone === "ok"
                ? "text-success"
                : "text-muted";
        return (
          <article
            key={metric.id}
            className={`${panelClass} flex min-w-[140px] flex-1 items-center gap-3 px-3 py-3`}
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fill text-accent">
              {metric.id === "alarms" ? (
                <Activity className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Gauge className="h-4 w-4" strokeWidth={1.75} />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted">
                {metric.label}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-fg">
                {metric.value}
                {metric.unit ? (
                  <span className="ml-1 text-[10px] font-medium text-muted">
                    {metric.unit}
                  </span>
                ) : null}
              </p>
              <p className={`mt-0.5 text-[10px] font-medium tabular-nums ${toneClass}`}>
                {up ? "+" : ""}
                {metric.deltaPct.toFixed(1)}%
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function TagInspector({
  node,
}: {
  node: NonNullable<ReturnType<typeof buildScadaSnapshot>["nodes"][0]>;
}) {
  return (
    <section className={`${panelClass} p-4`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
            <Gauge className="h-3 w-3" />
            Tag inspector
          </p>
          <h2 className={`mt-1 ${sectionTitleClass}`}>{node.name}</h2>
        </div>
        <span
          className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
          style={{
            color: statusColor[node.status],
            background: `${statusColor[node.status]}22`,
          }}
        >
          {node.status}
        </span>
      </div>
      <ul className="mt-3 space-y-1.5">
        {node.points.map((point) => (
          <li
            key={point.tag}
            className="flex items-center justify-between gap-3 rounded-md border border-edge bg-fill px-2.5 py-1.5"
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-[10px] text-muted">
                {point.tag}
              </p>
              <p className="text-[11px] text-secondary">{point.desc}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums text-fg">
                {point.value}
                {point.unit ? (
                  <span className="ml-1 text-[10px] font-medium text-muted">
                    {point.unit}
                  </span>
                ) : null}
              </p>
              <p className="text-[10px] text-success">{point.quality}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AlarmList({
  alarms,
  onAck,
  onAckAll,
  compact = false,
}: {
  alarms: ScadaAlarm[];
  onAck: (id: string) => void;
  onAckAll?: () => void;
  compact?: boolean;
}) {
  return (
    <section className={`${panelClass} p-4`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className={sectionTitleClass}>Alarm list</h2>
        </div>
        {onAckAll ? (
          <button
            type="button"
            onClick={onAckAll}
            className="rounded-md border border-edge-strong px-2 py-1 text-[11px] text-muted hover:text-fg"
          >
            ACK all
          </button>
        ) : null}
      </div>
      <ul
        className={`mt-3 space-y-1 overflow-y-auto ${compact ? "max-h-[220px]" : "max-h-[420px]"}`}
      >
        {alarms.length === 0 ? (
          <li className="py-6 text-center text-sm text-muted">No active alarms</li>
        ) : (
          alarms.map((alarm) => (
            <li
              key={alarm.id}
              className="flex items-start gap-2 rounded-md px-2 py-2 hover:bg-fill"
            >
              <span
                className={`mt-0.5 text-[10px] font-semibold ${
                  alarm.state === "UNACK" ? "alcaster-live-dot" : ""
                }`}
                style={{ color: priorityColor[alarm.priority] }}
              >
                {alarm.priority}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] text-fg">{alarm.message}</p>
                <p className="mt-0.5 font-mono text-[10px] text-muted">
                  {alarm.time} · {alarm.tag} · {alarm.state}
                </p>
              </div>
              {alarm.state === "UNACK" ? (
                <button
                  type="button"
                  onClick={() => onAck(alarm.id)}
                  className="rounded-md border border-edge-strong px-1.5 py-0.5 text-[10px] text-muted hover:text-fg"
                >
                  ACK
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function InverterBayGrid({
  rows,
  onSelect,
}: {
  rows: ReturnType<typeof buildScadaSnapshot>["inverters"];
  onSelect: (tag: string) => void;
}) {
  return (
    <section className={`${panelClass} p-4`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className={sectionTitleClass}>Inverter bay map</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] text-muted">
          {(
            [
              ["RUN", statusColor.RUN],
              ["WARN", statusColor.WARN],
              ["FAULT", statusColor.FAULT],
            ] as const
          ).map(([label, color]) => (
            <span key={label} className="inline-flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: color }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onSelect(row.tag)}
            className="rounded-md border border-edge px-2 py-2 text-left transition-colors hover:border-edge-strong"
            style={{
              background: `${statusColor[row.status]}14`,
              borderColor: `${statusColor[row.status]}55`,
            }}
          >
            <p className="truncate text-[10px] font-medium text-fg">{row.tag}</p>
            <p className="mt-0.5 text-xs font-semibold tabular-nums text-fg">
              {row.pacMw.toFixed(2)}
              <span className="ml-0.5 text-[9px] font-medium text-muted">MW</span>
            </p>
            <p
              className="mt-0.5 text-[9px] font-semibold"
              style={{ color: statusColor[row.status] }}
            >
              {row.status}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

function InverterTable({
  rows,
}: {
  rows: ReturnType<typeof buildScadaSnapshot>["inverters"];
}) {
  return (
    <section className={`overflow-hidden ${panelClass}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h2 className={sectionTitleClass}>Inverter telemetry</h2>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[12px]">
          <thead className="border-y border-edge text-[10px] uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Tag</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Pac</th>
              <th className="px-3 py-2 font-medium">Q</th>
              <th className="px-3 py-2 font-medium">Vac</th>
              <th className="px-3 py-2 font-medium">Iac</th>
              <th className="px-3 py-2 font-medium">Eff</th>
              <th className="px-3 py-2 font-medium">Temp</th>
              <th className="px-3 py-2 font-medium">Vdc</th>
              <th className="px-4 py-2 font-medium">Fault</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-edge last:border-0">
                <td className="px-4 py-2 font-medium text-fg">{row.tag}</td>
                <td className="px-3 py-2">
                  <span style={{ color: statusColor[row.status] }}>
                    {row.status}
                  </span>
                </td>
                <td className="px-3 py-2 tabular-nums text-secondary">
                  {row.pacMw} MW
                </td>
                <td className="px-3 py-2 tabular-nums text-muted">
                  {row.qKvar} kvar
                </td>
                <td className="px-3 py-2 tabular-nums text-muted">{row.vac} V</td>
                <td className="px-3 py-2 tabular-nums text-muted">{row.iac} A</td>
                <td className="px-3 py-2 tabular-nums text-secondary">
                  {row.efficiencyPct}%
                </td>
                <td className="px-3 py-2 tabular-nums text-muted">
                  {row.tempC} °C
                </td>
                <td className="px-3 py-2 tabular-nums text-muted">{row.vdc} V</td>
                <td className="px-4 py-2 text-muted">{row.fault}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BreakerTable({
  rows,
}: {
  rows: ReturnType<typeof buildScadaSnapshot>["breakers"];
}) {
  return (
    <section className={`overflow-hidden ${panelClass}`}>
      <div className="px-4 py-3">
        <h2 className={sectionTitleClass}>Switchgear</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[12px]">
          <thead className="border-y border-edge text-[10px] uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Tag</th>
              <th className="px-3 py-2 font-medium">Bay</th>
              <th className="px-3 py-2 font-medium">Position</th>
              <th className="px-3 py-2 font-medium">I</th>
              <th className="px-3 py-2 font-medium">V</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-edge last:border-0">
                <td className="px-4 py-2 font-mono text-fg">{row.tag}</td>
                <td className="px-3 py-2 text-secondary">{row.name}</td>
                <td className="px-3 py-2 font-semibold text-fg">{row.position}</td>
                <td className="px-3 py-2 tabular-nums text-muted">
                  {row.currentA} A
                </td>
                <td className="px-3 py-2 tabular-nums text-muted">
                  {row.voltageKv} kV
                </td>
                <td className="px-4 py-2">
                  <span style={{ color: statusColor[row.status] }}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CommsPanel({
  channels,
  config,
}: {
  channels: ReturnType<typeof buildScadaSnapshot>["channels"];
  config: ReturnType<typeof buildScadaSnapshot>["config"];
}) {
  return (
    <section className={`${panelClass} p-4`}>
      <h2 className={`flex items-center gap-1.5 ${sectionTitleClass}`}>
        <Radio className="h-3.5 w-3.5 text-accent" />
        Communications
      </h2>
      <p className={sectionHintClass}>
        {config.protocolLabel} · poll {config.pollIntervalSec}s ·{" "}
        {config.deviceCount} devices
      </p>
      <ul className="mt-3 space-y-2">
        {channels.map((channel) => (
          <li
            key={channel.id}
            className="flex items-center justify-between gap-3 rounded-md border border-edge px-2.5 py-2"
          >
            <div>
              <p className="text-[12px] text-fg">{channel.name}</p>
              <p className="text-[10px] text-muted">
                {channel.protocol} · {channel.latencyMs} ms · {channel.lastRx}
              </p>
            </div>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{
                color:
                  channel.status === "CONNECTED"
                    ? statusColor.RUN
                    : channel.status === "DEGRADED"
                      ? statusColor.WARN
                      : statusColor.FAULT,
              }}
            >
              {channel.status}
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-3 grid gap-2 border-t border-edge pt-3 text-[11px]">
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Endpoint</dt>
          <dd className="font-mono text-fg">{config.endpoint}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Tag source</dt>
          <dd className="truncate text-fg">{config.tagListSource}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Alert route</dt>
          <dd className="truncate text-fg">{config.alertEmail}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Critical routing</dt>
          <dd className="text-fg">
            {config.criticalAlarmEnabled ? "Enabled" : "Disabled"}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function SetpointPanel({
  setpoints,
}: {
  setpoints: ReturnType<typeof buildScadaSnapshot>["setpoints"];
}) {
  return (
    <section className={`${panelClass} p-4`}>
      <h2 className={sectionTitleClass}>Setpoints</h2>
      <ul className="mt-3 space-y-2">
        {setpoints.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-md border border-edge px-2.5 py-2"
          >
            <div>
              <p className="text-[12px] text-secondary">{item.label}</p>
              <p className="font-mono text-[10px] text-muted">{item.tag}</p>
            </div>
            <p className="text-sm font-semibold tabular-nums text-fg">
              {item.value}
              {item.unit ? (
                <span className="ml-1 text-[10px] font-medium text-muted">
                  {item.unit}
                </span>
              ) : null}
            </p>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled
        className="mt-3 w-full rounded-md border border-edge-strong py-2 text-[12px] text-subtle"
      >
        Write setpoint
      </button>
    </section>
  );
}

function EventLog({
  events,
}: {
  events: ReturnType<typeof buildScadaSnapshot>["events"];
}) {
  return (
    <section className={`${panelClass} p-4`}>
      <h2 className={sectionTitleClass}>Sequence of events</h2>
      <ul className="mt-3 max-h-[360px] space-y-2 overflow-y-auto">
        {events.map((event) => (
          <li key={event.id} className="flex gap-3 text-[12px]">
            <span className="w-16 shrink-0 tabular-nums text-muted">
              {event.time}
            </span>
            <span className="w-14 shrink-0 text-muted">{event.source}</span>
            <span className="text-secondary">{event.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MetCard({
  weather,
  ghi,
}: {
  weather: ProjectDashboardPayload["weather"];
  ghi: number;
}) {
  return (
    <section className={`${panelClass} p-4`}>
      <h2 className={sectionTitleClass}>MET-01</h2>
      <dl className="mt-3 grid grid-cols-2 gap-2">
        {[
          ["GHI", `${ghi} W/m²`],
          ["Ambient", `${weather.temperatureC} °C`],
          ["Wind", `${weather.windKmh} km/h`],
          ["Cloud", `${weather.cloudCoverPct}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-edge px-2.5 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-muted">
              {label}
            </dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-fg">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
