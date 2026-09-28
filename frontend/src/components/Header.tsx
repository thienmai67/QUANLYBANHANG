"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Layers,
  Package,
  Menu,
  X,
  Calculator,
  ShoppingBag,
  UserCircle2,
  LogIn,
  UserPlus,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Truck,
  Droplets,
  Zap,
  Gauge,
  Filter,
  Wrench,
  BookOpen,
  Building2,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getCurrentUser, logout, type AuthUser } from "@/lib/auth";

const CATEGORIES_MENU = [
  { href: "#catalog", label: "Lưu Trữ & Xi Téc", icon: Truck, desc: "Bồn ngầm, van thở, phụ kiện rót" },
  { href: "#catalog", label: "Đường Ống Truyền Dẫn", icon: Droplets, desc: "Ống thép ASTM, khớp Camlock" },
  { href: "#catalog", label: "Bơm & Cột Bơm Xăng", icon: Zap, desc: "Cột bơm Tatsuno, bơm Red Jacket" },
  { href: "#catalog", label: "Đo Lường & Tự Động Hóa", icon: Gauge, desc: "Đo bồn tự động ATG, thước thủy" },
  { href: "#catalog", label: "Lọc Tách Nước Xăng Dầu", icon: Filter, desc: "Lọc hạt mịn, cốc lọc trong suốt" },
  { href: "#catalog", label: "Vệ Sinh & Bảo Dưỡng Bồn", icon: Wrench, desc: "Bơm hút cặn, quạt thổi phòng nổ" },
  { href: "#catalog", label: "An Toàn & Thiết Bị PCCC", icon: ShieldCheck, desc: "Bộ ngăn tia lửa, tiếp địa tĩnh điện" },
];

