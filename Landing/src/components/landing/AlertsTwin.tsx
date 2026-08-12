"use client";

import { DigitalTwinScene } from "@/components/twin/DigitalTwinScene";
import { cn } from "@/lib/cn";

type AlertsTwinProps = {
  className?: string;
};

/** Pure twin visualization with INV-034 warning highlight. */
export function AlertsTwin({ className }: AlertsTwinProps) {
  return (
    <div className={cn("relative", className)}>
      <DigitalTwinScene
        warningId="inv-034"
        interactive={false}
        showLabels={false}
        showTooltip={false}
        float
        compact
        className="aspect-[16/10] w-full"
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            "radial-gradient(ellipse 40% 45% at 38% 55%, rgba(230,116,10,0.14), transparent 60%)",
        }}
        aria-hidden
      />
    </div>
  );
}
