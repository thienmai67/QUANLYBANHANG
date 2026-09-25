"use client";

import React from "react";
import { ArrowRight, Layers, ChevronRight } from "lucide-react";
import { MATERIAL_CATEGORIES } from "@/data/materialData";

interface MaterialCategoryGridProps {
  onSelectCategory?: (categoryId: string) => void;
}

export default function MaterialCategoryGrid({ onSelectCategory }: MaterialCategoryGridProps) {
  const handleCategoryClick = (catId: string) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
    const el = document.getElementById(`showcase-${catId}`) || document.getElementById("product-showcases");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="category-grid" className="w-full space-y-6 pt-4">
      {/* Section Header matching xangdauhanoi.com.vn: title with lines and 'Xem Tất Cả' */}
      <div className="flex items-center justify-between border-b-2 border-amber-600 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-6 bg-gradient-to-b from-amber-600 to-orange-600 rounded-sm" />
          <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-slate-900 dark:text-white">
            DANH MỤC SẢN PHẨM
          </h2>
        </div>
        <a
          href="#product-showcases"
          className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 hover:text-orange-600 flex items-center gap-1 transition-colors"
        >
          <span>Xem Tất Cả</span>
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {/* 7 Category Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        {MATERIAL_CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className="group cursor-pointer rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 shadow-sm hover:shadow-xl hover:border-amber-500/60 dark:hover:border-amber-500/60 transition-all duration-300 flex flex-col justify-between"
          >
            {/* Image with zoom on hover */}
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono font-bold">
                {cat.count}+ SP
              </span>
            </div>

            {/* Category Title */}
            <div className="text-center space-y-1">
              <h3 className="font-bold text-xs uppercase text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-tight min-h-[32px] flex items-center justify-center">
                {cat.name}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 font-sans">
                {cat.subcategories[0]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
