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
  Shield,
  Clock,
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
      name: user?.name || 'Nhân viên giao hàng',
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
          ? 'bg-white text-black high-contrast-mode font-sans'
          : 'bg-slate-950 text-slate-100 font-sans'
      }`}
    >
      {/* Centered Mobile Container (max-w-md on desktop) */}
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl border-x border-slate-800/40">
        {/* Sticky Header */}
        <header
          className={`sticky top-0 z-40 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b transition-colors ${
            isHighContrast
              ? 'bg-white border-2 border-black text-black'
              : 'bg-slate-900/90 border-slate-800 text-white'
          }`}
        >
          {/* Driver identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                isHighContrast
                  ? 'bg-amber-400 text-black border-2 border-black font-black'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}
            >
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm truncate leading-tight">
                  {shipperInfo.name}
                </h1>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                    shipperInfo.shiftStatus === 'available'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : shipperInfo.shiftStatus === 'busy'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-600/20 text-slate-400 border border-slate-600/30'
                  }`}
                >
                  {shipperInfo.shiftStatus === 'available'
                    ? 'Bật ca'
                    : shipperInfo.shiftStatus === 'busy'
                    ? 'Bận'
                    : 'Nghỉ'}
                </span>
              </div>
              <p
                className={`text-[11px] truncate mt-0.5 ${
                  isHighContrast ? 'text-black font-semibold' : 'text-slate-400'
                }`}
              >
                {shipperInfo.vehicle}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* High Contrast Outdoor Mode Button */}
            <button
              type="button"
              onClick={toggleHighContrast}
              title={
                isHighContrast
                  ? 'Tắt chế độ tương phản cao'
                  : 'Bật chế độ tương phản cao ngoài trời (>= 7:1)'
              }
              aria-label="Chế độ tương phản cao ngoài trời"
              className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                isHighContrast
                  ? 'bg-black text-yellow-300 border-2 border-black shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất"
              aria-label="Đăng xuất tài xế"
              className={`p-2 rounded-xl text-xs transition-all border ${
                isHighContrast
                  ? 'bg-white hover:bg-slate-100 text-rose-700 border-2 border-black'
                  : 'bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border-slate-700'
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 pb-24 overflow-y-auto">{children}</main>

        {/* Sticky Bottom Navigation (Mobile thumb reachable) */}
        <nav
          aria-label="Điều hướng chính tài xế"
          className={`fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto border-t transition-colors pb-[env(safe-area-inset-bottom,0px)] ${
            isHighContrast
              ? 'bg-white border-t-2 border-black text-black'
              : 'bg-slate-900/95 backdrop-blur-lg border-slate-800 text-slate-300'
          }`}
        >
          <div className="grid grid-cols-2 h-16">
            {/* Tab 1: Orders */}
            <Link
              href="/shipper"
              className={`flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all relative ${
                pathname === '/shipper' || pathname.startsWith('/shipper/orders')
                  ? isHighContrast
                    ? 'text-black bg-amber-100/80 font-black border-b-4 border-black'
                    : 'text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-400'
                  : isHighContrast
                  ? 'text-slate-800 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="relative">
                <Package className="w-5 h-5" />
                {activeOrdersCount > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isHighContrast
                        ? 'bg-black text-white border border-black'
                        : 'bg-emerald-500 text-white'
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
                    ? 'text-black bg-amber-100/80 font-black border-b-4 border-black'
                    : 'text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-400'
                  : isHighContrast
                  ? 'text-slate-800 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="relative">
                <Wallet className="w-5 h-5" />
                {unsettledCod.totalAmount > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 px-1 py-0.2 rounded-full text-[9px] font-black ${
                      isHighContrast
                        ? 'bg-rose-700 text-white border border-black'
                        : 'bg-amber-500 text-slate-950 font-bold'
                    }`}
                  >
                    {unsettledCod.orders.length}
                  </span>
                )}
              </div>
              <span>Sổ quỹ COD</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
