"use client";

import React, { useState } from "react";
import { Product } from "@/types/api";

interface UnitCalculatorProps {
  products: Product[];
}

export default function UnitCalculator({ products }: UnitCalculatorProps) {
  const productsWithConversions = products.filter(
    (p) => p.conversions && p.conversions.length > 0
  );

  const [selectedProductId, setSelectedProductId] = useState<string>(
    productsWithConversions[0]?.id || ""
  );
  const [quantity, setQuantity] = useState<number>(10);

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
    <div id="calculator" className="border border-[#E8E6E1] bg-white rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-4 pb-3 border-b border-[#F4F3EF]">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-[#18181B]">
            Bóc Tách Quy Đổi & Chiết Khấu (BOM Calculator)
          </h2>
          <p className="text-[11px] text-[#71717A]">
            Tự động đổi Cuộn $ightarrow$ Mét (Cadivi), Cây $ightarrow$ Mét (Bình Minh), Hộp $ightarrow$ Cái (Panasonic)
          </p>
        </div>
        <span className="font-mono text-[10px] text-[#346538] bg-[#EDF3EC] px-2 py-0.5 rounded">
          B2B Wholesale Rule
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-mono text-[#71717A] mb-1">
            01. Vật tư cần bóc tách
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full text-xs bg-[#FAF9F6] border border-[#E8E6E1] rounded-lg p-2 text-[#18181B] focus:outline-none focus:border-[#18181B] transition"
          >
            {productsWithConversions.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.brand_name}] {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-[#71717A] mb-1">
            02. Khối lượng ({activeConversion?.from_unit_name || "Đơn vị sỉ"})
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-full text-xs font-mono font-bold bg-[#FAF9F6] border border-[#E8E6E1] rounded-lg p-2 text-[#18181B] focus:outline-none focus:border-[#18181B] transition"
          />
        </div>

        <div className="border border-[#E8E6E1] bg-[#FAF9F6] rounded-lg p-3 flex flex-col justify-between">
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between text-[#71717A]">
              <span>Quy đổi cơ sở:</span>
              <span className="font-mono font-semibold text-[#18181B]">
                {quantity} {activeConversion?.from_unit_name} = {convertedQuantity.toLocaleString()} {activeConversion?.to_unit_name}
              </span>
            </div>
            <div className="flex justify-between text-[#71717A]">
              <span>Chiết khấu ({activeProduct?.brand_name} -{activeProduct?.discount_rate}%):</span>
              <span className="font-mono font-semibold text-[#346538]">-{formattedDiscount}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E8E6E1] flex justify-between items-baseline mt-2">
            <span className="text-[11px] font-mono text-[#71717A]">Tạm tính:</span>
            <span className="text-sm font-bold font-mono text-[#18181B]">{formattedFinal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
