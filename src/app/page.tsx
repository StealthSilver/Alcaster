import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import BlurIn from "@/components/animations/BlurIn";
import SplitText from "@/components/animations/SplitText";
import HLSVideoPlayer from "@/components/HLSVideoPlayer";
import { Navbar } from "@/components/Navbar";
import { Security } from "@/components/Security";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <main
        className="relative min-h-screen w-full overflow-hidden"
        style={{ backgroundColor: "#000000" }}
      >
        <Navbar />
        {/* Background Video */}
        <div
          className="absolute inset-0 z-0 lg:ml-[200px] lg:scale-120 lg:origin-left"
          style={{
            marginLeft: "0",
            transform: "scale(1.1)",
            transformOrigin: "center",
          }}
        >
          <HLSVideoPlayer
            src="https://customer-cbeadsgr09pnsezs.cloudflarestream.com/df176a2fb2ea2b64bd21ae1c10d3af6a/manifest/video.m3u8"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Bottom Fade Gradient */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 md:h-40 z-10"
          style={{
            background: `linear-gradient(to top, #000000, transparent)`,
          }}
        />

        {/* Content */}
        <div className="relative z-20 min-h-screen flex items-center py-20 md:py-24">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex flex-col gap-6 sm:gap-8 md:gap-12">
              {/* Badge and Heading Group */}
              <div className="flex flex-col gap-4 sm:gap-6">
                {/* Badge */}
                <BlurIn duration={0.6} delay={0}>
                  <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20 backdrop-blur-sm w-fit">
                    <Sparkles className="w-3 h-3 text-white/80" />
                    <span className="text-xs sm:text-sm font-medium text-white/80">
                      Decentralized Family Vault
                    </span>
                  </div>
                </BlurIn>

                {/* Main Heading */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-tight lg:leading-[1.2] text-foreground">
                  <SplitText delay={0} duration={0.6} wordDelay={0.08}>
                    Alcaster — Preserve What Matters.
                  </SplitText>{" "}
                  <SplitText
                    delay={0.4}
                    duration={0.6}
                    wordDelay={0.08}
                    className="font-serif italic"
                  >
                    Forever.
                  </SplitText>
                </h1>

                {/* Subtitle */}
                <BlurIn delay={0.4} duration={0.6}>
                  <p className="text-white/80 text-base sm:text-lg font-normal leading-relaxed max-w-xl">
                    A blockchain-secured family vault where ownership, trust,
                    and access are passed down over time.
                  </p>
                </BlurIn>
              </div>

              {/* CTA Buttons */}
              <BlurIn delay={0.6} duration={0.6}>
                <div className="flex gap-3 sm:gap-4 flex-wrap">
                  <Link
                    href="/book-call"
                    className="flex items-center gap-2 bg-foreground text-background rounded-full px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-medium transition-all hover:opacity-90"
                  >
                    Build Your Family Tree
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button className="bg-white/20 backdrop-blur-sm text-white rounded-full px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-medium transition-all hover:bg-white/30">
                    Learn now
                  </button>
                </div>
              </BlurIn>
            </div>
          </div>
        </div>
      </main>
      <HowItWorks />
      <Features />
      <Security />
      <CTA />
      <Footer />
    </>
  );
}
