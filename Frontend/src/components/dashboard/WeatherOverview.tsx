import { Cloud, Sun, Thermometer, Wind } from "lucide-react";

import type { WeatherConditions } from "@/data/dashboard";

import { panelClass, sectionHintClass, sectionTitleClass } from "./panel";

type WeatherOverviewProps = {
  weather: WeatherConditions;
  subtitle?: string;
};

export function WeatherOverview({
  weather,
  subtitle = "Site environmental inputs linked to generation",
}: WeatherOverviewProps) {
  const items = [
    {
      label: "Irradiance",
      value: `${weather.irradianceWm2}`,
      unit: "W/m²",
      Icon: Sun,
    },
    {
      label: "Temperature",
      value: `${weather.temperatureC}`,
      unit: "°C",
      Icon: Thermometer,
    },
    {
      label: "Wind",
      value: `${weather.windKmh}`,
      unit: "km/h",
      Icon: Wind,
    },
    {
      label: "Cloud cover",
      value: `${weather.cloudCoverPct}`,
      unit: "%",
      Icon: Cloud,
    },
  ];

  return (
    <section className={panelClass} aria-label="Current conditions">
      <div className="border-b border-edge px-4 py-3">
        <h2 className={sectionTitleClass}>Conditions</h2>
        <p className={sectionHintClass}>{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-edge">
        {items.map((item) => (
          <div key={item.label} className="px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <item.Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              {item.label}
            </div>
            <p className="mt-1.5 text-lg font-semibold tabular-nums text-fg">
              {item.value}
              <span className="ml-1 text-xs font-medium text-muted">
                {item.unit}
              </span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
