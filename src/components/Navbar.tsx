"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export const Navbar = () => {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-5"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between rounded-full border border-white/20 bg-black/40 backdrop-blur-xl px-6 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-xl font-semibold text-white tracking-tight">
              Alcaster
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {["Features", "How It Works", "Security", "Pricing"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="relative px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors group"
              >
                {item}
                <span className="absolute inset-x-4 -bottom-px h-px bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/get-started"
                className="inline-flex items-center rounded-full bg-white text-black px-5 py-2.5 text-sm font-semibold transition-all hover:bg-white/90"
              >
                Get Started
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
