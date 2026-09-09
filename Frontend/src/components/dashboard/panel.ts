export const panelClass =
  "rounded-md border border-edge bg-surface";

export const panelPadClass = `${panelClass} p-5`;

export const menuPanelClass =
  "overflow-hidden rounded-md border border-edge bg-surface";

export const sectionTitleClass = "text-sm font-semibold text-fg";

export const sectionHintClass = "mt-0.5 text-xs text-muted";

export const iconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-edge-strong text-muted transition-colors hover:bg-fill hover:text-fg";

export const compactSearchClass =
  "h-8 rounded-md border border-edge-strong bg-input pl-8 pr-2.5 text-sm text-fg placeholder:text-subtle outline-none transition-colors focus:border-accent/50";

export const menuItemClass =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-secondary transition-colors hover:bg-fill hover:text-fg";

export function sidebarItemClass(active: boolean) {
  return [
    "relative flex h-9 items-center gap-3 overflow-hidden rounded-md px-3 text-[13px] font-medium transition-colors",
    active
      ? "bg-fill text-fg"
      : "text-muted hover:bg-fill hover:text-fg",
  ].join(" ");
}

export function formControlClass(error?: string, extra = "") {
  return [
    "h-9 w-full rounded-md border bg-input px-3 text-sm text-fg placeholder:text-subtle outline-none transition-colors",
    error
      ? "border-danger/50 focus:border-danger/70"
      : "border-edge-strong focus:border-accent/50",
    extra,
  ].join(" ");
}
