"use client";

import React from "react";
import dynamic from "next/dynamic";
import MaterialHeader from "@/components/MaterialHeader";

const TDTInteractiveBanner = dynamic(
  () => import("@/components/TDTInteractiveBanner"),
  { ssr: false }
);
import MaterialCategoryGrid from "@/components/MaterialCategoryGrid";
import MaterialProductShowcase from "@/components/MaterialProductShowcase";
import MaterialWhyUs from "@/components/MaterialWhyUs";
import MaterialServices from "@/components/MaterialServices";
import MaterialBrands from "@/components/MaterialBrands";
import MaterialNews from "@/components/MaterialNews";
import MaterialFooter from "@/components/MaterialFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors duration-300 relative font-sans selection:bg-blue-500 selection:text-white">
      {/* 1. Header (Top Bar + Main Bar with Live Search + Category Mega Menu) */}
      <MaterialHeader />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-14 sm:space-y-16">
        {/* 2. Hero Banner 3D Interactive */}
        <TDTInteractiveBanner />

        {/* 3. Product Category Showcase Grid */}
        <MaterialCategoryGrid onSelectCategory={(catId) => {
          window.location.href = `/shop?cat=${encodeURIComponent(catId)}`;
        }} />

        {/* 4. Categorized Product Showcases */}
        <MaterialProductShowcase />

        {/* 5. "Vì sao nên chọn TDT M&E" (Value Proposition) */}
        <MaterialWhyUs />

        {/* 6. Technical Engineering Services */}
        <MaterialServices />

        {/* 7. Strategic Manufacturing Partners */}
        <MaterialBrands />

        {/* 8. Technical News & Regulatory Guidelines */}
        <MaterialNews />
      </main>

      {/* 9. 4-Column Industrial Footer */}
      <MaterialFooter />
    </div>
  );
}
