"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/types/api";
import {
  Droplets,
  Zap,
  Search,
  Plus,
  Check,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Flame,
  FileSpreadsheet,
} from "lucide-react";
import { useScrollReveal } from "@/lib/useScrollReveal";

interface ProductCatalogProps {
  products: Product[];
  loading?: boolean;
  onOpenRFQ?: () => void;
}

export default function ProductCatalog({
  products,
  loading,
  onOpenRFQ,
}: ProductCatalogProps) {
  const containerRef = useScrollReveal<HTMLDivElement>();
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [activeBrand, setActiveBrand] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("" );
  const [addedSku, setAddedSku] = useState<string | null>(null);

  const categories = [
    { id: "ALL", label: "Tất Cả Danh Mục" },
    { id: "PIPE", label: "Đường Ống & Bồn Bể" },
    { id: "CABLE", label: "Dây Cáp Điện & Hạ Thế" },
    { id: "DEVICE", label: "Thiết Bị Đóng Cắt & PCCC" },
  ];

  const brands = ["ALL", "Bình Minh", "Cadivi", "Panasonic"];

  const filtered = products.filter((p) => {
    // Category match
    const isWater =
      p.category_name?.toLowerCase().includes("nuoc") ||
      p.category_name?.toLowerCase().includes("nước") ||
      p.brand_name.toLowerCase().includes("binh minh");

    const isElectric =
      p.category_name?.toLowerCase().includes("dien") ||
      p.category_name?.toLowerCase().includes("điện") ||
      p.brand_name.toLowerCase().includes("cadivi");

    const isDevice =
      p.brand_name.toLowerCase().includes("panasonic") ||
      p.name.toLowerCase().includes("mcb") ||
      p.name.toLowerCase().includes("mccb") ||
      p.name.toLowerCase().includes("van");

    let catMatch = true;
    if (activeCategory === "PIPE") catMatch = isWater;
    else if (activeCategory === "CABLE") catMatch = isElectric;
    else if (activeCategory === "DEVICE") catMatch = isDevice;

    // Brand match
    const brandMatch =
      activeBrand === "ALL" ||
      p.brand_name.toLowerCase().includes(activeBrand.toLowerCase()) ||
      (activeBrand === "Bình Minh" && p.brand_name.toLowerCase().includes("binh minh"));

    // Search match
    const searchMatch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand_name.toLowerCase().includes(searchTerm.toLowerCase());

    return catMatch && brandMatch && searchMatch;
  });

  const handleAdd = (sku: string) => {
    setAddedSku(sku);
    setTimeout(() => setAddedSku(null), 2000);
  };

  return (
    <div ref={containerRef}>
      <section id="catalog" className="reveal-on-scroll space-y-8 scroll-mt-24">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent-blue/10 border border-accent-blue/30 text-accent-blue text-xs font-bold font-mono tracking-widest uppercase mb-3">
              <Sparkles className="w-4 h-4" /> BẢNG GIÁ &amp; TỒN KHO THỜI GIAN THỰC
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Tra Cứu Bảng Giá &amp; Danh Mục Vật Tư
            </h2>
            <p className="text-sm text-muted mt-2 max-w-2xl font-medium leading-relaxed">
              Quy cách kỹ thuật đầy đủ: đường kính Ø, tiết diện ruột đồng mm², dòng định mức Ampe và tỷ lệ chiết khấu xuất xưởng đại lý cấp 1.
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
              className="w-full pl-12 pr-4 py-3 rounded-xl text-sm font-semibold bg-surface border border-border text-foreground placeholder-muted focus:outline-none focus:border-accent-blue/50 transition-all shadow-sm focus:ring-1 focus:ring-accent-blue/30"
            />
          </div>
        </div>

        {/* Filter Controls: Category Tabs + Brand Pills */}
        <div className="space-y-3">
          {/* Main Category Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-border/60 pb-3">
            {categories.map((c) => {
              const isSelected = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all duration-200 whitespace-nowrap ${
                    isSelected
                      ? "bg-accent-blue text-white shadow-md shadow-accent-blue/20"
                      : "bg-surface text-muted hover:text-foreground hover:bg-border/40 border border-border"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Sub-Brand Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-mono text-muted uppercase font-bold shrink-0 mr-1">
              Hãng sản xuất:
            </span>
            {brands.map((b) => {
              const isSelected = activeBrand === b;
              return (
                <button
                  key={b}
                  onClick={() => setActiveBrand(b)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wider uppercase transition-all duration-200 whitespace-nowrap border ${
                    isSelected
                      ? "bg-foreground text-background border-foreground shadow-sm"
                      : "bg-surface text-muted hover:text-foreground hover:bg-border/50 border-border"
                  }`}
                >
                  {b === "ALL" ? "Tất Cả Hãng" : b}
                </button>
              );
            })}
          </div>
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
          <div className="py-16 px-4 text-center rounded-2xl border-2 border-dashed border-border bg-surface max-w-2xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center mx-auto">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-display font-bold text-foreground">
                {searchTerm
                  ? `Không tìm thấy vật tư khớp với "${searchTerm}"`
                  : "Không có sản phẩm nào trong danh mục đã chọn"}
              </p>
              <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
                Vui lòng thử tìm kiếm mã khác hoặc gửi trực tiếp file bản vẽ/BOM cho chuyên viên bóc tách để nhận báo giá tức thì.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={onOpenRFQ}
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-blue hover:bg-accent-blue/90 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-accent-blue/20"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Gửi Bản Vẽ / Yêu Cầu Báo Giá</span>
              </button>
            </div>
          </div>
        ) : (
          /* Product grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {filtered.map((product, idx) => {
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
              const isBestSeller = idx % 3 === 0 || product.discount_rate >= 30;

              return (
                <motion.div
                  key={product.id}
                  layout
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="reveal-on-scroll group rounded-2xl border border-border bg-surface p-6 flex flex-col justify-between hover:border-accent-blue/30 transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-md hover:bg-background"
                >
                  {/* Best Seller Badge */}
                  {isBestSeller && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-orange/15 border border-accent-orange/30 text-accent-orange text-[10px] font-mono font-bold uppercase tracking-wider">
                      <Flame className="w-3 h-3 fill-accent-orange" />
                      <span>Bán Chạy</span>
                    </div>
                  )}

                  <div>
                    {/* Brand badge + SKU */}
                    <div className="flex items-center justify-between text-[10px] mb-4 pr-16">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-bold font-mono uppercase tracking-widest bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                        {isWater ? (
                          <Droplets className="h-3.5 w-3.5" />
                        ) : (
                          <Zap className="h-3.5 w-3.5" />
                        )}
                        {product.brand_name}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-muted font-bold tracking-wider mb-1">
                      SKU: {product.sku}
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
                    className={`mt-5 w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 ${
                      isAdded
                        ? "bg-accent-green text-white shadow-md shadow-accent-green/20"
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
