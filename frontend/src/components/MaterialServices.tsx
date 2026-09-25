"use client";

import React from "react";
import { Wrench, ShieldCheck, ChevronRight, ArrowRight, Award } from "lucide-react";
import { MATERIAL_SERVICES } from "@/data/materialData";

interface MaterialServicesProps {
  onOpenRFQ: (serviceTitle?: string) => void;
}

export default function MaterialServices({ onOpenRFQ }: MaterialServicesProps) {
  return (
    <section id="services" className="w-full space-y-6 pt-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-amber-600 pb-3 gap-2">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-6 bg-gradient-to-b from-amber-600 to-orange-600 rounded-sm" />
            <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-slate-900 dark:text-white">
              DỊCH VỤ KỸ THUẬT CHUYÊN SÂU
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-6">
            Cung ứng vật liệu dự án, bơm bê tông tươi 24/7, gia công thép kết cấu và thi công chống thấm chuyên nghiệp
          </p>
        </div>
        <button
          onClick={() => onOpenRFQ("Tư vấn toàn diện dịch vụ cung ứng vật liệu xây dựng")}
          className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 hover:text-orange-600 flex items-center gap-1 transition-colors shrink-0"
        >
          <span>Khảo Sát Công Trình Miễn Phí</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Services Grid (4 items) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {MATERIAL_SERVICES.map((srv) => (
          <div
            key={srv.id}
            className="group rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-500/60 dark:hover:border-amber-500/60 transition-all duration-300 flex flex-col justify-between"
          >
            {/* Service Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
              <img
                src={srv.image}
                alt={srv.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
              />
              <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-amber-600/90 text-white font-mono font-bold text-[10px] uppercase tracking-wider backdrop-blur-sm">
                {srv.badge}
              </span>
            </div>

            {/* Service Content */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                  {srv.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {srv.desc}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onOpenRFQ(`Yêu cầu tư vấn dịch vụ: ${srv.title}`)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 group-hover:border-amber-500 group-hover:bg-amber-600 group-hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>Đăng ký dịch vụ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
