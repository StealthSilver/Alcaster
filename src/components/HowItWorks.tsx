"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    number: "01",
    title: "Create Your Vault",
    description:
      "Connect your Solana wallet and initialize your family vault. You become the first Family Head.",
  },
  {
    number: "02",
    title: "Invite Members",
    description:
      "Add trusted family members with customizable access levels and encrypted keychains.",
  },
  {
    number: "03",
    title: "Store Forever",
    description:
      "Upload documents, photos, passwords, and wills to the blockchain for eternal preservation.",
  },
  {
    number: "04",
    title: "Pass the Torch",
    description:
      "When the time comes, transfer complete ownership to the next Family Head seamlessly.",
  },
];

export const HowItWorks = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 0.8], ["0%", "100%"]);

  return (
    <section
      ref={containerRef}
      className="relative py-32 overflow-hidden"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Diagonal accent gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-gradient-to-bl from-blue-500/10 to-transparent rotate-12" />
      </div>

      {/* Radial gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-blue-500/10 blur-3xl" />

      {/* Animated particles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-blue-400/30"
          style={{
            left: `${15 + i * 20}%`,
            top: `${25 + (i % 2) * 30}%`,
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.2, 0.7, 0.2],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        {/* Header - Centered with large typography */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <span className="inline-block text-blue-400 text-sm font-semibold tracking-wider uppercase mb-4">
            Process
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-medium text-foreground">
            Simple Steps to <span className="font-serif italic">Forever</span>
          </h2>
        </motion.div>

        {/* Timeline with alternating layout */}
        <div className="relative">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 hidden lg:block">
            <motion.div
              style={{ height: lineHeight }}
              className="w-full bg-gradient-to-b from-blue-400 to-blue-400/30"
            />
          </div>

          <div className="space-y-12 lg:space-y-0">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className={`relative lg:grid lg:grid-cols-2 lg:gap-16 ${
                  index % 2 === 0 ? "" : "lg:direction-rtl"
                }`}
              >
                {/* Content */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`
                    p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm
                    hover:border-blue-400/50 transition-all duration-300 group
                    ${index % 2 === 0 ? "lg:text-right" : "lg:col-start-2"}
                  `}
                >
                  <div
                    className={`flex items-start gap-6 ${
                      index % 2 === 0 ? "lg:flex-row-reverse" : ""
                    }`}
                  >
                    <span className="flex-shrink-0 text-6xl lg:text-7xl font-bold text-blue-400/20 group-hover:text-blue-400/40 transition-colors">
                      {step.number}
                    </span>
                    <div>
                      <h3 className="text-2xl font-semibold text-foreground mb-3">
                        {step.title}
                      </h3>
                      <p className="text-white/70 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Timeline dot */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.15 }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:block"
                >
                  <div className="h-4 w-4 rounded-full bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
