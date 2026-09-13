/**
 * Phase 5 — Environmental context (extends Phase 4 weather telemetry).
 * Weather Station remains the canonical operational source; this normalizes
 * richer environmental snapshots for UI context overlays.
 */

export type WeatherScenario =
  | "clear_day"
  | "partly_cloudy"
  | "cloudy"
  | "hot_day"
  | "high_wind"
  | "rain"
  | "night";

export type EnvironmentalSnapshot = {
  timestamp: string;
  ghi?: number;
  dni?: number;
  dhi?: number;
  poaIrradiance?: number;
  ambientTemperature?: number;
  moduleTemperature?: number;
  windSpeed?: number;
  windDirection?: number;
  relativeHumidity?: number;
  rainfall?: number;
  precipitationProbability?: number;
  atmosphericPressure?: number;
  visibility?: number;
  cloudCover?: number;
  soilingIndex?: number;
  snowCover?: number;
  scenario?: WeatherScenario;
};

export const WEATHER_SCENARIO_LABELS: Record<WeatherScenario, string> = {
  clear_day: "Clear Day",
  partly_cloudy: "Partly Cloudy",
  cloudy: "Cloudy",
  hot_day: "Hot Day",
  high_wind: "High Wind",
  rain: "Rain Event",
  night: "Night",
};

/** Contextual inspection hints — not diagnoses. */
export function weatherInspectionContext(
  env: EnvironmentalSnapshot,
): string[] {
  const hints: string[] = [];
  if ((env.windSpeed ?? 0) >= 12) {
    hints.push("High wind — structural / tracker inspection context");
  }
  if ((env.moduleTemperature ?? 0) >= 65) {
    hints.push("Elevated module temperature — thermal inspection conditions");
  }
  if ((env.relativeHumidity ?? 0) >= 85) {
    hints.push("High humidity — corrosion / environmental stress context");
  }
  if ((env.rainfall ?? 0) > 0.5 || (env.cloudCover ?? 0) > 80) {
    hints.push("Wet / overcast — civil drainage and soiling context");
  }
  if ((env.ghi ?? 0) < 50 && env.scenario !== "night") {
    hints.push("Low irradiance — reduced thermal contrast for IR surveys");
  }
  return hints;
}

export function emptyEnvironment(now = new Date().toISOString()): EnvironmentalSnapshot {
  return { timestamp: now };
}

/**
 * Build environmental snapshot from weather-station telemetry measurements
 * plus optional scenario enrichment.
 */
export function environmentFromWeatherTelemetry(
  measurements: {
    irradiance?: number;
    poaIrradiance?: number;
    temperature?: number;
    moduleTemperature?: number;
    windSpeed?: number;
    windDirection?: number;
    humidity?: number;
  },
  extras?: Partial<EnvironmentalSnapshot>,
  timestamp = new Date().toISOString(),
): EnvironmentalSnapshot {
  const ghi = measurements.irradiance;
  const cloud =
    extras?.cloudCover ??
    (ghi == null ? undefined : Math.max(0, Math.min(100, 100 - (ghi / 10))));
  return {
    timestamp,
    ghi,
    poaIrradiance: measurements.poaIrradiance,
    ambientTemperature: measurements.temperature,
    moduleTemperature: measurements.moduleTemperature,
    windSpeed: measurements.windSpeed,
    windDirection: measurements.windDirection,
    relativeHumidity: measurements.humidity,
    cloudCover: cloud,
    dni: extras?.dni,
    dhi: extras?.dhi,
    rainfall: extras?.rainfall ?? 0,
    precipitationProbability: extras?.precipitationProbability,
    atmosphericPressure: extras?.atmosphericPressure ?? 1013,
    visibility: extras?.visibility,
    soilingIndex: extras?.soilingIndex,
    snowCover: extras?.snowCover ?? 0,
    scenario: extras?.scenario,
  };
}
