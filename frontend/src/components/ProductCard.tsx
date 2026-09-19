import React from "react";
import { Product } from "@/types/api";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isWater = product.category_name.toLowerCase().includes("nước");
  const discountedPrice = product.base_price * (1 - product.discount_rate / 100);

  const formattedBase = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.base_price);
  const formattedDiscounted = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(discountedPrice);

  return (
    <div className="border border-[#E8E6E1] bg-white rounded-xl p-4 flex flex-col justify-between hover:border-[#D1CECD] transition duration-200">
      <div>
        <div className="flex items-center justify-between text-[10px] font-mono mb-2">
          <span className={`px-2 py-0.5 rounded font-semibold tracking-wide ${
            isWater ? "bg-[#E1F3FE] text-[#1F6C9F]" : "bg-[#FBF3DB] text-[#956400]"
          }`}>
            {product.brand_name}
          </span>
          <span className="text-[#A1A1AA]">{product.sku}</span>
        </div>

        <h3 className="text-xs font-semibold text-[#18181B] leading-snug line-clamp-2">
          {product.name}
        </h3>

        <div className="mt-2.5 flex flex-wrap gap-1">
          {product.diameter_mm && (
            <span className="text-[10px] font-mono bg-[#F4F3EF] text-[#52525B] px-1.5 py-0.5 rounded">
              Φ{product.diameter_mm}mm
            </span>
          )}
          {product.cross_section_mm2 && (
            <span className="text-[10px] font-mono bg-[#F4F3EF] text-[#52525B] px-1.5 py-0.5 rounded">
              {product.cross_section_mm2}mm²
            </span>
          )}
          {product.amp_rating && (
            <span className="text-[10px] font-mono bg-[#F4F3EF] text-[#52525B] px-1.5 py-0.5 rounded">
              {product.amp_rating}A
            </span>
          )}
          <span className="text-[10px] font-mono bg-[#EDF3EC] text-[#346538] px-1.5 py-0.5 rounded font-semibold">
            -{product.discount_rate}%
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F4F3EF] space-y-1 text-xs">
          <div className="flex justify-between text-[#71717A] text-[11px]">
            <span>Niêm yết:</span>
            <span className="line-through">{formattedBase}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[#52525B] text-[11px] font-medium">Giá thầu:</span>
            <span className="font-semibold text-[#18181B] font-mono">
              {formattedDiscounted} <span className="text-[10px] font-normal text-[#71717A]">/{product.base_unit_name}</span>
            </span>
          </div>
        </div>

        {product.conversions && product.conversions.length > 0 && (
          <div className="mt-2.5 bg-[#FAF9F6] border border-[#E8E6E1] rounded px-2 py-1.5 text-[11px] font-mono text-[#52525B] flex justify-between">
            <span>1 {product.conversions[0].from_unit_name}</span>
            <span className="text-[#A1A1AA]">=</span>
            <span className="text-[#18181B] font-semibold">{product.conversions[0].conversion_factor} {product.conversions[0].to_unit_name}</span>
          </div>
        )}
      </div>

      <button className="mt-4 w-full py-1.5 bg-[#18181B] hover:bg-[#333333] active:scale-[0.98] text-white text-[11px] font-medium rounded-lg transition duration-150">
        Thêm vào BOM
      </button>
    </div>
  );
}
