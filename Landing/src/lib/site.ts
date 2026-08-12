/**
 * Alcaster site identity and SEO constants.
 *
 * Set `NEXT_PUBLIC_SITE_URL` to the production origin (no trailing slash), e.g.:
 *   NEXT_PUBLIC_SITE_URL=https://your-domain.com
 *
 * When unset, a local-dev placeholder is used so relative metadata URLs can resolve.
 * Do not treat the fallback as a production domain.
 */

export const SITE_NAME = "Alcaster";

export const SITE_TITLE =
  "Alcaster — Renewable Energy Digital Twin Platform";

export const SITE_DESCRIPTION =
  "Alcaster is a renewable energy digital twin platform for creating, visualizing, and managing interactive 3D replicas of solar and other renewable power plants.";

export const SITE_KEYWORDS = [
  "Alcaster",
  "renewable energy",
  "digital twin",
  "renewable energy digital twin",
  "solar plant digital twin",
  "solar power plant",
  "3D power plant visualization",
  "renewable power plant visualization",
  "solar plant visualization",
  "power plant digital twin",
  "renewable energy software",
  "solar plant monitoring",
  "renewable energy analytics",
  "SCADA digital twin",
] as const;

/** Expected public asset path for social previews. Add `public/og-image.png` when ready. */
export const OG_IMAGE_PATH = "/og-image.png";

/**
 * Brand icon assets under `public/`.
 * Light / dark SVGs follow `prefers-color-scheme` in root metadata.
 */
export const ICON_ASSET_PATHS = {
  light: "/Alcaster-light.svg",
  dark: "/Alcaster-dark.svg",
  apple: "/Alcaster-light.svg",
} as const;

/** Local-dev / unset-env placeholder — replace via NEXT_PUBLIC_SITE_URL for production. */
const SITE_URL_PLACEHOLDER = "http://localhost:3000";

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!fromEnv) {
    return SITE_URL_PLACEHOLDER;
  }
  return fromEnv.replace(/\/$/, "");
}
