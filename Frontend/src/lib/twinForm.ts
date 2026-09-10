import type {
  InverterKind,
  ModuleTech,
  MountingType,
  Project,
  ProjectStatus,
  ProjectType,
  Site,
  TwinSpec,
} from "@/lib/api";

export const TWIN_PHASE_IDS = [
  "plant",
  "site",
  "solar",
  "module",
  "table",
  "blocks",
  "inverters",
  "transformers",
  "substation",
  "roads",
  "buildings",
  "boundary",
  "appearance",
] as const;

export type TwinPhaseId = (typeof TWIN_PHASE_IDS)[number];

export type TwinFormValues = {
  siteId: string;
  projectName: string;
  location: string;
  plantType: ProjectType;
  status: ProjectStatus;
  capacityMw: string;
  description: string;
  projectId: string;
  plantId: string;
  developerOwner: string;
  epcContractor: string;
  omContractor: string;
  commissioningDate: string;
  commercialOperationDate: string;
  plantDcCapacity: string;
  plantAcCapacity: string;

  totalPlantArea: string;
  areaUnit: "acres" | "hectares" | "sq_m";
  latitude: string;
  longitude: string;
  terrainType: "flat" | "mostly_flat" | "sloped" | "hilly" | "unknown";
  averageSiteElevation: string;
  siteBoundaryFile: string;

  solarTechnology:
    | "monocrystalline"
    | "polycrystalline"
    | "thin_film"
    | "topcon"
    | "hjt"
    | "other";
  mountingKind: "fixed_tilt" | "single_axis" | "dual_axis";
  trackerType: "" | "horizontal" | "tilted" | "independent";
  tiltOrTracker: "fixed_tilt" | "tracker";
  tiltDeg: string;
  azimuthDeg: string;

  moduleManufacturer: string;
  moduleModel: string;
  totalModules: string;
  moduleRatedPowerW: string;
  moduleLengthM: string;
  moduleWidthM: string;
  moduleThicknessMm: string;
  moduleWeightKg: string;
  cellTechnology: "" | "mono" | "poly" | "thin_film" | "hjt" | "topcon" | "other";
  numberOfCells: string;
  moduleIdPrefix: string;
  moduleNumberingPattern: string;
  /** Phase 3 — modules in series per string (optional; default from TwinSpec). */
  modulesPerString: string;

  totalTables: string;
  modulesPerTable: string;
  tableLengthM: string;
  tableWidthM: string;
  tableHeightM: string;
  rowToRowDistanceM: string;
  tableToTableDistanceM: string;
  numberOfRows: string;
  tablesPerRow: string;
  rowOrientationDeg: string;
  structureHeightM: string;
  tableIdPrefix: string;
  tableNumberingPattern: string;

  numberOfSolarBlocks: string;
  modulesPerBlock: string;
  tablesPerBlock: string;
  rowsPerBlock: string;
  blockToBlockDistanceM: string;
  blockLayoutFile: string;
  blockIdPrefix: string;
  blockNumberingPattern: string;
  /** Phase 3 — strings feeding each combiner (optional). */
  stringsPerCombiner: string;

  numberOfInverters: string;
  inverterManufacturer: string;
  inverterModel: string;
  inverterSerialNumber: string;
  inverterKind: "" | "central" | "string" | "micro";
  inverterLengthM: string;
  inverterWidthM: string;
  inverterHeightM: string;
  inverterLocation: string;
  inverterLocationFile: string;
  invertersPerBlock: string;
  inverterIdPrefix: string;
  inverterNumberingPattern: string;
  /** Phase 3 — inverters per transformer (optional). */
  invertersPerTransformer: string;

  numberOfTransformers: string;
  transformerType: "" | "oil" | "dry" | "padmount" | "other";
  transformerManufacturer: string;
  transformerModel: string;
  transformerSerialNumber: string;
  transformerLengthM: string;
  transformerWidthM: string;
  transformerHeightM: string;
  transformerLocation: string;
  transformerLocationFile: string;
  transformersPerBlock: string;
  transformerIdPrefix: string;
  transformerNumberingPattern: string;
  /** Phase 3 — transformers per MV feeder (optional). */
  transformersPerFeeder: string;

  substationPresent: "yes" | "no";
  numberOfSubstations: string;
  substationAreaM2: string;
  substationLatitude: string;
  substationLongitude: string;
  substationType: "" | "ais" | "gis" | "hybrid";
  /** Phase 3 — number of MV feeders (optional; derived if empty). */
  numberOfMvFeeders: string;

  internalRoadsPresent: "yes" | "no";
  mainAccessRoadPresent: "" | "yes" | "no";
  approximateRoadWidthM: string;
  roadSurfaceType: "" | "gravel" | "asphalt" | "concrete" | "dirt" | "other";
  roadLayoutFile: string;

  controlRoomPresent: "yes" | "no";
  omBuildingPresent: "" | "yes" | "no";
  warehousePresent: "" | "yes" | "no";
  securityCabinPresent: "" | "yes" | "no";
  otherBuildings: string;
  buildingLocations: string;
  buildingLengthM: string;
  buildingWidthM: string;
  buildingHeightM: string;

  perimeterFencePresent: "yes" | "no";
  fenceHeightM: string;
  fenceType: "" | "chain_link" | "palisade" | "concrete" | "wire" | "other";
  numberOfGates: string;
  gateLocations: string;
  fenceLayoutFile: string;

  modelVisualStyle: "simple" | "standard" | "realistic";
  terrainAppearance: "" | "bare" | "grass" | "scrub" | "desert";
  moduleAppearance: "" | "dark" | "blue" | "bifacial";
  structureAppearance: "" | "galvanized" | "painted" | "weathered";
  buildingAppearance: "" | "concrete" | "metal" | "mixed";
  dayNight: "" | "day" | "night" | "dusk";
};

export type TwinFormKey = keyof TwinFormValues;

export type TwinFieldType =
  | "text"
  | "number"
  | "select"
  | "textarea"
  | "date"
  | "file"
  | "yesno";

export type TwinFieldOption = { value: string; label: string };

