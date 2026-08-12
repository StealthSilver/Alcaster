import Link from "next/link";

import { Container } from "@/components/ui/Container";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Platform", href: "#platform" },
      { label: "Solutions", href: "#solutions" },
      { label: "Technology", href: "#technology" },
      { label: "Resources", href: "#resources" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#resources" },
      { label: "Contact", href: "#demo" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#privacy" },
      { label: "Terms", href: "#terms" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08]">
      <Container className="py-12 sm:py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-16">
          <div className="max-w-xs">
            <p className="text-sm font-semibold tracking-[0.2em] text-white">
              ALCASTER
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/40">
              Digital Twins for Renewable Energy
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-12">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/50 transition-colors duration-300 hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-white/[0.06] pt-6">
          <p className="text-xs text-white/30">© 2026 Alcaster</p>
        </div>
      </Container>
    </footer>
  );
}
