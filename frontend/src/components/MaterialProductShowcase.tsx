"use client";

import React from "react";
import { MAndE_PRODUCTS } from "@/data/materialData";
import { useAdminStore } from "@/store/useAdminStore";
import { Eye, Calculator } from "lucide-react";
import * as motion from "motion/react-client";

interface MaterialProductShowcaseProps {
  onOpenRFQ?: (productName?: string) => void;
}

export default function MaterialProductShowcase({ onOpenRFQ }: MaterialProductShowcaseProps) {
  const adminProducts = useAdminStore((state) => state.products);
  
  // Merge products from Admin Store if available, fallback to default MAndE_PRODUCTS
  const displayProducts = adminProducts && adminProducts.length > 0
    ? adminProducts.map((p) => {
        const rawPrice = p.basePrice ?? (typeof p.price === 'number' ? p.price : 0);
        const priceStr = typeof p.price === 'string'
          ? p.price
          : `${rawPrice.toLocaleString('vi-VN')} ₫`;
        
        const specsArr = Array.isArray(p.specs)
          ? p.specs
          : typeof p.specs === 'string'
            ? [p.specs]
            : [`Thương hiệu: ${p.brand || 'Chính hãng'}`, `Đơn vị: ${p.unit || 'Chuẩn'}`];

        return {
          id: p.id,
          sku: p.sku || "SKU-STD",
          name: p.name,
          brand: p.brand || "Cadivi",
          category: p.category || "CABLE",
          price: priceStr,
          unit: p.unit || "Bộ",
          image: p.image || "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=500&auto=format&fit=crop&q=80",
          badge: p.badge || "MỚI",
          specs: specsArr,
          discount: p.discountRate ?? p.discount ?? 15,
        };
      })
    : MAndE_PRODUCTS.slice(0, 8);

  return (
    <section className="w-full">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-slate-900 dark:text-white uppercase mb-2">
            VẬT TƯ <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">NỔI BẬT KHUYÊN DÙNG</span>
          </h2>
          <p className="text-slate-500 text-sm">Sản phẩm vật tư điện nước được các nhà thầu M&amp;E tìm kiếm và đặt hàng nhiều nhất tháng này.</p>
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
                <span className={`px-2.5 py-1 rounded bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md`}>
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
                  onClick={() => window.location.href = `/shop`}
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
                  {prod.specs[0]?.includes(":") ? prod.specs[0].split(":")[1]?.trim() : prod.specs[0]}
                </span>
                <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-default hover:border-blue-300 transition-colors">
                  {prod.specs[1]?.includes(":") ? prod.specs[1].split(":")[1]?.trim() : prod.specs[1]}
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
