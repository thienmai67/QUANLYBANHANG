"use client";

import React, { useState } from "react";
import {
  ChevronRight,
  ShieldCheck,
  PhoneCall,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { MATERIAL_PRODUCTS, MaterialProduct } from "@/data/materialData";

interface MaterialProductShowcaseProps {
  onOpenRFQ: (productName?: string) => void;
}

export default function MaterialProductShowcase({ onOpenRFQ }: MaterialProductShowcaseProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const storageProducts = MATERIAL_PRODUCTS.filter((p) => p.category === "storage");
  const pumpProducts = MATERIAL_PRODUCTS.filter((p) => p.category === "pumps");
  const filterProducts = MATERIAL_PRODUCTS.filter((p) => p.category === "filtration");
  const measurementProducts = MATERIAL_PRODUCTS.filter((p) => p.category === "measurement");
  const safetyProducts = MATERIAL_PRODUCTS.filter((p) => p.category === "safety" || p.category === "cleaning");

  const showcases = [
    {
      id: "showcase-storage",
      catId: "storage",
      title: "THÉP XÂY DỰNG & KIM KHÍ",
      subtitle: "Thép thanh vằn Hòa Phát, thép cuộn trơn, thép hình H/I/U/V, ống hộp mạ kẽm Hoa Sen và lưới thép đổ sàn",
      products: storageProducts,
    },
    {
      id: "showcase-pumps",
      catId: "pumps",
      title: "GẠCH XÂY DỰNG & NGÓI LỢP",
      subtitle: "Gạch tuynel đặc A1 Viglacera, gạch ống 2 lỗ, gạch không nung xi măng, gạch nhẹ khí chưng áp AAC",
      products: pumpProducts,
    },
    {
      id: "showcase-filtration",
      catId: "filtration",
      title: "GẠCH ỐP LÁT & ĐÁ TRANG TRÍ",
      subtitle: "Gạch lát nền Granite Prime 80x80, gạch ốp tường men mờ Đồng Tâm, đá hoa cương tự nhiên, keo dán gạch Weber",
      products: filterProducts,
    },
    {
      id: "showcase-measurement",
      catId: "measurement",
      title: "CÁT, ĐÁ & BÊ TÔNG THƯƠNG PHẨM",
      subtitle: "Cát vàng tuyển rửa Sông Lô, đá 1x2 xanh sàng tuyển mỏ Phủ Lý, bê tông tươi Mac 250 - Mac 450",
      products: measurementProducts,
    },
    {
      id: "showcase-safety",
      catId: "safety",
      title: "XI MĂNG, CHỐNG THẤM & THI CÔNG",
      subtitle: "Xi măng bao Vicem Hoàng Thạch PCB40, màng chống thấm polyme Sikatop Seal 107, màng khò nóng Bitum",
      products: safetyProducts,
    },
  ];

  return (
    <div id="product-showcases" className="w-full space-y-16">
      {showcases.map((section) => (
        <section key={section.id} id={section.id} className="w-full space-y-6 scroll-mt-28">
          {/* Showcase Section Header matching reference */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-amber-600 pb-3 gap-2">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-6 bg-gradient-to-b from-amber-600 to-orange-600 rounded-sm" />
                <h3 className="font-display font-black text-lg sm:text-2xl uppercase tracking-tight text-slate-900 dark:text-white">
                  {section.title}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-6">
                {section.subtitle}
              </p>
            </div>
            <button
              onClick={() => onOpenRFQ(`Yêu cầu báo giá toàn bộ danh mục ${section.title}`)}
              className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 hover:text-orange-600 flex items-center gap-1 transition-colors self-start sm:self-auto shrink-0"
            >
              <span>Xem Tất Cả ({section.products.length}+ thiết bị)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Product Cards Grid: 5 columns on desktop, 3 on tablet, 2 on mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
            {section.products.map((product) => (
              <div
                key={product.id}
                className="group rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm hover:shadow-xl hover:border-amber-500/60 dark:hover:border-amber-500/60 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Badge top-left */}
                {product.badge && (
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        product.badge === "HOT"
                          ? "bg-rose-600 text-white shadow-sm"
                          : product.badge === "NEW"
                          ? "bg-amber-500 text-slate-950 font-black"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {product.badge}
                    </span>
                  </div>
                )}

                {/* Brand & Origin top-right */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-slate-200">
                    {product.brand}
                  </span>
                </div>

                {/* Product Thumbnail with hover zoom */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 mb-3 border border-slate-100 dark:border-slate-800/80">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Product Body Content */}
                <div className="space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    {/* SKU Code */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-900/60">
                        {product.sku}
                      </span>
                      <span className="text-[11px] text-slate-400 font-sans">
                        • {product.origin}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug min-h-[38px]">
                      {product.name}
                    </h4>

                    {/* Specs Pills (up to 2 specs) */}
                    <div className="space-y-1 pt-1">
                      {product.specs.slice(0, 2).map((spec, sIdx) => (
                        <div
                          key={sIdx}
                          className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 line-clamp-1"
                        >
                          <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                          <span className="line-clamp-1">{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price & Primary CTA matching reference "Giá: Liên hệ" / "Đề nghị báo giá" */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-slate-500 font-sans">Đơn giá:</span>
                      <span className="font-bold text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-mono">
                        {product.price}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => onOpenRFQ(product.name)}
                        className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-[11px] transition-all text-center shadow-sm"
                      >
                        Báo giá nhanh
                      </button>
                      <button
                        onClick={() => onOpenRFQ(`Tư vấn kỹ thuật cho thiết bị: ${product.name} (SKU: ${product.sku})`)}
                        className="w-full py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-700 dark:text-slate-300 hover:text-amber-600 font-semibold text-[11px] transition-colors text-center"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
