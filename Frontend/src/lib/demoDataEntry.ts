import {
  defaultDataEntryState,
  writeDataEntryState,
  readDataEntryState,
  type DataEntryState,
} from "@/lib/dataEntryStore";
import {
  PLANT_PRODUCT_IDS,
  emptyProductValues,
  productById,
  type PlantProductId,
} from "@/lib/plantProducts";

/** Demo plants seeded / showcase plants (match by exact name). */
export const DEMO_PLANT_NAMES = new Set([
  "Sunrise Ridge Solar",
  "ABC Solar Plant",
  "Green Valley Solar",
  "Horizon Renewable Plant",
  "Solar Park Karnataka",
]);

/** Bump to re-apply demo intake for demo plants. */
export const DEMO_DATA_ENTRY_VERSION = 3;

const CORE_AND_ASSET: PlantProductId[] = [
  "dashboard",
  "scada",
  "forecast",
  "cmms",
  "data-explorer",
  "rule-engine",
  "ems",
  "dt-assets",
];

function isSunriseRidge(plantName: string): boolean {
  return plantName.trim().toLowerCase() === "sunrise ridge solar";
}

function dummyValues(
  productId: PlantProductId,
  plantName: string,
  capacityMw: number,
): Record<string, string> {
  const base = emptyProductValues(productById(productId));
  const expectedMwh = String(Math.round(capacityMw * 1600));
  const sunrise = isSunriseRidge(plantName);

  const byProduct: Partial<Record<PlantProductId, Record<string, string>>> = {
    dashboard: sunrise
      ? {
          operatorName: "Alcaster Energy",
          timezone: "Asia/Kolkata",
          codDate: "2025-03-01",
          reportingCurrency: "INR",
          expectedAnnualGenerationMwh: "32000",
          performanceRatioTarget: "81.5",
          dashboardNotes:
            "Sunrise Ridge Solar — 20 MW demo plant (2×10 MW tracker blocks) on Demo Site, Pavagada.",
        }
      : {
          operatorName: "Alcaster Energy",
          timezone: "Asia/Kolkata",
          codDate: "2024-06-15",
          reportingCurrency: "INR",
          expectedAnnualGenerationMwh: expectedMwh,
          performanceRatioTarget: "82",
          dashboardNotes: `Demo CMS intake for ${plantName}`,
        },
    scada: sunrise
      ? {
          scadaProtocol: "modbus_tcp",
          scadaEndpoint: "10.48.12.20:502",
          pollIntervalSec: "5",
          deviceCount: "64",
          tagListSource: "sunrise-ridge-tag-list-v3.csv",
          alertEmail: "sunrise-ops@alcaster.com",
          criticalAlarmEnabled: "yes",
          scadaNotes:
            "Demo SCADA: Block A/B central inverters, trackers, meteo, and 33 kV bay status.",
        }
      : {
          scadaProtocol: "modbus_tcp",
          scadaEndpoint: "10.20.1.10:502",
          pollIntervalSec: "5",
          deviceCount: "148",
          tagListSource: "demo-tag-export.csv",
          alertEmail: "ops@alcaster.com",
          criticalAlarmEnabled: "yes",
          scadaNotes: "Demo SCADA gateway — Karnataka collector",
        },
    forecast: sunrise
      ? {
          wmsProvider: "on_site",
          wmsStationId: "SRS-WMS-01",
          wmsApiEndpoint: "https://wms.demo.alcaster.local/sunrise-ridge",
          irradianceSource: "both",
          forecastHorizonHours: "72",
          scheduleGranularityMin: "15",
          weatherInputs:
            "GHI, POA, ambient temp, module temp, wind speed, humidity, rainfall",
        }
      : {
          wmsProvider: "solcast",
          wmsStationId: "WMS-DEMO-0142",
          wmsApiEndpoint: "https://api.solcast.com.au/demo",
          irradianceSource: "both",
          forecastHorizonHours: "48",
          scheduleGranularityMin: "15",
          weatherInputs: "GHI, POA, ambient temp, wind speed, cloud cover",
        },
    cmms: sunrise
      ? {
          cmmsSystem: "alcaster",
          maintenanceTeamLead: "Arjun Mehta",
          preventiveIntervalDays: "30",
          criticalSparesTracked: "yes",
          workOrderCategories:
            "Corrective, Preventive, Tracker inspection, Inverter service, Switchyard",
          cmmsNotes:
            "Sunrise Ridge CMMS — Block A/B trackers, 2 central inverters, AIS switchyard.",
        }
      : {
          cmmsSystem: "alcaster",
          maintenanceTeamLead: "Priya Nair",
          preventiveIntervalDays: "30",
          criticalSparesTracked: "yes",
          workOrderCategories: "Corrective, Preventive, Inspection, CapEx",
          cmmsNotes: "Demo maintenance roster for plant ops",
        },
    "data-explorer": sunrise
      ? {
          primaryHistorian: "TimescaleDB (sunrise-ridge)",
          retentionDays: "1095",
          measurementGroups:
            "Generation, POA/GHI, Trackers, Inverters, 33 kV bay, Meteo",
          exportFormats: "CSV, Parquet, JSON",
          dataCatalogReady: "yes",
        }
      : {
          primaryHistorian: "TimescaleDB (demo)",
          retentionDays: "730",
          measurementGroups: "Generation, Irradiance, Inverters, Meteo, Grid",
          exportFormats: "CSV, Parquet, JSON",
          dataCatalogReady: "yes",
        },
    "rule-engine": sunrise
      ? {
          formulaLanguage: "alcaster",
          coreFormulas:
            "PR, Availability, Specific yield, Tracker availability, Inverter efficiency, Block A/B split",
          ruleEvaluationIntervalSec: "30",
          alertOnRuleFail: "yes",
        }
      : {
          formulaLanguage: "alcaster",
          coreFormulas: "PR, Availability, Specific yield, Inverter efficiency",
          ruleEvaluationIntervalSec: "60",
          alertOnRuleFail: "yes",
        },
    ems: sunrise
      ? {
          gridExportLimitMw: "20",
          hasBess: "no",
          bessCapacityMwh: "0",
          dispatchMode: "maximize_export",
          emsControlEndpoint: "ems.sunrise-ridge.demo.alcaster.local:8443",
          emsNotes:
            "20 MW export limit at 33/132 kV AIS switchyard — curtailment ready for demo.",
        }
      : {
          gridExportLimitMw: String(capacityMw),
          hasBess: capacityMw >= 100 ? "yes" : "no",
          bessCapacityMwh: capacityMw >= 100 ? "40" : "0",
          dispatchMode: "follow_schedule",
          emsControlEndpoint: "ems-demo.alcaster.local:8443",
          emsNotes: "Demo EMS setpoints for export and curtailment",
        },
    "dt-assets": sunrise
      ? {
          assetNamingScheme:
            "BLK-{A|B} / INV-{block} / TRK-{block}-{row} / STR-{inv}-{n}",
          assetLevels:
            "Plant → Block (A/B) → Inverter → Tracker row → String → Module",
          includeSerialNumbers: "yes",
          assetImportSource: "sunrise-ridge-asset-register.xlsx",
        }
      : {
          assetNamingScheme: "INV-{block}-{n} / STR-{inv}-{n}",
          assetLevels: "Plant → Block → Inverter → String → Module",
          includeSerialNumbers: "yes",
          assetImportSource: "demo-asset-register.xlsx",
        },
  };

  return { ...base, ...(byProduct[productId] ?? {}) };
}