export default function Header({ onOpenRFQ }: { onOpenRFQ?: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  // Handle outside click to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
      if (
        categoriesRef.current &&
        !categoriesRef.current.contains(event.target as Node)
      ) {
        setCategoriesOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Mobile trigger & Brand */}
        <div className="flex items-center gap-4 lg:gap-8">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 -ml-2 rounded-md text-foreground hover:bg-surface transition"
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" className="flex items-center gap-2 group select-none">
            <div className="w-8 h-8 bg-accent-blue rounded flex items-center justify-center text-white font-bold font-display text-lg shadow-sm">
              T
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-display font-bold text-base leading-none text-foreground tracking-tight group-hover:text-accent-blue transition-colors">
                TDT Platform
              </span>
              <span className="text-[10px] text-muted font-sans font-medium uppercase tracking-wider">
                M&amp;E Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Nav with Mega Menu */}
          <nav className="hidden lg:flex items-center gap-6 ml-4">
            {/* Mega Menu Dropdown: DANH MỤC SẢN PHẨM */}
            <div
              className="relative"
              ref={categoriesRef}
              onMouseEnter={() => setCategoriesOpen(true)}
              onMouseLeave={() => setCategoriesOpen(false)}
            >
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center gap-1.5 text-[13px] font-bold text-foreground hover:text-accent-blue transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-accent-blue hover:after:w-full after:transition-all after:duration-300"
              >
                <span>DANH MỤC SẢN PHẨM</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${categoriesOpen ? "rotate-180 text-accent-blue" : "text-muted"}`} />
              </button>

              <AnimatePresence>
                {categoriesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-1 w-[560px] rounded-2xl border border-border bg-background/95 dark:bg-surface/95 backdrop-blur-xl shadow-2xl p-4 z-50 grid grid-cols-2 gap-2"
                  >
                    <div className="col-span-2 px-3 py-1.5 border-b border-border/60 mb-1 flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                        7 Hệ Thống Vật Tư Chuẩn Hóa
                      </span>
                      <a href="#catalog" onClick={() => setCategoriesOpen(false)} className="text-accent-blue text-[11px] font-semibold hover:underline">
                        Tra cứu tất cả →
                      </a>
                    </div>
                    {CATEGORIES_MENU.map((item) => {
                      const Icon = item.icon;
                      return (
                        <a
                          key={item.label}
                          href={item.href}
                          onClick={() => setCategoriesOpen(false)}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-surface border border-transparent hover:border-border/60 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center shrink-0 text-accent-blue group-hover:scale-105 transition-transform">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-foreground group-hover:text-accent-blue transition-colors">
                              {item.label}
                            </div>
                            <div className="text-[11px] text-muted line-clamp-1">
                              {item.desc}
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a
              href="#bom-estimator"
              className="text-[13px] font-medium text-muted hover:text-foreground transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-accent-blue hover:after:w-full after:transition-all after:duration-300"
            >
              CÔNG CỤ BÁO GIÁ
            </a>

            <a
              href="#engineering-calc"
              className="text-[13px] font-medium text-muted hover:text-foreground transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-accent-blue hover:after:w-full after:transition-all after:duration-300"
            >
              TÍNH TOÁN KỸ THUẬT
            </a>

            <a
              href="#project-showcase"
              className="text-[13px] font-medium text-muted hover:text-foreground transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-accent-blue hover:after:w-full after:transition-all after:duration-300"
            >
              DỰ ÁN &amp; CAM KẾT
            </a>

            <a
              href="#news-events"
              className="text-[13px] font-medium text-muted hover:text-foreground transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-accent-blue hover:after:w-full after:transition-all after:duration-300"
            >
              TIN TỨC &amp; SỰ KIỆN
            </a>
          </nav>
        </div>

        {/* Right: Auth, Theme + RFQ */}
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />

          {/* Profile Dropdown Container */}
          <div className="relative border-l border-border pl-2 sm:pl-3" ref={dropdownRef}>
            {user ? (
              <button
                id="profile-dropdown-trigger"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface border border-transparent hover:border-border transition-all"
                aria-label="Tài khoản cá nhân"
                title="Tài khoản cá nhân"
              >
                <div className="w-7 h-7 rounded-full bg-accent-blue/15 border border-accent-blue/30 flex items-center justify-center text-accent-blue font-semibold text-xs">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-xs font-semibold text-foreground tracking-wide truncate max-w-[100px]">
                    {user.email.split("@")[0]}
                  </span>
                  <span className="text-[9px] text-accent-blue uppercase tracking-widest font-mono font-medium">
                    {user.role}
                  </span>
                </div>
              </button>
            ) : (
              <button
                id="profile-dropdown-trigger"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="p-1.5 sm:p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface border border-transparent hover:border-border transition-all flex items-center gap-1.5"
                aria-label="Tài khoản"
                title="Tài khoản"
              >
                <UserCircle2 className="w-5 h-5 text-muted hover:text-foreground transition-colors" />
              </button>
            )}

            {/* Dropdown Menu Popup */}
            <AnimatePresence>
              {profileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-background/95 dark:bg-surface/95 backdrop-blur-xl shadow-xl p-1.5 z-50"
                >
                  {user ? (
                    <>
                      <div className="px-3 py-2 border-b border-border/60 mb-1">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {user.email}
                        </div>
                        <div className="text-[10px] text-accent-blue font-mono font-medium uppercase mt-0.5">
                          {user.role}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          alert("Chức năng quản lý hồ sơ và bảo mật đang được phát triển.");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-surface transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-muted" />
                        <span>Hồ sơ &amp; bảo mật</span>
                      </button>

                      <div className="border-t border-border/60 my-1" />

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                          setUser(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider border-b border-border/60 mb-1">
                        Tài khoản
                      </div>

                      <Link
                        href="/login"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-accent-blue hover:bg-accent-blue/90 transition-colors mb-1 shadow-sm"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Đăng nhập</span>
                      </Link>

                      <Link
                        href="/register"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-surface transition-colors"
                      >
                        <UserPlus className="w-4 h-4 text-muted" />
                        <span>Tạo tài khoản mới</span>
                      </Link>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dashboard / Project Score button + RFQ Quick Action */}
          <div className="flex items-center gap-2 border-l border-border pl-2 sm:pl-3">
            <button
              onClick={onOpenRFQ}
              className="p-2 rounded-md hover:bg-surface text-foreground transition-colors relative"
              title="Yêu cầu báo giá nhanh"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-blue border-[1.5px] border-background" />
            </button>

            <button
              onClick={onOpenRFQ}
              className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-foreground hover:bg-foreground/90 text-background text-xs font-semibold transition-all shadow-sm"
            >
              <span>BẢNG ĐIỂM TÍN DỰ ÁN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background p-4 space-y-4 animate-fade-in shadow-xl max-h-[85vh] overflow-y-auto">
          {/* Mobile Links */}
          <nav className="flex flex-col gap-1">
            <a
              href="#catalog"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-bold text-foreground hover:bg-surface transition-colors"
            >
              <Package className="h-4 w-4 text-accent-blue" />
              <span>DANH MỤC VẬT TƯ (7 NHÓM)</span>
            </a>
            <a
              href="#bom-estimator"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-accent-blue" />
              <span>CÔNG CỤ BÁO GIÁ BOM</span>
            </a>
            <a
              href="#engineering-calc"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <Calculator className="h-4 w-4 text-accent-blue" />
              <span>TÍNH TOÁN KỸ THUẬT</span>
            </a>
            <a
              href="#project-showcase"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <Building2 className="h-4 w-4 text-accent-blue" />
              <span>DỰ ÁN &amp; CAM KẾT</span>
            </a>
            <a
              href="#news-events"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <BookOpen className="h-4 w-4 text-accent-blue" />
              <span>TIN TỨC &amp; SỰ KIỆN</span>
            </a>
          </nav>

          {/* Mobile Auth Actions */}
          <div className="pt-3 border-t border-border">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface text-xs">
                  <span className="font-semibold text-foreground truncate">
                    {user.email}
                  </span>
                  <span className="text-[10px] text-accent-blue font-mono uppercase">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                    setUser(null);
                  }}
                  className="w-full py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-500/10 flex items-center justify-center gap-2 transition-colors border border-red-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-2.5 rounded-lg bg-accent-blue hover:bg-accent-blue/90 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-2.5 rounded-lg border border-border bg-surface hover:bg-border/50 text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Đăng ký</span>
                </Link>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenRFQ?.();
              }}
              className="w-full py-2.5 rounded-md bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-2"
            >
              YÊU CẦU BÁO GIÁ
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
