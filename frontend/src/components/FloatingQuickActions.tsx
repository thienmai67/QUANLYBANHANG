"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileUp, PhoneCall, ArrowUp, Sparkles, MessageCircle } from "lucide-react";

interface FloatingQuickActionsProps {
  onOpenRFQ: () => void;
}

export default function FloatingQuickActions({ onOpenRFQ }: FloatingQuickActionsProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-slate-900/90 border border-white/[0.12] text-slate-300 hover:text-white flex items-center justify-center backdrop-blur-md shadow-xl hover:border-cyan-500/50 transition-all"
            title="Lên đầu trang"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Main Dock */}
      <div className="flex items-center gap-2 p-1.5 rounded-full bg-slate-950/90 border border-white/[0.12] backdrop-blur-xl shadow-2xl">
        {/* Hotline */}
        <a
          href="tel:0908123456"
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-xs text-slate-200 border border-white/[0.06] transition-all group"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <PhoneCall className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline font-mono font-bold text-emerald-400">0908.123.456</span>
          <span className="hidden sm:inline text-[11px] text-slate-400 font-mono">(Kỹ Thuật)</span>
        </a>

        {/* Primary RFQ Trigger */}
        <button
          onClick={onOpenRFQ}
          className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-500 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.8)] hover:scale-105 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin text-slate-950" style={{ animationDuration: "6s" }} />
          <span>Báo Giá Nhanh 15 Phút</span>
        </button>
      </div>
    </div>
  );
}
