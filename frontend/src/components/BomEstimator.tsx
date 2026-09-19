"use client";

import React, { useState } from "react";
import { Product } from "@/types/api";
import { Calculator, ArrowRight, CheckCircle, Sparkles, TrendingDown, Layers } from "lucide-react";

interface BomEstimatorProps {
  products: Product[];
}

export default function BomEstimator({ products }: BomEstimatorProps) {
  const productsWithConversions = products.filter(
    (p) => p.conversions && p.conversions.length > 0
  );

  const [selectedProductId, setSelectedProductId] = useState<string>(
    productsWithConversions[0]?.id || ""
  );
  const [quantity, setQuantity] = useState<number>(20);

  const activeProduct = products.find((p) => p.id === selectedProductId);
  const activeConversion = activeProduct?.conversions?.[0];

  const convertedQuantity = activeConversion
    ? quantity * activeConversion.conversion_factor
    : quantity;

  const rawTotal = activeProduct
    ? convertedQuantity * activeProduct.base_price
    : 0;

  const discountAmount = activeProduct
    ? rawTotal * (activeProduct.discount_rate / 100)
    : 0;

  const finalTotal = rawTotal - discountAmount;

  const formattedRaw = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(rawTotal);
  const formattedDiscount = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(discountAmount);
  const formattedFinal = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(finalTotal);

  return (
    <div id="bom-estimator" className="rounded-2xl border border-white/[0.08] bg-[#0E1526] p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.08] mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Bộ Tính Khối Lượng BOM & Chiết Khấu Đại Lý
            </h2>
            <p className="text-xs text-slate-400">
              Mô phỏng thuật toán tính chiết khấu và tự động quy đổi Cuộn/Cây $\rightarrow$ Mét cơ sở
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold self-start">
          <TrendingDown className="h-3.5 w-3.5" />
          <span>Chiết khấu trực tiếp {activeProduct?.discount_rate}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-4 space-y-1.5">
          <label className="block text-xs font-mono text-slate-400">
            01. CHỌN MÃ VẬT TƯ BÓC TÁCH
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full text-xs font-semibold bg-[#162035] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-400 transition"
          >
            {productsWithConversions.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                [{p.brand_name}] {p.name}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500">Giá gốc: {new Intl.NumberFormat("vi-VN").format(activeProduct?.base_price || 0)} đ/{activeProduct?.base_unit_name}</p>
        </div>

        <div className="md:col-span-3 space-y-1.5">
          <label className="block text-xs font-mono text-slate-400">
            02. SỐ LƯỢNG ĐẶT ({activeConversion?.from_unit_name || "Đơn vị sỉ"})
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-full text-sm font-mono font-bold bg-[#162035] border border-white/10 rounded-xl p-2.5 text-cyan-400 focus:outline-none focus:border-cyan-400 transition"
          />
          <p className="text-[10px] text-slate-500">Quy cách đóng gói nhà máy</p>
        </div>

        <div className="md:col-span-5 rounded-xl border border-white/10 bg-gradient-to-br from-[#121B30] to-[#0A0F1E] p-4 flex flex-col justify-between shadow-inner">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Quy đổi đơn vị cơ sở:</span>
              <span className="font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {quantity} {activeConversion?.from_unit_name} = {convertedQuantity.toLocaleString()} {activeConversion?.to_unit_name}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Tổng giá niêm yết:</span>
              <span className="line-through text-slate-500 font-mono">{formattedRaw}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Mức chiết khấu ({activeProduct?.brand_name} -{activeProduct?.discount_rate}%):</span>
              <span className="text-emerald-400 font-mono font-bold">-{formattedDiscount}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between mt-3">
            <span className="text-xs font-bold text-slate-300">Giá thanh toán sau CK:</span>
            <span className="text-xl font-black text-amber-400 font-mono tracking-tight">{formattedFinal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
