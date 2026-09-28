"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Compass, ShieldCheck, Waves } from "lucide-react";

export default function EditorialShowcase() {
  return (
    <div className="space-y-16">
      {/* 1. Cinematic Banner: COASTAL SERENITY / OCEAN VISTAS (Direct reference to Screenshot 2) */}
      <section className="relative w-full rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl min-h-[460px] sm:min-h-[520px] flex items-center">
        {/* Background Image: Ocean waves on dark rocks at sunset */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop"
            alt="Coastal Serenity & Marine Engineering"
            className="w-full h-full object-cover object-center filter brightness-[0.6] contrast-[1.1] transform scale-100 hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101114] via-transparent to-transparent" />
        </div>

        {/* Content aligned left / center */}
        <div className="relative z-10 p-8 sm:p-14 lg:p-16 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]" />
            <span className="text-[11px] font-sans font-semibold tracking-[0.35em] text-[#C5A880] uppercase">
              OCEAN VISTAS &amp; MARINE ENGINEERING
            </span>
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[0.06em] text-[#EDE8D5] uppercase drop-shadow-lg leading-tight">
            COASTAL SERENITY
          </h2>

          <p className="text-sm sm:text-base text-[#D4CDC0] font-light leading-relaxed drop-shadow-md">
            Trải nghiệm độ bền vượt thời gian với hệ thống ống &amp; cáp chịu ăn mòn nước biển, giải pháp cơ điện M&amp;E đạt chứng nhận quốc tế dành cho đại đô thị nghỉ dưỡng ven biển.
          </p>

          <div className="pt-3">
            <a
              href="#catalog"
              className="inline-flex items-center gap-3 px-8 py-3.5 rounded-sm border border-white/40 hover:border-white text-[#F5EFEB] hover:bg-white/[0.1] text-xs font-medium tracking-[0.25em] uppercase transition-all duration-300 backdrop-blur-sm"
            >
              <span>DISCOVER MORE</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A880]" />
            </a>
          </div>
        </div>
      </section>

      {/* 2. Split Editorial Card: FOLLOW THE JOURNEY (Direct reference to Screenshot 3) */}
      <section className="relative w-full rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* Left Col: High-contrast coastal & natural landscape photography */}
        <div className="lg:col-span-6 relative min-h-[300px] lg:min-h-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1600&auto=format&fit=crop"
            alt="Follow the Journey - Nature & Coast"
            className="w-full h-full object-cover object-center filter brightness-[0.8] contrast-[1.1] transform hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 text-white text-[11px] font-sans tracking-[0.2em] uppercase bg-black/40 px-3 py-1.5 rounded-sm backdrop-blur-md border border-white/10">
            NATURAL TEXTURES &amp; FOUNDATIONS
          </div>
        </div>

        {/* Right Col: Solid Editorial Warm Sand / Linen Block (Exactly as in Screenshot 3) */}
        <div className="lg:col-span-6 bg-[#EBE5D8] text-[#191A1D] p-8 sm:p-12 lg:p-16 flex flex-col justify-center space-y-6">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-[0.08em] text-[#1A1B1E] uppercase leading-tight">
            FOLLOW THE JOURNEY
          </h2>

          <p className="text-sm sm:text-base text-[#464540] font-light leading-relaxed max-w-md">
            Đồng hành cùng cộng đồng hơn 500+ kiến trúc sư, kỹ sư kết cấu &amp; nhà thầu M&amp;E tiên phong. Kiến tạo các công trình mang tính biểu tượng với nguồn vật tư tuyển chọn cao cấp nhất.
          </p>

          <div className="text-xs font-bold tracking-[0.25em] text-[#7A7365] uppercase font-sans">
            @OPULENCE_ARCHITECTURAL_M&amp;E
          </div>

          <div className="pt-2">
            <a
              href="#engineering-calc"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-sm bg-[#222326] hover:bg-[#111214] text-[#EFEAE1] font-bold text-xs tracking-[0.25em] uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(34,35,38,0.25)]"
            >
              <span>FOLLOW US &amp; PARTNER</span>
              <ArrowRight className="w-4 h-4 text-[#C5A880]" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
