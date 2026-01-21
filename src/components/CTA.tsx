"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export const CTA = () => {
  return (
    <section
      className="relative py-32 overflow-hidden"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Dramatic gradient background */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-blue-500/20 via-blue-500/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      {/* Animated particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-blue-400/40"
          style={{
            left: `${15 + i * 15}%`,
            top: `${30 + (i % 3) * 20}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}

      <div className="relative mx-auto max-w-5xl px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Large heading */}
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-medium text-foreground mb-8 leading-tight">
            Start Building Your
            <br />
            <span className="font-serif italic">Eternal Legacy</span>
          </h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Join thousands of families who trust Alcaster to preserve their most
            important documents, memories, and secrets across generations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/get-started"
                className="group inline-flex items-center gap-3 rounded-full bg-foreground text-background px-8 py-5 text-lg font-semibold transition-all hover:opacity-90"
              >
                Create Your Vault
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/demo"
                className="inline-flex items-center rounded-full border border-white/20 bg-white/20 backdrop-blur-sm px-8 py-5 text-lg font-medium text-white transition-all hover:border-white/30 hover:bg-white/30"
              >
                Watch Demo
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-16 flex flex-wrap justify-center items-center gap-8 text-white/70"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-sm">5GB free storage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-sm">Up to 10 family members</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
