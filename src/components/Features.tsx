"use client";

import { motion } from "framer-motion";
import { Shield, Users, Key, FileText, Image, Lock } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Family Tree Structure",
    description:
      "Organize your vault like a family tree with hierarchical access control.",
    size: "large",
  },
  {
    icon: Shield,
    title: "Blockchain Protected",
    description: "Built on Solana for immutable, decentralized storage.",
    size: "small",
  },
  {
    icon: Key,
    title: "Personal Keychains",
    description:
      "Each member gets their own encrypted keychain for sensitive data.",
    size: "small",
  },
  {
    icon: FileText,
    title: "Document Vault",
    description:
      "Store wills, legal documents, and certificates that pass through generations.",
    size: "medium",
  },
  {
    icon: Image,
    title: "Memory Archive",
    description: "Preserve family photos and videos in an eternal archive.",
    size: "medium",
  },
  {
    icon: Lock,
    title: "Succession Planning",
    description: "Seamlessly transfer vault ownership to the next generation.",
    size: "small",
  },
];

export const Features = () => {
  return (
    <section
      className="relative py-32 overflow-hidden"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Background accent gradient */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/5 to-transparent" />

      {/* Radial gradient */}
      <div className="absolute top-1/4 right-1/4 w-[800px] h-[800px] rounded-full bg-blue-500/10 blur-3xl" />

      {/* Animated particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-blue-400/30"
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

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section Header - Asymmetric */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5"
          >
            <span className="inline-block text-blue-400 text-sm font-semibold tracking-wider uppercase mb-4">
              Features
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium text-foreground leading-tight">
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
            <p className="text-lg text-white/70 leading-relaxed">
              A complete solution for preserving your family's legacy across
              generations with military-grade security and intuitive design.
            </p>
          </motion.div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[200px]">
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
                scale: 1.02,
                borderColor: "rgba(59, 130, 246, 0.5)",
                transition: { duration: 0.2 },
              }}
              className={`
                group relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm
                flex flex-col justify-between overflow-hidden cursor-pointer
                ${feature.size === "large" ? "md:col-span-2 md:row-span-2" : ""}
                ${feature.size === "medium" ? "lg:col-span-2" : ""}
              `}
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-400/20"
                >
                  <feature.icon className="h-6 w-6 text-blue-400" />
                </motion.div>
                <h3
                  className={`font-semibold text-foreground mb-2 ${
                    feature.size === "large" ? "text-2xl" : "text-lg"
                  }`}
                >
                  {feature.title}
                </h3>
              </div>
              <p
                className={`relative z-10 text-white/70 ${
                  feature.size === "large" ? "text-base" : "text-sm"
                }`}
              >
                {feature.description}
              </p>

              {/* Corner accent */}
              <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
