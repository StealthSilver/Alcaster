import type {
  OperationalAlert,
  ProjectDashboardPayload,
  TwinRecord,
} from "@/lib/api";
import type { ChartSeries } from "@/lib/cmsMonitor";
import { readDataEntryState } from "@/lib/dataEntryStore";
import { buildTwinLayout } from "@/lib/twinLayout";

export type TagQuality = "GOOD" | "UNCERTAIN" | "BAD";
export type ScadaStatus = "RUN" | "WARN" | "FAULT" | "STOP";
export type AlarmState = "UNACK" | "ACK" | "RTN";
export type AlarmPriority = "P1" | "P2" | "P3" | "P4";
export type ScadaNodeKind =
  | "array"
  | "combiner"
  | "inverter"
  | "transformer"
  | "substation"
  | "grid"
  | "met";

export type ScadaPoint = {
  tag: string;
  desc: string;
  value: string;
  unit?: string;
  quality: TagQuality;
};

export type ScadaNode = {
  id: string;
  name: string;
  kind: ScadaNodeKind;
  status: ScadaStatus;
  primary: string;
  secondary: string;
  points: ScadaPoint[];
};

export type ScadaInverterRow = {
  id: string;
  tag: string;
  status: ScadaStatus;
  pacMw: number;
  qKvar: number;
  vac: number;
  iac: number;
  efficiencyPct: number;
  tempC: number;
  vdc: number;
  fault: string;
};

export type ScadaBreakerRow = {
  id: string;
  tag: string;
  name: string;
  position: "CLOSED" | "OPEN" | "TRIP";
  currentA: number;
  voltageKv: number;
  status: ScadaStatus;
};

export type ScadaAlarm = {
  id: string;
  time: string;
  priority: AlarmPriority;
  state: AlarmState;
  tag: string;
  message: string;
  quality: TagQuality;
};

export type ScadaChannel = {
  id: string;
  name: string;
  protocol: string;
  status: "CONNECTED" | "DEGRADED" | "DOWN";
  latencyMs: number;
  lastRx: string;
};

export type ScadaSetpoint = {
  id: string;
  label: string;
  tag: string;
  value: string;
  unit: string;
};

export type ScadaEvent = {
  id: string;
  time: string;
  source: string;
  message: string;
};

export type ScadaMetricCard = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  deltaPct: number;
  tone: "ok" | "warn" | "fault" | "neutral";
};

export type ScadaConfig = {
  protocol: string;
  protocolLabel: string;
  endpoint: string;
  pollIntervalSec: number;
  deviceCount: number;
  tagListSource: string;
  alertEmail: string;
  criticalAlarmEnabled: boolean;
  notes: string;
};

export type ScadaSnapshot = {
  plantName: string;
  projectId: string;
  capturedAt: string;
  scanMs: number;
  mode: "AUTO";
  tick: number;
  config: ScadaConfig;
  kpis: {
    pacMw: number;
    pdcMw: number;
    prPct: number;
    availabilityPct: number;
    ghi: number;
    frequencyHz: number;
    powerFactor: number;
    gridKv: number;
    energyTodayMwh: number;
    loadSharePct: number;
  };
  metrics: ScadaMetricCard[];
  nodes: ScadaNode[];
  inverters: ScadaInverterRow[];
  breakers: ScadaBreakerRow[];
  alarms: ScadaAlarm[];
  channels: ScadaChannel[];
  setpoints: ScadaSetpoint[];
  events: ScadaEvent[];
  series: ProjectDashboardPayload["generationSeries"];
  chartHours: string[];
  chartSeries: ChartSeries[];
  weather: ProjectDashboardPayload["weather"];
};

const PROTOCOL_LABELS: Record<string, string> = {
  modbus_tcp: "Modbus TCP",
  opc_ua: "OPC UA",
  iec104: "IEC 60870-5-104",
  mqtt: "MQTT",
  rest: "REST / HTTPS",
};

