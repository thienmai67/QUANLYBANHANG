'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Menu,
  Plus,
  X,
  FileText,
  ShoppingBag,
  UserPlus,
} from 'lucide-react';
import { useSaleShellStore } from '@/store/useSaleShellStore';
import { useSaleStore } from '@/store/useSaleStore';

export function SaleBottomNav() {
  const pathname = usePathname();
  const { toggleMobileDrawer, mobileDrawerOpen } = useSaleShellStore();
  const { orders } = useSaleStore();

  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const speedDialRef = useRef<HTMLDivElement>(null);

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  // Close speed dial on route change
  useEffect(() => {
    setIsSpeedDialOpen(false);
  }, [pathname]);

  // Close speed dial when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (speedDialRef.current && !speedDialRef.current.contains(e.target as Node)) {
        setIsSpeedDialOpen(false);
      }
    };
    if (isSpeedDialOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isSpeedDialOpen]);

  const isDashboardActive = pathname === '/sale' || pathname === '/sale/dashboard';
  const isOrdersActive = pathname.startsWith('/sale/orders') && pathname !== '/sale/orders/new';
  const isCustomersActive = pathname.startsWith('/sale/customers');

  return (
    <>
      {/* Backdrop overlay when speed dial is open */}
      {isSpeedDialOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setIsSpeedDialOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Speed Dial Popover Menu */}
      {isSpeedDialOpen && (
        <div
          ref={speedDialRef}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-3 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 lg:hidden space-y-1.5"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tác vụ nhanh
            </span>
          </div>

          <Link
            href="/sale/orders/new"
            onClick={() => setIsSpeedDialOpen(false)}
            className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-800 dark:text-slate-200 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Tạo đơn hàng mới
              </div>
              <div className="text-[10px] text-slate-500">
                Lên đơn xuất kho hộ khách hàng
              </div>
            </div>
          </Link>

          <Link
            href="/sale/quotes/new"
            onClick={() => setIsSpeedDialOpen(false)}
            className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-800 dark:text-slate-200 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Lập báo giá dự án
              </div>
              <div className="text-[10px] text-slate-500">
                Chiết khấu thương hiệu vật tư M&E
              </div>
            </div>
          </Link>

          <Link
            href="/sale/customers"
            onClick={() => setIsSpeedDialOpen(false)}
            className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-800 dark:text-slate-200 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Thêm khách hàng
              </div>
              <div className="text-[10px] text-slate-500">
                Mở hồ sơ đại lý, thầu thợ mới
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Main Bottom Bar */}
      <nav
        aria-label="Điều hướng nhanh điện thoại"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden"
      >
        <div className="grid grid-cols-5 h-16 items-center px-2">
          {/* 1. Tổng quan (Dashboard) */}
          <Link
            href="/sale/dashboard"
            className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
              isDashboardActive
                ? 'text-purple-600 dark:text-purple-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Tổng quan</span>
            {isDashboardActive && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400" />
            )}
          </Link>

          {/* 2. Đơn hàng (Orders) */}
          <Link
            href="/sale/orders"
            className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
              isOrdersActive
                ? 'text-purple-600 dark:text-purple-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 mb-0.5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white shadow-xs">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-tight">Đơn hàng</span>
            {isOrdersActive && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400" />
            )}
          </Link>

          {/* 3. Center Speed Dial (+) Action Button */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsSpeedDialOpen((prev) => !prev)}
              aria-label="Tác vụ nhanh"
              aria-expanded={isSpeedDialOpen}
              className={`w-12 h-12 -mt-5 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 active:scale-95 ${
                isSpeedDialOpen
                  ? 'bg-slate-800 text-white rotate-45 shadow-slate-900/30'
                  : 'bg-gradient-to-tr from-purple-700 to-indigo-600 text-white shadow-purple-600/40 ring-4 ring-white dark:ring-slate-900'
              }`}
            >
              {isSpeedDialOpen ? (
                <Plus className="w-6 h-6 transition-transform" />
              ) : (
                <Plus className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* 4. Khách hàng (Customers) */}
          <Link
            href="/sale/customers"
            className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
              isCustomersActive
                ? 'text-purple-600 dark:text-purple-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Khách hàng</span>
            {isCustomersActive && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400" />
            )}
          </Link>

          {/* 5. Menu / Thêm (Open Drawer) */}
          <button
            type="button"
            onClick={toggleMobileDrawer}
            className={`flex flex-col items-center justify-center py-1 transition-colors relative active:scale-95 touch-manipulation ${
              mobileDrawerOpen
                ? 'text-purple-600 dark:text-purple-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            aria-label="Mở tất cả menu"
            aria-expanded={mobileDrawerOpen}
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Menu</span>
            {mobileDrawerOpen && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}

