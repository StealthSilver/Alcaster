/**
 * Ordered plant products and the data each one needs before it can run.
 * Completion of product N unlocks product N+1 — products “start running”
 * as soon as their intake is marked complete.
 */

export const PLANT_PRODUCT_IDS = [
  "dashboard",
  "scada",
  "forecast",
  "cmms",
  "data-explorer",
  "rule-engine",
  "ems",
  "dt-normal",
  "dt-assets",
  "dt-electrical",
  "dt-monitoring",
  "dt-historical",
  "dt-maintenance",
  "dt-simulation",
  "dt-operational",
  "dt-forecasting",
] as const;

export type PlantProductId = (typeof PLANT_PRODUCT_IDS)[number];

export type ProductFieldType =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "date"
  | "url"
  | "yesno";

export type ProductFieldOption = { value: string; label: string };

export type ProductField = {
  key: string;
  label: string;
  type: ProductFieldType;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options?: ProductFieldOption[];
  min?: number;
  step?: string;
};

export type PlantProduct = {
  id: PlantProductId;
  code: string;
  name: string;
  shortName: string;
  group: "core" | "digital-twin";
  description: string;
  /** What the product delivers once intake is complete. */
  enables: string;
  /** Special intake UI (existing twin wizard). */
  intake?: "form" | "twin";
  fields: ProductField[];
};

