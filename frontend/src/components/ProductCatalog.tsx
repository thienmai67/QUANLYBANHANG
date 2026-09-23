"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/types/api";
import { Droplets, Zap, Search, Plus, Check, ShoppingBag, ArrowRight, Sparkles, Filter } from "lucide-react";
import { useScrollReveal } from "@/lib/useScrollReveal";

interface ProductCatalogProps {
  products: Product[];
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="skeleton h-6 w-24 rounded-md" />
        <div className="skeleton h-4 w-16 rounded-md" />
      </div>
      <div className="skeleton h-5 w-full rounded-md" />
      <div className="skeleton h-4 w-3/4 rounded-md" />
      <div className="flex gap-2">
        <div className="skeleton h-6 w-16 rounded-md" />
        <div className="skeleton h-6 w-16 rounded-md" />
      </div>
      <div className="skeleton h-10 w-full mt-4 rounded-md" />
    </div>
  );
}

export default function ProductCatalog({ products, loading }: ProductCatalogProps) {
  const containerRef = useScrollReveal<HTMLDivElement>();
  const [activeBrand, setActiveBrand] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [addedSku, setAddedSku] = useState<string | null>(null);

  const brands = ["ALL", "Bình Minh", "Cadivi", "Panasonic"];

  const filtered = products.filter((p) => {
    // Normalizing brand match for Vietnamese diacritics
    const brandMatch =
      activeBrand === "ALL" ||
      p.brand_name.toLowerCase().includes(activeBrand.toLowerCase()) ||
      (activeBrand === "Bình Minh" && p.brand_name.toLowerCase().includes("binh minh"));

    const searchMatch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand_name.toLowerCase().includes(searchTerm.toLowerCase());

    return brandMatch && searchMatch;
  });

  const handleAdd = (sku: string) => {
    setAddedSku(sku);
    setTimeout(() => setAddedSku(null), 2000);
  };

  return (
    <div ref={containerRef}>
      <section id="catalog" className="reveal-on-scroll space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent-blue/10 border border-accent-blue/30 text-accent-blue text-xs font-bold font-mono tracking-widest uppercase mb-3">
              <Sparkles className="w-4 h-4" /> BẢNG GIÁ & TỒN KHO THỜI GIAN THỰC
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Tra Cứu Bảng Giá & Danh Mục Vật Tư
            </h2>
            <p className="text-sm text-muted mt-3 max-w-2xl font-medium leading-relaxed">
              Quy cách kỹ thuật đầy đủ: đường kính Ø, tiết diện ruột đồng mm², dòng định mức Ampe và tỷ lệ chiết khấu xuất xưởng.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="h-5 w-5 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã SKU, tên vật tư..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg text-sm font-bold bg-surface border border-border text-foreground placeholder-muted focus:outline-none focus:border-accent-blue/50 transition-all shadow-sm focus:ring-1 focus:ring-accent-blue/30"
            />
          </div>
        </div>

        {/* Brand filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {brands.map((b) => {
            const isSelected = activeBrand === b;
            return (
              <button
                key={b}
                onClick={() => setActiveBrand(b)}
                className={`px-4 py-2.5 rounded-md text-xs font-bold tracking-wider uppercase transition-all duration-200 whitespace-nowrap border ${
                  isSelected
                    ? "bg-foreground text-background shadow-[0_4px_15px_rgba(var(--foreground),0.2)] border-foreground"
                    : "bg-surface text-muted hover:text-foreground hover:bg-border/50 border-border"
                }`}
              >
                {b === "ALL" ? "Tất Cả Hãng" : b}
              </button>
            );
          })}
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-xl bg-surface border border-border animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="py-20 text-center rounded-xl border-2 border-dashed border-border bg-surface">
            <ShoppingBag className="h-16 w-16 text-muted mx-auto mb-4 opacity-50" />
            <p className="text-lg font-display font-bold text-foreground">
              {searchTerm
                ? `Không tìm thấy vật tư khớp với "${searchTerm}"`
                : "Không có sản phẩm nào trong danh mục đã chọn"}
            </p>
            <p className="text-sm text-muted mt-2 font-medium">
              Vui lòng thử tìm kiếm mã khác hoặc gửi trực tiếp file bản vẽ/BOM cho chuyên viên bóc tách.
            </p>
          </div>
        ) : (
          /* Product grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {filtered.map((product) => {
              const isWater =
                product.category_name?.toLowerCase().includes("nuoc") ||
                product.category_name?.toLowerCase().includes("nước") ||
                product.brand_name.toLowerCase().includes("binh minh");

              const discountedPrice =
                product.base_price * (1 - product.discount_rate / 100);

              const formattedBase = new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(product.base_price);

              const formattedDiscounted = new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(discountedPrice);

              const isAdded = addedSku === product.sku;

              return (
                <motion.div
                  key={product.id}
                  layout
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="reveal-on-scroll group rounded-xl border border-border bg-surface p-6 flex flex-col justify-between hover:border-accent-blue/30 transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-md hover:bg-background"
                >
                  <div>
                    {/* Brand badge + SKU */}
                    <div className="flex items-center justify-between text-[10px] mb-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-bold font-mono uppercase tracking-widest bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                        {isWater ? (
                          <Droplets className="h-3.5 w-3.5" />
                        ) : (
                          <Zap className="h-3.5 w-3.5" />
                        )}
                        {product.brand_name}
                      </span>
                      <span className="text-muted font-bold font-mono tracking-wider">
                        {product.sku}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-base font-display font-bold text-foreground leading-snug line-clamp-2 group-hover:text-accent-blue transition-colors">
                      {product.name}
                    </h3>

                    {/* Spec Tags */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {product.diameter_mm && (
                        <span className="text-[10px] bg-background text-muted border border-border px-2 py-1 rounded font-bold font-mono">
                          Ø {product.diameter_mm}mm
                        </span>
                      )}
                      {product.cross_section_mm2 && (
                        <span className="text-[10px] bg-background text-muted border border-border px-2 py-1 rounded font-bold font-mono">
                          CV {product.cross_section_mm2} mm²
                        </span>
                      )}
                      {product.amp_rating && (
                        <span className="text-[10px] bg-background text-muted border border-border px-2 py-1 rounded font-bold font-mono">
                          {product.amp_rating}A
                        </span>
                      )}
                      <span className="text-[10px] bg-accent-orange/10 text-accent-orange border border-accent-orange/20 px-2 py-1 rounded font-bold font-mono">
                        CK -{product.discount_rate}%
                      </span>
                    </div>

                    {/* Price Block */}
                    <div className="mt-5 pt-4 border-t border-border space-y-2">
                      <div className="flex justify-between text-muted text-xs font-medium">
                        <span>Giá niêm yết:</span>
                        <span className="line-through">{formattedBase}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted text-xs font-bold uppercase tracking-wider">
                          Giá Cấp 1:
                        </span>
                        <span className="font-mono font-bold text-accent-orange text-lg">
                          {formattedDiscounted}
                          <span className="text-[10px] font-bold text-muted ml-1 uppercase">
                            /{product.base_unit_name}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Unit conversion preview */}
                    {product.conversions && product.conversions.length > 0 && (
                      <div className="mt-4 bg-background border border-border rounded-lg px-3 py-2 text-xs text-muted flex items-center justify-between font-mono">
                        <span className="font-bold">
                          1 {product.conversions[0].from_unit_name}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-accent-blue" />
                        <span className="text-accent-blue font-bold">
                          {product.conversions[0].conversion_factor} {product.conversions[0].to_unit_name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Add button */}
                  <motion.button
                    onClick={() => handleAdd(product.sku)}
                    whileTap={{ scale: 0.96 }}
                    className={`mt-5 w-full py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 ${
                      isAdded
                        ? "bg-accent-green text-background shadow-md"
                        : "bg-background hover:bg-foreground hover:text-background text-foreground border border-border"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>ĐÃ THÊM VÀO BOM</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 text-accent-blue group-hover:text-background" />
                        <span>THÊM VÀO BOM</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
