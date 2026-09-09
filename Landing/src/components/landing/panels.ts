export const LANDING_PANELS = [
  { id: "top", label: "Home", inNav: false },
  { id: "platform", label: "Platform", inNav: true },
  { id: "solutions", label: "Solutions", inNav: true },
  { id: "technology", label: "Technology", inNav: true },
  { id: "resources", label: "Resources", inNav: true },
  { id: "demo", label: "Demo", inNav: false },
] as const;

export type LandingPanelId = (typeof LANDING_PANELS)[number]["id"];

export const NAV_LINKS = LANDING_PANELS.filter((panel) => panel.inNav);

export const PANEL_COUNT = LANDING_PANELS.length;

export function isLandingPanelId(value: string): value is LandingPanelId {
  return LANDING_PANELS.some((panel) => panel.id === value);
}

export function panelIndex(id: LandingPanelId): number {
  return LANDING_PANELS.findIndex((panel) => panel.id === id);
}
