"use client";

import Image from "next/image";
import Link from "next/link";

import { useLandingNav } from "./LandingNavContext";

export function LandingLogo() {
  const { goTo } = useLandingNav();

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex justify-center pt-5 sm:pt-6">
      <Link
        href="#top"
        className="pointer-events-auto relative flex items-center gap-2.5"
        aria-label="Alcaster home"
        onClick={(event) => {
          event.preventDefault();
          goTo("top");
        }}
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
    </div>
  );
}