export type TwinFieldConfig = {
  key: TwinFormKey;
  label: string;
  type: TwinFieldType;
  required?: boolean;
  readOnly?: boolean;
  generated?: boolean;
  hint?: string;
  min?: number;
  max?: number;
  step?: string;
  options?: TwinFieldOption[];
  hidden?: (values: TwinFormValues) => boolean;
};

export type TwinPhaseConfig = {
  id: TwinPhaseId;
  label: string;
  title: string;
  note: string;
  fields: TwinFieldConfig[];
};

const YES_NO: TwinFieldOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const YES_NO_OPTIONAL: TwinFieldOption[] = [
  { value: "", label: "Not set" },
  ...YES_NO,
];

export const TWIN_PHASES: TwinPhaseConfig[] = [
  {
    id: "plant",
    label: "Plant",
    title: "Project / Plant information",
    note: "Identity and ownership for this twin. Existing project values are filled in; IDs and capacities are generated.",
    fields: [
      { key: "siteId", label: "Site", type: "select", required: true },
      { key: "projectName", label: "Project name", type: "text", required: true },
      { key: "location", label: "Location", type: "text", required: true },
      {
        key: "plantType",
        label: "Plant type",
        type: "select",
        required: true,
        options: [
          { value: "solar", label: "Solar" },
          { value: "wind", label: "Wind" },
          { value: "hybrid", label: "Hybrid" },
          { value: "bess", label: "BESS" },
        ],
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "active", label: "Active" },
          { value: "pending", label: "Pending" },
          { value: "on_hold", label: "On hold" },
          { value: "completed", label: "Completed" },
        ],
      },
      {
        key: "capacityMw",
        label: "Capacity (MW)",
        type: "number",
        required: true,
        min: 0.1,
        step: "0.1",
      },
      { key: "description", label: "Description", type: "textarea" },
      {
        key: "projectId",
        label: "Project ID",
        type: "text",
        required: true,
        readOnly: true,
        generated: true,
      },
      {
        key: "plantId",
        label: "Plant ID",
        type: "text",
        required: true,
        readOnly: true,
        generated: true,
      },
      { key: "developerOwner", label: "Developer / Owner", type: "text" },
      { key: "epcContractor", label: "EPC contractor", type: "text" },
      { key: "omContractor", label: "O&M contractor", type: "text" },
      { key: "commissioningDate", label: "Commissioning date", type: "date" },
      {
        key: "commercialOperationDate",
        label: "Commercial operation date",
        type: "date",
      },
      {
        key: "plantDcCapacity",
        label: "Plant DC capacity (MWp)",
        type: "number",
        generated: true,
        step: "0.1",
        hint: "Generated from AC capacity × 1.3 when left blank.",
      },
      {
        key: "plantAcCapacity",
        label: "Plant AC capacity (MW)",
        type: "number",
        generated: true,
        step: "0.1",
        hint: "Defaults to the project capacity.",
      },
    ],
  },
  {
    id: "site",
    label: "Site",
    title: "Site & area",
    note: "Plot size and coordinates used to scale the plant boundary.",
    fields: [
      {
        key: "totalPlantArea",
        label: "Total plant area",
        type: "number",
        required: true,
        min: 0.1,
        step: "0.1",
        generated: true,
      },
      {
        key: "areaUnit",
        label: "Area unit",
        type: "select",
        required: true,
        options: [
          { value: "acres", label: "Acres" },
          { value: "hectares", label: "Hectares" },
          { value: "sq_m", label: "Square metres" },
        ],
      },
      {
        key: "latitude",
        label: "Latitude",
        type: "number",
        required: true,
        min: -90,
        max: 90,
        step: "0.0001",
      },
      {
        key: "longitude",
        label: "Longitude",
        type: "number",
        required: true,
        min: -180,
        max: 180,
        step: "0.0001",
      },
      {
        key: "terrainType",
        label: "Terrain type",
        type: "select",
        required: true,
        options: [
          { value: "flat", label: "Flat" },
          { value: "mostly_flat", label: "Mostly flat" },
          { value: "sloped", label: "Sloped" },
          { value: "hilly", label: "Hilly" },
          { value: "unknown", label: "Unknown" },
        ],
      },
      {
        key: "averageSiteElevation",
        label: "Average site elevation (m)",
        type: "number",
        step: "1",
      },
      { key: "siteBoundaryFile", label: "Site boundary", type: "file" },
    ],
  },
  {
    id: "solar",
    label: "Solar",
    title: "Solar technology",
    note: "Array technology and orientation that drive table layout.",
    fields: [
      {
        key: "solarTechnology",
        label: "Solar technology",
        type: "select",
        required: true,
        options: [
          { value: "monocrystalline", label: "Monocrystalline" },
          { value: "polycrystalline", label: "Polycrystalline" },
          { value: "thin_film", label: "Thin film" },
          { value: "topcon", label: "TOPCon" },
          { value: "hjt", label: "HJT" },
          { value: "other", label: "Other" },
        ],
      },
      {
        key: "mountingKind",
        label: "Mounting type",
        type: "select",
        required: true,
        options: [
          { value: "fixed_tilt", label: "Fixed tilt" },
          { value: "single_axis", label: "Single-axis tracker" },
          { value: "dual_axis", label: "Dual-axis tracker" },
        ],
      },
      {
        key: "trackerType",
        label: "Tracker type",
        type: "select",
        hidden: (values) => values.mountingKind === "fixed_tilt",
        options: [
          { value: "", label: "Not set" },
          { value: "horizontal", label: "Horizontal" },
          { value: "tilted", label: "Tilted" },
          { value: "independent", label: "Independent" },
        ],
      },
      {
        key: "tiltOrTracker",
        label: "Fixed tilt / Tracker",
        type: "select",
        required: true,
        options: [
          { value: "fixed_tilt", label: "Fixed tilt" },
          { value: "tracker", label: "Tracker" },
        ],
      },
      {
        key: "tiltDeg",
        label: "Tilt angle (°)",
        type: "number",
        required: true,
        min: 0,
        max: 60,
        step: "1",
      },
      {
        key: "azimuthDeg",
        label: "Azimuth / Orientation (°)",
        type: "number",
        required: true,
        min: 0,
        max: 360,
        step: "1",
      },
    ],
  },
  {
    id: "module",
    label: "Modules",
    title: "PV module",
    note: "Length, width, and quantity are what the first 3D model needs.",
    fields: [
      { key: "moduleManufacturer", label: "Module manufacturer", type: "text" },
      { key: "moduleModel", label: "Module model", type: "text" },
      {
        key: "totalModules",
        label: "Total number of modules",
        type: "number",
        required: true,
        min: 1,
        step: "1",
        generated: true,
      },
      {
        key: "moduleRatedPowerW",
        label: "Module rated power (W)",
        type: "number",
        required: true,
        min: 1,
        step: "5",
      },
      {
        key: "moduleLengthM",
        label: "Module length (m)",
        type: "number",
        required: true,
        min: 0.1,
        step: "0.001",
      },
      {
        key: "moduleWidthM",
        label: "Module width (m)",
        type: "number",
        required: true,
        min: 0.1,
        step: "0.001",
      },
      {
        key: "moduleThicknessMm",
        label: "Module thickness (mm)",
        type: "number",
        step: "0.1",
      },
      {
        key: "moduleWeightKg",
        label: "Module weight (kg)",
        type: "number",
        step: "0.1",
      },
      {
        key: "cellTechnology",
        label: "Cell technology",
        type: "select",
        options: [
          { value: "", label: "Not set" },
          { value: "mono", label: "Mono" },
          { value: "poly", label: "Poly" },
          { value: "thin_film", label: "Thin film" },
          { value: "hjt", label: "HJT" },
          { value: "topcon", label: "TOPCon" },
          { value: "other", label: "Other" },
        ],
      },
      {
        key: "numberOfCells",
        label: "Number of cells",
        type: "number",
        min: 1,
        step: "1",
      },
      {
        key: "moduleIdPrefix",
        label: "Module ID prefix",
        type: "text",
        hint: "Optional. Default MOD.",
      },
      {
        key: "moduleNumberingPattern",
        label: "Module numbering pattern",
        type: "text",
        hint: "Optional. Default MOD-{number:03d}.",
      },
      {
        key: "modulesPerString",
        label: "Modules per string",
        type: "number",
        min: 1,
        step: "1",
        hint: "Optional. Series modules per string. Default 28.",
      },
    ],
  },
  {
    id: "table",
    label: "Tables",
    title: "Solar table / Mounting arrangement",
    note: "Tables and row spacing. Counts are checked against modules ÷ modules per table.",
    fields: [
      {
        key: "totalTables",
        label: "Total number of tables",
        type: "number",
        required: true,
        min: 1,
        step: "1",
        generated: true,
      },
      {
        key: "modulesPerTable",
        label: "Modules per table",
        type: "number",
        required: true,
        min: 1,
        step: "1",
      },
      { key: "tableLengthM", label: "Table length (m)", type: "number", step: "0.1" },
      { key: "tableWidthM", label: "Table width (m)", type: "number", step: "0.1" },
      { key: "tableHeightM", label: "Table height (m)", type: "number", step: "0.1" },
      {
        key: "rowToRowDistanceM",
        label: "Row-to-row distance (m)",
        type: "number",
        required: true,
        min: 0.5,
        step: "0.1",
      },
      {
        key: "tableToTableDistanceM",
        label: "Table-to-table distance (m)",
        type: "number",
        step: "0.1",
      },
      {
        key: "numberOfRows",
        label: "Number of rows",
        type: "number",
        required: true,
        min: 1,
        step: "1",
        generated: true,
      },
      {
        key: "tablesPerRow",
        label: "Tables per row",
        type: "number",
        required: true,
        min: 1,
        step: "1",
        generated: true,
      },
      {
        key: "rowOrientationDeg",
        label: "Row orientation (°)",
        type: "number",
        required: true,
        min: 0,
        max: 360,
        step: "1",
      },
      {
        key: "structureHeightM",
        label: "Structure height (m)",
        type: "number",
        step: "0.1",
      },
      {
        key: "tableIdPrefix",
        label: "Table ID prefix",
        type: "text",
        hint: "Optional. Default BLK uses TBL.",
      },
      {
        key: "tableNumberingPattern",
        label: "Table numbering pattern",
        type: "text",
        hint: "Optional. Default TBL-{number:03d}.",
      },
    ],
  },
  {
    id: "blocks",
    label: "Blocks",
    title: "Solar blocks",
    note: "If block detail is empty, tables and rows are distributed automatically.",
    fields: [
      {
        key: "numberOfSolarBlocks",
        label: "Number of solar blocks",
        type: "number",
        required: true,
        min: 1,
        step: "1",
        generated: true,
      },
      {
        key: "modulesPerBlock",
        label: "Modules per block",
        type: "number",
        generated: true,
        step: "1",
      },
      {
        key: "tablesPerBlock",
        label: "Tables per block",
        type: "number",
        generated: true,
        step: "1",
      },
      {
        key: "rowsPerBlock",
        label: "Rows per block",
        type: "number",
        generated: true,
        step: "1",
      },
      {
        key: "blockToBlockDistanceM",
        label: "Block-to-block distance (m)",
        type: "number",
        step: "0.1",
      },
      { key: "blockLayoutFile", label: "Block layout", type: "file" },
      {
        key: "blockIdPrefix",
        label: "Block ID prefix",
        type: "text",
        hint: "Optional. Default BLK.",
      },
      {
        key: "blockNumberingPattern",
        label: "Block numbering pattern",
        type: "text",
        hint: "Optional. Default BLK-{number:03d}.",
      },
      {
        key: "stringsPerCombiner",
        label: "Strings per combiner",
        type: "number",
        min: 1,
        step: "1",
        hint: "Optional. Default 16.",
      },
    ],
  },
  {
    id: "inverters",
    label: "Inverters",
    title: "Inverters",
    note: "Exact locations are optional — the first model can place them on each block.",
    fields: [
      {
        key: "numberOfInverters",
        label: "Number of inverters",
        type: "number",
        required: true,
        min: 1,
        step: "1",
        generated: true,
      },
      { key: "inverterManufacturer", label: "Inverter manufacturer", type: "text" },
      { key: "inverterModel", label: "Inverter model", type: "text" },
      {
        key: "inverterSerialNumber",
        label: "Inverter serial number",
        type: "text",
        hint: "Optional template / note for serial identity.",
      },
      {
        key: "inverterKind",
        label: "Inverter type",
        type: "select",
        options: [
          { value: "", label: "Not set" },
          { value: "central", label: "Central" },
          { value: "string", label: "String" },
          { value: "micro", label: "Micro" },
        ],
      },
      { key: "inverterLengthM", label: "Inverter length (m)", type: "number", step: "0.1" },
      { key: "inverterWidthM", label: "Inverter width (m)", type: "number", step: "0.1" },
      { key: "inverterHeightM", label: "Inverter height (m)", type: "number", step: "0.1" },
      {
        key: "inverterLocation",
        label: "Inverter location",
        type: "text",
        hint: "Coordinates or a short placement note.",
      },
      { key: "inverterLocationFile", label: "Inverter location file", type: "file" },
      {
        key: "invertersPerBlock",
        label: "Inverters per block",
        type: "number",
        generated: true,
        step: "1",
      },
      {
        key: "inverterIdPrefix",
        label: "Inverter ID prefix",
        type: "text",
        hint: "Optional. Default INV.",
      },
      {
        key: "inverterNumberingPattern",
        label: "Inverter numbering pattern",
        type: "text",
        hint: "Optional. Default INV-{number:03d}.",
      },
      {
        key: "invertersPerTransformer",
        label: "Inverters per transformer",
        type: "number",
        min: 1,
        step: "1",
        hint: "Optional. Default 4.",
      },
    ],
  },
  {
    id: "transformers",
    label: "Xfmrs",
    title: "Transformers",
    note: "Count is required. Placement can be generated with the blocks.",
    fields: [
      {
        key: "numberOfTransformers",
        label: "Number of transformers",
        type: "number",
        required: true,
        min: 1,
        step: "1",
        generated: true,
      },
      {
        key: "transformerType",
        label: "Transformer type",
        type: "select",
        options: [
          { value: "", label: "Not set" },
          { value: "oil", label: "Oil-filled" },
          { value: "dry", label: "Dry-type" },
          { value: "padmount", label: "Padmount" },
          { value: "other", label: "Other" },
        ],
      },
      {
        key: "transformerManufacturer",
        label: "Transformer manufacturer",
        type: "text",
      },
      { key: "transformerModel", label: "Transformer model", type: "text" },
      {
        key: "transformerSerialNumber",
        label: "Transformer serial number",
        type: "text",
        hint: "Optional template / note for serial identity.",
      },
      {
        key: "transformerLengthM",
        label: "Transformer length (m)",
        type: "number",
        step: "0.1",
      },
      {
        key: "transformerWidthM",
        label: "Transformer width (m)",
        type: "number",
        step: "0.1",
      },
      {
        key: "transformerHeightM",
        label: "Transformer height (m)",
        type: "number",
        step: "0.1",
      },
      {
        key: "transformerLocation",
        label: "Transformer location",
        type: "text",
        hint: "Coordinates or a short placement note.",
      },
      {
        key: "transformerLocationFile",
        label: "Transformer location file",
        type: "file",
      },
      {
        key: "transformersPerBlock",
        label: "Transformers per block",
        type: "number",
        generated: true,
        step: "1",
      },
      {
        key: "transformerIdPrefix",
        label: "Transformer ID prefix",
        type: "text",
        hint: "Optional. Default TRF.",
      },
      {
        key: "transformerNumberingPattern",
        label: "Transformer numbering pattern",
        type: "text",
        hint: "Optional. Default TRF-{number:03d}.",
      },
      {
        key: "transformersPerFeeder",
        label: "Transformers per MV feeder",
        type: "number",
        min: 1,
        step: "1",
        hint: "Optional. Default 2.",
      },
    ],
  },
  {
    id: "substation",
    label: "Substation",
    title: "Substation",
    note: "If there is no substation, the remaining fields stay hidden.",
    fields: [
      {
        key: "substationPresent",
        label: "Substation present?",
        type: "yesno",
        required: true,
        options: YES_NO,
      },
      {
        key: "numberOfSubstations",
        label: "Number of substations",
        type: "number",
        hidden: (values) => values.substationPresent === "no",
        min: 1,
        step: "1",
      },
      {
        key: "substationAreaM2",
        label: "Substation area (m²)",
        type: "number",
        hidden: (values) => values.substationPresent === "no",
        step: "1",
      },
      {
        key: "substationLatitude",
        label: "Substation latitude",
        type: "number",
        hidden: (values) => values.substationPresent === "no",
        min: -90,
        max: 90,
        step: "0.0001",
      },
      {
        key: "substationLongitude",
        label: "Substation longitude",
        type: "number",
        hidden: (values) => values.substationPresent === "no",
        min: -180,
        max: 180,
        step: "0.0001",
      },
      {
        key: "substationType",
        label: "Substation type",
        type: "select",
        hidden: (values) => values.substationPresent === "no",
        options: [
          { value: "", label: "Not set" },
          { value: "ais", label: "AIS" },
          { value: "gis", label: "GIS" },
          { value: "hybrid", label: "Hybrid" },
        ],
      },
      {
        key: "numberOfMvFeeders",
        label: "Number of MV feeders",
        type: "number",
        hidden: (values) => values.substationPresent === "no",
        min: 1,
        step: "1",
        hint: "Optional. Derived from transformers if empty.",
      },
    ],
  },
  {
    id: "roads",
    label: "Roads",
    title: "Roads & access",
    note: "If no layout is uploaded, roads can be generated around the blocks.",
    fields: [
      {
        key: "internalRoadsPresent",
        label: "Internal roads present?",
        type: "yesno",
        required: true,
        options: YES_NO,
      },
      {
        key: "mainAccessRoadPresent",
        label: "Main access road present?",
        type: "select",
        options: YES_NO_OPTIONAL,
      },
      {
        key: "approximateRoadWidthM",
        label: "Approximate road width (m)",
        type: "number",
        step: "0.1",
      },
      {
        key: "roadSurfaceType",
        label: "Road surface type",
        type: "select",
        options: [
          { value: "", label: "Not set" },
          { value: "gravel", label: "Gravel" },
          { value: "asphalt", label: "Asphalt" },
          { value: "concrete", label: "Concrete" },
          { value: "dirt", label: "Dirt" },
          { value: "other", label: "Other" },
        ],
      },
      { key: "roadLayoutFile", label: "Road layout", type: "file" },
    ],
  },
  {
    id: "buildings",
    label: "Buildings",
    title: "Buildings & structures",
    note: "These become simple volumes on the first model.",
    fields: [
      {
        key: "controlRoomPresent",
        label: "Control room present?",
        type: "yesno",
        required: true,
        options: YES_NO,
      },
      {
        key: "omBuildingPresent",
        label: "O&M building present?",
        type: "select",
        options: YES_NO_OPTIONAL,
      },
      {
        key: "warehousePresent",
        label: "Warehouse present?",
        type: "select",
        options: YES_NO_OPTIONAL,
      },
      {
        key: "securityCabinPresent",
        label: "Security cabin present?",
        type: "select",
        options: YES_NO_OPTIONAL,
      },
      {
        key: "otherBuildings",
        label: "Other buildings",
        type: "number",
        min: 0,
        step: "1",
      },
      {
        key: "buildingLocations",
        label: "Building locations",
        type: "text",
        hint: "Coordinates or a short placement note.",
      },
      { key: "buildingLengthM", label: "Building length (m)", type: "number", step: "0.1" },
      { key: "buildingWidthM", label: "Building width (m)", type: "number", step: "0.1" },
      { key: "buildingHeightM", label: "Building height (m)", type: "number", step: "0.1" },
    ],
  },
  {
    id: "boundary",
    label: "Boundary",
    title: "Boundary & security",
    note: "If no fence layout is uploaded, the fence follows the plant boundary.",
    fields: [
      {
        key: "perimeterFencePresent",
        label: "Perimeter fence present?",
        type: "yesno",
        required: true,
        options: YES_NO,
      },
      { key: "fenceHeightM", label: "Fence height (m)", type: "number", step: "0.1" },
      {
        key: "fenceType",
        label: "Fence type",
        type: "select",
        options: [
          { value: "", label: "Not set" },
          { value: "chain_link", label: "Chain-link" },
          { value: "palisade", label: "Palisade" },
          { value: "concrete", label: "Concrete" },
          { value: "wire", label: "Wire" },
          { value: "other", label: "Other" },
        ],
      },
      { key: "numberOfGates", label: "Number of gates", type: "number", min: 0, step: "1" },
      {
        key: "gateLocations",
        label: "Gate locations",
        type: "text",
        hint: "Coordinates or a short placement note.",
      },
      { key: "fenceLayoutFile", label: "Fence layout", type: "file" },
    ],
  },
  {
    id: "appearance",
    label: "Look",
    title: "Basic visual appearance",
    note: "Optional styling for the first model. Standard is the default.",
    fields: [
      {
        key: "modelVisualStyle",
        label: "Model visual style",
        type: "select",
        required: true,
        options: [
          { value: "simple", label: "Simple" },
          { value: "standard", label: "Standard" },
          { value: "realistic", label: "Realistic" },
        ],
      },
      {
        key: "terrainAppearance",
        label: "Terrain appearance",
        type: "select",
        options: [
          { value: "", label: "Not set" },
          { value: "bare", label: "Bare earth" },
          { value: "grass", label: "Grass" },
          { value: "scrub", label: "Scrub" },
          { value: "desert", label: "Desert" },
        ],
      },
      {
        key: "moduleAppearance",
        label: "Module appearance",
        type: "select",
        options: [
          { value: "", label: "Not set" },
          { value: "dark", label: "Dark" },
          { value: "blue", label: "Blue" },
          { value: "bifacial", label: "Bifacial" },
        ],
      },
      {
        key: "structureAppearance",
        label: "Structure appearance",
        type: "select",
        options: [
          { value: "", label: "Not set" },
          { value: "galvanized", label: "Galvanized" },
          { value: "painted", label: "Painted" },
          { value: "weathered", label: "Weathered" },
        ],
      },
      {
        key: "buildingAppearance",
        label: "Building appearance",
        type: "select",
        options: [
          { value: "", label: "Not set" },
          { value: "concrete", label: "Concrete" },
          { value: "metal", label: "Metal" },
          { value: "mixed", label: "Mixed" },
        ],
      },
      {
        key: "dayNight",
        label: "Day / Night",
        type: "select",
        options: [
          { value: "", label: "Not set" },
          { value: "day", label: "Day" },
          { value: "night", label: "Night" },
          { value: "dusk", label: "Dusk" },
        ],
      },
    ],
  },
];

