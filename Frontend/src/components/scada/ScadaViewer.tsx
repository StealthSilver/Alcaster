import { useEffect, useMemo, useState } from "react";
import { Box, Gauge, Map, Radio } from "lucide-react";
import { Link } from "react-router-dom";

import { PortfolioGeneration } from "@/components/dashboard/PortfolioGeneration";
import { WeatherOverview } from "@/components/dashboard/WeatherOverview";
import { ScadaMimic } from "@/components/scada/ScadaMimic";
import type { ProjectDashboardPayload, TwinRecord } from "@/lib/api";
import { projectSitemapPath, projectTwinPath } from "@/lib/paths";
import {
  buildScadaSnapshot,
  type AlarmPriority,
  type ScadaAlarm,
  type ScadaStatus,
} from "@/lib/scadaModel";

type ScadaViewerProps = {
  dashboard: ProjectDashboardPayload;
  twin: TwinRecord | null;
};

const statusColor: Record<ScadaStatus, string> = {
  RUN: "rgba(120, 180, 140, 0.95)",
  WARN: "#e6740a",
  FAULT: "#f07167",
  STOP: "rgba(255,255,255,0.45)",
};

const priorityColor: Record<AlarmPriority, string> = {
  P1: "#f07167",
  P2: "#e6740a",
  P3: "rgba(230,116,10,0.7)",
  P4: "rgba(255,255,255,0.45)",
};

export function ScadaViewer({ dashboard, twin }: ScadaViewerProps) {
  const snapshot = useMemo(
    () => buildScadaSnapshot(dashboard, twin),
    [dashboard, twin],
  );
  const [now, setNow] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState(snapshot.nodes[2]?.id ?? "inverter");
  const [acks, setAcks] = useState<Record<string, true>>({});

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const selected = snapshot.nodes.find((node) => node.id === selectedId) ?? snapshot.nodes[0];
  const alarms = snapshot.alarms.map((alarm) =>
    acks[alarm.id] ? { ...alarm, state: "ACK" as const } : alarm,
  );
  const unack = alarms.filter((alarm) => alarm.state === "UNACK").length;
  const capturedLabel = new Date(snapshot.capturedAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const clock = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-4">
      <StatusBar
        plantName={snapshot.plantName}
        clock={clock}
        capturedLabel={capturedLabel}
        scanMs={snapshot.scanMs}
        mode={snapshot.mode}
        unack={unack}
        projectId={snapshot.projectId}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <Kpi label="P AC" value={snapshot.kpis.pacMw} unit="MW" />
        <Kpi label="P DC" value={snapshot.kpis.pdcMw} unit="MW" />
        <Kpi label="PR" value={snapshot.kpis.prPct} unit="%" />
        <Kpi label="Availability" value={snapshot.kpis.availabilityPct} unit="%" />
        <Kpi label="GHI" value={snapshot.kpis.ghi} unit="W/m²" />
        <Kpi label="Grid" value={snapshot.kpis.gridKv} unit="kV" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Frequency" value={snapshot.kpis.frequencyHz} unit="Hz" decimals={3} />
        <Kpi label="Power factor" value={snapshot.kpis.powerFactor} unit="" decimals={3} />
        <Kpi label="Energy today" value={snapshot.kpis.energyTodayMwh} unit="MWh" />
        <Kpi label="Scan" value={snapshot.scanMs / 1000} unit="s" decimals={1} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <ScadaMimic
            nodes={snapshot.nodes}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <InverterTable rows={snapshot.inverters} />
        </div>
        <div className="space-y-4">
          <TagInspector node={selected} />
          <AlarmList
            alarms={alarms}
            onAck={(id) => setAcks((current) => ({ ...current, [id]: true }))}
          />
          <CommsPanel channels={snapshot.channels} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PortfolioGeneration
            series={snapshot.series}
            title="Active power trend"
            subtitle="Static day curve · live historian next"
          />
        </div>
        <WeatherOverview
          weather={snapshot.weather}
          subtitle="MET-01 · quality GOOD"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SetpointPanel setpoints={snapshot.setpoints} />
        <EventLog events={snapshot.events} />
      </div>
    </div>
  );
}

