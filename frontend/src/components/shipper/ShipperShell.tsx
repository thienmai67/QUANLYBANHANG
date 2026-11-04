'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useShipperUIStore } from '@/store/useShipperUIStore';
import { useManagerStore } from '@/store/useManagerStore';
import {
  Package,
  Wallet,
  Sun,
  Moon,
  LogOut,
  User,
  Truck,
} from 'lucide-react';
import '@/styles/shipper-tokens.css';

interface ShipperShellProps {
  children: React.ReactNode;
}

export default function ShipperShell({ children }: ShipperShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isHighContrast, toggleHighContrast } = useShipperUIStore();
  const { shippers, orders } = useManagerStore();

  const currentShipperId = user?.shipperId || user?.id || '';
  const shipperInfo =
    shippers.find((s) => s.id === currentShipperId) || {
      name: user?.name || user?.fullName || 'Nhân viên giao hàng',
      shiftStatus: 'available',
      activeOrders: 0,
    };

  const shiftStatusText =
    shipperInfo.shiftStatus === 'available'
      ? 'Đang trực ca'
      : shipperInfo.shiftStatus === 'busy'
      ? 'Đang bận'
      : 'Nghỉ ca';

  const isShiftOnline = shipperInfo.shiftStatus === 'available' || shipperInfo.shiftStatus === 'busy';

  const activeOrdersCount = orders.filter(
    (o) =>
      o.shipperId === currentShipperId &&
      (o.status === 'PACKING' || o.status === 'SHIPPING')
  ).length;

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const initials = shipperInfo.name
    ? shipperInfo.name
        .split(' ')
        .map((w) => w[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : 'TX';

  return (
    <div
      className={`shipper-portal min-h-screen font-sans transition-colors ${
        isHighContrast
          ? 'shipper-dark-mode bg-[#0b0f19] text-[#f8fafc]'
          : 'bg-[#f8fafc] text-[#0f172a]'
      }`}
    >
      {/* Centered responsive container */}
      <div
        className={`max-w-md mx-auto min-h-screen flex flex-col border-x shadow-2xl transition-colors ${
          isHighContrast
            ? 'bg-[#0f172a] border-[#1e293b]'
            : 'bg-[#ffffff] border-[#e2e8f0]'
        }`}
      >
        {/* 1. Top App Bar */}
        <header
          className={`sticky top-0 z-40 h-[56px] px-3.5 flex items-center justify-between border-b backdrop-blur-md transition-colors ${
            isHighContrast
              ? 'bg-[#0f172a]/95 border-[#1e293b] text-[#f8fafc]'
              : 'bg-white/95 border-[#e2e8f0] text-[#0f172a]'
          }`}
        >
          {/* Driver identity & shift badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Logo Badge */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs shadow-md shadow-blue-500/20 shrink-0">
              <Truck className="w-4 h-4" />
            </div>

            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-bold tracking-tight truncate">
                  {shipperInfo.name}
                </span>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isShiftOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                  title={shiftStatusText}
                />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-blue-600 dark:text-blue-400">TDT Ship</span>
                <span>•</span>
                <span>{shiftStatusText}</span>
              </div>
            </div>
          </div>

          {/* Quick controls: theme switch & logout */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleHighContrast}
              title={isHighContrast ? 'Chuyển sang giao diện sáng' : 'Chuyển sang chế độ tối'}
              aria-label="Chuyển chế độ sáng tối"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isHighContrast
                  ? 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isHighContrast ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất tài xế"
              aria-label="Đăng xuất tài xế"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isHighContrast
                  ? 'bg-slate-800 text-rose-400 hover:bg-rose-950/60'
                  : 'bg-slate-100 text-slate-600 hover:text-rose-600 hover:bg-rose-50'
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 pb-[84px]">{children}</main>

        {/* 2. Modern Sticky Bottom Navigation */}
        <nav
          aria-label="Điều hướng chính tài xế"
          className={`fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto h-[64px] border-t backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_12px_rgba(0,0,0,0.04)] transition-colors ${
            isHighContrast
              ? 'bg-[#0f172a]/95 border-[#1e293b]'
              : 'bg-white/95 border-[#e2e8f0]'
          }`}
        >
          <div className="grid grid-cols-3 h-full px-2">
            {/* Tab 1: Đơn hàng */}
            <Link
              href="/shipper"
              className={`relative flex flex-col items-center justify-center gap-1 transition-all rounded-xl my-1 ${
                pathname === '/shipper' || pathname.startsWith('/shipper/orders')
                  ? isHighContrast
                    ? 'text-blue-400 font-bold bg-blue-950/40'
                    : 'text-blue-600 font-bold bg-blue-50/80'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Package className="w-5 h-5" />
                {activeOrdersCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 min-w-[16px] h-4 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                    {activeOrdersCount}
                  </span>
                )}
              </div>
              <span className="text-[12px] leading-none">Đơn hàng</span>
            </Link>

            {/* Tab 2: Sổ quỹ */}
            <Link
              href="/shipper/cod"
              className={`flex flex-col items-center justify-center gap-1 transition-all rounded-xl my-1 ${
                pathname === '/shipper/cod'
                  ? isHighContrast
                    ? 'text-blue-400 font-bold bg-blue-950/40'
                    : 'text-blue-600 font-bold bg-blue-50/80'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span className="text-[12px] leading-none">Sổ quỹ COD</span>
            </Link>

            {/* Tab 3: Tài khoản */}
            <Link
              href="/change-password"
              className={`flex flex-col items-center justify-center gap-1 transition-all rounded-xl my-1 ${
                pathname === '/change-password'
                  ? isHighContrast
                    ? 'text-blue-400 font-bold bg-blue-950/40'
                    : 'text-blue-600 font-bold bg-blue-50/80'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[12px] leading-none">Tài khoản</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
