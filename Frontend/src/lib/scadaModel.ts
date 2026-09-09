import type {
  OperationalAlert,
  ProjectDashboardPayload,
  TwinRecord,
} from "@/lib/api";
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

export type ScadaSnapshot = {
  plantName: string;
  projectId: string;
  capturedAt: string;
  scanMs: number;
  mode: "AUTO";
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
  };
  nodes: ScadaNode[];
  inverters: ScadaInverterRow[];
  alarms: ScadaAlarm[];
  channels: ScadaChannel[];
  setpoints: ScadaSetpoint[];
  events: ScadaEvent[];
  series: ProjectDashboardPayload["generationSeries"];
  weather: ProjectDashboardPayload["weather"];
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

function point(
  tag: string,
  desc: string,
  value: string,
  unit?: string,
): ScadaPoint {
  return { tag, desc, value, unit, quality: "GOOD" };
}

function alarmPriority(severity: OperationalAlert["severity"]): AlarmPriority {
  if (severity === "critical") return "P1";
  if (severity === "warning") return "P2";
  return "P4";
}

export function buildScadaSnapshot(
  dashboard: ProjectDashboardPayload,
  twin: TwinRecord | null,
  capturedAt = new Date(),
): ScadaSnapshot {
  const project = dashboard.project;
  const seed = project.id;
  const pacMw = dashboard.kpis.currentOutputMw;
  const dcRatio = twin?.spec.dcAcRatio ?? 1.3;
  const pdcMw = round(pacMw * dcRatio, 2);
  const gridKv = twin?.spec.gridVoltageKv ?? 132;
  const mvKv = twin?.spec.mvVoltageKv ?? 33;
  const ghi = dashboard.weather.irradianceWm2;
  const prPct = round(
    Math.min(92, Math.max(62, dashboard.kpis.vsForecastPct * 0.82)),
    1,
  );
  const frequencyHz = round(mix(49.96, 50.04, `${seed}:hz`), 3);
  const powerFactor = round(mix(0.972, 0.996, `${seed}:pf`), 3);
  const layout = twin ? buildTwinLayout(twin.spec, twin.derived) : null;
  const inverterCount = layout
    ? layout.inverters.length
    : Math.min(8, Math.max(4, Math.round(project.capacityMw / 25)));
  const combinerCount = layout?.combiners.length ?? Math.max(4, inverterCount);
  const acPerInv = pacMw / Math.max(inverterCount, 1);
  const unitsPerPad = layout
    ? Math.max(1, Math.round(twin!.derived.inverterCount / inverterCount))
    : 1;

  const inverters: ScadaInverterRow[] = Array.from(
    { length: inverterCount },
    (_, index) => {
      const tag =
        layout?.inverters[index]?.label ??
        `INV-${String(index + 1).padStart(2, "0")}`;
      const status = toStatus(`${seed}:${tag}`);
      const pac = round(acPerInv * factor(status, tag), 2);
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
        tempC: round(mix(38, 54, `${tag}:t`), 1),
        vdc: round(mix(980, 1280, `${tag}:vdc`)),
        fault: status === "FAULT" ? "F12 DC overvoltage" : status === "WARN" ? "W07 high temp" : "None",
      };
    },
  );

  const arrayStatus = inverters.some((row) => row.status === "FAULT")
    ? "WARN"
    : "RUN";
  const invWarn = inverters.find((row) => row.status !== "RUN");

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
        point("PV.STRINGS", "Strings in service", String(twin?.derived.stringCount ?? inverterCount * 16)),
        point("PV.AVAIL", "Array availability", `${dashboard.kpis.availabilityPct}`, "%"),
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
        point("CB.V_DC", "DC bus voltage", String(round(mix(1020, 1180, `${seed}:cbv`))), "V"),
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
        point("INV.EFF", "Weighted efficiency", `${round(mix(97.1, 98.4, `${seed}:eff`), 1)}`, "%"),
      ],
    },
    {
      id: "transformer",
      name: "XFMR-01",
      kind: "transformer",
      status: toStatus(`${seed}:xfmr`),
      primary: `${round(pacMw * 0.997, 1)} MW`,
      secondary: `${twin?.spec.transformerMva ?? Math.round(project.capacityMw * 1.1)} MVA`,
      points: [
        point("XFMR.P", "Throughput", String(round(pacMw * 0.997, 1)), "MW"),
        point("XFMR.OIL", "Oil temperature", String(round(mix(48, 66, `${seed}:oil`), 1)), "°C"),
        point("XFMR.TAP", "Tap position", String(Math.round(mix(-1, 2, `${seed}:tap`)))),
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
        point("SUB.I", "Export current", String(round((pacMw * 1000) / (mvKv * 1.732), 1)), "A"),
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
        point("MET.TAMB", "Ambient", String(dashboard.weather.temperatureC), "°C"),
        point("MET.WIND", "Wind", String(dashboard.weather.windKmh), "km/h"),
        point("MET.CLOUD", "Cloud cover", String(dashboard.weather.cloudCoverPct), "%"),
      ],
    },
  ];

  const extraAlarms: ScadaAlarm[] = inverters
    .filter((row) => row.status !== "RUN")
    .map((row, index) => ({
      id: `${row.id}-alm`,
      time: clockAt(capturedAt, 3 + index * 2),
      priority: row.status === "FAULT" ? "P1" : "P2",
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
      protocol: "Modbus TCP",
      status: "CONNECTED",
      latencyMs: round(mix(8, 18, `${seed}:plc`)),
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
    ...dashboard.activity.map((item) => ({
      id: item.id,
      time: item.time.length === 5 ? `${item.time}:00` : item.time,
      source: "HMI",
      message: item.description,
    })),
    {
      id: `${seed}-scan`,
      time: clockAt(capturedAt, 0),
      source: "SCADA",
      message: "Static snapshot loaded — live feed not connected",
    },
  ];

  return {
    plantName: project.name,
    projectId: project.id,
    capturedAt: capturedAt.toISOString(),
    scanMs: 2000,
    mode: "AUTO",
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
    },
    nodes,
    inverters,
    alarms,
    channels,
    setpoints,
    events,
    series: dashboard.generationSeries,
    weather: dashboard.weather,
  };
}
