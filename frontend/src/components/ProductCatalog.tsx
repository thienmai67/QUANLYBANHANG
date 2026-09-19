"use client";

import React, { useState } from "react";
import { Product } from "@/types/api";
import { Droplet, Zap, Search, Plus, Check } from "lucide-react";

interface ProductCatalogProps {
  products: Product[];
}

export default function ProductCatalog({ products }: ProductCatalogProps) {
  const [activeBrand, setActiveBrand] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [addedSku, setAddedSku] = useState<string | null>(null);

  const brands = ["ALL", "Bình Minh", "Cadivi", "Panasonic"];

  const filtered = products.filter((p) => {
    const matchBrand = activeBrand === "ALL" || p.brand_name === activeBrand;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchBrand && matchSearch;
  });

  const handleAdd = (sku: string) => {
    setAddedSku(sku);
    setTimeout(() => setAddedSku(null), 1800);
  };

  return (
    <section id="catalog" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Danh Mục Vật Tư Quy Cách Chuẩn (B2B Procurement)
          </h2>
          <p className="text-xs text-slate-400">
            Dữ liệu quy cách kỹ thuật chuẩn: đường kính Φ, tiết diện mm², dòng Ampe, tỷ lệ đóng gói
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm mã SKU, quy cách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[#162035] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-48 transition"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {brands.map((b) => (
          <button
            key={b}
            onClick={() => setActiveBrand(b)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition ${
              activeBrand === b
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.05]"
            }`}
          >
            {b === "ALL" ? "Tất Cả Hãng" : b}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((product) => {
          const isWater = product.category_name.toLowerCase().includes("nước");
          const discountedPrice = product.base_price * (1 - product.discount_rate / 100);
          const formattedBase = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.base_price);
          const formattedDiscounted = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(discountedPrice);
          const isAdded = addedSku === product.sku;

          return (
            <div
              key={product.id}
              className="rounded-2xl border border-white/[0.08] bg-[#0E1526] p-4 flex flex-col justify-between hover:border-cyan-500/40 transition duration-200 group"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border ${
                    isWater
                      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}>
                    {isWater ? <Droplet className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                    {product.brand_name}
                  </span>
                  <span className="text-slate-500 group-hover:text-slate-300 transition">{product.sku}</span>
                </div>

                <h3 className="text-xs font-bold text-white leading-snug line-clamp-2">
                  {product.name}
                </h3>

                <div className="mt-2.5 flex flex-wrap gap-1">
                  {product.diameter_mm && (
                    <span className="text-[10px] font-mono bg-white/[0.04] text-cyan-300 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                      Φ{product.diameter_mm}mm
                    </span>
                  )}
                  {product.cross_section_mm2 && (
                    <span className="text-[10px] font-mono bg-white/[0.04] text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded">
                      {product.cross_section_mm2}mm²
                    </span>
                  )}
                  {product.amp_rating && (
                    <span className="text-[10px] font-mono bg-white/[0.04] text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded">
                      {product.amp_rating}A
                    </span>
                  )}
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                    -{product.discount_rate}%
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1">
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Giá niêm yết:</span>
                    <span className="line-through">{formattedBase}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-300 text-xs font-medium">Giá sỉ nhà thầu:</span>
                    <span className="font-extrabold text-amber-400 font-mono text-sm">
                      {formattedDiscounted} <span className="text-[10px] font-normal text-slate-400">/{product.base_unit_name}</span>
                    </span>
                  </div>
                </div>

                {product.conversions && product.conversions.length > 0 && (
                  <div className="mt-2.5 bg-[#121B30] border border-white/[0.06] rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-slate-300 flex justify-between">
                    <span>1 {product.conversions[0].from_unit_name}</span>
                    <span className="text-slate-500">=</span>
                    <span className="text-cyan-400 font-bold">{product.conversions[0].conversion_factor} {product.conversions[0].to_unit_name}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleAdd(product.sku)}
                className={`mt-4 w-full py-2 rounded-xl text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 ${
                  isAdded
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/10"
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Đã thêm vào BOM</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm vào BOM</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
