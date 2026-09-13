"use client";

import { ContactSection } from "@/components/landing/ContactSection";
import { CapabilityGrid } from "@/components/landing/CapabilityGrid";
import { DigitalTwinSection } from "@/components/landing/DigitalTwinSection";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingLogo } from "@/components/landing/LandingLogo";
import { LandingNavProvider } from "@/components/landing/LandingNavContext";
import { LandingSlider } from "@/components/landing/LandingSlider";
import { Navbar } from "@/components/landing/Navbar";
import { WhyAlcaster } from "@/components/landing/WhyAlcaster";

function LandingShell() {
  return (
    <div className="relative h-dvh w-full overflow-hidden touch-pan-x">
      {/* Fixed shell background stays put while panels slide */}
      <div className="pointer-events-none absolute inset-0 alcaster-horizon" aria-hidden />
      <LandingLogo />
      <div className="absolute inset-x-0 top-0 bottom-[var(--landing-nav-h)] overflow-hidden">
        <LandingSlider>
          <Hero />
          <DigitalTwinSection />
          <CapabilityGrid />
          <HowItWorks />
          <WhyAlcaster />
          <ContactSection />
        </LandingSlider>
      </div>
      <Navbar />
    </div>
  );
}

export function LandingPage() {
  return (
    <LandingNavProvider>
      <LandingShell />
    </LandingNavProvider>
  );
}
