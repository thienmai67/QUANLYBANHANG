"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  Users,
  Percent,
  ArrowRight,
  CheckCircle,
  Building2,
  Zap,
} from "lucide-react";

interface MaterialHeroSliderProps {
  onOpenRFQ: (contextNote?: string) => void;
}

const SLIDES = [
  {
    id: 1,
    tag: "TỔNG KHO VẬT TƯ ĐIỆN NƯỚC M&E CHÍNH HÃNG",
    title: "ỐNG uPVC BÌNH MINH, CÁP CADIVI & THIẾT BỊ PANASONIC",
    desc: "Phân phối trực tiếp dây cáp điện Cadivi, ống nhựa uPVC/PPR Bình Minh - Tiền Phong và thiết bị đóng cắt Panasonic chính hãng với chiết khấu đại lý Cấp 1 lên tới 25%.",
    image: "https://images.unsplash.com/photo-1581091228480-9337af036f3b?q=80&w=1600&auto=format&fit=crop",
    primaryCta: "Bóc tách dự toán BOM ngay",
    secondaryCta: "Xem danh mục vật tư",
    badges: ["Chiết Khấu Đại Lý Cấp 1", "Đầy Đủ Chứng Chỉ CO/CQ", "Tự Động Quy Đổi Cây/Cuộn"],
  },
  {
    id: 2,
    tag: "HỆ THỐNG CẤP THOÁT NƯỚC & NƯỚC NÓNG TIÊN TIẾN",
    title: "ỐNG uPVC PHI 21-114MM & ỐNG PPR NƯỚC NÓNG TIỀN PHONG",
    desc: "Cung ứng trọn gói ống cấp thoát nước uPVC, ống hàn nhiệt PPR chịu áp PN10-PN20, van cửa đồng Minh Hòa cho nhà phố, biệt thự và công trình cao tầng.",
    image: "https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?q=80&w=1600&auto=format&fit=crop",
    primaryCta: "Tính kích thước ống nước",
    secondaryCta: "Bảng giá ống Bình Minh",
    badges: ["Áp Lực PN10/PN16", "Thử Áp Đạt TCVN", "Giao Tận Chân Công Trình 2H"],
  },
  {
    id: 3,
    tag: "CÁP ĐIỆN CÔNG TRÌNH & THIẾT BỊ ĐÓNG CẮT AN TOÀN",
    title: "CÁP LỰC CADIVI & APTOMAT CHỐNG GIẬT PANASONIC RCBO",
    desc: "Đầy đủ dây đơn CV 1.5 - 10mm², cáp ngầm CXV, Aptomat RCBO chống rò điện 30mA, ống luồn dây điện chống cháy Nano/Sino phục vụ thi công điện âm tường.",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1600&auto=format&fit=crop",
    primaryCta: "Tính công suất chọn cáp",
    secondaryCta: "Bảng giá dây Cadivi",
    badges: ["Đồng Nguyên Chất 99.9%", "Chống Cháy & Chống Rò Điện", "Bảo Hành Nhà Máy 24 Tháng"],
  },
];

const TRUST_METRICS = [
  {
    icon: <ShieldCheck className="w-5 h-5 text-amber-500" />,
    title: "100% Chính Hãng CO/CQ",
    desc: "Đầy đủ chứng chỉ xuất xưởng & VAT",
  },
  {
    icon: <Truck className="w-5 h-5 text-orange-500" />,
    title: "Giao Hàng 2H SLA",
    desc: "Đội xe cẩu giao nhanh tận chân công trình",
  },
  {
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    title: "Tính Cáp & Ống TCVN",
    desc: "Tính toán công suất cáp & cỡ ống TCVN",
  },
  {
    icon: <Percent className="w-5 h-5 text-orange-500" />,
    title: "Chiết Khấu Đại Lý Cấp 1",
    desc: "Trực tiếp nhà máy Bình Minh, Cadivi, Pana",
  },
];

export default function MaterialHeroSlider({ onOpenRFQ }: MaterialHeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const slide = SLIDES[current];

  return (
    <div className="w-full space-y-4">
      {/* Slider Visual Container */}
      <div
        className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-[#090d16] border border-slate-200 dark:border-slate-800/80 min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] flex items-center"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Images with smooth opacity cross-fade */}
        {SLIDES.map((s, idx) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              current === idx ? "opacity-100 z-0" : "opacity-0 pointer-events-none -z-10"
            }`}
          >
            <img
              src={s.image}
              alt={s.title}
              className="w-full h-full object-cover object-center brightness-[0.4] contrast-125"
            />
            {/* Deep gradient overlays for maximum text legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#070b14] via-[#070b14]/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/80 via-transparent to-black/40" />
          </div>
        ))}

        {/* Content Box */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-12 sm:py-16 w-full">
          <div className="max-w-2xl lg:max-w-3xl space-y-5">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Building2 className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{slide.tag}</span>
            </div>

            {/* Headline */}
            <h1 className="font-display font-black text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-[1.15] drop-shadow-md">
              {slide.title}
            </h1>

            {/* Description */}
            <p className="text-slate-200 text-xs sm:text-base leading-relaxed line-clamp-3 font-sans">
              {slide.desc}
            </p>

            {/* Feature Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {slide.badges.map((b, bIdx) => (
                <span
                  key={bIdx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.12] border border-white/[0.2] text-slate-100 text-[11px] font-mono font-medium backdrop-blur-sm"
                >
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  {b}
                </span>
              ))}
            </div>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={() => onOpenRFQ(slide.title)}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-orange-600/40 hover:shadow-orange-600/60 transition-all flex items-center gap-2 group shrink-0"
              >
                <span>{slide.primaryCta}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#category-grid"
                className="px-5 py-3 rounded-full bg-white/[0.1] hover:bg-white/[0.2] border border-white/[0.25] text-white font-bold text-xs sm:text-sm tracking-wide transition-colors shrink-0"
              >
                {slide.secondaryCta}
              </a>
            </div>
          </div>
        </div>

        {/* Carousel Prev/Next Buttons */}
        <button
          onClick={() => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-amber-600 text-white border border-white/20 flex items-center justify-center transition-all z-20 backdrop-blur-sm shadow-md"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrent((prev) => (prev + 1) % SLIDES.length)}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-amber-600 text-white border border-white/20 flex items-center justify-center transition-all z-20 backdrop-blur-sm shadow-md"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                current === idx ? "w-8 bg-amber-500 shadow-sm" : "w-2 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 4-Pillar Trust Guarantee Strip (Directly below slider) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TRUST_METRICS.map((metric, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5 hover:border-amber-500/50 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              {metric.icon}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {metric.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {metric.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
