"use client";

import React, { useRef } from "react";
import { MATERIAL_CATEGORIES } from "@/data/materialData";
import { ChevronRight, ChevronLeft } from "lucide-react";
import * as motion from "motion/react-client";

export default function MaterialCategoryGrid({ onSelectCategory }: { onSelectCategory?: (id: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  return (
    <section className="relative w-full overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-slate-900 dark:text-white uppercase">
          M&E <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Categories</span>
        </h2>
        
        <div className="flex items-center gap-2">
          <button onClick={scrollLeft} className="p-2 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <button onClick={scrollRight} className="p-2 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {MATERIAL_CATEGORIES.map((cat, idx) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            viewport={{ once: true }}
            className="shrink-0 w-64 sm:w-72 snap-start group cursor-pointer"
            onClick={() => onSelectCategory && onSelectCategory(cat.id)}
          >
            <div className="relative w-full aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800">
              <img 
                src={cat.image} 
                alt={cat.name} 
                className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <span className="inline-block px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-white border border-white/20 uppercase tracking-wider">
                  {cat.count}+ Items
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-between">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">{cat.subcategories.join(" • ")}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
