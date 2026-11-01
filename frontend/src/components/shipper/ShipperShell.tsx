'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useShipperUIStore } from '@/store/useShipperUIStore';
import { useManagerStore } from '@/store/useManagerStore';
import {
  Truck,
  Package,
  Wallet,
  Sun,
  Moon,
  LogOut,
  Eye,
  KeyRound,
  Shield,
  CheckCircle2,
  Clock,
  CircleDot,
} from 'lucide-react';
import { formatCurrencyVND } from '@/lib/formatters';

interface ShipperShellProps {
  children: React.ReactNode;
}

export default function ShipperShell({ children }: ShipperShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isHighContrast, toggleHighContrast } = useShipperUIStore();
  const { shippers, orders, getShipperUnsettledCod } = useManagerStore();

  const currentShipperId = user?.shipperId || user?.id || '';
  const shipperInfo =
    shippers.find((s) => s.id === currentShipperId) || {
      name: user?.name || user?.fullName || 'Nhân viên giao hàng',
      vehicle: 'Xe máy giao hàng',
      shiftStatus: 'available',
      activeOrders: 0,
    };

  const activeOrdersCount = orders.filter(
    (o) =>
      o.shipperId === currentShipperId &&
      (o.status === 'PACKING' || o.status === 'SHIPPING')
  ).length;

  const unsettledCod = getShipperUnsettledCod(currentShipperId);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-150 ${
        isHighContrast
          ? 'bg-neutral-100 text-black high-contrast-mode font-sans'
          : 'bg-slate-950 text-slate-100 font-sans'
      }`}
    >
      {/* Responsive Container (Comfortable max-w-2xl on desktop/tablet, full-width on mobile) */}
      <div
        className={`max-w-2xl mx-auto min-h-screen flex flex-col relative shadow-2xl transition-colors ${
          isHighContrast
            ? 'bg-white border-x-4 border-black'
            : 'bg-slate-950 border-x border-slate-800/80'
        }`}
      >
        {/* Sticky Header with Industrial Field Aesthetics */}
        <header
          className={`sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b transition-colors ${
            isHighContrast
              ? 'bg-white border-b-4 border-black text-black'
              : 'bg-slate-900/95 backdrop-blur-md border-slate-800/90 text-white shadow-sm'
          }`}
        >
          {/* Driver Identity & Shift Status */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                isHighContrast
                  ? 'bg-amber-300 text-black border-2 border-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30 shadow-inner'
              }`}
            >
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm truncate leading-tight tracking-tight">
                  {shipperInfo.name}
                </h1>
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1 ${
                    shipperInfo.shiftStatus === 'available'
                      ? isHighContrast
                        ? 'bg-emerald-300 text-black border border-black font-black'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : shipperInfo.shiftStatus === 'busy'
                      ? isHighContrast
                        ? 'bg-amber-300 text-black border border-black font-black'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : isHighContrast
                      ? 'bg-slate-200 text-black border border-black'
                      : 'bg-slate-700/30 text-slate-400 border border-slate-700/50'
                  }`}
                >
                  <CircleDot className="w-2 h-2 animate-pulse" />
                  {shipperInfo.shiftStatus === 'available'
                    ? 'Bật ca'
                    : shipperInfo.shiftStatus === 'busy'
                    ? 'Đang bận'
                    : 'Nghỉ ca'}
                </span>
              </div>
              <p
                className={`text-[11px] truncate mt-0.5 font-medium flex items-center gap-1.5 ${
                  isHighContrast ? 'text-black font-bold' : 'text-slate-400'
                }`}
              >
                <span>{shipperInfo.vehicle}</span>
                {unsettledCod.totalAmount > 0 && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-black ${
                      isHighContrast
                        ? 'bg-amber-300 text-black border border-black'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    COD: {formatCurrencyVND(unsettledCod.totalAmount)}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Header Actions: Sunlight Mode & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {/* High Contrast Outdoor Mode Button (Sunlight Mode) */}
            <button
              type="button"
              onClick={toggleHighContrast}
              title={
                isHighContrast
                  ? 'Chuyển về giao diện chuẩn'
                  : 'Bật chế độ Nắng gắt ngoài trời (Sunlight High-Contrast)'
              }
              aria-label="Chế độ tương phản cao ngoài trời"
              className={`p-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 active:scale-95 ${
                isHighContrast
                  ? 'bg-black text-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-slate-800 text-slate-200 hover:text-amber-400 border-slate-700 hover:border-amber-400/40 hover:bg-slate-800/80 shadow-sm'
              }`}
            >
              {isHighContrast ? (
                <Moon className="w-4 h-4 text-yellow-300" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất tài xế"
              aria-label="Đăng xuất tài xế"
              className={`p-2.5 rounded-xl text-xs transition-all border flex items-center justify-center active:scale-95 ${
                isHighContrast
                  ? 'bg-white hover:bg-rose-100 text-rose-700 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-slate-800/90 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border-slate-700'
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 pb-24 overflow-y-auto">{children}</main>

        {/* Sticky Bottom Navigation (Ergonomic 3-Tab Mobile Thumb Bar) */}
        <nav
          aria-label="Điều hướng chính tài xế"
          className={`fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto border-t transition-colors pb-[env(safe-area-inset-bottom,0px)] ${
            isHighContrast
              ? 'bg-white border-t-4 border-black text-black'
              : 'bg-slate-900/95 backdrop-blur-xl border-slate-800/90 text-slate-400 shadow-2xl'
          }`}
        >
          <div className="grid grid-cols-3 h-16">
            {/* Tab 1: Orders */}
            <Link
              href="/shipper"
              className={`flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all relative ${
                pathname === '/shipper' || pathname.startsWith('/shipper/orders')
                  ? isHighContrast
                    ? 'text-black bg-amber-200/90 font-black border-t-4 border-black'
                    : 'text-emerald-400 bg-emerald-500/10 border-t-2 border-emerald-400'
                  : isHighContrast
                  ? 'text-slate-900 hover:bg-slate-100 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="relative">
                <Package className="w-5 h-5" />
                {activeOrdersCount > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-3 px-1.5 py-0.2 rounded-full text-[10px] font-black font-mono shadow-sm ${
                      isHighContrast
                        ? 'bg-black text-white border border-black'
                        : 'bg-emerald-500 text-white ring-2 ring-slate-900'
                    }`}
                  >
                    {activeOrdersCount}
                  </span>
                )}
              </div>
              <span>Đơn giao</span>
            </Link>

            {/* Tab 2: COD Settlement */}
            <Link
              href="/shipper/cod"
              className={`flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all relative ${
                pathname === '/shipper/cod'
                  ? isHighContrast
                    ? 'text-black bg-amber-200/90 font-black border-t-4 border-black'
                    : 'text-emerald-400 bg-emerald-500/10 border-t-2 border-emerald-400'
                  : isHighContrast
                  ? 'text-slate-900 hover:bg-slate-100 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="relative">
                <Wallet className="w-5 h-5" />
                {unsettledCod.totalAmount > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-3 px-1.5 py-0.2 rounded-full text-[9px] font-black font-mono shadow-sm ${
                      isHighContrast
                        ? 'bg-rose-600 text-white border border-black font-black'
                        : 'bg-amber-500 text-slate-950 font-black ring-2 ring-slate-900'
                    }`}
                  >
                    {unsettledCod.orders.length}
                  </span>
                )}
              </div>
              <span>Ví COD</span>
            </Link>

            {/* Tab 3: Security & Profile */}
            <Link
              href="/change-password"
              className={`flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all relative ${
                pathname === '/change-password'
                  ? isHighContrast
                    ? 'text-black bg-amber-200/90 font-black border-t-4 border-black'
                    : 'text-emerald-400 bg-emerald-500/10 border-t-2 border-emerald-400'
                  : isHighContrast
                  ? 'text-slate-900 hover:bg-slate-100 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <KeyRound className="w-5 h-5" />
              <span>Đổi mật khẩu</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
