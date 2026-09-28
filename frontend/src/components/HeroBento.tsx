"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface HeroBentoProps {
  onOpenRFQ?: () => void;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export default function HeroBento({ onOpenRFQ }: HeroBentoProps) {
  return (
    <section className="relative w-full rounded-3xl overflow-hidden border border-border shadow-2xl bg-surface transition-colors duration-300">
      {/* Background Industrial Fuel & Pipeline Hero Banner */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1545459720-aac8509eb02c?q=80&w=2000&auto=format&fit=crop"
          alt="Fuel Storage & Pipeline Technology"
          className="w-full h-full object-cover object-center transform scale-105 filter saturate-[0.85] opacity-35 dark:opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background dark:from-background/95 dark:via-background/80 dark:to-background pointer-events-none" />
      </div>

      {/* Main Hero Container */}
      <div className="relative z-10 px-5 sm:px-8 lg:px-12 pt-16 sm:pt-20 pb-12 max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-5">
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/25 backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
            <span className="font-mono text-[11px] font-bold tracking-widest text-accent-blue uppercase">
              M&amp;E &amp; PETROLEUM INTELLIGENCE
            </span>
          </motion.div>

          {/* Headline (Max 2 lines, impactful font-display) */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT_EXPO }}
            className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground uppercase leading-[1.08]"
          >
            CHUYÊN GIA CÔNG NGHỆ <br className="hidden sm:inline" />
            <span className="text-accent-blue">XĂNG DẦU &amp; CƠ ĐIỆN</span>
          </motion.h1>

          {/* Subtext (< 25 words, clear value prop) */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: EASE_OUT_EXPO }}
            className="text-sm sm:text-base text-muted font-medium leading-relaxed max-w-2xl mx-auto"
          >
            Nền tảng thông minh cho bóc tách BOM tự động, chiết khấu xuất xưởng cấp 1 trực tiếp và quản lý tiến độ cung ứng vật tư thời gian thực.
          </motion.p>

          {/* CTAs (Single-line desktop buttons with strong contrast) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: EASE_OUT_EXPO }}
            className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto"
          >
            <a
              href="#catalog"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-accent-blue hover:bg-accent-blue/90 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-accent-blue/25 active:scale-[0.98]"
            >
              <span>KHÁM PHÁ SẢN PHẨM</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              onClick={onOpenRFQ}
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-accent-orange hover:bg-accent-orange/90 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-accent-orange/25 active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>BÁO GIÁ SIÊU TỐC 15 PHÚT</span>
            </button>
          </motion.div>

          {/* Quick SLA points */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-wrap items-center justify-center gap-5 pt-1 text-[11px] text-muted font-medium"
          >
            <span className="flex items-center gap-1.5 text-foreground font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
              CO/CQ Xuất Xưởng
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-foreground font-semibold">
              <Clock className="w-3.5 h-3.5 text-accent-orange" />
              Giao Hàng 2H Chân Công Trình
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-foreground font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent-blue" />
              Chiết Khấu Cấp 1 Tới 38%
            </span>
          </motion.div>
        </div>

        {/* Feature Bento Cards (2 cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group rounded-2xl border border-border bg-background/80 backdrop-blur-md p-6 sm:p-7 flex flex-col justify-between hover:border-accent-blue/50 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] tracking-widest text-accent-blue uppercase font-bold font-mono px-2.5 py-1 rounded bg-accent-blue/10 border border-accent-blue/20">
                  AUTOMATION &amp; BIM
                </span>
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 text-accent-blue flex items-center justify-center border border-accent-blue/20">
                  <FileSpreadsheet className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-foreground group-hover:text-accent-blue transition-colors">
                Bóc Tách Khối Lượng Tự Động
              </h3>
              <p className="text-xs sm:text-sm text-muted mt-2 font-medium leading-relaxed">
                Tải lên bản vẽ hoặc bảng tính Excel/BIM. Thuật toán tự động nhận diện quy cách, chuyển đổi cây/cuộn sang mét và áp chiết khấu nhà máy tức thì.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted">Độ chính xác quy đổi</span>
              <span className="text-foreground tracking-widest font-mono font-bold">100% Theo Tiêu Chuẩn</span>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group rounded-2xl border border-border bg-background/80 backdrop-blur-md p-6 sm:p-7 flex flex-col justify-between hover:border-accent-orange/50 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] tracking-widest text-accent-orange uppercase font-bold font-mono px-2.5 py-1 rounded bg-accent-orange/10 border border-accent-orange/20">
                  QUALITY &amp; CERTIFICATION
                </span>
                <div className="w-10 h-10 rounded-xl bg-accent-orange/10 text-accent-orange flex items-center justify-center border border-accent-orange/20">
                  <ShieldCheck className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-foreground group-hover:text-accent-orange transition-colors">
                Chứng Nhận CO/CQ Chuẩn Xuất Xưởng
              </h3>
              <p className="text-xs sm:text-sm text-muted mt-2 font-medium leading-relaxed">
                Toàn bộ bồn bể, đường ống và thiết bị trạm xăng dầu được cấp phát kèm đầy đủ tem kiểm định PCCC, hồ sơ thử áp lực và chứng nhận hợp chuẩn.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted">Chế độ bảo hành</span>
              <span className="text-foreground tracking-widest font-mono font-bold">12 - 36 Tháng Nhà Máy</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
