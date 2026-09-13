/** Consistent unit formatting for live operational UI. */

export function formatPowerKw(kw: number | undefined | null): string {
  if (kw == null || !Number.isFinite(kw)) return "—";
  const abs = Math.abs(kw);
  if (abs >= 1000) return `${(kw / 1000).toFixed(2)} MW`;
  if (abs >= 100) return `${kw.toFixed(0)} kW`;
  if (abs >= 10) return `${kw.toFixed(1)} kW`;
  return `${kw.toFixed(2)} kW`;
}

export function formatEnergyKwh(kwh: number | undefined | null): string {
  if (kwh == null || !Number.isFinite(kwh)) return "—";
  if (Math.abs(kwh) >= 1000) return `${(kwh / 1000).toFixed(2)} MWh`;
  return `${kwh.toFixed(1)} kWh`;
}

export function formatTempC(c: number | undefined | null): string {
  if (c == null || !Number.isFinite(c)) return "—";
  return `${c.toFixed(1)} °C`;
}

export function formatIrradiance(wm2: number | undefined | null): string {
  if (wm2 == null || !Number.isFinite(wm2)) return "—";
  return `${Math.round(wm2)} W/m²`;
}

export function formatPercent(pct: number | undefined | null, digits = 1): string {
  if (pct == null || !Number.isFinite(pct)) return "—";
  return `${pct.toFixed(digits)}%`;
}

export function formatVoltage(v: number | undefined | null, unit: "V" | "kV" = "V"): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (unit === "kV") return `${v.toFixed(2)} kV`;
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(2)} kV`;
  return `${v.toFixed(0)} V`;
}

export function formatCurrent(a: number | undefined | null): string {
  if (a == null || !Number.isFinite(a)) return "—";
  if (Math.abs(a) >= 100) return `${a.toFixed(0)} A`;
  return `${a.toFixed(1)} A`;
}

export function formatFrequency(hz: number | undefined | null): string {
  if (hz == null || !Number.isFinite(hz)) return "—";
  return `${hz.toFixed(2)} Hz`;
}

export function formatWind(ms: number | undefined | null): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  return `${ms.toFixed(1)} m/s`;
}

export function formatPowerFactor(pf: number | undefined | null): string {
  if (pf == null || !Number.isFinite(pf)) return "—";
  return pf.toFixed(2);
}

export function formatClock(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatRelativeAge(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const sec = Math.max(0, Math.round((now - t) / 1000));
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ago`;
}

export function operationalStatusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}
