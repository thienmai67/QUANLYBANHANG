"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Search,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Flame,
  ShieldCheck,
  Fuel,
  Wrench,
  Gauge,
  Filter,
  Sparkles,
  Layers,
  ArrowRight,
  Building2,
  HardHat,
  PhoneCall,
  User,
  LogIn,
  UserPlus,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { MATERIAL_CATEGORIES, MATERIAL_PRODUCTS, MaterialProduct } from "@/data/materialData";

interface MaterialHeaderProps {
  onOpenRFQ: (productName?: string) => void;
  cartCount?: number;
}

export default function MaterialHeader({ onOpenRFQ, cartCount = 0 }: MaterialHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MaterialProduct[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string>(MATERIAL_CATEGORIES[0].id);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMobileCategory, setActiveMobileCategory] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Live search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = MATERIAL_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
    ).slice(0, 6);
    setSearchResults(filtered);
  }, [searchQuery]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case "storage":
        return <Layers className="w-4 h-4 text-amber-500" />;
      case "piping":
        return <Building2 className="w-4 h-4 text-blue-500" />;
      case "pump":
        return <HardHat className="w-4 h-4 text-orange-500" />;
      case "gauge":
        return <Gauge className="w-4 h-4 text-purple-500" />;
      case "filter":
        return <Sparkles className="w-4 h-4 text-cyan-500" />;
      case "cleaning":
        return <ShieldCheck className="w-4 h-4 text-teal-500" />;
      case "safety":
        return <Wrench className="w-4 h-4 text-rose-500" />;
      default:
        return <Building2 className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <header className="w-full bg-white dark:bg-[#070b14] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm transition-colors duration-200">
      {/* 1. TOP BAR */}
      <div className="bg-[#0f172a] text-slate-300 text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
          {/* Top Bar Left: Hotline, Email, Address */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[11px] sm:text-xs">
            <a
              href="tel:0961089292"
              className="flex items-center gap-1.5 text-amber-400 font-bold hover:text-amber-300 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Hotline 24/7: 096 108 9292</span>
            </a>
            <a
              href="mailto:vlxdtdt.vn@gmail.com"
              className="hidden md:flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>vlxdtdt.vn@gmail.com</span>
            </a>
            <span className="hidden xl:flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Tòa nhà Icon4, 243A Đê La Thành, Đống Đa, Hà Nội</span>
            </span>
          </div>

          {/* Top Bar Right: Theme Toggle & Quick Info */}
          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <span className="hidden sm:inline-block text-emerald-400 font-mono font-medium">
              ● 100% Chuẩn TCVN, CO/CQ Nhà Máy • Giao Tận Chân Công Trình
            </span>
            <div className="h-3 w-px bg-slate-700 hidden sm:block" />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER (Logo, Search, Actions) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4 lg:gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                  VLXD TDT
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400 font-sans mt-0.5">
                Tổng Kho Vật Liệu Xây Dựng & Thiết Bị Công Trình
              </p>
            </div>
          </Link>

          {/* Central Live Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-xl hidden md:block">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Tìm kiếm: thép Hòa Phát, xi măng Vicem, gạch tuynel, cát vàng, gạch ốp lát..."
                className="w-full pl-10 pr-24 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <button
                type="button"
                className="absolute right-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-full text-xs font-bold transition-all shadow-sm"
              >
                Tìm kiếm
              </button>
            </div>

            {/* Live Search Autocomplete Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>Vật liệu gợi ý ({searchResults.length})</span>
                  <span>Nhấn để xem báo giá</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-96 overflow-y-auto">
                  {searchResults.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        onOpenRFQ(prod.name);
                        setIsSearchFocused(false);
                      }}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              {prod.sku}
                            </span>
                            <span className="text-xs text-slate-500 font-semibold">{prod.brand}</span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 line-clamp-1 mt-0.5">
                            {prod.name}
                          </h4>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 block font-mono">
                          {prod.price}
                        </span>
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 underline font-medium">
                          Báo giá nhanh
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Icon */}
            <button
              onClick={() => onOpenRFQ("Kiểm tra danh mục giỏ hàng vật tư")}
              aria-label="Giỏ hàng"
              className="relative p-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center font-mono animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Hotline outline pill - desktop */}
            <a
              href="tel:0961089292"
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-full border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all shrink-0"
            >
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              <span>096 108 9292</span>
            </a>

            {/* Primary RFQ Button */}
            <button
              onClick={() => onOpenRFQ()}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-orange-600/20 hover:shadow-orange-600/40 transition-all shrink-0"
            >
              Yêu cầu báo giá
            </button>

            {/* Profile Dropdown Menu */}
            <div ref={profileMenuRef} className="relative shrink-0">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                aria-label="Tài khoản cá nhân"
                className={`p-2 sm:p-2.5 rounded-full border transition-all ${
                  isProfileMenuOpen
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400"
                }`}
              >
                <User className="w-5 h-5" />
              </button>

              {/* Dropmenu with Login and Register options */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Tài khoản</p>
                  </div>
                  <Link
                    href="/login"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    <LogIn className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Đăng nhập</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>Đăng ký</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 md:hidden"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search input bar */}
        <div className="mt-3 md:hidden">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm thép, xi măng, gạch, cát đá..."
              className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          </div>
        </div>
      </div>

      {/* 3. WIDE NAV BAR (RE-DESIGNED FOR CRISP STRUCTURE, NO WRAPPING, BEAUTIFUL ALIGNMENT) */}
      <div className="bg-[#f8fafc] dark:bg-[#0c1322] border-t border-b border-slate-200 dark:border-slate-800/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Left: DANH MỤC SẢN PHẨM Dropdown Opener (Clear Fixed Box) */}
            <div ref={categoryMenuRef} className="relative shrink-0">
              <button
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className="w-52 lg:w-56 h-12 flex items-center justify-between px-3.5 lg:px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs lg:text-[13px] uppercase tracking-wider transition-all select-none shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Menu className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">DANH MỤC SẢN PHẨM</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isCategoryMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Flyout Mega Menu */}
              {isCategoryMenuOpen && (
                <div className="absolute top-full left-0 w-64 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 rounded-b-xl overflow-visible">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {MATERIAL_CATEGORIES.map((cat) => (
                      <div
                        key={cat.id}
                        onMouseEnter={() => setHoveredCategory(cat.id)}
                        className={`relative group px-4 py-3 cursor-pointer flex items-center justify-between text-xs font-semibold transition-colors ${
                          hoveredCategory === cat.id
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-l-4 border-amber-600 pl-3"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {getCategoryIcon(cat.iconSlug)}
                          <span className="line-clamp-1">{cat.name}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                        {/* Mega Subcategory Flyout Panel */}
                        {hoveredCategory === cat.id && (
                          <div className="hidden lg:block absolute left-full top-0 w-80 min-h-full bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 rounded-r-xl z-50">
                            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                              {getCategoryIcon(cat.iconSlug)}
                              <h5 className="font-bold text-xs uppercase text-slate-900 dark:text-white">
                                {cat.name}
                              </h5>
                            </div>
                            <ul className="space-y-2">
                              {cat.subcategories.map((sub, sIdx) => (
                                <li key={sIdx}>
                                  <a
                                    href={`#${cat.id}`}
                                    onClick={() => setIsCategoryMenuOpen(false)}
                                    className="text-xs text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                                  >
                                    <span>{sub}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-400 opacity-60" />
                                  </a>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                              <a
                                href={`#${cat.id}`}
                                onClick={() => setIsCategoryMenuOpen(false)}
                                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                              >
                                Xem tất cả {cat.count}+ vật liệu &rarr;
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* View all link */}
                    <div
                      onClick={() => {
                        setIsCategoryMenuOpen(false);
                        const el = document.getElementById("category-grid");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-4 py-3 bg-amber-600/10 hover:bg-amber-600/20 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center justify-between cursor-pointer"
                    >
                      <span>Xem toàn bộ danh mục VLXD</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Center: Main Navigation Links - Perfectly spaced, structured single-line arrangement */}
            <nav className="hidden md:flex items-center gap-2 lg:gap-3 xl:gap-6 text-xs lg:text-[13px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 whitespace-nowrap pl-4 lg:pl-6">
              <Link
                href="/"
                className="h-12 flex items-center px-1 text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 transition-colors shrink-0"
              >
                Trang chủ
              </Link>
              <a
                href="#partners"
                className="h-12 flex items-center px-1 hover:text-amber-600 dark:hover:text-amber-400 hover:border-b-2 hover:border-amber-400 transition-all shrink-0"
              >
                Hãng sản xuất
              </a>
              <a
                href="#why-us"
                className="h-12 flex items-center px-1 hover:text-amber-600 dark:hover:text-amber-400 hover:border-b-2 hover:border-amber-400 transition-all shrink-0"
              >
                Giới thiệu
              </a>
              <a
                href="#services"
                className="h-12 flex items-center px-1 hover:text-amber-600 dark:hover:text-amber-400 hover:border-b-2 hover:border-amber-400 transition-all shrink-0"
              >
                Dịch vụ kỹ thuật
              </a>
              <a
                href="#news"
                className="h-12 flex items-center px-1 hover:text-amber-600 dark:hover:text-amber-400 hover:border-b-2 hover:border-amber-400 transition-all shrink-0"
              >
                Tin tức sự kiện
              </a>
              <a
                href="#footer"
                className="h-12 flex items-center px-1 hover:text-amber-600 dark:hover:text-amber-400 hover:border-b-2 hover:border-amber-400 transition-all shrink-0"
              >
                Liên hệ & Báo giá
              </a>
            </nav>

            {/* Right: Technical Consultation Hotline Pill */}
            <div className="hidden xl:flex items-center gap-2 text-xs shrink-0 whitespace-nowrap pl-4 border-l border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Tư vấn kỹ thuật:</span>
              <a
                href="tel:0961089292"
                className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-black font-mono hover:underline"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>096 108 9292</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MOBILE DRAWER NAVIGATION */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-[#090d16] border-b border-slate-200 dark:border-slate-800 shadow-xl max-h-[85vh] overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold uppercase tracking-wider">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-center"
              >
                Trang chủ
              </Link>
              <a
                href="#partners"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-center"
              >
                Hãng sản xuất
              </a>
              <a
                href="#services"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-center"
              >
                Dịch vụ kỹ thuật
              </a>
              <a
                href="#footer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-center"
              >
                Báo giá nhanh
              </a>
            </div>

            {/* Mobile Auth Buttons */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex-1 py-2.5 text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-amber-600 flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-600" />
                <span>Đăng nhập</span>
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex-1 py-2.5 text-center rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:from-amber-500 hover:to-orange-500 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Đăng ký</span>
              </Link>
            </div>

            {/* Mobile Category Accordion */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
              <h5 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
                DANH MỤC VẬT LIỆU XÂY DỰNG
              </h5>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {MATERIAL_CATEGORIES.map((cat) => (
                  <div key={cat.id} className="py-2">
                    <button
                      onClick={() =>
                        setActiveMobileCategory(activeMobileCategory === cat.id ? null : cat.id)
                      }
                      className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(cat.iconSlug)}
                        <span>{cat.name}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          activeMobileCategory === cat.id ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {activeMobileCategory === cat.id && (
                      <ul className="mt-2 pl-6 space-y-1.5 border-l-2 border-amber-500 ml-2">
                        {cat.subcategories.map((sub, sIdx) => (
                          <li key={sIdx}>
                            <a
                              href={`#${cat.id}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-amber-600 block py-1"
                            >
                              {sub}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Contact CTAs in Mobile Drawer */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <a
                href="tel:0961089292"
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 font-bold text-xs flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                Hotline: 096 108 9292
              </a>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenRFQ();
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs"
              >
                Gửi yêu cầu báo giá ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
