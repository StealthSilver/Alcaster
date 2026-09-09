"use client";

import { Children, useCallback, useEffect, useRef } from "react";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

import { useLandingNav } from "./LandingNavContext";
import { LANDING_PANELS, PANEL_COUNT } from "./panels";

const SLIDE_MS = 900;
const WHEEL_THRESHOLD = 100;
const WHEEL_IDLE_MS = 200;

type LandingSliderProps = {
  children: React.ReactNode;
};

export function LandingSlider({ children }: LandingSliderProps) {
  const { activeIndex, goToIndex } = useLandingNav();
  const reduced = usePrefersReducedMotion();
  const slides = Children.toArray(children);

  const indexRef = useRef(activeIndex);
  const animatingRef = useRef(false);
  const pointerStart = useRef<number | null>(null);
  const wheelAcc = useRef(0);
  const lastWheelAt = useRef(0);
  const unlockTimer = useRef<number>(0);
  const hasSlid = useRef(false);

  indexRef.current = activeIndex;

  useEffect(() => {
    if (!hasSlid.current) {
      hasSlid.current = true;
      return;
    }
    animatingRef.current = true;
    window.clearTimeout(unlockTimer.current);
    unlockTimer.current = window.setTimeout(() => {
      animatingRef.current = false;
    }, SLIDE_MS);
    return () => window.clearTimeout(unlockTimer.current);
  }, [activeIndex]);

  const moveBy = useCallback(
    (direction: number) => {
      if (animatingRef.current || direction === 0) return;
      const nextIndex = indexRef.current + direction;
      if (nextIndex < 0 || nextIndex >= PANEL_COUNT) return;
      goToIndex(nextIndex);
    },
    [goToIndex],
  );

  const moveByRef = useRef(moveBy);
  moveByRef.current = moveBy;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveByRef.current(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveByRef.current(-1);
      } else if (event.key === "Home") {
        event.preventDefault();
        if (!animatingRef.current) goToIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        if (!animatingRef.current) goToIndex(PANEL_COUNT - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToIndex]);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();

      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      const raw = horizontal ? event.deltaX : event.deltaY;
      const delta =
        event.deltaMode === 1 ? raw * 16 : event.deltaMode === 2 ? raw * window.innerHeight : raw;
      const direction = delta > 0 ? 1 : delta < 0 ? -1 : 0;
      if (direction === 0) return;

      const now = performance.now();
      if (now - lastWheelAt.current > WHEEL_IDLE_MS) {
        wheelAcc.current = 0;
      }
      lastWheelAt.current = now;

      const atStart = indexRef.current <= 0 && direction < 0;
      const atEnd = indexRef.current >= PANEL_COUNT - 1 && direction > 0;
      if (atStart || atEnd || animatingRef.current) {
        wheelAcc.current = 0;
        return;
      }

      wheelAcc.current += delta;
      if (Math.abs(wheelAcc.current) < WHEEL_THRESHOLD) return;

      wheelAcc.current = 0;
      moveByRef.current(direction);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as HTMLElement | null)?.closest("a, button, input, textarea")) {
      pointerStart.current = null;
      return;
    }
    pointerStart.current = event.clientX;
  }, []);

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStart.current == null) return;
    const dx = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(dx) < 64) return;
    moveByRef.current(dx < 0 ? 1 : -1);
  }, []);

  return (
    <div
      className="h-full w-full overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        pointerStart.current = null;
      }}
    >
      <div
        className="flex h-full"
        data-active-index={activeIndex}
        style={{
          transform: `translate3d(${-activeIndex * 100}vw, 0, 0)`,
          transitionProperty: reduced ? "none" : "transform",
          transitionDuration: reduced ? "0ms" : `${SLIDE_MS}ms`,
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {slides.map((child, index) => {
          const panel = LANDING_PANELS[index];
          const active = index === activeIndex;
          return (
            <div
              key={panel?.id ?? index}
              className="h-full min-h-0 w-screen shrink-0 overflow-hidden"
              aria-hidden={!active}
              {...(active ? {} : { inert: true })}
            >
              {child}
            </div>
          );
        })}
      </div>
    </div>
  );
}