export function phaseById(id: TwinPhaseId) {
  return TWIN_PHASES.find((phase) => phase.id === id) ?? TWIN_PHASES[0];
}

export function visiblePhaseFields(
  phase: TwinPhaseConfig,
  values: TwinFormValues,
) {
  return phase.fields.filter((field) => !field.hidden?.(values));
}

function isFilled(value: string) {
  return value.trim() !== "";
}

export function phaseFillPercent(phase: TwinPhaseConfig, values: TwinFormValues) {
  const fields = visiblePhaseFields(phase, values);
  if (fields.length === 0) return 100;
  const filled = fields.filter((field) => isFilled(String(values[field.key]))).length;
  return Math.round((filled / fields.length) * 100);
}

export function overallFillPercent(values: TwinFormValues) {
  const fields = TWIN_PHASES.flatMap((phase) => visiblePhaseFields(phase, values));
  if (fields.length === 0) return 0;
  const filled = fields.filter((field) => isFilled(String(values[field.key]))).length;
  return Math.round((filled / fields.length) * 100);
}

export function validatePhase(phase: TwinPhaseConfig, values: TwinFormValues) {
  const fields: Partial<Record<TwinFormKey, string>> = {};
  for (const field of visiblePhaseFields(phase, values)) {
    if (!field.required) continue;
    const raw = String(values[field.key] ?? "").trim();
    if (!raw) {
      fields[field.key] = `${field.label} is required.`;
      continue;
    }
    if (field.type === "number") {
      const n = Number(raw);
      if (Number.isNaN(n)) {
        fields[field.key] = `Enter a valid ${field.label.toLowerCase()}.`;
        continue;
      }
      if (field.min != null && n < field.min) {
        fields[field.key] = `${field.label} is too low.`;
      }
      if (field.max != null && n > field.max) {
        fields[field.key] = `${field.label} is too high.`;
      }
    }
  }

  if (phase.id === "table") {
    const modules = Number(values.totalModules);
    const perTable = Number(values.modulesPerTable);
    const tables = Number(values.totalTables);
    if (modules > 0 && perTable > 0 && tables > 0) {
      const expected = Math.max(1, Math.ceil(modules / perTable));
      if (Math.abs(tables - expected) > Math.max(2, Math.round(expected * 0.15))) {
        fields.totalTables = `Expected about ${expected.toLocaleString()} tables from modules ÷ modules per table.`;
      }
    }
  }

  return fields;
}

