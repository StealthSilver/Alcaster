"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "Solutions", href: "#solutions" },
  { label: "Technology", href: "#technology" },
  { label: "Resources", href: "#resources" },
] as const;

function getFocusable(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const overlay = overlayRef.current;
    const focusables = overlay ? getFocusable(overlay) : [];
    focusables[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key !== "Tab" || !overlay) return;

      const items = getFocusable(overlay);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeMenu]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "border-b transition-[background-color,border-color,backdrop-filter] duration-300",
          scrolled
            ? "border-white/[0.08] bg-[rgba(1,6,9,0.85)] backdrop-blur-md"
            : "border-transparent bg-transparent",
        )}
      >
        <Container className="flex h-16 items-center justify-between gap-4 sm:h-[4.25rem]">
          <Link
            href="#top"
            className="relative flex shrink-0 items-center gap-2.5"
            aria-label="Alcaster home"
          >
            <Image
              src="/Alcaster-dark.svg"
              alt=""
              width={91}
              height={41}
              className="h-7 w-auto sm:h-8"
              priority
            />
            <span className="text-sm font-semibold tracking-[0.18em] text-white">
              ALCASTER
            </span>
          </Link>

          <nav
            className="hidden items-center gap-8 lg:flex"
            aria-label="Primary"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/55 transition-colors duration-300 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Button href="/dashboard" variant="ghost" size="sm">
              Sign In
            </Button>
            <Button href="#demo" variant="primary" size="sm">
              Request a Demo
            </Button>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/[0.04] hover:text-white lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </Container>
      </div>

      {open ? (
        <div
          ref={overlayRef}
          id={menuId}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="fixed inset-0 z-50 flex flex-col bg-[rgba(1,6,9,0.97)] backdrop-blur-md lg:hidden"
        >
          <div className="flex h-16 items-center justify-between px-5 sm:h-[4.25rem] sm:px-6">
            <Link
              href="#top"
              className="flex items-center gap-2.5"
              aria-label="Alcaster home"
              onClick={closeMenu}
            >
              <Image
                src="/Alcaster-dark.svg"
                alt=""
                width={91}
                height={41}
                className="h-7 w-auto"
              />
              <span className="text-sm font-semibold tracking-[0.18em] text-white">
                ALCASTER
              </span>
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/[0.04] hover:text-white"
              aria-label="Close menu"
              onClick={closeMenu}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav
            className="flex flex-1 flex-col justify-center gap-1 px-5 sm:px-6"
            aria-label="Mobile primary"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="border-b border-white/[0.06] py-4 text-2xl font-medium tracking-tight text-white transition-colors hover:text-[#e6740a]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3 px-5 pb-10 sm:px-6">
            <Button href="/dashboard" variant="secondary" size="lg" onClick={closeMenu}>
              Sign In
            </Button>
            <Button href="#demo" variant="primary" size="lg" onClick={closeMenu}>
              Request a Demo
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
