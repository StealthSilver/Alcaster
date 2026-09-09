export function inputClass(error?: string, extra = "") {
  return [
    "h-11 w-full rounded-lg border bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/25 outline-none transition-colors",
    error
      ? "border-[#f07167]/50 focus:border-[#f07167]/70"
      : "border-white/[0.08] focus:border-[#e6740a]/40 focus:bg-white/[0.05]",
    extra,
  ].join(" ");
}
