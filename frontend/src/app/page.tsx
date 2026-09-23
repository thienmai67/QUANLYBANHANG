"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import RoleSwitcher from "@/components/RoleSwitcher";
import LiveMarketTicker from "@/components/LiveMarketTicker";
import HeroBento from "@/components/HeroBento";
import BomEstimator from "@/components/BomEstimator";
import EngineeringCalculator from "@/components/EngineeringCalculator";
import OrderPipeline from "@/components/OrderPipeline";
import BrandShowcase from "@/components/BrandShowcase";
import ProductCatalog from "@/components/ProductCatalog";
import ProjectShowcase from "@/components/ProjectShowcase";
import RFQModal from "@/components/RFQModal";
import FloatingQuickActions from "@/components/FloatingQuickActions";
import { fetchProducts } from "@/lib/api";
import { Product } from "@/types/api";
import { UserSession } from "@/types/auth";
import { ROLES_PRESETS } from "@/components/RoleSwitcher";
import EditorialShowcase from "@/components/EditorialShowcase";
import { ShieldCheck, Phone, Mail, MapPin, Building, Truck, Clock, Award, CheckCircle2, ArrowRight } from "lucide-react";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRFQOpen, setIsRFQOpen] = useState(false);
  const [session, setSession] = useState<UserSession>(ROLES_PRESETS.CUSTOMER);
  const [emailSubscribed, setEmailSubscribed] = useState(false);

  useEffect(() => {
    fetchProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5EE] text-[#1A1B1E] selection:bg-[#E8DFD1] selection:text-[#1A1B1E] relative font-sans">
      {/* Role Switcher */}
      <RoleSwitcher currentSession={session} onRoleChange={setSession} />

      {/* Header */}
      <Header onOpenRFQ={() => setIsRFQOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-24">
        {/* 1. Live Market Ticker & Key Stats */}
        <LiveMarketTicker />

        {/* 2. Hero Cinematic Section (Opulence Style - Screenshot 1) */}
        <HeroBento onOpenRFQ={() => setIsRFQOpen(true)} />

        {/* 3. Editorial Showcase: Coastal Serenity & Follow The Journey Split (Screenshots 2 & 3) */}
        <EditorialShowcase />

        {/* 4. Engineering Calculator (Công Cụ Tính Cáp & Cỡ Ống) */}
        <div id="engineering-calc">
          <EngineeringCalculator />
        </div>

        {/* 5. Order Pipeline (RBAC) */}
        <div id="orders-pipeline">
          <OrderPipeline currentSession={session} />
        </div>

        {/* 6. BOM Estimator */}
        <div id="bom-estimator">
          <BomEstimator products={products} />
        </div>

        {/* 7. Brand Partners Ecosystem */}
        <BrandShowcase />

        {/* 8. Product Catalog & Live Stock */}
        <div id="catalog">
          <ProductCatalog products={products} loading={loading} />
        </div>

        {/* 9. Project Delivery Showcase & SLA Guarantees */}
        <ProjectShowcase />
      </main>

      {/* Luxury Editorial Footer - Direct Implementation of Screenshot 4 */}
      <footer className="border-t border-white/[0.08] bg-[#16171B] pt-20 pb-12 mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">
            {/* Col Left: Newsletter (Directly from Screenshot 4) */}
            <div className="md:col-span-5 space-y-6">
              <h4 className="font-serif text-2xl sm:text-3xl text-[#EDE8D5] font-normal tracking-wide">
                Join our community
              </h4>
              <p className="text-xs sm:text-sm text-[#8E887E] font-light max-w-sm leading-relaxed">
                Đăng ký nhận báo giá dự án độc quyền, catalogue vật tư kiến trúc mới nhất và bảng giá cập nhật hàng tuần.
              </p>

              {/* Minimal Line Input with Arrow (Screenshot 4) */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setEmailSubscribed(true);
                }}
                className="relative max-w-sm pt-2"
              >
                <div className="flex items-center border-b border-[#C5A880]/40 focus-within:border-[#C5A880] pb-2 transition-colors">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    className="w-full bg-transparent text-sm text-[#F5EFEB] placeholder-[#736E66] focus:outline-none pr-8 font-light"
                  />
                  <button
                    type="submit"
                    aria-label="Đăng ký nhận tin"
                    className="text-[#C5A880] hover:text-white transition-colors"
                  >
                    <ArrowRight className="w-5 h-5 stroke-[1.5]" />
                  </button>
                </div>
                {emailSubscribed && (
                  <p className="text-xs text-[#C5A880] mt-2 font-mono">
                    ✓ Cảm ơn bạn đã tham gia mạng lưới kiến trúc TDT Opulence.
                  </p>
                )}
              </form>
            </div>

            {/* Col Right: 3 Minimalist Columns (SHOP, COMPANY, HELP from Screenshot 4) */}
            <div className="md:col-span-7 grid grid-cols-3 gap-8 text-xs font-sans tracking-[0.18em] uppercase">
              {/* SHOP / DANH MỤC */}
              <div className="space-y-4">
                <span className="text-[#8E887E] text-[11px] font-semibold block">
                  SHOP
                </span>
                <ul className="space-y-3 font-medium text-[#C4BEB4]">
                  <li>
                    <a href="#catalog" className="hover:text-[#F5EFEB] transition-colors">
                      ALL PRODUCTS
                    </a>
                  </li>
                  <li>
                    <a href="#catalog" className="hover:text-[#F5EFEB] transition-colors">
                      NEW ARRIVALS
                    </a>
                  </li>
                  <li>
                    <a href="#catalog" className="hover:text-[#F5EFEB] transition-colors">
                      COLLECTIONS
                    </a>
                  </li>
                  <li>
                    <a href="#bom-estimator" className="hover:text-[#F5EFEB] transition-colors">
                      BOM ESTIMATE
                    </a>
                  </li>
                </ul>
              </div>

              {/* COMPANY / DOANH NGHIỆP */}
              <div className="space-y-4">
                <span className="text-[#8E887E] text-[11px] font-semibold block">
                  COMPANY
                </span>
                <ul className="space-y-3 font-medium text-[#C4BEB4]">
                  <li>
                    <a href="#" className="hover:text-[#F5EFEB] transition-colors">
                      OUR STORY
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#F5EFEB] transition-colors">
                      CRAFTSMANSHIP
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#F5EFEB] transition-colors">
                      STANDARDS
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#F5EFEB] transition-colors">
                      CONTACT
                    </a>
                  </li>
                </ul>
              </div>

              {/* HELP / HỖ TRỢ */}
              <div className="space-y-4">
                <span className="text-[#8E887E] text-[11px] font-semibold block">
                  HELP
                </span>
                <ul className="space-y-3 font-medium text-[#C4BEB4]">
                  <li>
                    <a href="#" className="hover:text-[#F5EFEB] transition-colors">
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#F5EFEB] transition-colors">
                      SHIPPING
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#F5EFEB] transition-colors">
                      RETURNS
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#F5EFEB] transition-colors">
                      WARRANTY
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Copyright line matching Screenshot 4 */}
          <div className="pt-10 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-light text-[#8E887E]">
            <p>
              2025 Opulence. All rights reserved. • TDT Architectural Materials &amp; M&amp;E Group
            </p>
            <div className="flex items-center gap-6 text-[11px] tracking-wider uppercase">
              <a href="#" className="hover:text-[#C5A880] transition-colors">Privacy</a>
              <span>•</span>
              <a href="#" className="hover:text-[#C5A880] transition-colors">Terms of Supply</a>
              <span>•</span>
              <a href="#" className="hover:text-[#C5A880] transition-colors">CO/CQ Portal</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Quick Actions Dock */}
      <FloatingQuickActions onOpenRFQ={() => setIsRFQOpen(true)} />

      {/* RFQ Modal */}
      <RFQModal isOpen={isRFQOpen} onClose={() => setIsRFQOpen(false)} />
    </div>
  );
}
