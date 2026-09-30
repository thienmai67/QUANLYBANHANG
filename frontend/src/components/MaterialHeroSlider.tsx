"use client";

import React from "react";
import * as motion from "motion/react-client";
import { ArrowRight, Calculator, CheckCircle2, ShieldCheck, Truck, Percent } from "lucide-react";

interface MaterialHeroSliderProps {
  onOpenRFQ?: (productName?: string) => void;
}

export default function MaterialHeroSlider({ onOpenRFQ }: MaterialHeroSliderProps) {
  return (
    <section className="relative w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1541888081198-500bdf19c016?q=80&w=2000&auto=format&fit=crop"
          alt="M&E Construction background"
          className="w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b14] via-[#070b14]/80 to-transparent" />
      </div>

      <div className="relative z-10 px-6 sm:px-12 py-16 sm:py-24 max-w-3xl">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          NHÀ PHÂN PHỐI VẬT TƯ ĐIỆN NƯỚC M&amp;E HÀNG ĐẦU
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-white leading-[1.1] tracking-tight mb-6"
        >
          Vật Tư Cơ Điện M&amp;E Chính Hãng <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Chiết Khấu Cao Cho Nhà Thầu</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-base sm:text-lg mb-10 max-w-xl leading-relaxed"
        >
          Phân phối trực tiếp ống nước Bình Minh, cáp điện Cadivi, thiết bị Schneider/Panasonic, van Minh Hòa. Báo giá tự động BOM, giao hàng 2H cẩu tận chân công trình.
        </motion.p>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="flex flex-wrap items-center gap-4"
        >
          <button
            onClick={() => { if (onOpenRFQ) onOpenRFQ(); }}
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-600/20 hover:scale-105"
          >
            <Calculator className="w-5 h-5" /> Báo Giá Nhanh (BOM)
          </button>
          
          <button
            onClick={() => {
              const el = document.getElementById("catalog");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10 hover:border-white/30 backdrop-blur-md"
          >
            Tra Cứu Bảng Giá <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>
      </div>

      {/* 4-Item Guarantee Strip */}
      <div className="relative z-10 w-full border-t border-white/10 bg-black/40 backdrop-blur-md">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
          <div className="flex items-center gap-3 p-4 justify-center group">
            <ShieldCheck className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="text-white text-xs font-semibold">100% Cam Kết CO/CQ</span>
          </div>
          <div className="flex items-center gap-3 p-4 justify-center group">
            <Truck className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="text-white text-xs font-semibold">Giao 2H Chân Công Trình</span>
          </div>
          <div className="flex items-center gap-3 p-4 justify-center group">
            <CheckCircle2 className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
            <span className="text-white text-xs font-semibold">Tự Động Hóa BOM M&amp;E</span>
          </div>
          <div className="flex items-center gap-3 p-4 justify-center group">
            <Percent className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
            <span className="text-white text-xs font-semibold">Chiết Khấu Đại Lý Cấp 1</span>
          </div>
        </div>
      </div>
    </section>
  );
}
