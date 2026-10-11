"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useAdminStore } from "@/store/useAdminStore";
import { Eye, Package } from "lucide-react";
import * as motion from "motion/react-client";

interface MaterialProductShowcaseProps {
  onOpenRFQ?: (productName?: string) => void;
}

export default function MaterialProductShowcase(_props: MaterialProductShowcaseProps) {
  const adminProducts = useAdminStore((state) => state.products);
  const productsLoading = useAdminStore((state) => state.productsLoading);
  const fetchProducts = useAdminStore((state) => state.fetchProducts);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const displayProducts = (adminProducts || []).slice(0, 8).map((p) => {
    const rawPrice = p.basePrice ?? (typeof p.price === "number" ? p.price : 0);
    const priceStr =
      typeof p.price === "string"
        ? p.price
        : `${rawPrice.toLocaleString("vi-VN")} ₫`;

    const specsArr = Array.isArray(p.specs)
      ? p.specs
      : typeof p.specs === "string"
        ? [p.specs]
        : [`Thương hiệu: ${p.brand || "Chính hãng"}`, `Đơn vị: ${p.unit || "Chuẩn"}`];

    return {
      id: p.id,
      sku: p.sku || "SKU-STD",
      name: p.name,
      brand: p.brand || "Cadivi",
      category: p.category || "CABLE",
      price: priceStr,
      unit: p.unit || "Bộ",
      image: p.image || "/images/products/copper-cables.png",
      badge: p.badge || "MỚI",
      specs: specsArr,
      discount: p.discountRate ?? p.discount ?? 15,
    };
  });

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

      {productsLoading && displayProducts.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm font-medium">
          Đang tải danh sách sản phẩm...
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <Package className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
          <p className="text-base font-bold text-slate-700 dark:text-slate-200">
            Chưa có sản phẩm
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayProducts.map((prod, idx) => (
          <motion.div
            key={prod.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            viewport={{ once: true }}
          >
            <Link
              href={`/product/${prod.id}`}
              className="group block relative bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-blue-900/5 transition-all h-full"
            >
              {/* Badges */}
              {prod.badge && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="px-2.5 py-1 rounded bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
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
                  <div 
                    className="p-3 bg-white text-slate-900 rounded-full transition-transform hover:scale-110 active:scale-95"
                    title="Xem chi tiết"
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
                  <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    {prod.specs[0]?.includes(":") ? prod.specs[0].split(":")[1]?.trim() : prod.specs[0]}
                  </span>
                  <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    {prod.specs[1]?.includes(":") ? prod.specs[1].split(":")[1]?.trim() : prod.specs[1]}
                  </span>
                </div>

                <div className="mt-5 flex items-end justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Giá bán lẻ</p>
                    <span className="font-bold text-orange-500 text-base">{prod.price}</span>
                  </div>
                  {prod.discount && (
                    <span className="text-green-600 dark:text-green-400 text-xs font-bold px-2 py-1 bg-green-500/10 rounded">
                      -{prod.discount}%
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      )}
    </section>
  );
}
