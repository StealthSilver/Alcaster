import { AlertsSection } from "@/components/landing/AlertsSection";
import { AnalyticsSection } from "@/components/landing/AnalyticsSection";
import { BuilderSection } from "@/components/landing/BuilderSection";
import { CapabilityGrid } from "@/components/landing/CapabilityGrid";
import { CTA } from "@/components/landing/CTA";
import { DigitalTwinSection } from "@/components/landing/DigitalTwinSection";
import { EnterpriseSection } from "@/components/landing/EnterpriseSection";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Navbar } from "@/components/landing/Navbar";
import { PartnersSection } from "@/components/landing/PartnersSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { RealtimeSection } from "@/components/landing/RealtimeSection";
import { SimulationSection } from "@/components/landing/SimulationSection";
import { TechnologySection } from "@/components/landing/TechnologySection";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { WhyAlcaster } from "@/components/landing/WhyAlcaster";

export function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <ProblemSection />
        <DigitalTwinSection />
        <ProductShowcase />
        <CapabilityGrid />
        <HowItWorks />
        <BuilderSection />
        <RealtimeSection />
        <SimulationSection />
        <AnalyticsSection />
        <AlertsSection />
        <TechnologySection />
        <WhyAlcaster />
        <EnterpriseSection />
        <PartnersSection />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
