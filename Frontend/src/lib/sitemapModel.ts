import type { TwinRecord } from "@/lib/api";
import {
  buildTwinLayout,
  tableFootprint,
  type TwinLayout,
} from "@/lib/twinLayout";

export type SitemapStatus = "ONLINE" | "WARNING" | "OFFLINE";

export type SitemapKind =
  | "table"
  | "combiner"
  | "inverter"
  | "transformer"
  | "substation"
  | "grid"
  | "building"
  | "weather";

export type InfoRow = {
  label: string;
  value: string;
};

export type SitemapComponent = {
  id: string;
  kind: SitemapKind;
  name: string;
  typeLabel: string;
  status: SitemapStatus;
  rows: InfoRow[];
  x: number;
  z: number;
  w: number;
  d: number;
  rotY: number;
};

export type SitemapModel = {
  layout: TwinLayout;
  components: SitemapComponent[];
  plantLoadPct: number;
  irradiance: number;
  ambientC: number;
  exportMw: number;
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

function statusOf(seed: string): SitemapStatus {
  const roll = unit(`${seed}:status`);
  if (roll > 0.985) return "OFFLINE";
  if (roll > 0.93) return "WARNING";
  return "ONLINE";
}

function factorFor(status: SitemapStatus, seed: string): number {
  if (status === "OFFLINE") return 0;
  if (status === "WARNING") return mix(0.52, 0.78, `${seed}:f`);
  return mix(0.92, 1.04, `${seed}:f`);
}

export function buildSitemapModel(twin: TwinRecord): SitemapModel {
  const layout = buildTwinLayout(twin.spec, twin.derived);
  const { spec, derived } = twin;
  const seed = twin.id;
  const irradiance = round(mix(780, 980, `${seed}:ghi`));
  const ambientC = round(mix(28, 38, `${seed}:tamb`));
  const plantLoadPct = round(mix(62, 88, `${seed}:load`), 1);
  const exportMw = round(spec.capacityMw * (plantLoadPct / 100), 2);
  const tableCount = Math.max(1, layout.tables.length);
  const dcPerTableMw = derived.dcCapacityMwp / tableCount;
  const invCount = Math.max(1, layout.inverters.length);
  const acPerInvMw = exportMw / invCount;
  const components: SitemapComponent[] = [];

  layout.tables.forEach((table, index) => {
    const id = `tbl-${String(index + 1).padStart(3, "0")}`;
    const status = statusOf(`${seed}:${id}`);
    const footprint = tableFootprint(table.tracker);
    const modules = table.rows * table.cols;
    const dcKw = dcPerTableMw * 1000 * factorFor(status, id) * (plantLoadPct / 100);
    components.push({
      id,
      kind: "table",
      name: `TBL-${String(index + 1).padStart(3, "0")}`,
      typeLabel: table.tracker ? "Tracker table" : "Fixed-tilt table",
      status,
      x: table.x,
      z: table.z,
      w: table.tracker ? footprint.across : footprint.along,
      d: table.tracker ? footprint.along : footprint.across,
      rotY: table.rotY,
      rows: [
        { label: "DC output", value: `${round(dcKw, 1)} kW` },
        { label: "Modules", value: String(modules) },
        {
          label: "POA irradiance",
          value: `${round(irradiance * mix(0.96, 1.04, `${id}:poa`))} W/m²`,
        },
        {
          label: "Module temp",
          value: `${round(ambientC + mix(12, 22, `${id}:t`))} °C`,
        },
        {
          label: "Availability",
          value:
            status === "OFFLINE"
              ? "0%"
              : `${round(mix(97.2, 99.8, `${id}:a`), 1)}%`,
        },
        {
          label: "Strings",
          value: String(Math.max(1, Math.round(modules / spec.modulesPerString))),
        },
      ],
    });
  });

  layout.combiners.forEach((combiner, index) => {
    const id = `cb-${String(index + 1).padStart(2, "0")}`;
    const status = statusOf(`${seed}:${id}`);
    const strings = Math.max(
      4,
      Math.round(derived.stringCount / Math.max(1, layout.combiners.length)),
    );
    components.push({
      id,
      kind: "combiner",
      name: `CB-${String(index + 1).padStart(2, "0")}`,
      typeLabel: "DC combiner",
      status,
      x: combiner.x,
      z: combiner.z,
      w: 1.7,
      d: 1.7,
      rotY: 0,
      rows: [
        { label: "DC current", value: `${round(mix(180, 420, id))} A` },
        { label: "DC voltage", value: `${round(mix(980, 1280, `${id}:v`))} V` },
        { label: "Strings in", value: String(strings) },
        {
          label: "Fuse status",
          value: status === "WARNING" ? "1 open" : "All healthy",
        },
        {
          label: "Cabinet temp",
          value: `${round(ambientC + mix(6, 14, `${id}:t`))} °C`,
        },
      ],
    });
  });

  layout.inverters.forEach((inverter, index) => {
    const name = inverter.label ?? `INV-${String(index + 1).padStart(2, "0")}`;
    const id = name.toLowerCase();
    const status = statusOf(`${seed}:${id}`);
    const unitsPerPad = Math.max(
      1,
      Math.round(derived.inverterCount / invCount),
    );
    const padRatingMw = (spec.inverterRatingKw * unitsPerPad) / 1000;
    const pac = acPerInvMw * factorFor(status, id);
    components.push({
      id,
      kind: "inverter",
      name,
      typeLabel:
        spec.inverterType === "central" ? "Central inverter" : "String inverter",
      status,
      x: inverter.x,
      z: inverter.z,
      w: 4.6,
      d: 3.2,
      rotY: 0,
      rows: [
        { label: "AC power", value: `${round(pac, 2)} MW` },
        {
          label: "Pad rating",
          value: `${round(padRatingMw, 1)} MW`,
        },
        {
          label: "Units on pad",
          value: String(unitsPerPad),
        },
        {
          label: "Efficiency",
          value: `${round(mix(96.4, 98.6, `${id}:eff`), 1)}%`,
        },
        {
          label: "Loading",
          value: `${round((pac / Math.max(padRatingMw, 0.01)) * 100, 1)}%`,
        },
        { label: "DC voltage", value: `${round(mix(1000, 1300, `${id}:v`))} V` },
        { label: "AC voltage", value: `${spec.mvVoltageKv} kV` },
        {
          label: "Cabinet temp",
          value: `${round(mix(38, 52, `${id}:t`), 1)} °C`,
        },
      ],
    });
  });

  layout.transformers.forEach((transformer, index) => {
    const id = `xfmr-${String(index + 1).padStart(2, "0")}`;
    const status = statusOf(`${seed}:${id}`);
    components.push({
      id,
      kind: "transformer",
      name: `XFMR-${String(index + 1).padStart(2, "0")}`,
      typeLabel: "MV transformer",
      status,
      x: transformer.x,
      z: transformer.z,
      w: 7.4,
      d: 5.4,
      rotY: 0,
      rows: [
        {
          label: "Throughput",
          value: `${round(exportMw * mix(0.98, 1, id), 1)} MW`,
        },
        { label: "Rating", value: `${spec.transformerMva} MVA` },
        {
          label: "Loading",
          value: `${round(plantLoadPct * mix(0.92, 1.05, `${id}:load`), 1)}%`,
        },
        { label: "HV / LV", value: `${spec.mvVoltageKv} / 0.69 kV` },
        {
          label: "Oil temp",
          value: `${round(mix(48, 68, `${id}:oil`), 1)} °C`,
        },
        {
          label: "Tap position",
          value: String(Math.round(mix(-2, 3, `${id}:tap`))),
        },
      ],
    });
  });

  const subStatus = statusOf(`${seed}:sub-01`);
  components.push({
    id: "sub-01",
    kind: "substation",
    name: "SUB-01",
    typeLabel: "Plant substation",
    status: subStatus,
    x: layout.substation.x,
    z: layout.substation.z,
    w: 9.6,
    d: 7.2,
    rotY: 0,
    rows: [
      { label: "Export", value: `${round(exportMw * 0.995, 2)} MW` },
      { label: "Bus voltage", value: `${spec.mvVoltageKv} kV` },
      { label: "Grid voltage", value: `${spec.gridVoltageKv} kV` },
      {
        label: "Breakers",
        value: subStatus === "WARNING" ? "1 alarm" : "Closed",
      },
      {
        label: "Frequency",
        value: `${round(mix(49.94, 50.06, `${seed}:hz`), 2)} Hz`,
      },
    ],
  });

  const gridStatus = statusOf(`${seed}:grid-01`);
  components.push({
    id: "grid-01",
    kind: "grid",
    name: "GRID-01",
    typeLabel: "Grid interconnection",
    status: gridStatus,
    x: layout.grid.x,
    z: layout.grid.z,
    w: 7.2,
    d: 5.4,
    rotY: 0,
    rows: [
      { label: "POI export", value: `${exportMw} MW` },
      { label: "POI voltage", value: `${spec.gridVoltageKv} kV` },
      {
        label: "Power factor",
        value: round(mix(0.97, 0.995, `${seed}:pf`), 3).toFixed(3),
      },
      {
        label: "Setpoint",
        value: `${round(spec.capacityMw * 0.9, 1)} MW`,
      },
      {
        label: "Curtailment",
        value: gridStatus === "WARNING" ? "Active" : "None",
      },
    ],
  });

  if (layout.building) {
    components.push({
      id: "bldg-01",
      kind: "building",
      name: "CRB-01",
      typeLabel: "Control room",
      status: "ONLINE",
      x: layout.building.x,
      z: layout.building.z,
      w: 6.4,
      d: 4.8,
      rotY: 0,
      rows: [
        { label: "Occupancy", value: "Staffed" },
        { label: "HVAC", value: "Normal" },
        { label: "UPS", value: `${round(mix(92, 99, `${seed}:ups`))}%` },
        { label: "SCADA link", value: "Healthy" },
      ],
    });
  }

  if (layout.weather) {
    components.push({
      id: "met-01",
      kind: "weather",
      name: "MET-01",
      typeLabel: "Weather station",
      status: "ONLINE",
      x: layout.weather.x,
      z: layout.weather.z,
      w: 3.2,
      d: 3.2,
      rotY: 0,
      rows: [
        { label: "GHI", value: `${irradiance} W/m²` },
        { label: "Ambient", value: `${ambientC} °C` },
        { label: "Wind", value: `${round(mix(1.4, 5.8, `${seed}:wind`), 1)} m/s` },
        { label: "Humidity", value: `${round(mix(28, 62, `${seed}:rh`))}%` },
      ],
    });
  }

  return {
    layout,
    components,
    plantLoadPct,
    irradiance,
    ambientC,
    exportMw,
  };
}

export const SLD_STAGES: Array<{
  kind: SitemapKind;
  label: string;
}> = [
  { kind: "table", label: "PV arrays" },
  { kind: "combiner", label: "Combiners" },
  { kind: "inverter", label: "Inverters" },
  { kind: "transformer", label: "Transformer" },
  { kind: "substation", label: "Substation" },
  { kind: "grid", label: "Grid" },
];