function StatusBar({
  plantName,
  clock,
  capturedLabel,
  scanMs,
  mode,
  unack,
  projectId,
}: {
  plantName: string;
  clock: string;
  capturedLabel: string;
  scanMs: number;
  mode: string;
  unack: number;
  projectId: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 sm:px-4">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6740a]/35 bg-[#e6740a]/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e6740a]">
        <span className="alcaster-live-dot h-1.5 w-1.5 rounded-full bg-[#e6740a]" />
        Live
      </span>
      <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
        Static feed
      </span>
      <span className="hidden text-[12px] font-medium text-white sm:inline">
        {plantName}
      </span>
      <span className="text-[11px] tabular-nums text-white/40">SYS {clock}</span>
      <span className="text-[11px] tabular-nums text-white/35">
        Last scan {capturedLabel}
      </span>
      <span className="text-[11px] text-white/35">{scanMs} ms</span>
      <span className="rounded-full border border-[rgba(120,180,140,0.35)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-[rgba(120,180,140,0.95)]">
        {mode}
      </span>
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] ${
          unack > 0
            ? "border border-[#e6740a]/40 bg-[#e6740a]/12 text-[#e6740a]"
            : "border border-white/10 text-white/40"
        }`}
      >
        {unack} UNACK
      </span>
      <span className="ml-auto flex items-center gap-2">
        <Link
          to={projectTwinPath(projectId)}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/55 hover:text-white"
        >
          <Box className="h-3 w-3" />
          Twin
        </Link>
        <Link
          to={projectSitemapPath(projectId)}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/55 hover:text-white"
        >
          <Map className="h-3 w-3" />
          Sitemap
        </Link>
      </span>
    </div>
  );
}

function Kpi({
  label,
  value,
  unit,
  decimals = 1,
}: {
  label: string;
  value: number;
  unit: string;
  decimals?: number;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-white">
        {value.toFixed(decimals)}
        {unit ? (
          <span className="ml-1 text-xs font-medium text-white/40">{unit}</span>
        ) : null}
      </p>
    </div>
  );
}

function TagInspector({
  node,
}: {
  node: NonNullable<ReturnType<typeof buildScadaSnapshot>["nodes"][0]>;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#e6740a]">
            <Gauge className="h-3 w-3" />
            Tag inspector
          </p>
          <h2 className="mt-1 text-sm font-semibold text-white">{node.name}</h2>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
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
            className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5"
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-[10px] text-white/40">{point.tag}</p>
              <p className="text-[11px] text-white/70">{point.desc}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums text-white">
                {point.value}
                {point.unit ? (
                  <span className="ml-1 text-[10px] font-medium text-white/40">
                    {point.unit}
                  </span>
                ) : null}
              </p>
              <p className="text-[10px] text-[rgba(120,180,140,0.9)]">{point.quality}</p>
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
}: {
  alarms: ScadaAlarm[];
  onAck: (id: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <h2 className="text-sm font-semibold text-white">Alarm list</h2>
      <p className="mt-0.5 text-[11px] text-white/40">
        Priority · tag · acknowledge locally
      </p>
      <ul className="mt-3 max-h-[280px] space-y-1 overflow-y-auto">
        {alarms.map((alarm) => (
          <li
            key={alarm.id}
            className="flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-white/[0.03]"
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
              <p className="truncate text-[12px] text-white/85">{alarm.message}</p>
              <p className="mt-0.5 font-mono text-[10px] text-white/35">
                {alarm.time} · {alarm.tag} · {alarm.state}
              </p>
            </div>
            {alarm.state === "UNACK" ? (
              <button
                type="button"
                onClick={() => onAck(alarm.id)}
                className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-white/55 hover:text-white"
              >
                ACK
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function InverterTable({
  rows,
}: {
  rows: ReturnType<typeof buildScadaSnapshot>["inverters"];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03]">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Inverter bay</h2>
          <p className="text-[11px] text-white/40">Device telemetry · quality GOOD</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[12px]">
          <thead className="border-y border-white/[0.06] text-[10px] uppercase tracking-[0.12em] text-white/35">
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
              <tr key={row.id} className="border-b border-white/[0.04] last:border-0">
                <td className="px-4 py-2 font-medium text-white">{row.tag}</td>
                <td className="px-3 py-2">
                  <span style={{ color: statusColor[row.status] }}>{row.status}</span>
                </td>
                <td className="px-3 py-2 tabular-nums text-white/80">{row.pacMw} MW</td>
                <td className="px-3 py-2 tabular-nums text-white/60">{row.qKvar} kvar</td>
                <td className="px-3 py-2 tabular-nums text-white/60">{row.vac} V</td>
                <td className="px-3 py-2 tabular-nums text-white/60">{row.iac} A</td>
                <td className="px-3 py-2 tabular-nums text-white/80">{row.efficiencyPct}%</td>
                <td className="px-3 py-2 tabular-nums text-white/60">{row.tempC} °C</td>
                <td className="px-3 py-2 tabular-nums text-white/60">{row.vdc} V</td>
                <td className="px-4 py-2 text-white/45">{row.fault}</td>
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
}: {
  channels: ReturnType<typeof buildScadaSnapshot>["channels"];
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-white">
        <Radio className="h-3.5 w-3.5 text-[#e6740a]" />
        Communications
      </h2>
      <ul className="mt-3 space-y-2">
        {channels.map((channel) => (
          <li key={channel.id} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] text-white/85">{channel.name}</p>
              <p className="text-[10px] text-white/35">
                {channel.protocol} · {channel.latencyMs} ms · {channel.lastRx}
              </p>
            </div>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{
                color:
                  channel.status === "CONNECTED"
                    ? "rgba(120,180,140,0.95)"
                    : channel.status === "DEGRADED"
                      ? "#e6740a"
                      : "#f07167",
              }}
            >
              {channel.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SetpointPanel({
  setpoints,
}: {
  setpoints: ReturnType<typeof buildScadaSnapshot>["setpoints"];
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <h2 className="text-sm font-semibold text-white">Setpoints</h2>
      <p className="mt-0.5 text-[11px] text-white/40">
        Write disabled — static feed
      </p>
      <ul className="mt-3 space-y-2">
        {setpoints.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.04] px-2.5 py-2"
          >
            <div>
              <p className="text-[12px] text-white/80">{item.label}</p>
              <p className="font-mono text-[10px] text-white/35">{item.tag}</p>
            </div>
            <p className="text-sm font-semibold tabular-nums text-white">
              {item.value}
              {item.unit ? (
                <span className="ml-1 text-[10px] font-medium text-white/40">
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
        className="mt-3 w-full rounded-lg border border-white/10 py-2 text-[12px] text-white/30"
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
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 xl:col-span-2">
      <h2 className="text-sm font-semibold text-white">Sequence of events</h2>
      <ul className="mt-3 space-y-2">
        {events.map((event) => (
          <li key={event.id} className="flex gap-3 text-[12px]">
            <span className="w-16 shrink-0 tabular-nums text-white/40">{event.time}</span>
            <span className="w-14 shrink-0 text-white/35">{event.source}</span>
            <span className="text-white/80">{event.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
