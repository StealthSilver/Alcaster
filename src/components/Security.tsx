"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Database,
  Fingerprint,
  Globe,
  Lock,
  Eye,
} from "lucide-react";

const securityFeatures = [
  { icon: ShieldCheck, label: "End-to-End Encryption" },
  { icon: Database, label: "Decentralized Storage" },
  { icon: Fingerprint, label: "Biometric Access" },
  { icon: Globe, label: "Solana Powered" },
  { icon: Lock, label: "Zero Knowledge" },
  { icon: Eye, label: "Privacy First" },
];

export const Security = () => {
  return (
    <section
      id="security"
      className="relative py-20 sm:py-28 md:py-40 overflow-hidden"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Massive background text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span className="text-[15vw] sm:text-[20vw] font-bold text-white/[0.03] whitespace-nowrap select-none">
          SECURE
        </span>
      </div>

      {/* Radial gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[1000px] h-[500px] sm:h-[1000px] rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 md:gap-24 items-center">
          {/* Left - Visual element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative aspect-square max-w-md mx-auto lg:mx-0 lg:max-w-lg"
          >
            {/* Pulsing rings with blue gradient glow */}
            <motion.div
              animate={{
                scale: [1, 1.02, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full border-2 border-blue-400/30"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
                boxShadow: "0 0 40px rgba(59, 130, 246, 0.4)",
              }}
            />
            <motion.div
              animate={{
                scale: [1, 1.03, 1],
                opacity: [0.4, 0.6, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="absolute inset-8 rounded-full border-2 border-blue-400/40"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(59, 130, 246, 0.2) 0%, transparent 70%)",
                boxShadow:
                  "inset 0 0 40px rgba(59, 130, 246, 0.3), 0 0 50px rgba(59, 130, 246, 0.5)",
              }}
            />
            <motion.div
              animate={{
                scale: [1, 1.04, 1],
                opacity: [0.5, 0.7, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute inset-16 rounded-full border-2 border-blue-400/50"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(59, 130, 246, 0.25) 0%, transparent 70%)",
                boxShadow:
                  "inset 0 0 50px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.6)",
              }}
            />

            {/* Center content with glow */}
            <div
              className="absolute inset-20 sm:inset-24 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-blue-400/40 flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(59, 130, 246, 0.25) 0%, rgba(255, 255, 255, 0.05) 100%)",
                boxShadow:
                  "inset 0 0 60px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.4)",
              }}
            >
              <div className="text-center hidden md:block">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-1 sm:mb-2"
                  style={{
                    textShadow: "0 0 30px rgba(59, 130, 246, 0.5)",
                  }}
                >
                  256
                </motion.div>
                <div className="text-xs sm:text-sm text-white/90 font-medium">
                  Bit Encryption
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right - Content */}
          <div className="space-y-6 sm:space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-blue-400 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-3 sm:mb-4">
                Security First
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium text-foreground mb-4 sm:mb-6 leading-tight">
                Fortress-Grade{" "}
                <span className="font-serif italic">Protection</span>
              </h2>
              <p className="text-base sm:text-lg text-white/80 leading-relaxed">
                Your family's most precious information deserves the strongest
                protection. Alcaster leverages the Solana blockchain to create
                an immutable, decentralized vault that no single entity can
                access.
              </p>
            </motion.div>

            {/* Feature buttons in structured grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
            >
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                  whileHover={{
                    scale: 1.03,
                    borderColor: "rgba(96, 165, 250, 0.5)",
                    boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
                  }}
                  className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 rounded-xl border border-white/20 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm text-xs sm:text-sm text-white/80 hover:text-white transition-all cursor-pointer"
                >
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                  </div>
                  <span className="font-medium">{feature.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-3 gap-4 sm:gap-8 pt-2 sm:pt-4"
            >
              {[
                { value: "10K+", label: "Families" },
                { value: "0", label: "Breaches" },
                { value: "99.9%", label: "Uptime" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                  className="text-center lg:text-left"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-white/70">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
