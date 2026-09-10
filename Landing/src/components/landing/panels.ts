export const LANDING_PANELS = [
  { id: "top", label: "Home", inNav: true },
  { id: "platform", label: "Platform", inNav: true },
  { id: "solutions", label: "Solutions", inNav: true },
  { id: "technology", label: "Technology", inNav: true },
  { id: "resources", label: "Resources", inNav: true },
  { id: "contact", label: "Contact", inNav: true },
] as const;

export type LandingPanelId = (typeof LANDING_PANELS)[number]["id"];

export const NAV_LINKS = LANDING_PANELS.filter((panel) => panel.inNav);

export const PANEL_COUNT = LANDING_PANELS.length;

export function isLandingPanelId(value: string): value is LandingPanelId {
  return LANDING_PANELS.some((panel) => panel.id === value);
}

export function resolvePanelId(value: string): LandingPanelId | null {
  if (value === "demo") return "contact";
  if (isLandingPanelId(value)) return value;
  return null;
}

export function panelIndex(id: LandingPanelId): number {
  return LANDING_PANELS.findIndex((panel) => panel.id === id);
}
