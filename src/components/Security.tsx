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
      className="relative py-32 overflow-hidden"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Massive background text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span className="text-[20vw] font-bold text-white/[0.03] whitespace-nowrap select-none">
          SECURE
        </span>
      </div>

      {/* Radial gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left - Visual element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative aspect-square max-w-lg mx-auto lg:mx-0"
          >
            {/* Rotating rings */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-white/20"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-8 rounded-full border border-blue-400/30"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute inset-16 rounded-full border border-blue-400/50"
              style={{
                boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
              }}
            />

            {/* Center content */}
            <div
              className="absolute inset-24 rounded-full bg-white/5 backdrop-blur-sm border border-blue-400/30 flex items-center justify-center"
              style={{
                boxShadow: "0 0 40px rgba(59, 130, 246, 0.2)",
              }}
            >
              <div className="text-center">
                <div className="text-5xl font-bold text-foreground mb-2">
                  256
                </div>
                <div className="text-sm text-white/80">Bit Encryption</div>
              </div>
            </div>

            {/* Floating icons */}
            {securityFeatures.slice(0, 4).map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.2 }}
                className="absolute"
                style={{
                  top: `${20 + Math.sin(index * 1.57) * 35}%`,
                  left: `${50 + Math.cos(index * 1.57) * 45}%`,
                }}
              >
                <div
                  className="h-12 w-12 rounded-xl bg-white/5 backdrop-blur-sm border border-white/20 flex items-center justify-center"
                  style={{
                    boxShadow: "0 0 10px rgba(59, 130, 246, 0.2)",
                  }}
                >
                  <feature.icon className="h-5 w-5 text-blue-400" />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right - Content */}
          <div>
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
              <p className="text-lg text-white/80 mb-10 leading-relaxed">
                Your family's most precious information deserves the strongest
                protection. Alcaster leverages the Solana blockchain to create
                an immutable, decentralized vault that no single entity can
                access.
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap gap-3"
            >
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  whileHover={{
                    scale: 1.05,
                    borderColor: "rgba(96, 165, 250, 0.5)",
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-sm text-white/80 hover:text-white transition-all cursor-pointer"
                >
                  <feature.icon className="h-4 w-4 text-blue-400" />
                  {feature.label}
                </motion.div>
              ))}
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12 grid grid-cols-3 gap-6"
            >
              {[
                { value: "10K+", label: "Families" },
                { value: "0", label: "Breaches" },
                { value: "99.9%", label: "Uptime" },
              ].map((stat, index) => (
                <div key={index} className="text-center lg:text-left">
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
