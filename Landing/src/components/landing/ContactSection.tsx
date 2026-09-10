"use client";

import { CTA } from "@/components/landing/CTA";
import { Container } from "@/components/ui/Container";

export function ContactSection() {
  return (
    <section
      id="contact"
      className="relative flex h-full min-h-0 flex-col overflow-hidden"
    >
      <div className="relative flex min-h-0 flex-1 flex-col justify-center pt-20 pb-6 sm:pt-[4.75rem] sm:pb-8">
        <Container>
          <div className="mx-auto max-w-3xl">
            <CTA />
          </div>
        </Container>
      </div>
    </section>
  );
}
