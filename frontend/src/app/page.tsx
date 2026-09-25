"use client";

import React, { useState } from "react";
import MaterialHeader from "@/components/MaterialHeader";
import MaterialHeroSlider from "@/components/MaterialHeroSlider";
import MaterialCategoryGrid from "@/components/MaterialCategoryGrid";
import MaterialProductShowcase from "@/components/MaterialProductShowcase";
import MaterialWhyUs from "@/components/MaterialWhyUs";
import MaterialServices from "@/components/MaterialServices";
import MaterialBrands from "@/components/MaterialBrands";
import MaterialNews from "@/components/MaterialNews";
import MaterialFooter from "@/components/MaterialFooter";
import RFQModal from "@/components/RFQModal";

export default function HomePage() {
  const [isRFQOpen, setIsRFQOpen] = useState(false);
  const [selectedProductForRFQ, setSelectedProductForRFQ] = useState<string | undefined>(undefined);

  const handleOpenRFQ = (productName?: string) => {
    setSelectedProductForRFQ(productName);
    setIsRFQOpen(true);
  };

  const handleCloseRFQ = () => {
    setIsRFQOpen(false);
    setSelectedProductForRFQ(undefined);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors duration-300 relative font-sans selection:bg-amber-500 selection:text-white">
      {/* 1. Header (Top Bar + Main Bar with Live Search + Category Mega Menu) */}
      <MaterialHeader onOpenRFQ={handleOpenRFQ} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-14 sm:space-y-16">
        {/* 2. Hero Banner Slider & 4-Item Guarantee Strip */}
        <MaterialHeroSlider onOpenRFQ={handleOpenRFQ} />

        {/* 3. Product Category Showcase Grid (7 Danh Mục Vật Liệu Xây Dựng) */}
        <MaterialCategoryGrid onSelectCategory={(catId) => {
          const el = document.getElementById(`showcase-${catId}`);
          el?.scrollIntoView({ behavior: "smooth" });
        }} />

        {/* 4. Categorized Product Showcases (Thép, Gạch, Ngói, Cát Đá, Xi Măng, Chống Thấm) */}
        <MaterialProductShowcase onOpenRFQ={handleOpenRFQ} />

        {/* 5. "Vì sao nên chọn VLXD TDT" (Value Proposition) */}
        <MaterialWhyUs onOpenRFQ={handleOpenRFQ} />

        {/* 6. Technical Engineering Services (Bóc tách dự toán, Cắt uốn thép, Nén mẫu bê tông) */}
        <MaterialServices onOpenRFQ={handleOpenRFQ} />

        {/* 7. Strategic Manufacturing Partners (Hòa Phát, Vicem, Viglacera, Prime, Tiền Phong, Sika) */}
        <MaterialBrands />

        {/* 8. Technical News & Regulatory Guidelines */}
        <MaterialNews />
      </main>

      {/* 10. 4-Column Industrial Footer + Sticky Floating Zalo & Phone Ring */}
      <MaterialFooter />

      {/* 11. Interactive Quote / RFQ Modal */}
      <RFQModal
        isOpen={isRFQOpen}
        onClose={handleCloseRFQ}
        initialProductName={selectedProductForRFQ}
      />
    </div>
  );
}
