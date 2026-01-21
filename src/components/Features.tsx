"use client";

import { motion } from "framer-motion";
import { Shield, Users, Key, FileText, Image, Lock } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Family Tree Structure",
    description:
      "Organize your vault like a family tree with hierarchical access control.",
    gridArea: "1 / 1 / 3 / 3", // spans 2 rows, 2 columns
  },
  {
    icon: Shield,
    title: "Blockchain Protected",
    description: "Built on Solana for immutable, decentralized storage.",
    gridArea: "1 / 3 / 2 / 4",
  },
  {
    icon: Key,
    title: "Personal Keychains",
    description:
      "Each member gets their own encrypted keychain for sensitive data.",
    gridArea: "2 / 3 / 3 / 5",
  },
  {
    icon: FileText,
    title: "Document Vault",
    description:
      "Store wills, legal documents, and certificates that pass through generations.",
    gridArea: "1 / 4 / 2 / 5",
  },
  {
    icon: Image,
    title: "Memory Archive",
    description: "Preserve family photos and videos in an eternal archive.",
    gridArea: "3 / 1 / 4 / 3",
  },
  {
    icon: Lock,
    title: "Succession Planning",
    description: "Seamlessly transfer vault ownership to the next generation.",
    gridArea: "3 / 3 / 4 / 5",
  },
];

export const Features = () => {
  return (
    <section
      className="relative py-16 sm:py-24 md:py-32 overflow-hidden"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Background accent gradient */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/5 to-transparent" />

      {/* Radial gradient */}
      <div className="absolute top-1/4 right-1/4 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] rounded-full bg-blue-500/10 blur-3xl" />

      {/* Animated particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-blue-400/30"
          style={{
            right: `${10 + i * 15}%`,
            top: `${20 + (i % 3) * 15}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 2.5 + i * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        />
      ))}

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
        {/* Section Header - Asymmetric */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-12 sm:mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5"
          >
            <span className="inline-block text-blue-400 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-3 sm:mb-4">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-foreground leading-tight">
              Everything Your Family{" "}
              <span className="font-serif italic">Needs</span>
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 lg:col-start-8 flex items-end"
          >
            <p className="text-base sm:text-lg text-white/70 leading-relaxed">
              A complete solution for preserving your family's legacy across
              generations with military-grade security and intuitive design.
            </p>
          </motion.div>
        </div>

        {/* Bento Grid - Responsive layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:auto-rows-[240px] auto-rows-[200px]">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              whileHover={{
                y: -4,
                borderColor: "rgba(59, 130, 246, 0.5)",
                transition: { duration: 0.2 },
              }}
              style={{ gridArea: feature.gridArea }}
              className="group relative p-6 md:p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col justify-between overflow-hidden cursor-pointer"
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-400/20 group-hover:bg-blue-500/20 transition-colors duration-300">
                  <feature.icon className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-xl group-hover:text-blue-400 transition-colors duration-300">
                  {feature.title}
                </h3>
              </div>
              <p className="relative z-10 text-white/70 text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Animated corner accent */}
              <motion.div
                className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-blue-500/5"
                whileHover={{ scale: 1.2, opacity: 0.15 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
