"use client";

import { cn } from "@/lib/cn";

import { useLandingNav } from "./LandingNavContext";
import { NAV_LINKS, PANEL_COUNT, panelIndex } from "./panels";

export function Navbar() {
  const { activeId, goTo } = useLandingNav();
  const progress = (panelIndex(activeId) + 1) / PANEL_COUNT;

  return (
    <header className="absolute inset-x-0 bottom-0 z-50 h-[var(--landing-nav-h)]">
      <div className="absolute inset-x-0 top-0 h-px bg-white/[0.08]" aria-hidden>
        <div
          className="h-full bg-[#e6740a] transition-[width] duration-500 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="flex h-full items-center justify-center bg-[rgba(1,6,9,0.72)] backdrop-blur-md">
        <nav
          className="flex items-center justify-center gap-0.5 px-3 sm:gap-1 sm:px-6 lg:gap-6"
          aria-label="Primary"
        >
          {NAV_LINKS.map((link) => {
            const active = activeId === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => goTo(link.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative px-2.5 py-2 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors duration-300 sm:px-3 sm:text-[11px]",
                  active ? "text-white" : "text-white/40 hover:text-white/75",
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute inset-x-2.5 -bottom-0.5 h-px origin-center bg-[#e6740a] transition-transform duration-300 sm:inset-x-3",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                  aria-hidden
                />
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
