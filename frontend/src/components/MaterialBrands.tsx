"use client";

import React from "react";
import { MATERIAL_PARTNERS } from "@/data/materialData";
import { Award, Globe } from "lucide-react";

export default function MaterialBrands() {
  return (
    <section id="partners" className="w-full space-y-6 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-amber-600 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-6 bg-gradient-to-b from-amber-600 to-orange-600 rounded-sm" />
          <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-slate-900 dark:text-white">
            HÃNG SẢN XUẤT ĐỐI TÁC CHIẾN LƯỢC
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
          Cam kết 100% vật liệu xuất xưởng chính hãng
        </span>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {MATERIAL_PARTNERS.map((partner, idx) => (
          <div
            key={idx}
            className="group p-4 rounded-xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-amber-500/60 dark:hover:border-amber-500/60 transition-all text-center flex flex-col justify-between"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                {partner.country}
              </span>
              <h4 className="font-display font-black text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {partner.name}
              </h4>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium line-clamp-2">
              {partner.highlight}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
