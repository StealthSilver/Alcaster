import Link from "next/link";

import { Container } from "@/components/ui/Container";

import { NAV_LINKS } from "./panels";

const LEGAL_LINKS = [
  { label: "Privacy", href: "#privacy" },
  { label: "Terms", href: "#terms" },
] as const;

export function Footer() {
  return (
    <footer className="relative shrink-0 border-t border-white/[0.08]">
      <Container className="flex flex-col gap-4 py-5 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold tracking-[0.18em] text-white">
            ALCASTER
          </p>

          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.id}
                href={`#${link.id}`}
                className="text-[13px] text-white/45 transition-colors duration-300 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/30">© 2026 Alcaster</p>
          <div className="flex items-center gap-4">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-white/28 transition-colors duration-300 hover:text-white/55"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
