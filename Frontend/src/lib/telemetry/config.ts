import type { SimulationScenario } from "./types";

export type SimulationConfig = {
  /** Telemetry tick interval (ms) */
  updateIntervalMs: number;
  /** Consider data stale after this many ms without update */
  staleThresholdMs: number;
  /** Consider communication offline after this many ms */
  offlineThresholdMs: number;
  /** Temperature warning / critical °C */
  tempWarningC: number;
  tempCriticalC: number;
  /** Transformer load warning % */
  transformerLoadWarningPct: number;
  /** Cloud variation amplitude 0–1 */
  cloudVariation: number;
  /** Small noise amplitude 0–1 */
  noiseAmplitude: number;
  /** Nominal inverter efficiency 0–1 */
  inverterEfficiency: number;
  /** Nominal plant DC/AC conversion efficiency for plant KPI */
  plantEfficiencyNominal: number;
  /** Default scenario */
  defaultScenario: SimulationScenario;
  /** Optional clock override (tests / demos) */
  now?: () => Date;
};

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  updateIntervalMs: 2000,
  staleThresholdMs: 15_000,
  offlineThresholdMs: 60_000,
  tempWarningC: 65,
  tempCriticalC: 80,
  transformerLoadWarningPct: 90,
  cloudVariation: 0.12,
  noiseAmplitude: 0.02,
  inverterEfficiency: 0.965,
  plantEfficiencyNominal: 0.94,
  defaultScenario: "normal",
};

export const SCENARIO_LABELS: Record<SimulationScenario, string> = {
  normal: "Normal Operation",
  inverter_fault: "Inverter Fault",
  inverter_offline: "Inverter Offline",
  high_temperature: "High Temperature",
  grid_disconnect: "Grid Disconnect",
  low_irradiance: "Low Irradiance",
  communication_loss: "Communication Loss",
};
