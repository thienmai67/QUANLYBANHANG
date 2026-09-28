"use client";

import React from "react";
import { MATERIAL_PRODUCTS, MAndE_PRODUCTS } from "@/data/materialData";
import { Eye, Calculator } from "lucide-react";
import * as motion from "motion/react-client";

interface MaterialProductShowcaseProps {
  onOpenRFQ?: (productName?: string) => void;
}

export default function MaterialProductShowcase({ onOpenRFQ }: MaterialProductShowcaseProps) {
  // Take first 8 products for showcase
  const displayProducts = MAndE_PRODUCTS.slice(0, 8);

  return (
    <section className="w-full">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-slate-900 dark:text-white uppercase mb-2">
            Trending <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Supplies</span>
          </h2>
          <p className="text-slate-500 text-sm">Most requested items by M&E contractors this month.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayProducts.map((prod, idx) => (
          <motion.div
            key={prod.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            viewport={{ once: true }}
            className="group block relative bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-blue-900/5 transition-all"
          >
            {/* Badges */}
            {prod.badge && (
              <div className="absolute top-3 left-3 z-10">
                <span className={`px-2.5 py-1 rounded bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider`}>
                  {prod.badge}
                </span>
              </div>
            )}

            {/* Image */}
            <div className="w-full aspect-square bg-slate-50 dark:bg-slate-900 overflow-hidden relative border-b border-slate-100 dark:border-slate-800">
              <img 
                src={prod.image} 
                alt={prod.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Quick Actions overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                <button 
                  onClick={(e) => { e.preventDefault(); if (onOpenRFQ) onOpenRFQ(prod.name); }}
                  className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-transform hover:scale-110 active:scale-95"
                  title="Quick Quote (RFQ)"
                >
                  <Calculator className="w-5 h-5" />
                </button>
                <div 
                  className="p-3 bg-white text-slate-900 rounded-full transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                  title="Details"
                  onClick={() => window.location.href = `/produkt/${prod.id}`}
                >
                  <Eye className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{prod.brand}</span>
                <span className="text-[10px] text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 rounded">{prod.sku}</span>
              </div>
              
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2 min-h-[40px] leading-relaxed group-hover:text-blue-600 transition-colors">
                {prod.name}
              </h3>

              {/* Interactive Spec Chips */}
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-default hover:border-blue-300 transition-colors">
                  {prod.specs[0]?.split(":")[1]?.trim() || "Standard"}
                </span>
                <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-default hover:border-blue-300 transition-colors">
                  {prod.specs[1]?.split(":")[1]?.trim() || prod.unit}
                </span>
              </div>

              <div className="mt-5 flex items-end justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-400 mb-0.5">Dealer Price</p>
                  <span className="font-bold text-orange-500 text-base">{prod.price}</span>
                </div>
                {prod.discount && (
                  <span className="text-green-600 dark:text-green-400 text-xs font-bold px-2 py-1 bg-green-500/10 rounded">
                    -{prod.discount}%
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
