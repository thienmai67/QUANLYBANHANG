"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  Package,
  Wrench,
  ShieldCheck,
  Newspaper,
  User,
  Truck,
  Building2,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { MATERIAL_PRODUCTS, MaterialProduct } from "@/data/materialData";

interface MaterialHeaderProps {
  onOpenRFQ?: (productName?: string) => void;
  cartCount?: number;
}

export default function MaterialHeader({ onOpenRFQ, cartCount = 0 }: MaterialHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MaterialProduct[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Live search filtering — debounced to prevent filtering on every keystroke
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const handler = setTimeout(() => {
      const filtered = MATERIAL_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      ).slice(0, 5);
      setSearchResults(filtered);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-[#0c1322]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Tier 1: Search, Logo, Cart, Role */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform duration-300">
            <Building2 className="w-5 h-5 fill-white/20" />
          </div>
          <div className="hidden sm:block">
            <span className="font-display font-black text-xl tracking-tight text-slate-900 dark:text-white uppercase">
              TDT M&E
            </span>
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest mt-0.5">
              Platform
            </p>
          </div>
        </Link>

        {/* Live Search */}
        <div ref={searchRef} className="relative flex-1 max-w-2xl mx-auto hidden md:block">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Tìm kiếm: ống uPVC, cadivi, aptomat, van đồng, đèn LED..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900/50 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-[#070b14] text-sm text-slate-900 dark:text-slate-100 transition-all font-medium placeholder:text-slate-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {searchResults.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      if (onOpenRFQ) onOpenRFQ(prod.name);
                      setIsSearchFocused(false);
                    }}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex items-center gap-4 transition-colors"
                  >
                    <img src={prod.image} alt={prod.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{prod.name}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{prod.sku} • {prod.brand}</p>
                    </div>
                    <span className="text-sm font-bold text-orange-500">{prod.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
          
          {/* RBAC Pill */}
          <Link href="/account" className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <User className="w-4 h-4 text-slate-500" />
            <span>Tài Khoản Nhà Thầu</span>
          </Link>

          {/* Cart BOM */}
          <button className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] hover:border-blue-500 transition-colors group">
            <ShoppingCart className="w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors" />
            {cartCount >= 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-[#0c1322]">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 md:hidden"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Tier 2: Commerce Nav Strip */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center justify-between py-2.5">
          <nav className="flex items-center gap-6">
            <Link href="/shop" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Package className="w-4 h-4" /> Danh Mục Vật Tư
            </Link>
            <Link href="/cong-trinh" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Building2 className="w-4 h-4" /> Gói Công Trình
            </Link>
            <Link href="/cong-cu" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Wrench className="w-4 h-4" /> Công Cụ M&amp;E
            </Link>
            <Link href="/thuong-hieu" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <ShieldCheck className="w-4 h-4" /> Thương Hiệu
            </Link>
            <Link href="/tin-tuc" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Newspaper className="w-4 h-4" /> Tiêu Chuẩn &amp; Tin Tức
            </Link>
          </nav>

          {/* Right Trust Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 text-[11px] font-bold">
            <Truck className="w-3.5 h-3.5" />
            Giao 2H Chân Công Trình • Miễn Phí Vận Chuyển Đơn &gt; 10Tr
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-[#0c1322] border-b border-slate-200 dark:border-slate-800 shadow-xl p-4 space-y-4">
          <input
            type="text"
            placeholder="Tìm kiếm vật tư..."
            className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border-none text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <div className="grid grid-cols-2 gap-3 text-sm font-semibold">
            <Link href="/shop" className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center gap-2"><Package className="w-4 h-4"/> Danh Mục</Link>
            <Link href="/cong-trinh" className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center gap-2"><Building2 className="w-4 h-4"/> Gói Công Trình</Link>
          </div>
        </div>
      )}
    </header>
  );
}
