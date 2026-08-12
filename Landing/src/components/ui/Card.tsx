import { cn } from "@/lib/cn";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
};

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]",
        hover &&
          "transition-[border-color,background-color,transform] duration-400 hover:border-white/[0.14] hover:bg-white/[0.05]",
        className,
      )}
    >
      {children}
    </div>
  );
}
