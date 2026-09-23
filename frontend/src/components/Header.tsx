"use client";

import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Layers, Package, Menu, X, Calculator, ShoppingBag, ArrowRight, LogOut } from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getCurrentUser, logout, type AuthUser } from "@/lib/auth";

export default function Header({ onOpenRFQ }: { onOpenRFQ?: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const navLinks = [
    { href: "#bom-estimator", label: "BÓC TÁCH BOM", icon: FileSpreadsheet },
    { href: "#orders-pipeline", label: "HỒ SƠ TIẾN ĐỘ", icon: Layers },
    { href: "#engineering-calc", label: "TÍNH TOÁN KỸ THUẬT", icon: Calculator },
    { href: "#catalog", label: "BỘ SƯU TẬP VẬT TƯ", icon: Package },
  ];

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
          
          <a href="#" className="flex items-center gap-2 group select-none">
            <div className="w-8 h-8 bg-accent-blue rounded flex items-center justify-center text-white font-bold font-display text-lg">
              T
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-display font-bold text-base leading-none text-foreground tracking-tight group-hover:text-accent-blue transition-colors">
                TDT Platform
              </span>
              <span className="text-[10px] text-muted font-sans font-medium uppercase tracking-wider">
                M&E Intelligence
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 ml-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13px] font-medium text-muted hover:text-foreground transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-accent-blue hover:after:w-full after:transition-all after:duration-300"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Right: Auth, Theme + RFQ */}
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          
          {user ? (
            <div className="flex items-center gap-3 border-l border-border pl-3 sm:pl-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-foreground tracking-wide truncate max-w-[120px]">
                  {user.email.split("@")[0]}
                </span>
                <span className="text-[10px] text-accent-blue uppercase tracking-widest font-mono">{user.role}</span>
              </div>
              <button
                onClick={() => { logout(); setUser(null); }}
                title="Đăng xuất"
                className="p-1.5 rounded-md text-muted hover:text-red-500 hover:bg-surface transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-l border-border pl-3 sm:pl-4 hidden sm:block">
              <GoogleSignInButton className="border-border bg-surface hover:bg-border/50 text-foreground" />
            </div>
          )}

          <div className="flex items-center gap-2 border-l border-border pl-2 sm:pl-4">
            <button
              onClick={onOpenRFQ}
              className="p-2 rounded-md hover:bg-surface text-foreground transition-colors relative"
              title="Đơn hàng & Dự án"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-blue border-[1.5px] border-background" />
            </button>
            
            <button
              onClick={onOpenRFQ}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-md bg-foreground hover:bg-foreground/90 text-background text-xs font-semibold transition-all shadow-sm"
            >
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background p-4 space-y-4 animate-fade-in shadow-xl">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-muted hover:text-foreground hover:bg-surface transition-colors"
              >
                <link.icon className="h-4 w-4 text-accent-blue" />
                <span>{link.label}</span>
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-border">
            <button
              onClick={() => { setMobileOpen(false); onOpenRFQ?.(); }}
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
