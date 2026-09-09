
import { Cloud, Sun, Thermometer, Wind } from "lucide-react";
import { motion } from "framer-motion";

import type { WeatherConditions } from "@/data/dashboard";

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
      label: "Cloud Cover",
      value: `${weather.cloudCoverPct}`,
      unit: "%",
      Icon: Cloud,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_8px_28px_rgba(0,0,0,0.22)]"
      aria-label="Current conditions"
    >
      <div>
        <h2 className="text-base font-semibold tracking-tight text-white">
          Current Conditions
        </h2>
        <p className="mt-1 text-sm text-white/40">
          {subtitle}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {items.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 + index * 0.05 }}
            className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-3"
          >
            <div className="flex items-center gap-2 text-white/40">
              <item.Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em]">
                {item.label}
              </span>
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums tracking-tight text-white">
              {item.value}
              <span className="ml-1 text-xs font-medium text-white/40">
                {item.unit}
              </span>
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.05]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#e6740a]/80 to-white/20"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (weather.irradianceWm2 / 1000) * 100)}%` }}
          transition={{ duration: 1.2, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <p className="mt-2 text-[11px] text-white/30">
        Irradiance vs clear-sky reference
      </p>
    </motion.section>
  );
}
