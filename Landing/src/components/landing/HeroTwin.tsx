"use client";

import { useRef } from "react";

import { DigitalTwinScene } from "@/components/twin/DigitalTwinScene";
import { cn } from "@/lib/cn";

type HeroTwinProps = {
  className?: string;
};

export function HeroTwin({ className }: HeroTwinProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={frameRef} className={cn("relative h-full w-full", className)}>
      <DigitalTwinScene
        framed={false}
        showLabels={false}
        showFlows={false}
        float={false}
        interactive={false}
        className="h-full min-h-[320px] bg-transparent sm:min-h-[380px]"
      />
    </div>
  );
}