export function firstIncompletePhase(values: TwinFormValues): TwinPhaseId | null {
  for (const phase of TWIN_PHASES) {
    if (Object.keys(validatePhase(phase, values)).length > 0) return phase.id;
  }
  return null;
}

export type MissingRequiredField = {
  phaseId: TwinPhaseId;
  phaseLabel: string;
  key: TwinFormKey;
  label: string;
  message: string;
};

export function missingRequiredFields(
  values: TwinFormValues,
): MissingRequiredField[] {
  const missing: MissingRequiredField[] = [];
  for (const phase of TWIN_PHASES) {
    const errors = validatePhase(phase, values);
    for (const [key, message] of Object.entries(errors)) {
      const field = phase.fields.find((item) => item.key === key);
      missing.push({
        phaseId: phase.id,
        phaseLabel: phase.label,
        key: key as TwinFormKey,
        label: field?.label ?? key,
        message,
      });
    }
  }
  return missing;
}

function plantIdFromProject(projectId: string) {
  const compact = projectId.replace(/[^a-f0-9]/gi, "").slice(-6).toUpperCase();
  return `PLT-${compact || "000000"}`;
}

function areaToAcres(area: number, unit: TwinFormValues["areaUnit"]) {
  if (unit === "hectares") return area * 2.47105;
  if (unit === "sq_m") return area / 4046.8564224;
  return area;
}

