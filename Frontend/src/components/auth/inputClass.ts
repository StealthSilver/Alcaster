export function inputClass(error?: string, extra = "") {
  return [
    "h-11 w-full rounded-lg border bg-input px-3 text-sm text-fg placeholder:text-subtle outline-none transition-colors",
    error
      ? "border-danger/50 focus:border-danger/70"
      : "border-edge focus:border-accent/40 focus:bg-fill",
    extra,
  ].join(" ");
}
