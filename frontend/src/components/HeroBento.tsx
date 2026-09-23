"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Droplets, Zap } from "lucide-react";

interface HeroBentoProps {
  onOpenRFQ?: () => void;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export default function HeroBento({ onOpenRFQ }: HeroBentoProps) {
  return (
    <section className="relative w-full rounded-2xl overflow-hidden border border-border shadow-2xl bg-surface transition-colors duration-300">
      {/* Background Hero Banner */}
      <div className="absolute inset-x-0 top-0 h-[75%] z-0 rounded-t-2xl overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1541888050672-880521dce5fe?q=80&w=2000&auto=format&fit=crop"
          alt="M&E Infrastructure"
          className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 opacity-90 dark:opacity-40 filter saturate-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background dark:from-background/40 dark:via-background/80 dark:to-background pointer-events-none" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-8 pt-24 pb-12 max-w-4xl mx-auto space-y-7">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-accent-blue/10 border border-accent-blue/20 backdrop-blur-md"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
          <span className="font-mono text-[11px] font-semibold tracking-widest text-accent-blue uppercase">
            M&E ENGINEERING INTELLIGENCE
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.96, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15, ease: EASE_OUT_EXPO }}
          className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground uppercase leading-[1.05]"
        >
          PRECISION &amp; EFFICIENCY
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: EASE_OUT_EXPO }}
          className="text-sm sm:text-base text-muted font-medium leading-relaxed max-w-2xl mx-auto"
        >
          Nền tảng bóc tách, tính toán và mua sắm vật tư Cơ Điện M&E tiên tiến nhất. Cung cấp dữ liệu trực tuyến, chuẩn hóa kỹ thuật và chiết khấu B2B chuyên biệt cho Nhà Thầu.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: EASE_OUT_EXPO }}
          className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          <a
            href="#catalog"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-md bg-accent-blue hover:bg-accent-blue/90 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-accent-blue/20"
          >
            <span>BẮT ĐẦU TÍNH TOÁN</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <button
            onClick={onOpenRFQ}
            type="button"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-md bg-surface hover:bg-border text-foreground font-semibold text-xs tracking-wider uppercase border border-border transition-all"
          >
            <Sparkles className="w-4 h-4 text-accent-orange" />
            <span>NHẬN BÁO GIÁ LÔ</span>
          </button>
        </motion.div>
      </div>

      {/* Bento Grid Features */}
      <div className="relative z-10 px-6 sm:px-8 pb-8 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {/* Block 1 */}
        <div className="group rounded-xl border border-border bg-background p-6 flex flex-col justify-between hover:border-accent-blue/50 transition-all duration-300 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-widest text-muted uppercase font-bold font-mono">
                HYDRAULICS
              </span>
              <div className="p-2 rounded-md bg-accent-blue/10 text-accent-blue">
                <Droplets className="w-5 h-5 stroke-[2]" />
              </div>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mt-4 group-hover:text-accent-blue transition-colors">
              Hệ Thống Ống Cấp Thoát Nước
            </h3>
            <p className="text-sm text-muted mt-2 font-medium leading-relaxed">
              uPVC, PPR, HDPE chuẩn DIN & ISO. Tự động chuyển đổi đơn vị và định mức khối lượng theo mét lẻ chính xác 100%.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted tracking-wide">Chiết khấu dự án</span>
            <span className="text-foreground tracking-widest font-mono font-bold">CK 28% - 32%</span>
          </div>
        </div>

        {/* Block 2 */}
        <div className="group rounded-xl border border-border bg-background p-6 flex flex-col justify-between hover:border-accent-orange/50 transition-all duration-300 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-widest text-muted uppercase font-bold font-mono">
                ELECTRICAL
              </span>
              <div className="p-2 rounded-md bg-accent-orange/10 text-accent-orange">
                <Zap className="w-5 h-5 stroke-[2]" />
              </div>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mt-4 group-hover:text-accent-orange transition-colors">
              Hệ Thống Cáp & Thiết Bị Điện
            </h3>
            <p className="text-sm text-muted mt-2 font-medium leading-relaxed">
              Cáp ngầm trung thế, dây điện chống cháy, PLC, Biến tần và Thiết bị đóng cắt thông minh từ các thương hiệu hàng đầu.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted tracking-wide">Chiết khấu dự án</span>
            <span className="text-foreground tracking-widest font-mono font-bold">CK 30% - 38%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