function mapModuleTech(tech: TwinFormValues["solarTechnology"]): ModuleTech {
  if (tech === "topcon" || tech === "hjt") return "topcon";
  if (tech === "thin_film") return "bifacial";
  return "mono_perc";
}

function mapMounting(kind: TwinFormValues["mountingKind"]): MountingType {
  return kind === "fixed_tilt" ? "fixed_tilt" : "single_axis";
}

function mapInverterKind(kind: TwinFormValues["inverterKind"]): InverterKind {
  return kind === "string" ? "string" : "central";
}

function intakeFromValues(values: TwinFormValues): Record<string, string> {
  const intake: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    intake[key] = String(value ?? "");
  }
  return intake;
}

function assignValue<K extends TwinFormKey>(
  target: TwinFormValues,
  key: K,
  value: TwinFormValues[K],
) {
  target[key] = value;
}

export function valuesFromIntake(
  intake: Record<string, string> | undefined,
  base: TwinFormValues,
): TwinFormValues {
  if (!intake) return base;
  const next = { ...base };
  for (const key of Object.keys(base) as TwinFormKey[]) {
    if (intake[key] != null) {
      assignValue(next, key, intake[key] as TwinFormValues[typeof key]);
    }
  }
  return next;
}

export function defaultsFromProject(
  project: Project,
  site: Site | null,
  organizationName: string | null,
  existing?: TwinSpec,
): TwinFormValues {
  const capacity = existing?.capacityMw ?? project.capacityMw;
  const dcRatio = existing?.dcAcRatio ?? 1.3;
  const moduleW = existing?.moduleWattageW ?? 550;
  const dcMw = capacity * dcRatio;
  const totalModules = Math.max(1, Math.round((dcMw * 1_000_000) / moduleW));
  const modulesPerTable = 56;
  const totalTables = Math.max(1, Math.ceil(totalModules / modulesPerTable));
  const numberOfRows = Math.max(1, Math.round(Math.sqrt(totalTables / 1.6)));
  const tablesPerRow = Math.max(1, Math.ceil(totalTables / numberOfRows));
  const blocks = Math.max(1, Math.round(capacity / 25));
  const inverterRating = existing?.inverterRatingKw ?? 2500;
  const inverters = Math.max(1, Math.round((capacity * 1000) / inverterRating));
  const transformers = Math.max(1, Math.ceil(inverters / 4));
  const landAcres = existing?.landAreaAcres ?? Math.round(capacity * 4.5 * 10) / 10;
  const mountingKind: TwinFormValues["mountingKind"] =
    existing?.mountingType === "fixed_tilt" ? "fixed_tilt" : "single_axis";
  const solarTechnology: TwinFormValues["solarTechnology"] =
    existing?.moduleTech === "topcon"
      ? "topcon"
      : existing?.moduleTech === "bifacial"
        ? "thin_film"
        : "monocrystalline";

  const generated: TwinFormValues = {
    siteId: project.siteId,
    projectName: project.name,
    location: project.location,
    plantType: project.type,
    status: project.status,
    capacityMw: String(capacity),
    description: project.description ?? "",
    projectId: project.id,
    plantId: plantIdFromProject(project.id),
    developerOwner: organizationName ?? site?.organizationName ?? "",
    epcContractor: "",
    omContractor: "",
    commissioningDate: "",
    commercialOperationDate: "",
    plantDcCapacity: dcMw.toFixed(1),
    plantAcCapacity: String(capacity),

    totalPlantArea: String(landAcres),
    areaUnit: "acres",
    latitude: String(existing?.latitude ?? site?.latitude ?? ""),
    longitude: String(existing?.longitude ?? site?.longitude ?? ""),
    terrainType: "flat",
    averageSiteElevation: "",
    siteBoundaryFile: "",

    solarTechnology,
    mountingKind,
    trackerType: mountingKind === "fixed_tilt" ? "" : "horizontal",
    tiltOrTracker: mountingKind === "fixed_tilt" ? "fixed_tilt" : "tracker",
    tiltDeg: String(existing?.tiltDeg ?? 22),
    azimuthDeg: String(existing?.azimuthDeg ?? 180),

    moduleManufacturer: "",
    moduleModel: "",
    totalModules: String(totalModules),
    moduleRatedPowerW: String(moduleW),
    moduleLengthM: "2.279",
    moduleWidthM: "1.134",
    moduleThicknessMm: "35",
    moduleWeightKg: "28",
    cellTechnology:
      solarTechnology === "topcon"
        ? "topcon"
        : solarTechnology === "thin_film"
          ? "thin_film"
          : "mono",
    numberOfCells: "144",
    moduleIdPrefix: "MOD",
    moduleNumberingPattern: "MOD-{number:03d}",
    modulesPerString: String(existing?.modulesPerString ?? 28),

    totalTables: String(totalTables),
    modulesPerTable: String(modulesPerTable),
    tableLengthM: "",
    tableWidthM: "",
    tableHeightM: "",
    rowToRowDistanceM: mountingKind === "fixed_tilt" ? "6.5" : "8",
    tableToTableDistanceM: "0.4",
    numberOfRows: String(numberOfRows),
    tablesPerRow: String(tablesPerRow),
    rowOrientationDeg: String(existing?.azimuthDeg ?? 180),
    structureHeightM: existing?.mountingType === "fixed_tilt" ? "1.8" : "2.2",
    tableIdPrefix: "TBL",
    tableNumberingPattern: "TBL-{number:03d}",

    numberOfSolarBlocks: String(blocks),
    modulesPerBlock: String(Math.ceil(totalModules / blocks)),
    tablesPerBlock: String(Math.ceil(totalTables / blocks)),
    rowsPerBlock: String(Math.max(1, Math.ceil(numberOfRows / blocks))),
    blockToBlockDistanceM: "12",
    blockLayoutFile: "",
    blockIdPrefix: "BLK",
    blockNumberingPattern: "BLK-{number:03d}",
    stringsPerCombiner: existing?.intake?.stringsPerCombiner ?? "16",

    numberOfInverters: String(inverters),
    inverterManufacturer: "",
    inverterModel: "",
    inverterSerialNumber: "",
    inverterKind: existing?.inverterType ?? "central",
    inverterLengthM: "",
    inverterWidthM: "",
    inverterHeightM: "",
    inverterLocation: "",
    inverterLocationFile: "",
    invertersPerBlock: String(Math.max(1, Math.ceil(inverters / blocks))),
    inverterIdPrefix: "INV",
    inverterNumberingPattern: "INV-{number:03d}",
    invertersPerTransformer:
      existing?.intake?.invertersPerTransformer ??
      String(Math.max(1, Math.ceil(inverters / transformers))),

    numberOfTransformers: String(transformers),
    transformerType: "",
    transformerManufacturer: "",
    transformerModel: "",
    transformerSerialNumber: "",
    transformerLengthM: "",
    transformerWidthM: "",
    transformerHeightM: "",
    transformerLocation: "",
    transformerLocationFile: "",
    transformersPerBlock: String(Math.max(1, Math.ceil(transformers / blocks))),
    transformerIdPrefix: "TRF",
    transformerNumberingPattern: "TRF-{number:03d}",
    transformersPerFeeder: existing?.intake?.transformersPerFeeder ?? "2",

    substationPresent: "yes",
    numberOfSubstations: "1",
    substationAreaM2: "",
    substationLatitude: String(existing?.latitude ?? site?.latitude ?? ""),
    substationLongitude: String(existing?.longitude ?? site?.longitude ?? ""),
    substationType: "ais",
    numberOfMvFeeders:
      existing?.intake?.numberOfMvFeeders ??
      String(Math.max(1, Math.ceil(transformers / 2))),

    internalRoadsPresent: existing?.includeRoads === false ? "no" : "yes",
    mainAccessRoadPresent: "yes",
    approximateRoadWidthM: "4",
    roadSurfaceType: "gravel",
    roadLayoutFile: "",

    controlRoomPresent: existing?.includeBuilding === false ? "no" : "yes",
    omBuildingPresent: existing?.includeBuilding === false ? "no" : "yes",
    warehousePresent: "no",
    securityCabinPresent: "yes",
    otherBuildings: "0",
    buildingLocations: "",
    buildingLengthM: "18",
    buildingWidthM: "10",
    buildingHeightM: "4.5",

    perimeterFencePresent: existing?.includeFence === false ? "no" : "yes",
    fenceHeightM: "2.4",
    fenceType: "chain_link",
    numberOfGates: "2",
    gateLocations: "",
    fenceLayoutFile: "",

    modelVisualStyle: "standard",
    terrainAppearance: "bare",
    moduleAppearance: "dark",
    structureAppearance: "galvanized",
    buildingAppearance: "concrete",
    dayNight: "day",
  };

  return valuesFromIntake(existing?.intake, generated);
}

