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
  KeyRound,
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
      ? 'Bật ca'
      : shipperInfo.shiftStatus === 'busy'
      ? 'Đang bận'
      : 'Nghỉ ca';

  const activeOrdersCount = orders.filter(
    (o) =>
      o.shipperId === currentShipperId &&
      (o.status === 'PACKING' || o.status === 'SHIPPING')
  ).length;

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div
      className={`shipper-portal min-h-screen font-sans ${
        isHighContrast
          ? 'shipper-dark-mode bg-[#121212] text-[#f5f5f5]'
          : 'bg-[#f8f8f8] text-[#0a0a0a]'
      }`}
    >
      {/* Centered responsive container */}
      <div
        className={`max-w-md mx-auto min-h-screen flex flex-col border-x ${
          isHighContrast
            ? 'bg-[#121212] border-[#2a2a2a]'
            : 'bg-[#f8f8f8] border-[#e6e6e6]'
        }`}
      >
        {/* 1. Top bar: exact 48px height, no emoji, no greeting banner */}
        <header
          className={`sticky top-0 z-40 h-[48px] px-4 flex items-center justify-between border-b ${
            isHighContrast
              ? 'bg-[#1c1c1c] border-[#2a2a2a] text-[#f5f5f5]'
              : 'bg-white border-[#e6e6e6] text-[#0a0a0a]'
          }`}
        >
          {/* Driver identity & shift */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[16px] font-bold text-[#0a0a0a] shrink-0 dark:text-[#f5f5f5]">
              TDT Ship
            </span>
            <span className="text-[#6b6b6b] text-[14px] shrink-0">•</span>
            <span className="text-[14px] text-[#0a0a0a] truncate font-medium dark:text-[#f5f5f5]">
              {shipperInfo.name}
            </span>
            <span className="text-[#6b6b6b] text-[14px] shrink-0">•</span>
            <span className="text-[14px] text-[#6b6b6b] shrink-0">
              {shiftStatusText}
            </span>
          </div>

          {/* Quick controls: theme switch & logout */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleHighContrast}
              title={isHighContrast ? 'Chuyển sang giao diện sáng' : 'Chuyển sang chế độ tối'}
              aria-label="Chuyển chế độ sáng tối"
              className={`min-h-[48px] min-w-[48px] p-2 rounded-[6px] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fbf] ${
                isHighContrast
                  ? 'text-[#f5f5f5] hover:bg-[#2a2a2a]'
                  : 'text-[#0a0a0a] hover:bg-[#f2f2f2]'
              }`}
            >
              {isHighContrast ? (
                <Moon className="w-[18px] h-[18px]" />
              ) : (
                <Sun className="w-[18px] h-[18px]" />
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất tài xế"
              aria-label="Đăng xuất tài xế"
              className={`min-h-[48px] min-w-[48px] p-2 rounded-[6px] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fbf] ${
                isHighContrast
                  ? 'text-[#a0a0a0] hover:text-[#ffedea] hover:bg-[#2a2a2a]'
                  : 'text-[#6b6b6b] hover:text-[#831c1e] hover:bg-[#ffedea]'
              }`}
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 pb-[80px]">{children}</main>

        {/* Sticky Bottom Navigation: height 64px, 3 tabs */}
        <nav
          aria-label="Điều hướng chính tài xế"
          className={`fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto h-[64px] border-t pb-[env(safe-area-inset-bottom,0px)] ${
            isHighContrast
              ? 'bg-[#1c1c1c] border-[#2a2a2a]'
              : 'bg-white border-[#e6e6e6]'
          }`}
        >
          <div className="grid grid-cols-3 h-full">
            {/* Tab 1: Đơn hàng */}
            <Link
              href="/shipper"
              className={`flex flex-col items-center justify-center gap-1 h-full min-h-[48px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fbf] ${
                pathname === '/shipper' || pathname.startsWith('/shipper/orders')
                  ? isHighContrast
                    ? 'text-[#f5f5f5] font-bold border-t-2 border-[#f5f5f5]'
                    : 'text-[#0a0a0a] font-bold border-t-2 border-[#0a0a0a]'
                  : 'text-[#6b6b6b] font-normal border-t-2 border-transparent hover:text-[#0a0a0a]'
              }`}
            >
              <Package className="w-[18px] h-[18px]" />
              <span className="text-[14px] leading-tight">
                Đơn hàng{activeOrdersCount > 0 ? ` (${activeOrdersCount})` : ''}
              </span>
            </Link>

            {/* Tab 2: Sổ quỹ */}
            <Link
              href="/shipper/cod"
              className={`flex flex-col items-center justify-center gap-1 h-full min-h-[48px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fbf] ${
                pathname === '/shipper/cod'
                  ? isHighContrast
                    ? 'text-[#f5f5f5] font-bold border-t-2 border-[#f5f5f5]'
                    : 'text-[#0a0a0a] font-bold border-t-2 border-[#0a0a0a]'
                  : 'text-[#6b6b6b] font-normal border-t-2 border-transparent hover:text-[#0a0a0a]'
              }`}
            >
              <Wallet className="w-[18px] h-[18px]" />
              <span className="text-[14px] leading-tight">Sổ quỹ</span>
            </Link>

            {/* Tab 3: Tài khoản */}
            <Link
              href="/change-password"
              className={`flex flex-col items-center justify-center gap-1 h-full min-h-[48px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fbf] ${
                pathname === '/change-password'
                  ? isHighContrast
                    ? 'text-[#f5f5f5] font-bold border-t-2 border-[#f5f5f5]'
                    : 'text-[#0a0a0a] font-bold border-t-2 border-[#0a0a0a]'
                  : 'text-[#6b6b6b] font-normal border-t-2 border-transparent hover:text-[#0a0a0a]'
              }`}
            >
              <KeyRound className="w-[18px] h-[18px]" />
              <span className="text-[14px] leading-tight">Tài khoản</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
