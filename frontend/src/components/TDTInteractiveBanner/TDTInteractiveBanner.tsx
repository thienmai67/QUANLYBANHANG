"use client";

import React, { Suspense, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Html, Environment, OrbitControls, useProgress } from "@react-three/drei";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Scene } from "./Scene";
import { ProductLabels } from "./ProductModels";
import { ShieldCheck, Truck, Calculator, Percent, ArrowRight, Play } from "lucide-react";
import { motion } from "motion/react";

// Floating Particles in DOM (CSS-based for performance)
const DOMParticles = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const count = 30;
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "absolute w-1 h-1 bg-blue-400/30 rounded-full";
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const delay = Math.random() * 6;
      const duration = 4 + Math.random() * 6;
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      el.style.animation = `float ${duration}s ease-in-out ${delay}s infinite`;
      containerRef.current.appendChild(el);
    }
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none" />
  );
};

// Loading spinner
const Experience = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-4 text-white">
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-blue-400">{Math.round(progress)}% loaded</span>
      </div>
    </Html>
  );
};

interface TDTInteractiveBannerProps {
  onOpenRFQ?: (productName?: string) => void;
}

export default function TDTInteractiveBanner({ onOpenRFQ }: TDTInteractiveBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeProduct, setActiveProduct] = useState<string | null>(null);

  // Product data
  const guarantees = [
    { icon: ShieldCheck, label: "100% CO/CQ Certified", color: "text-blue-400" },
    { icon: Truck, label: "2H SLA Crane Delivery", color: "text-amber-400" },
    { icon: Calculator, label: "BOM Automation", color: "text-green-400" },
    { icon: Percent, label: "Tier-1 Discounts", color: "text-orange-400" },
  ];

  // GSAP entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {}, containerRef);
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from(".banner-title", { y: 50, opacity: 0, duration: 0.8 })
      .from(".banner-subtitle", { y: 30, opacity: 0, duration: 0.6 }, "-=0.4")
      .from(".banner-cta", { y: 20, opacity: 0, duration: 0.6, stagger: 0.1 }, "-=0.3")
      .from(".guarantee-item", { y: 20, opacity: 0, duration: 0.5, stagger: 0.1 }, "-=0.2");

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[500px] sm:h-[580px] rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl"
    >
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        className="absolute inset-0 w-full h-full"
      >
        <Suspense fallback={<Experience />}>
          <Scene activeProduct={activeProduct} onProductSelect={setActiveProduct} />
          <Environment preset="night" />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 3}
            enableDamping
            dampingFactor={0.1}
          />
        </Suspense>
      </Canvas>

      {/* DOM Particles */}
      <DOMParticles />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#070b14] via-[#070b14]/90 to-transparent pointer-events-none" />

      {/* Product Labels */}
      <ProductLabels activeProduct={activeProduct} onProductSelect={setActiveProduct} />

      {/* Content overlay */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-12 max-w-3xl">
        {/* Top badge */}
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-6 w-max"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          The future of M&E Supply
        </motion.span>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-white leading-[1.1] tracking-tight banner-title"
        >
          Sustainable Projects Built with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
            Authentic M&E Supplies
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed banner-subtitle mt-6"
        >
          Direct wholesale distribution for contractors. Fast quotes, massive volume discounts, and 2H
          delivery directly to your construction site.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center gap-4 mt-8 banner-cta"
        >
          <button
            onClick={() => {
              if (onOpenRFQ) onOpenRFQ();
            }}
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-600/20 hover:scale-105"
          >
            <Calculator className="w-5 h-5" /> Calculate BOM &amp; Get Quote
          </button>
          <button className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10 hover:border-white/30 backdrop-blur-md">
            Explore Catalog <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>
      </div>

      {/* Guarantee Strip */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/40 backdrop-blur-md">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
          {guarantees.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center justify-center gap-3 p-4 group guarantee-item"
            >
              <item.icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
              <span className="text-white text-xs font-semibold">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