export function applyDerived(
  values: TwinFormValues,
  touched: Partial<Record<TwinFormKey, boolean>>,
): TwinFormValues {
  const next = { ...values };
  const capacity = Number(next.capacityMw);
  const moduleW = Number(next.moduleRatedPowerW);
  const set = (key: TwinFormKey, value: string) => {
    if (!touched[key]) {
      assignValue(next, key, value as TwinFormValues[typeof key]);
    }
  };

  if (capacity > 0) {
    if (!touched.plantAcCapacity) set("plantAcCapacity", String(capacity));
    const ac = Number(next.plantAcCapacity) || capacity;
    if (!touched.plantDcCapacity) set("plantDcCapacity", (ac * 1.3).toFixed(1));
    if (!touched.totalPlantArea) {
      set("totalPlantArea", String(Math.round(capacity * 4.5 * 10) / 10));
    }
  }

  if (next.mountingKind === "fixed_tilt") {
    if (!touched.tiltOrTracker) next.tiltOrTracker = "fixed_tilt";
  } else if (!touched.tiltOrTracker) {
    next.tiltOrTracker = "tracker";
  }

  if (!touched.rowOrientationDeg && next.azimuthDeg) {
    next.rowOrientationDeg = next.azimuthDeg;
  }

  const dc = Number(next.plantDcCapacity);
  if (dc > 0 && moduleW > 0 && !touched.totalModules) {
    next.totalModules = String(Math.max(1, Math.round((dc * 1_000_000) / moduleW)));
  }

  const modules = Number(next.totalModules);
  const perTable = Number(next.modulesPerTable);
  if (modules > 0 && perTable > 0 && !touched.totalTables) {
    next.totalTables = String(Math.max(1, Math.ceil(modules / perTable)));
  }

  const tables = Number(next.totalTables);
  if (tables > 0 && !touched.numberOfRows) {
    next.numberOfRows = String(Math.max(1, Math.round(Math.sqrt(tables / 1.6))));
  }
  const rows = Number(next.numberOfRows);
  if (tables > 0 && rows > 0 && !touched.tablesPerRow) {
    next.tablesPerRow = String(Math.max(1, Math.ceil(tables / rows)));
  }

  if (capacity > 0 && !touched.numberOfSolarBlocks) {
    next.numberOfSolarBlocks = String(Math.max(1, Math.round(capacity / 25)));
  }
  const blocks = Number(next.numberOfSolarBlocks);
  if (blocks > 0) {
    if (modules > 0 && !touched.modulesPerBlock) {
      next.modulesPerBlock = String(Math.ceil(modules / blocks));
    }
    if (tables > 0 && !touched.tablesPerBlock) {
      next.tablesPerBlock = String(Math.ceil(tables / blocks));
    }
    if (rows > 0 && !touched.rowsPerBlock) {
      next.rowsPerBlock = String(Math.max(1, Math.ceil(rows / blocks)));
    }
  }

  if (capacity > 0 && !touched.numberOfInverters) {
    next.numberOfInverters = String(Math.max(1, Math.round((capacity * 1000) / 2500)));
  }
  const inverters = Number(next.numberOfInverters);
  if (inverters > 0 && !touched.numberOfTransformers) {
    next.numberOfTransformers = String(Math.max(1, Math.ceil(inverters / 4)));
  }
  if (blocks > 0 && inverters > 0 && !touched.invertersPerBlock) {
    next.invertersPerBlock = String(Math.max(1, Math.ceil(inverters / blocks)));
  }
  const transformers = Number(next.numberOfTransformers);
  if (blocks > 0 && transformers > 0 && !touched.transformersPerBlock) {
    next.transformersPerBlock = String(Math.max(1, Math.ceil(transformers / blocks)));
  }

  if (next.substationPresent === "yes" && !touched.numberOfSubstations && !next.numberOfSubstations) {
    next.numberOfSubstations = "1";
  }

  return next;
}

