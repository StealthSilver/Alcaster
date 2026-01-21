"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Features", sectionId: "features" },
  { label: "How It Works", sectionId: "how-it-works" },
  { label: "Security", sectionId: "security" },
];

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Navbar height offset
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setMobileMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-12 py-3 sm:py-5"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between rounded-full border border-white/20 bg-black/40 backdrop-blur-xl px-4 sm:px-6 py-2.5 sm:py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.svg" alt="Alcaster" className="h-5 sm:h-6 w-auto" />
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.sectionId)}
                className="relative px-3 lg:px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors group"
              >
                {item.label}
                <span className="absolute inset-x-3 lg:inset-x-4 -bottom-px h-px bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden lg:inline-flex px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="hidden md:block"
            >
              <Link
                href="/get-started"
                className="inline-flex items-center rounded-full bg-white text-black px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all hover:bg-white/90"
              >
                Get Started
              </Link>
            </motion.div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="md:hidden mt-2 rounded-3xl border border-white/20 bg-black/95 backdrop-blur-xl p-4"
            >
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => scrollToSection(item.sectionId)}
                    className="px-4 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all text-left"
                  >
                    {item.label}
                  </button>
                ))}
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/get-started"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm font-semibold text-center bg-white text-black rounded-xl transition-all hover:bg-white/90 mt-2"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};