const YES_NO: ProductFieldOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const PLANT_PRODUCTS: PlantProduct[] = [
  {
    id: "dashboard",
    code: "1",
    name: "Dashboard (CMS)",
    shortName: "Dashboard",
    group: "core",
    description:
      "Conventional CMS dashboard — plant identity, portfolio KPIs, and operating context.",
    enables: "Portfolio summary, plant dashboard, capacity and status widgets",
    fields: [
      {
        key: "operatorName",
        label: "Plant operator",
        type: "text",
        required: true,
        placeholder: "Operating company",
      },
      {
        key: "timezone",
        label: "Plant timezone",
        type: "select",
        required: true,
        options: [
          { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
          { value: "UTC", label: "UTC" },
          { value: "America/New_York", label: "America/New_York" },
          { value: "Europe/Berlin", label: "Europe/Berlin" },
          { value: "Asia/Dubai", label: "Asia/Dubai" },
        ],
      },
      {
        key: "codDate",
        label: "Commercial operation date",
        type: "date",
        required: true,
      },
      {
        key: "reportingCurrency",
        label: "Reporting currency",
        type: "select",
        required: true,
        options: [
          { value: "INR", label: "INR" },
          { value: "USD", label: "USD" },
          { value: "EUR", label: "EUR" },
        ],
      },
      {
        key: "expectedAnnualGenerationMwh",
        label: "Expected annual generation (MWh)",
        type: "number",
        required: true,
        min: 0,
        step: "1",
        hint: "Used for portfolio production targets",
      },
      {
        key: "performanceRatioTarget",
        label: "Target performance ratio (%)",
        type: "number",
        required: true,
        min: 0,
        step: "0.1",
      },
      {
        key: "dashboardNotes",
        label: "CMS notes",
        type: "textarea",
        placeholder: "Any portfolio or reporting notes",
      },
    ],
  },
  {
    id: "scada",
    code: "2",
    name: "Live SCADA + Monitoring + Alerts",
    shortName: "SCADA",
    group: "core",
    description:
      "Live telemetry, device monitoring, and operational alerts for the plant.",
    enables: "SCADA views, live monitoring, alert routing",
    fields: [
      {
        key: "scadaProtocol",
        label: "Primary protocol",
        type: "select",
        required: true,
        options: [
          { value: "modbus_tcp", label: "Modbus TCP" },
          { value: "opc_ua", label: "OPC UA" },
          { value: "iec104", label: "IEC 60870-5-104" },
          { value: "mqtt", label: "MQTT" },
          { value: "rest", label: "REST / HTTPS" },
        ],
      },
      {
        key: "scadaEndpoint",
        label: "SCADA / gateway endpoint",
        type: "text",
        required: true,
        placeholder: "host:port or URL",
      },
      {
        key: "pollIntervalSec",
        label: "Poll interval (seconds)",
        type: "number",
        required: true,
        min: 1,
        step: "1",
      },
      {
        key: "deviceCount",
        label: "Monitored device count",
        type: "number",
        required: true,
        min: 1,
        step: "1",
      },
      {
        key: "tagListSource",
        label: "Tag / point list source",
        type: "text",
        required: true,
        placeholder: "Export file name or historian path",
      },
      {
        key: "alertEmail",
        label: "Alert notification email",
        type: "text",
        required: true,
        placeholder: "ops@example.com",
      },
      {
        key: "criticalAlarmEnabled",
        label: "Critical alarm routing enabled",
        type: "yesno",
        required: true,
        options: YES_NO,
      },
      {
        key: "scadaNotes",
        label: "SCADA notes",
        type: "textarea",
      },
    ],
  },
  {
    id: "forecast",
    code: "3",
    name: "Forecast & Scheduling",
    shortName: "Forecast",
    group: "core",
    description:
      "Generation forecast and scheduling — weather / WMS inputs required.",
    enables: "Forecasting, day-ahead schedules, weather-driven outlook",
    fields: [
      {
        key: "wmsProvider",
        label: "WMS / weather provider",
        type: "select",
        required: true,
        options: [
          { value: "on_site", label: "On-site weather station" },
          { value: "solcast", label: "Solcast" },
          { value: "meteomatics", label: "Meteomatics" },
          { value: "openweather", label: "OpenWeather" },
          { value: "other", label: "Other" },
        ],
      },
      {
        key: "wmsStationId",
        label: "Weather station / WMS ID",
        type: "text",
        required: true,
      },
      {
        key: "wmsApiEndpoint",
        label: "WMS API endpoint",
        type: "url",
        required: true,
        placeholder: "https://…",
      },
      {
        key: "irradianceSource",
        label: "Irradiance source",
        type: "select",
        required: true,
        options: [
          { value: "ghi", label: "GHI" },
          { value: "poa", label: "POA" },
          { value: "both", label: "GHI + POA" },
        ],
      },
      {
        key: "forecastHorizonHours",
        label: "Forecast horizon (hours)",
        type: "number",
        required: true,
        min: 1,
        step: "1",
      },
      {
        key: "scheduleGranularityMin",
        label: "Schedule granularity (minutes)",
        type: "number",
        required: true,
        min: 5,
        step: "5",
      },
      {
        key: "weatherInputs",
        label: "Additional weather inputs",
        type: "textarea",
        placeholder: "Temp, wind, humidity, cloud cover…",
      },
    ],
  },
  {
    id: "cmms",
    code: "4",
    name: "Conventional CMMS",
    shortName: "CMMS",
    group: "core",
    description:
      "Maintenance management — assets, work orders, and spare parts.",
    enables: "Work orders, maintenance schedules, spare inventory",
    fields: [
      {
        key: "cmmsSystem",
        label: "CMMS system",
        type: "select",
        required: true,
        options: [
          { value: "alcaster", label: "Alcaster CMMS" },
          { value: "sap_pm", label: "SAP PM" },
          { value: "maximo", label: "IBM Maximo" },
          { value: "other", label: "Other / external" },
        ],
      },
      {
        key: "maintenanceTeamLead",
        label: "Maintenance team lead",
        type: "text",
        required: true,
      },
      {
        key: "preventiveIntervalDays",
        label: "Default preventive interval (days)",
        type: "number",
        required: true,
        min: 1,
        step: "1",
      },
      {
        key: "criticalSparesTracked",
        label: "Critical spares tracked",
        type: "yesno",
        required: true,
        options: YES_NO,
      },
      {
        key: "workOrderCategories",
        label: "Work order categories",
        type: "textarea",
        required: true,
        placeholder: "Corrective, preventive, inspection…",
      },
      {
        key: "cmmsNotes",
        label: "CMMS notes",
        type: "textarea",
      },
    ],
  },
  {
    id: "data-explorer",
    code: "5",
    name: "Data Explorer",
    shortName: "Data Explorer",
    group: "core",
    description:
      "Explore historical and live plant datasets across sources.",
    enables: "Ad-hoc queries, trends, data catalog",
    fields: [
      {
        key: "primaryHistorian",
        label: "Primary historian / store",
        type: "text",
        required: true,
        placeholder: "e.g. Timescale, Influx, PI",
      },
      {
        key: "retentionDays",
        label: "Raw data retention (days)",
        type: "number",
        required: true,
        min: 1,
        step: "1",
      },
      {
        key: "measurementGroups",
        label: "Measurement groups",
        type: "textarea",
        required: true,
        placeholder: "Generation, irradiance, inverters, meteo…",
      },
      {
        key: "exportFormats",
        label: "Export formats",
        type: "text",
        required: true,
        placeholder: "CSV, Parquet, JSON",
      },
      {
        key: "dataCatalogReady",
        label: "Data catalog seeded",
        type: "yesno",
        required: true,
        options: YES_NO,
      },
    ],
  },
  {
    id: "rule-engine",
    code: "6",
    name: "Rule Engine + Formulas",
    shortName: "Rules",
    group: "core",
    description:
      "Derived metrics, formulas, and automated operational rules.",
    enables: "Calculated KPIs, rule triggers, formula library",
    fields: [
      {
        key: "formulaLanguage",
        label: "Formula language",
        type: "select",
        required: true,
        options: [
          { value: "alcaster", label: "Alcaster formulas" },
          { value: "sql", label: "SQL expressions" },
          { value: "js", label: "JavaScript" },
        ],
      },
      {
        key: "coreFormulas",
        label: "Core formulas to enable",
        type: "textarea",
        required: true,
        placeholder: "PR, availability, specific yield…",
      },
      {
        key: "ruleEvaluationIntervalSec",
        label: "Rule evaluation interval (seconds)",
        type: "number",
        required: true,
        min: 1,
        step: "1",
      },
      {
        key: "alertOnRuleFail",
        label: "Raise alert when rule fails",
        type: "yesno",
        required: true,
        options: YES_NO,
      },
    ],
  },
  {
    id: "ems",
    code: "7",
    name: "EMS",
    shortName: "EMS",
    group: "core",
    description:
      "Energy management — setpoints, grid constraints, and dispatch.",
    enables: "EMS control, curtailment, storage dispatch",
    fields: [
      {
        key: "gridExportLimitMw",
        label: "Grid export limit (MW)",
        type: "number",
        required: true,
        min: 0,
        step: "0.1",
      },
      {
        key: "hasBess",
        label: "BESS present",
        type: "yesno",
        required: true,
        options: YES_NO,
      },
      {
        key: "bessCapacityMwh",
        label: "BESS capacity (MWh)",
        type: "number",
        min: 0,
        step: "0.1",
        hint: "Required when BESS is present",
      },
      {
        key: "dispatchMode",
        label: "Default dispatch mode",
        type: "select",
        required: true,
        options: [
          { value: "maximize_export", label: "Maximize export" },
          { value: "peak_shave", label: "Peak shave" },
          { value: "follow_schedule", label: "Follow schedule" },
          { value: "manual", label: "Manual" },
        ],
      },
      {
        key: "emsControlEndpoint",
        label: "EMS control endpoint",
        type: "text",
        required: true,
      },
      {
        key: "emsNotes",
        label: "EMS notes",
        type: "textarea",
      },
    ],
  },
  {
    id: "dt-normal",
    code: "8A",
    name: "Digital Twin — Full plant",
    shortName: "DT Full",
    group: "digital-twin",
    description:
      "Normal digital twin with all physical plant elements in place.",
    enables: "3D / spatial twin of the full plant",
    intake: "twin",
    fields: [],
  },
  {
    id: "dt-assets",
    code: "8B",
    name: "Digital Twin — Assets",
    shortName: "DT Assets",
    group: "digital-twin",
    description: "Asset-centric twin — registry depth and tagging.",
    enables: "Asset digital twin views and selection",
    fields: [
      {
        key: "assetNamingScheme",
        label: "Asset naming scheme",
        type: "text",
        required: true,
        placeholder: "e.g. INV-{block}-{n}",
      },
      {
        key: "assetLevels",
        label: "Asset hierarchy levels",
        type: "textarea",
        required: true,
        placeholder: "Plant → Block → Inverter → String → Module",
      },
      {
        key: "includeSerialNumbers",
        label: "Track serial numbers",
        type: "yesno",
        required: true,
        options: YES_NO,
      },
      {
        key: "assetImportSource",
        label: "Asset import source",
        type: "text",
        required: true,
      },
    ],
  },
  {
    id: "dt-electrical",
    code: "8C",
    name: "Digital Twin — Electrical",
    shortName: "DT Electrical",
    group: "digital-twin",
    description: "Electrical topology twin — strings, combiners, feeders.",
    enables: "Electrical SLD twin and topology analytics",
    fields: [
      {
        key: "modulesPerString",
        label: "Modules per string",
        type: "number",
        required: true,
        min: 1,
        step: "1",
      },
      {
        key: "stringsPerCombiner",
        label: "Strings per combiner",
        type: "number",
        required: true,
        min: 1,
        step: "1",
      },
      {
        key: "voltageLevelKv",
        label: "Collection voltage (kV)",
        type: "number",
        required: true,
        min: 0,
        step: "0.1",
      },
      {
        key: "sldAvailable",
        label: "SLD / one-line available",
        type: "yesno",
        required: true,
        options: YES_NO,
      },
      {
        key: "electricalNotes",
        label: "Electrical notes",
        type: "textarea",
      },
    ],
  },
  {
    id: "dt-monitoring",
    code: "8D",
    name: "Digital Twin — Monitoring / SCADA",
    shortName: "DT Monitor",
    group: "digital-twin",
    description: "Maps twin assets to live SCADA tags and points.",
    enables: "Live twin overlays from SCADA",
    fields: [
      {
        key: "tagMappingStrategy",
        label: "Tag mapping strategy",
        type: "select",
        required: true,
        options: [
          { value: "by_asset_id", label: "By asset ID" },
          { value: "by_name", label: "By name pattern" },
          { value: "manual", label: "Manual map" },
        ],
      },
      {
        key: "liveOverlayEnabled",
        label: "Live overlay enabled",
        type: "yesno",
        required: true,
        options: YES_NO,
      },
      {
        key: "primaryTelemetryTags",
        label: "Primary telemetry tags",
        type: "textarea",
        required: true,
        placeholder: "Power, voltage, current, status…",
      },
    ],
  },
  {
    id: "dt-historical",
    code: "8E",
    name: "Digital Twin — Historical",
    shortName: "DT Historical",
    group: "digital-twin",
    description: "Time-travel twin driven by historical datasets.",
    enables: "Historical playback on the twin",
    fields: [
      {
        key: "historyStartDate",
        label: "History start date",
        type: "date",
        required: true,
      },
      {
        key: "playbackResolutionMin",
        label: "Playback resolution (minutes)",
        type: "number",
        required: true,
        min: 1,
        step: "1",
      },
      {
        key: "historySource",
        label: "History data source",
        type: "text",
        required: true,
      },
    ],
  },
  {
    id: "dt-maintenance",
    code: "8F",
    name: "Digital Twin — Maintenance",
    shortName: "DT Maintenance",
    group: "digital-twin",
    description: "Maintenance twin linked to CMMS work and asset health.",
    enables: "Maintenance overlays and work context on the twin",
    fields: [
      {
        key: "linkToCmms",
        label: "Linked to CMMS",
        type: "yesno",
        required: true,
        options: YES_NO,
      },
      {
        key: "healthScoreMethod",
        label: "Asset health score method",
        type: "text",
        required: true,
      },
      {
        key: "openWoOnTwin",
        label: "Show open work orders on twin",
        type: "yesno",
        required: true,
        options: YES_NO,
      },
    ],
  },
  {
    id: "dt-simulation",
    code: "8G",
    name: "Digital Twin — Simulation & Performance",
    shortName: "DT Simulation",
    group: "digital-twin",
    description: "Simulation and performance twin for what-if analysis.",
    enables: "Performance simulation and scenario runs",
    fields: [
      {
        key: "simulationEngine",
        label: "Simulation engine",
        type: "select",
        required: true,
        options: [
          { value: "alcaster", label: "Alcaster" },
          { value: "pvlib", label: "pvlib-based" },
          { value: "external", label: "External" },
        ],
      },
      {
        key: "baselineModel",
        label: "Baseline performance model",
        type: "text",
        required: true,
      },
      {
        key: "scenarioHorizonDays",
        label: "Default scenario horizon (days)",
        type: "number",
        required: true,
        min: 1,
        step: "1",
      },
    ],
  },
  {
    id: "dt-operational",
    code: "8H",
    name: "Digital Twin — Operational",
    shortName: "DT Operational",
    group: "digital-twin",
    description: "Operational twin for day-to-day plant running modes.",
    enables: "Operational mode views and live plant state",
    fields: [
      {
        key: "operatingModes",
        label: "Operating modes",
        type: "textarea",
        required: true,
        placeholder: "Normal, curtailed, maintenance, islanded…",
      },
      {
        key: "shiftHandoverEnabled",
        label: "Shift handover on twin",
        type: "yesno",
        required: true,
        options: YES_NO,
      },
      {
        key: "opsSopLink",
        label: "Ops SOP / runbook link",
        type: "url",
        required: true,
      },
    ],
  },
  {
    id: "dt-forecasting",
    code: "8I",
    name: "Digital Twin — Forecasting",
    shortName: "DT Forecast",
    group: "digital-twin",
    description: "Forecast twin overlays predicted generation on the plant model.",
    enables: "Forecast visualization on the digital twin",
    fields: [
      {
        key: "linkToForecastProduct",
        label: "Use Forecast & Scheduling inputs",
        type: "yesno",
        required: true,
        options: YES_NO,
      },
      {
        key: "forecastOverlayMetric",
        label: "Primary overlay metric",
        type: "select",
        required: true,
        options: [
          { value: "power", label: "Power (MW)" },
          { value: "energy", label: "Energy (MWh)" },
          { value: "pr", label: "Performance ratio" },
        ],
      },
      {
        key: "forecastConfidenceBands",
        label: "Show confidence bands",
        type: "yesno",
        required: true,
        options: YES_NO,
      },
    ],
  },
];

export function productById(id: PlantProductId): PlantProduct {
  const found = PLANT_PRODUCTS.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown product: ${id}`);
  return found;
}

export function productIndex(id: PlantProductId): number {
  return PLANT_PRODUCT_IDS.indexOf(id);
}

export function nextProductId(
  id: PlantProductId,
): PlantProductId | null {
  const index = productIndex(id);
  if (index < 0 || index >= PLANT_PRODUCT_IDS.length - 1) return null;
  return PLANT_PRODUCT_IDS[index + 1] ?? null;
}

export function previousProductId(
  id: PlantProductId,
): PlantProductId | null {
  const index = productIndex(id);
  if (index <= 0) return null;
  return PLANT_PRODUCT_IDS[index - 1] ?? null;
}

export type ProductStatus = "locked" | "available" | "complete" | "running";

export function emptyProductValues(
  product: PlantProduct,
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of product.fields) {
    values[field.key] = "";
  }
  return values;
}

export function validateProductFields(
  product: PlantProduct,
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of product.fields) {
    if (!field.required) continue;
    const raw = (values[field.key] ?? "").trim();
    if (!raw) {
      errors[field.key] = `${field.label} is required.`;
      continue;
    }
    if (field.type === "number") {
      const n = Number(raw);
      if (Number.isNaN(n)) {
        errors[field.key] = "Enter a valid number.";
      } else if (field.min != null && n < field.min) {
        errors[field.key] = `Must be at least ${field.min}.`;
      }
    }
  }
  return errors;
}

export function productFillPercent(
  product: PlantProduct,
  values: Record<string, string>,
): number {
  if (product.intake === "twin") return 0;
  const fields = product.fields;
  if (fields.length === 0) return 0;
  const filled = fields.filter((field) =>
    (values[field.key] ?? "").trim(),
  ).length;
  return Math.round((filled / fields.length) * 100);
}