export function toTwinPayload(values: TwinFormValues): TwinSpec {
  const capacity = Number(values.plantAcCapacity) || Number(values.capacityMw);
  const dc = Number(values.plantDcCapacity) || capacity * 1.3;
  const area = Number(values.totalPlantArea) || capacity * 4.5;
  const moduleW = Number(values.moduleRatedPowerW) || 550;
  const inverters = Number(values.numberOfInverters) || 1;
  const inverterRating = Math.max(
    20,
    Math.round((capacity * 1000) / Math.max(inverters, 1)),
  );

  return {
    capacityMw: capacity,
    landAreaAcres: Math.max(0.5, Math.round(areaToAcres(area, values.areaUnit) * 10) / 10),
    usableLandPct: 85,
    latitude: Number(values.latitude),
    longitude: Number(values.longitude),
    dcAcRatio: Math.min(1.8, Math.max(1, Math.round((dc / Math.max(capacity, 0.1)) * 100) / 100)),
    moduleWattageW: moduleW,
    moduleTech: mapModuleTech(values.solarTechnology),
    tiltDeg: Number(values.tiltDeg),
    azimuthDeg: Number(values.azimuthDeg),
    mountingType: mapMounting(values.mountingKind),
    groundCoverageRatio: 0.4,
    modulesPerString: Math.max(
      1,
      Math.round(Number(values.modulesPerString) || 28),
    ),
    inverterType: mapInverterKind(values.inverterKind),
    inverterRatingKw: Math.min(5000, inverterRating),
    transformerMva: Math.max(10, Math.round(capacity * 1.1)),
    mvVoltageKv: 33,
    gridVoltageKv: 132,
    includeBuilding:
      values.controlRoomPresent === "yes" || values.omBuildingPresent === "yes",
    includeWeatherStation: true,
    includeFence: values.perimeterFencePresent === "yes",
    includeRoads: values.internalRoadsPresent === "yes",
    intake: intakeFromValues(values),
  };
}

export type TwinDraft = {
  values: TwinFormValues;
  phaseId: TwinPhaseId;
  unlocked: TwinPhaseId[];
};

export function draftStorageKey(projectId: string) {
  return `alcaster.twin.draft.${projectId}`;
}

export function readDraft(projectId: string): TwinDraft | null {
  try {
    const raw = localStorage.getItem(draftStorageKey(projectId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TwinDraft | TwinFormValues;
    if (parsed && typeof parsed === "object" && "values" in parsed) {
      return parsed;
    }
    return {
      values: parsed as TwinFormValues,
      phaseId: "plant",
      unlocked: ["plant"],
    };
  } catch {
    return null;
  }
}

export function writeDraft(projectId: string, draft: TwinDraft) {
  try {
    localStorage.setItem(draftStorageKey(projectId), JSON.stringify(draft));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function clearDraft(projectId: string) {
  try {
    localStorage.removeItem(draftStorageKey(projectId));
  } catch {
    // Ignore storage failures.
  }
}
