import { cn } from "@/lib/cn";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "neutral" | "accent";
};

export function Badge({ children, className, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em]",
        tone === "accent"
          ? "border-[#e6740a]/30 bg-[#e6740a]/10 text-[#e6740a]"
          : "border-white/10 bg-white/[0.03] text-white/55",
        className,
      )}
    >
      {children}
    </span>
  );
}
