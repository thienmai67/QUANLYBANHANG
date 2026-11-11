"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAdminStore } from "@/store/useAdminStore";
import { useCartStore } from "@/store/useCartStore";
import { ShoppingBag, Package, ChevronRight, Sparkles, Layers } from "lucide-react";
import * as motion from "motion/react-client";

interface MaterialProductShowcaseProps {
  onOpenRFQ?: (productName?: string) => void;
}

type BrandFilter = "ALL" | "Cadivi" | "Bình Minh" | "Schneider" | "Panasonic";

const BRAND_TABS: Array<{ id: BrandFilter; label: string; badge: string }> = [
  { id: "ALL", label: "Tất cả nổi bật", badge: "Đa dạng" },
  { id: "Cadivi", label: "Dây Cáp Cadivi", badge: "Điện" },
  { id: "Bình Minh", label: "Ống Nhựa Bình Minh", badge: "Nước" },
  { id: "Schneider", label: "Thiết Bị Schneider", badge: "Aptomat" },
  { id: "Panasonic", label: "Thiết Bị Panasonic", badge: "Công tắc" },
];

export default function MaterialProductShowcase(_props: MaterialProductShowcaseProps) {
  const adminProducts = useAdminStore((state) => state.products);
  const productsLoading = useAdminStore((state) => state.productsLoading);
  const fetchProducts = useAdminStore((state) => state.fetchProducts);
  const addItem = useCartStore((state) => state.addItem);

  const [selectedBrand, setSelectedBrand] = useState<BrandFilter>("ALL");

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const allDisplayProducts = useMemo(() => {
    return (adminProducts || []).map((p) => {
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
        rawPrice: rawPrice,
        unit: p.unit || "Bộ",
        image: p.image || "/images/products/day-cap-don-1.jpg",
        badge: p.badge || "MỚI",
        specs: specsArr,
        discount: p.discountRate ?? p.discount ?? 15,
      };
    });
  }, [adminProducts]);

  // Lọc sản phẩm theo Thương hiệu được chọn, hoặc nếu ALL thì chia đều các thương hiệu
  const displayProducts = useMemo(() => {
    if (selectedBrand === "ALL") {
      // Lấy xen kẽ đại diện từ tất cả các thương hiệu (Cadivi, Bình Minh, Schneider, Panasonic)
      const cadivi = allDisplayProducts.filter((p) => p.brand.includes("Cadivi")).slice(0, 3);
      const binhMinh = allDisplayProducts.filter((p) => p.brand.includes("Bình Minh")).slice(0, 3);
      const schneider = allDisplayProducts.filter((p) => p.brand.includes("Schneider")).slice(0, 3);
      const panasonic = allDisplayProducts.filter((p) => p.brand.includes("Panasonic")).slice(0, 3);

      const combined = [...cadivi, ...binhMinh, ...schneider, ...panasonic];
      if (combined.length > 0) return combined;
      return allDisplayProducts.slice(0, 12);
    }

    return allDisplayProducts
      .filter((p) => p.brand.toLowerCase().includes(selectedBrand.toLowerCase()))
      .slice(0, 12);
  }, [allDisplayProducts, selectedBrand]);

  return (
    <section className="w-full space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kho Vật Tư M&amp;E Chính Hãng ({allDisplayProducts.length} sản phẩm)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-slate-900 dark:text-white uppercase">
            VẬT TƯ <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">NỔI BẬT KHUYÊN DÙNG</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Đầy đủ các nhóm vật tư Dây cáp Cadivi, Ống nước Bình Minh, Thiết bị điện Schneider &amp; Panasonic.
          </p>
        </div>

        {/* Link to Full Shop */}
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline shrink-0"
        >
          <span>Xem toàn bộ {allDisplayProducts.length} sản phẩm</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 2. Brand Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-2 border-b border-slate-100 dark:border-slate-800">
        {BRAND_TABS.map((tab) => {
          const isActive = selectedBrand === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedBrand(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                  : "bg-white dark:bg-[#0c1322] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}
              >
                {tab.id === "ALL"
                  ? allDisplayProducts.length
                  : allDisplayProducts.filter((p) => p.brand.toLowerCase().includes(tab.id.toLowerCase())).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Products Grid */}
      {productsLoading && displayProducts.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm font-medium">
          Đang tải danh sách sản phẩm...
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <Package className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
          <p className="text-base font-bold text-slate-700 dark:text-slate-200">
            Chưa có sản phẩm trong nhóm này
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((prod, idx) => (
            <motion.div
              key={prod.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              viewport={{ once: true }}
            >
              <Link
                href={`/product/${prod.id}`}
                className="group block relative bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-blue-900/10 hover:border-blue-300 dark:hover:border-blue-700 transition-all h-full"
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
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (prod.brand.includes("Bình Minh")) {
                        target.src = "/images/products/ong-binh-minh-1.jpg";
                      } else if (prod.brand.includes("Cadivi")) {
                        target.src = "/images/products/day-cap-don-1.jpg";
                      } else {
                        target.src = "/images/products/schneider-mcb-1.jpg";
                      }
                    }}
                  />

                  {/* Quick Add overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem(
                          {
                            id: prod.id,
                            sku: prod.sku,
                            name: prod.name,
                            price: prod.price,
                            unitPrice: prod.rawPrice,
                            image: prod.image,
                            quantity: 1,
                          },
                          true
                        );
                      }}
                      className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/30 flex items-center justify-center gap-1.5 transition-all transform hover:scale-105 active:scale-95"
                      title="Thêm nhanh vào giỏ"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>+ Thêm Vào Giỏ</span>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                        {prod.brand}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {prod.sku}
                      </span>
                    </div>

                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2 min-h-[40px] leading-relaxed group-hover:text-blue-600 transition-colors">
                      {prod.name}
                    </h3>

                    {/* Interactive Spec Chips */}
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                        {prod.specs[0]?.includes(":") ? prod.specs[0].split(":")[1]?.trim() : prod.specs[0]}
                      </span>
                      {prod.specs[1] && (
                        <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                          {prod.specs[1]?.includes(":") ? prod.specs[1].split(":")[1]?.trim() : prod.specs[1]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-[10px] text-slate-400 mb-0.5">Giá bán lẻ ({prod.unit})</p>
                      <span className="font-bold text-orange-500 text-base">{prod.price}</span>
                    </div>
                    {prod.discount > 0 && (
                      <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded">
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

      {/* 4. Bottom Callout Button linking to /shop */}
      <div className="pt-4 text-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-blue-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Layers className="w-4 h-4" />
          <span>Khám Phá Toàn Bộ {allDisplayProducts.length} Mặt Hàng Tại Cửa Hàng &rarr;</span>
        </Link>
      </div>
    </section>
  );
}
