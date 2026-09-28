"use client";

import React, { useState } from "react";
import { Filter, X, Zap, ChevronDown, Package } from "lucide-react";
import MaterialHeader from "@/components/MaterialHeader";
import MaterialFooter from "@/components/MaterialFooter";
import { MAndE_PRODUCTS } from "@/data/materialData";
import * as motion from "motion/react-client";

export default function ShopPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simulated filtering for Skeletons
  const handleFilterToggle = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const applyFakeFilter = () => {
    setIsFilterOpen(false);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      <MaterialHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-900 dark:text-white uppercase mb-2">
              All M&E <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Products</span>
            </h1>
            <p className="text-slate-500 text-sm">Browse our full catalog of TCVN compliant electrical and plumbing supplies.</p>
          </div>
          <button
            onClick={handleFilterToggle}
            className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:text-blue-600 transition-colors font-bold text-sm bg-white dark:bg-[#0c1322]"
          >
            <Filter className="w-4 h-4" /> Filter Supplies
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl aspect-[3/4]">
                  <div className="w-full h-[55%] bg-slate-100 dark:bg-slate-900 mb-4 rounded-t-2xl"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded mt-4"></div>
                  </div>
                </div>
              ))
            : MAndE_PRODUCTS.map((prod, idx) => (
                <motion.a
                  href={`/produkt/${prod.id}`}
                  key={prod.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group block relative bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-blue-900/5 transition-all"
                >
                  <div className="w-full aspect-[4/3] relative bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 overflow-hidden">
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">{prod.brand}</span>
                    <h3 className="font-semibold text-sm line-clamp-2 min-h-[40px] group-hover:text-blue-600 transition-colors">
                      {prod.name}
                    </h3>
                    <div className="mt-4 flex gap-1">
                      {/* Fake Size Variants */}
                      {["S", "M", "L"].map(size => (
                        <div key={size} className="w-6 h-6 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-800">
                          {size}
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-orange-500 text-lg">{prod.price}</span>
                      <Package className="w-5 h-5 text-slate-300" />
                    </div>
                  </div>
                </motion.a>
              ))}
        </div>
      </main>

      <MaterialFooter />

      {/* Slide-Over Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleFilterToggle} />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-sm bg-white dark:bg-[#0c1322] h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-display font-black uppercase text-slate-900 dark:text-white">Filters</h3>
              <button onClick={handleFilterToggle} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Brands</h4>
                <div className="space-y-3">
                  {["Cadivi", "Bình Minh", "Panasonic", "Tiền Phong"].map(brand => (
                    <label key={brand} className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-medium">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Specs (Pressure / Gauge)</h4>
                <div className="space-y-3">
                  {["PN10", "PN16", "1.5mm² - 6.0mm²", "10mm² - 25mm²"].map(spec => (
                    <label key={spec} className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-medium">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <button
                onClick={applyFakeFilter}
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-lg shadow-blue-500/20"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
