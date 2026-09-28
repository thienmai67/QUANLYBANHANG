"use client";

import React, { useState } from "react";
import MaterialHeader from "@/components/MaterialHeader";
import MaterialFooter from "@/components/MaterialFooter";
import { MAndE_PRODUCTS } from "@/data/materialData";
import { Truck, ShieldCheck, Undo2, Check, Calculator, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import * as motion from "motion/react-client";

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  // Mock product selection or fallback to first product
  const product = MAndE_PRODUCTS.find(p => p.id === params.slug) || MAndE_PRODUCTS[0];
  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  
  const [activeImage, setActiveImage] = useState(images[0]);
  const [descOpen, setDescOpen] = useState(true);
  const [specsOpen, setSpecsOpen] = useState(true);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#070b14] text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white">
      <MaterialHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Mosaic Gallery Section */}
          <div className="space-y-4">
            <div className="w-full aspect-square md:aspect-[4/3] lg:aspect-square bg-slate-50 dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 relative">
              <motion.img 
                key={activeImage}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                src={activeImage} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg">
                    {product.badge}
                  </span>
                </div>
              )}
            </div>
            
            {/* Thumbnail Mosaic */}
            <div className="grid grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === img ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-transparent hover:border-slate-300'}`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">{product.categoryName}</span>
              <span className="text-xs font-mono font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">SKU: {product.sku}</span>
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-display font-black tracking-tight text-slate-900 dark:text-white uppercase leading-snug mb-6">
              {product.name}
            </h1>

            <div className="flex items-end gap-4 mb-8">
              <span className="text-3xl font-black text-orange-500">{product.price}</span>
              <span className="text-sm font-bold text-slate-400 mb-1.5 line-through">{product.rawPrice ? `${(product.rawPrice * 1.2).toLocaleString()}đ` : ''}</span>
              {product.discount && (
                <span className="text-xs font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded mb-1.5">
                  Save {product.discount}%
                </span>
              )}
            </div>

            {/* Interactive Variant Stack */}
            <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3 block">Format / Size</span>
                <div className="flex flex-wrap gap-3">
                  <button className="px-5 py-3 rounded-xl border-2 border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm flex items-center gap-2 transition-all">
                    <Check className="w-4 h-4" /> Standard ({product.unit})
                  </button>
                  <button className="px-5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-600 dark:text-slate-400 font-bold text-sm transition-all">
                    Bulk Pallet (x10)
                  </button>
                </div>
              </div>
            </div>

            {/* Actions Stack */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-sm uppercase tracking-wider shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                <Calculator className="w-5 h-5" /> Request RFQ Quote
              </button>
              <button className="sm:w-auto px-8 py-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
                <ShoppingCart className="w-5 h-5" /> Add to BOM
              </button>
            </div>

            {/* Trust Bar (Skanvi style) */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-[#0c1322]">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">2H SLA Delivery</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">100% CO/CQ Cert</span>
              </div>
              <div className="flex items-center gap-3">
                <Undo2 className="w-5 h-5 text-orange-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">30-day Exchange</span>
              </div>
            </div>

            {/* Accordions */}
            <div className="mt-12 space-y-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#0c1322]">
                <button 
                  onClick={() => setDescOpen(!descOpen)}
                  className="w-full flex items-center justify-between p-5 text-left bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <span className="font-bold uppercase tracking-wider text-sm">Product Description</span>
                  {descOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {descOpen && (
                  <div className="p-5 text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-200 dark:border-slate-800">
                    {product.description}
                  </div>
                )}
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#0c1322]">
                <button 
                  onClick={() => setSpecsOpen(!specsOpen)}
                  className="w-full flex items-center justify-between p-5 text-left bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <span className="font-bold uppercase tracking-wider text-sm">TCVN Specifications</span>
                  {specsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {specsOpen && (
                  <div className="p-5 border-t border-slate-200 dark:border-slate-800">
                    <ul className="space-y-3">
                      <li className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/50">
                        <span className="text-sm font-medium text-slate-500">Brand</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white uppercase">{product.brand}</span>
                      </li>
                      <li className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/50">
                        <span className="text-sm font-medium text-slate-500">Origin</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{product.origin}</span>
                      </li>
                      {product.specs.map((spec, i) => (
                        <li key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                          <span className="text-sm font-medium text-slate-500">{spec.split(':')[0] || 'Spec'}</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{spec.split(':')[1] || spec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      <MaterialFooter />
    </div>
  );
}
