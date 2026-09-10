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
    </div>
  );
}
