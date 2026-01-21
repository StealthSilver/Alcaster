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

const orbitIcons = [
  { icon: Globe, angle: 0 },
  { icon: Fingerprint, angle: 90 },
  { icon: Lock, angle: 180 },
  { icon: Eye, angle: 270 },
];

export const Security = () => {
  return (
    <section
      className="relative py-40 overflow-hidden"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Massive background text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span className="text-[20vw] font-bold text-white/[0.03] whitespace-nowrap select-none">
          SECURE
        </span>
      </div>

      {/* Radial gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          {/* Left - Visual element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative aspect-square max-w-lg mx-auto lg:mx-0"
          >
            {/* Rotating rings with blue gradient glow */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-white/10"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
              }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-8 rounded-full border border-blue-400/20"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
                boxShadow:
                  "inset 0 0 30px rgba(59, 130, 246, 0.2), 0 0 30px rgba(59, 130, 246, 0.15)",
              }}
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute inset-16 rounded-full border border-blue-400/30"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(59, 130, 246, 0.2) 0%, transparent 70%)",
                boxShadow:
                  "inset 0 0 40px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.2)",
              }}
            />

            {/* Center content with glow */}
            <div
              className="absolute inset-24 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-blue-400/40 flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(59, 130, 246, 0.25) 0%, rgba(255, 255, 255, 0.05) 100%)",
                boxShadow:
                  "inset 0 0 60px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.4)",
              }}
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-6xl font-bold text-foreground mb-2"
                  style={{
                    textShadow: "0 0 30px rgba(59, 130, 246, 0.5)",
                  }}
                >
                  256
                </motion.div>
                <div className="text-sm text-white/90 font-medium">
                  Bit Encryption
                </div>
              </div>
            </div>

            {/* Orbiting icons */}
            {orbitIcons.map((item, index) => {
              const orbitRadius = 200; // pixels from center

              return (
                <motion.div
                  key={index}
                  className="absolute top-1/2 left-1/2"
                  initial={{ opacity: 0, scale: 0, rotate: item.angle }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  animate={{
                    rotate: item.angle + 360,
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    transformOrigin: "0 0",
                  }}
                >
                  <motion.div
                    className="h-14 w-14 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-blue-400/30 flex items-center justify-center"
                    style={{
                      transform: `translate(${orbitRadius}px, -28px)`, // -28px to center the icon (half of 56px/14*4)
                      boxShadow:
                        "0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1)",
                    }}
                    animate={{
                      rotate: -360,
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                      delay: (item.angle / 360) * 20,
                    }}
                    whileHover={{ scale: 1.3 }}
                  >
                    <item.icon className="h-6 w-6 text-blue-400" />
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Right - Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-blue-400 text-sm font-semibold tracking-wider uppercase mb-4">
                Security First
              </span>
              <h2 className="text-4xl md:text-5xl font-medium text-foreground mb-6 leading-tight">
                Fortress-Grade{" "}
                <span className="font-serif italic">Protection</span>
              </h2>
              <p className="text-lg text-white/80 leading-relaxed">
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
              className="grid grid-cols-2 gap-4"
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
                  className="flex items-center gap-3 px-5 py-4 rounded-xl border border-white/20 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm text-sm text-white/80 hover:text-white transition-all cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-blue-400" />
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
              className="grid grid-cols-3 gap-8 pt-4"
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
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
