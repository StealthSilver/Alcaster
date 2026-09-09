"use client";

import { cn } from "@/lib/cn";

import { useLandingNav } from "./LandingNavContext";
import { NAV_LINKS } from "./panels";

export function Navbar() {
  const { activeId, goTo } = useLandingNav();

  return (
    <header className="absolute inset-x-0 bottom-0 z-50 h-[var(--landing-nav-h)]">
      <div className="flex h-full items-center justify-center border-t border-white/[0.08] bg-[rgba(1,6,9,0.92)] backdrop-blur-md">
        <nav
          className="flex items-center justify-center gap-1 px-5 sm:gap-2 sm:px-6 lg:gap-8"
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
                  "relative px-2.5 py-2 text-[11px] font-medium tracking-tight transition-colors duration-300 sm:px-3 sm:text-sm",
                  active ? "text-white" : "text-white/55 hover:text-white",
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute inset-x-2 -bottom-0.5 h-px origin-center bg-[#e6740a] transition-transform duration-300 sm:inset-x-3",
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