function hash32(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function unit(seed: string): number {
  return hash32(seed) / 4294967296;
}

function mix(min: number, max: number, seed: string): number {
  return min + (max - min) * unit(seed);
}

function round(value: number, digits = 1): number {
  const place = 10 ** digits;
  return Math.round(value * place) / place;
}

function clockAt(capturedAt: Date, minutesAgo: number): string {
  const at = new Date(capturedAt.getTime() - minutesAgo * 60_000);
  return at.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function toStatus(seed: string): ScadaStatus {
  const roll = unit(`${seed}:st`);
  if (roll > 0.985) return "FAULT";
  if (roll > 0.93) return "WARN";
  return "RUN";
}

function factor(status: ScadaStatus, seed: string): number {
  if (status === "FAULT" || status === "STOP") return 0;
  if (status === "WARN") return mix(0.55, 0.78, `${seed}:f`);
  return mix(0.94, 1.03, `${seed}:f`);
}

function liveJitter(tick: number, seed: string, amplitude = 0.018): number {
  return 1 + Math.sin(tick * 0.85 + unit(seed) * 12) * amplitude;
}

function point(
  tag: string,
  desc: string,
  value: string,
  unitLabel?: string,
): ScadaPoint {
  return { tag, desc, value, unit: unitLabel, quality: "GOOD" };
}

function alarmPriority(severity: OperationalAlert["severity"]): AlarmPriority {
  if (severity === "critical") return "P1";
  if (severity === "warning") return "P2";
  return "P4";
}

export function readScadaConfig(projectId: string): ScadaConfig {
  const intake = readDataEntryState(projectId)?.values.scada ?? {};
  const protocol = intake.scadaProtocol?.trim() || "modbus_tcp";
  const poll = Number(intake.pollIntervalSec);
  const devices = Number(intake.deviceCount);
  return {
    protocol,
    protocolLabel: PROTOCOL_LABELS[protocol] ?? protocol,
    endpoint: intake.scadaEndpoint?.trim() || "10.0.0.10:502",
    pollIntervalSec:
      Number.isFinite(poll) && poll >= 1 ? Math.min(60, Math.round(poll)) : 2,
    deviceCount:
      Number.isFinite(devices) && devices >= 1
        ? Math.min(128, Math.round(devices))
        : 24,
    tagListSource: intake.tagListSource?.trim() || "tags/plant.csv",
    alertEmail: intake.alertEmail?.trim() || "ops@alcaster.local",
    criticalAlarmEnabled: (intake.criticalAlarmEnabled ?? "yes") !== "no",
    notes: intake.scadaNotes?.trim() || "",
  };
}

export function buildScadaSnapshot(
  dashboard: ProjectDashboardPayload,
  twin: TwinRecord | null,
  options: { capturedAt?: Date; tick?: number; config?: ScadaConfig } = {},
): ScadaSnapshot {
  const project = dashboard.project;
  const seed = project.id;
  const capturedAt = options.capturedAt ?? new Date();
  const tick = options.tick ?? 0;
  const config = options.config ?? readScadaConfig(project.id);
  const jitter = liveJitter(tick, seed);

  const pacMw = round(dashboard.kpis.currentOutputMw * jitter, 2);
  const dcRatio = twin?.spec.dcAcRatio ?? 1.3;
  const pdcMw = round(pacMw * dcRatio * liveJitter(tick, `${seed}:dc`, 0.012), 2);
  const gridKv = twin?.spec.gridVoltageKv ?? 132;
  const mvKv = twin?.spec.mvVoltageKv ?? 33;
  const ghi = round(
    dashboard.weather.irradianceWm2 * liveJitter(tick, `${seed}:ghi`, 0.02),
  );
  const prPct = round(
    Math.min(92, Math.max(62, dashboard.kpis.vsForecastPct * 0.82)),
    1,
  );
  const frequencyHz = round(
    mix(49.96, 50.04, `${seed}:hz`) + Math.sin(tick * 0.4) * 0.004,
    3,
  );
  const powerFactor = round(mix(0.972, 0.996, `${seed}:pf`), 3);
  const layout = twin ? buildTwinLayout(twin.spec, twin.derived) : null;
  const inverterCount = layout
    ? layout.inverters.length
    : Math.min(
        12,
        Math.max(4, Math.round(config.deviceCount / 4), Math.round(project.capacityMw / 25)),
      );
  const combinerCount = layout?.combiners.length ?? Math.max(4, inverterCount);
  const acPerInv = pacMw / Math.max(inverterCount, 1);
  const unitsPerPad = layout
    ? Math.max(1, Math.round(twin!.derived.inverterCount / inverterCount))
    : 1;
  const loadSharePct = round(
    Math.min(100, (pacMw / Math.max(project.capacityMw, 0.1)) * 100),
    1,
  );

  const inverters: ScadaInverterRow[] = Array.from(
    { length: inverterCount },
    (_, index) => {
      const tag =
        layout?.inverters[index]?.label ??
        `INV-${String(index + 1).padStart(2, "0")}`;
      const status = toStatus(`${seed}:${tag}`);
      const pac = round(
        acPerInv * factor(status, tag) * liveJitter(tick, tag, 0.025),
        2,
      );
      const vac = round(mix(395, 415, `${tag}:vac`));
      const unitPacKw = (pac * 1000) / unitsPerPad;
      return {
        id: tag.toLowerCase(),
        tag,
        status,
        pacMw: pac,
        qKvar: round(pac * 1000 * mix(0.04, 0.12, `${tag}:q`)),
        vac,
        iac: round(unitPacKw / Math.max((vac * 1.732) / 1000, 0.01)),
        efficiencyPct: round(mix(96.6, 98.7, `${tag}:eff`), 1),
        tempC: round(
          mix(38, 54, `${tag}:t`) + Math.sin(tick * 0.3 + index) * 0.4,
          1,
        ),
        vdc: round(mix(980, 1280, `${tag}:vdc`)),
        fault:
          status === "FAULT"
            ? "F12 DC overvoltage"
            : status === "WARN"
              ? "W07 high temp"
              : "None",
      };
    },
  );

  const breakers: ScadaBreakerRow[] = [
    {
      id: "52-g",
      tag: "52-G",
      name: "Export breaker",
      position: "CLOSED",
      currentA: round((pacMw * 1000) / (mvKv * 1.732), 1),
      voltageKv: mvKv,
      status: "RUN",
    },
    {
      id: "52-t1",
      tag: "52-T1",
      name: "XFMR HV",
      position: "CLOSED",
      currentA: round((pacMw * 1000) / (mvKv * 1.732) * 0.98, 1),
      voltageKv: mvKv,
      status: "RUN",
    },
    {
      id: "52-f1",
      tag: "52-F1",
      name: "Feeder 1",
      position: inverters.some((r) => r.status === "FAULT") ? "TRIP" : "CLOSED",
      currentA: round((pacMw * 1000) / (mvKv * 1.732) * 0.52, 1),
      voltageKv: mvKv,
      status: inverters.some((r) => r.status === "FAULT") ? "FAULT" : "RUN",
    },
    {
      id: "52-f2",
      tag: "52-F2",
      name: "Feeder 2",
      position: "CLOSED",
      currentA: round((pacMw * 1000) / (mvKv * 1.732) * 0.48, 1),
      voltageKv: mvKv,
      status: "RUN",
    },
  ];

  const arrayStatus = inverters.some((row) => row.status === "FAULT")
    ? "WARN"
    : "RUN";
  const invWarn = inverters.find((row) => row.status !== "RUN");
  const xfmrStatus = toStatus(`${seed}:xfmr`);

  const nodes: ScadaNode[] = [
    {
      id: "array",
      name: "PV ARRAYS",
      kind: "array",
      status: arrayStatus,
      primary: `${pdcMw} MW`,
      secondary: `${ghi} W/m²`,
      points: [
        point("PV.P_DC", "Array DC power", String(pdcMw), "MW"),
        point("MET.GHI", "Global irradiance", String(ghi), "W/m²"),
        point(
          "PV.STRINGS",
          "Strings in service",
          String(twin?.derived.stringCount ?? inverterCount * 16),
        ),
        point(
          "PV.AVAIL",
          "Array availability",
          `${dashboard.kpis.availabilityPct}`,
          "%",
        ),
      ],
    },
    {
      id: "combiner",
      name: "COMBINERS",
      kind: "combiner",
      status: "RUN",
      primary: `${combinerCount} bays`,
      secondary: "DC bus",
      points: [
        point("CB.COUNT", "Combiner count", String(combinerCount)),
        point(
          "CB.V_DC",
          "DC bus voltage",
          String(round(mix(1020, 1180, `${seed}:cbv`))),
          "V",
        ),
        point("CB.FUSE", "Fuse status", "Healthy"),
      ],
    },
    {
      id: "inverter",
      name: "INVERTERS",
      kind: "inverter",
      status: invWarn?.status ?? "RUN",
      primary: `${pacMw} MW`,
      secondary: `${inverterCount} pads`,
      points: [
        point("INV.P_AC", "Inverter AC power", String(pacMw), "MW"),
        point("INV.COUNT", "Inverter pads", String(inverterCount)),
        point("INV.UNITS", "Units per pad", String(unitsPerPad)),
        point(
          "INV.EFF",
          "Weighted efficiency",
          `${round(mix(97.1, 98.4, `${seed}:eff`), 1)}`,
          "%",
        ),
      ],
    },
    {
      id: "transformer",
      name: "XFMR-01",
      kind: "transformer",
      status: xfmrStatus,
      primary: `${round(pacMw * 0.997, 1)} MW`,
      secondary: `${twin?.spec.transformerMva ?? Math.round(project.capacityMw * 1.1)} MVA`,
      points: [
        point("XFMR.P", "Throughput", String(round(pacMw * 0.997, 1)), "MW"),
        point(
          "XFMR.OIL",
          "Oil temperature",
          String(round(mix(48, 66, `${seed}:oil`) + Math.sin(tick * 0.2) * 0.3, 1)),
          "°C",
        ),
        point(
          "XFMR.TAP",
          "Tap position",
          String(Math.round(mix(-1, 2, `${seed}:tap`))),
        ),
        point("XFMR.HV", "HV voltage", String(mvKv), "kV"),
      ],
    },
    {
      id: "substation",
      name: "SUB-01",
      kind: "substation",
      status: "RUN",
      primary: `${mvKv} kV`,
      secondary: "Breakers closed",
      points: [
        point("SUB.V_BUS", "MV bus voltage", String(mvKv), "kV"),
        point("SUB.BRK", "Export breaker", "CLOSED"),
        point(
          "SUB.I",
          "Export current",
          String(round((pacMw * 1000) / (mvKv * 1.732), 1)),
          "A",
        ),
      ],
    },
    {
      id: "grid",
      name: "GRID-01",
      kind: "grid",
      status: "RUN",
      primary: `${pacMw} MW`,
      secondary: `${gridKv} kV`,
      points: [
        point("POI.P", "POI export", String(pacMw), "MW"),
        point("POI.V", "POI voltage", String(gridKv), "kV"),
        point("POI.F", "Frequency", String(frequencyHz), "Hz"),
        point("POI.PF", "Power factor", String(powerFactor)),
      ],
    },
    {
      id: "met",
      name: "MET-01",
      kind: "met",
      status: "RUN",
      primary: `${ghi} W/m²`,
      secondary: `${dashboard.weather.temperatureC} °C`,
      points: [
        point("MET.GHI", "GHI", String(ghi), "W/m²"),
        point(
          "MET.TAMB",
          "Ambient",
          String(dashboard.weather.temperatureC),
          "°C",
        ),
        point("MET.WIND", "Wind", String(dashboard.weather.windKmh), "km/h"),
        point(
          "MET.CLOUD",
          "Cloud cover",
          String(dashboard.weather.cloudCoverPct),
          "%",
        ),
      ],
    },
  ];

  const extraAlarms: ScadaAlarm[] = inverters
    .filter((row) => row.status !== "RUN")
    .map((row, index) => ({
      id: `${row.id}-alm`,
      time: clockAt(capturedAt, 3 + index * 2),
      priority: (row.status === "FAULT" ? "P1" : "P2") as AlarmPriority,
      state: "UNACK" as const,
      tag: `${row.tag}.STATUS`,
      message: row.fault,
      quality: "GOOD" as const,
    }));

  const mappedAlarms: ScadaAlarm[] = dashboard.alerts.map((alert, index) => ({
    id: alert.id,
    time: clockAt(capturedAt, 4 + index * 6),
    priority: alarmPriority(alert.severity),
    state: alert.severity === "info" ? "ACK" : "UNACK",
    tag: alert.severity === "info" ? "SYS.INFO" : "PLT.ALM",
    message: alert.title,
    quality: "GOOD",
  }));

  const alarms = [...extraAlarms, ...mappedAlarms].sort((a, b) =>
    a.priority.localeCompare(b.priority),
  );

  const channels: ScadaChannel[] = [
    {
      id: "plc",
      name: "PLC-01 Plant",
      protocol: config.protocolLabel,
      status: "CONNECTED",
      latencyMs: round(mix(8, 18, `${seed}:plc`) + Math.sin(tick) * 1.5),
      lastRx: clockAt(capturedAt, 0),
    },
    {
      id: "inv",
      name: "INV Gateway",
      protocol: "IEC 61850",
      status: invWarn ? "DEGRADED" : "CONNECTED",
      latencyMs: round(mix(12, 28, `${seed}:invgw`)),
      lastRx: clockAt(capturedAt, 0),
    },
    {
      id: "sub",
      name: "RTU-SUB",
      protocol: "DNP3",
      status: "CONNECTED",
      latencyMs: round(mix(10, 22, `${seed}:rtu`)),
      lastRx: clockAt(capturedAt, 0),
    },
    {
      id: "met",
      name: "MET-01",
      protocol: "Modbus RTU",
      status: "CONNECTED",
      latencyMs: round(mix(6, 14, `${seed}:met`)),
      lastRx: clockAt(capturedAt, 0),
    },
    {
      id: "poi",
      name: "Grid IED",
      protocol: "IEC 61850",
      status: "CONNECTED",
      latencyMs: round(mix(9, 16, `${seed}:ied`)),
      lastRx: clockAt(capturedAt, 0),
    },
  ];

  const setpoints: ScadaSetpoint[] = [
    {
      id: "pset",
      label: "Active power",
      tag: "PLT.P_SET",
      value: String(round(project.capacityMw * 0.9, 1)),
      unit: "MW",
    },
    {
      id: "qset",
      label: "Reactive power",
      tag: "PLT.Q_SET",
      value: "0.0",
      unit: "Mvar",
    },
    {
      id: "pf",
      label: "Power factor",
      tag: "PLT.PF_SET",
      value: "0.995",
      unit: "",
    },
    {
      id: "curtail",
      label: "Curtailment",
      tag: "PLT.CURTAIL",
      value: "0",
      unit: "%",
    },
  ];

  const events: ScadaEvent[] = [
    {
      id: `${seed}-scan-${tick}`,
      time: clockAt(capturedAt, 0),
      source: "SCADA",
      message: `Scan cycle #${tick + 1} · ${config.pollIntervalSec * 1000} ms · ${config.endpoint}`,
    },
    ...dashboard.activity.map((item) => ({
      id: item.id,
      time: item.time.length === 5 ? `${item.time}:00` : item.time,
      source: "HMI",
      message: item.description,
    })),
  ];

  const generation = dashboard.generationSeries;
  const chartHours = generation.map((g) => `${g.hour}:00`);
  const chartSeries: ChartSeries[] = [
    {
      id: "pac",
      label: "P AC",
      color: "#3b82f6",
      values: generation.map((g) =>
        round(g.actual * liveJitter(tick, `${g.hour}:pac`, 0.015), 2),
      ),
    },
    {
      id: "pdc",
      label: "P DC",
      color: "#e6740a",
      values: generation.map((g) =>
        round(g.actual * dcRatio * liveJitter(tick, `${g.hour}:pdc`, 0.012), 2),
      ),
    },
    {
      id: "q",
      label: "Q",
      color: "#a78bfa",
      values: generation.map((g) => round(g.actual * 0.12, 2)),
    },
    {
      id: "ghi",
      label: "GHI",
      color: "#e06b75",
      values: generation.map((g) => round(g.forecast * 0.9, 2)),
    },
    {
      id: "target",
      label: "Setpoint",
      color: "#2a9d6e",
      values: generation.map((g) => g.target),
    },
  ];

  const unack = alarms.filter((a) => a.state === "UNACK").length;
  const metrics: ScadaMetricCard[] = [
    {
      id: "pac",
      label: "Active power",
      value: pacMw.toFixed(2),
      unit: "MW",
      deltaPct: round(loadSharePct - 70, 1),
      tone: pacMw > 0 ? "ok" : "neutral",
    },
    {
      id: "pdc",
      label: "DC power",
      value: pdcMw.toFixed(2),
      unit: "MW",
      deltaPct: round((pdcMw / Math.max(pacMw, 0.1) - 1.2) * 40, 1),
      tone: "ok",
    },
    {
      id: "pr",
      label: "Performance ratio",
      value: prPct.toFixed(1),
      unit: "%",
      deltaPct: round(prPct - 80, 1),
      tone: prPct >= 78 ? "ok" : "warn",
    },
    {
      id: "avail",
      label: "Availability",
      value: dashboard.kpis.availabilityPct.toFixed(1),
      unit: "%",
      deltaPct: 0.4,
      tone: dashboard.kpis.availabilityPct >= 95 ? "ok" : "warn",
    },
    {
      id: "ghi",
      label: "GHI",
      value: String(ghi),
      unit: "W/m²",
      deltaPct: round((ghi / 900 - 1) * 20, 1),
      tone: "neutral",
    },
    {
      id: "freq",
      label: "Frequency",
      value: frequencyHz.toFixed(3),
      unit: "Hz",
      deltaPct: round((frequencyHz - 50) * 100, 2),
      tone: Math.abs(frequencyHz - 50) < 0.05 ? "ok" : "warn",
    },
    {
      id: "alarms",
      label: "Unack alarms",
      value: String(unack),
      unit: "",
      deltaPct: unack > 0 ? unack : 0,
      tone: unack === 0 ? "ok" : unack > 2 ? "fault" : "warn",
    },
  ];

  return {
    plantName: project.name,
    projectId: project.id,
    capturedAt: capturedAt.toISOString(),
    scanMs: config.pollIntervalSec * 1000,
    mode: "AUTO",
    tick,
    config,
    kpis: {
      pacMw,
      pdcMw,
      prPct,
      availabilityPct: dashboard.kpis.availabilityPct,
      ghi,
      frequencyHz,
      powerFactor,
      gridKv,
      energyTodayMwh: dashboard.kpis.todayGenerationMwh,
      loadSharePct,
    },
    metrics,
    nodes,
    inverters,
    breakers,
    alarms,
    channels,
    setpoints,
    events,
    series: dashboard.generationSeries,
    chartHours,
    chartSeries,
    weather: dashboard.weather,
  };
}
