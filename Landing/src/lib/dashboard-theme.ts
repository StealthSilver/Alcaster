/** Alcaster dashboard design tokens — palette only + alpha variants. */
export const colors = {
  bg: "#010609",
  white: "#ffffff",
  accent: "#e6740a",
  white005: "rgba(255,255,255,0.05)",
  white008: "rgba(255,255,255,0.08)",
  white012: "rgba(255,255,255,0.12)",
  white02: "rgba(255,255,255,0.2)",
  white04: "rgba(255,255,255,0.4)",
  white06: "rgba(255,255,255,0.6)",
  white08: "rgba(255,255,255,0.8)",
  accent012: "rgba(230,116,10,0.12)",
  accent02: "rgba(230,116,10,0.2)",
  accent025: "rgba(230,116,10,0.25)",
  accent04: "rgba(230,116,10,0.4)",
  /** Restrained online status — desaturated green kept minimal */
  online: "rgba(120, 180, 140, 0.9)",
  onlineGlow: "rgba(120, 180, 140, 0.35)",
} as const;