export function buildDemoDataEntryState(input: {
  plantName: string;
  capacityMw: number;
}): DataEntryState {
  const state = defaultDataEntryState();

  for (const id of PLANT_PRODUCT_IDS) {
    state.values[id] = dummyValues(id, input.plantName, input.capacityMw);
  }

  // Core products + asset DT are running. Full plant DT (8A) stays unlocked
  // but not complete so later DT work can continue from there.
  state.completed = [...CORE_AND_ASSET];
  state.unlocked = Array.from(
    new Set<PlantProductId>([
      ...CORE_AND_ASSET,
      "dt-normal",
      "dt-electrical",
    ]),
  );
  state.twinComplete = false;
  state.activeProductId = "dt-normal";
  return state;
}

export function isDemoPlantName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  for (const demo of DEMO_PLANT_NAMES) {
    if (demo.toLowerCase() === normalized) return true;
  }
  return false;
}

/**
 * Ensure demo plants have core (+ asset DT) intake filled and marked running.
 * Re-applies when DEMO_DATA_ENTRY_VERSION bumps.
 */
export function ensureDemoDataEntry(plant: {
  id: string;
  name: string;
  capacityMw: number;
}): DataEntryState | null {
  if (!isDemoPlantName(plant.name)) return null;

  let version = 0;
  try {
    const raw = localStorage.getItem(`alcaster.data-entry.${plant.id}`);
    if (raw) {
      const parsed = JSON.parse(raw) as { demoVersion?: number };
      version = parsed.demoVersion ?? 0;
    }
  } catch {
    version = 0;
  }

  if (version >= DEMO_DATA_ENTRY_VERSION) {
    return readDataEntryState(plant.id);
  }

  const state = buildDemoDataEntryState({
    plantName: plant.name,
    capacityMw: plant.capacityMw,
  });
  try {
    localStorage.setItem(
      `alcaster.data-entry.${plant.id}`,
      JSON.stringify({ ...state, demoVersion: DEMO_DATA_ENTRY_VERSION }),
    );
  } catch {
    writeDataEntryState(plant.id, state);
  }
  return state;
}

export function ensureDemoDataEntryForProjects(
  projects: Array<{ id: string; name: string; capacityMw: number }>,
) {
  for (const project of projects) {
    ensureDemoDataEntry(project);
  }
}
