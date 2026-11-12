'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RouteGuard from '@/components/auth/RouteGuard';
import ShipperShell from '@/components/shipper/ShipperShell';
import { useAuthStore } from '@/store/useAuthStore';
import { useManagerStore } from '@/store/useManagerStore';
import {
  User,
  Truck,
  Phone,
  Shield,
  Clock,
  KeyRound,
  LogOut,
  PackageCheck,
  Banknote,
  MapPin,
  CheckCircle2,
  Headphones,
} from 'lucide-react';
import { formatCurrencyVND } from '@/lib/formatters';

export default function ShipperProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { orders } = useManagerStore();

  const currentShipperId = user?.shipperId || user?.id || '';
  const currentShipperName =
    user?.fullName || user?.name || 'Trần Quốc Toản';
  const shipperPhone = user?.phone || '0912.345.678';

  const myOrders = orders.filter((o) => o.shipperId === currentShipperId);
  const deliveredCount = myOrders.filter((o) => o.status === 'DELIVERED').length;
  const totalCodCollected = myOrders
    .filter((o) => o.status === 'DELIVERED' && o.paymentMethod === 'COD')
    .reduce((sum, o) => sum + (o.codCollected || o.total || o.totalAmount || 0), 0);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <RouteGuard allowedRoles={['SHIPPER', 'MANAGER']} fallbackUrl="/login" forbiddenUrl="/403">
      <ShipperShell>
        <div className="px-4 py-4 space-y-4">
          {/* 1. Header Title */}
          <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Hồ sơ giao vận
            </span>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">
              Tài Khoản Tài Xế
            </h1>
          </div>

          {/* 2. Driver Identity Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 shrink-0">
                {currentShipperName
                  .split(' ')
                  .map((w) => w[0])
                  .slice(-2)
                  .join('')
                  .toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {currentShipperName}
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Mã tài xế: TX-TDT-01
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Đang trực ca
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Giao nhanh 2H
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Contact & Vehicle Specs */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 block font-medium">Số điện thoại</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{shipperPhone}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 block font-medium">Phương tiện</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">59X3-128.45</span>
              </div>
            </div>
          </div>

          {/* 3. Performance Today Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Kết quả ca hôm nay
            </span>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Đã giao xong</span>
                </div>
                <div className="text-xl font-black text-white tabular-nums">
                  {deliveredCount} <span className="text-xs font-normal text-slate-400">đơn</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <Banknote className="w-3.5 h-3.5 text-amber-400" />
                  <span>Đã thu COD</span>
                </div>
                <div className="text-base font-black text-amber-300 tabular-nums">
                  {formatCurrencyVND(totalCodCollected)}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Action List */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Cài đặt &amp; Hỗ trợ
            </span>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {/* Change Password */}
              <Link
                href="/change-password"
                className="p-3.5 flex items-center justify-between text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                  <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Đổi mật khẩu tài xế</span>
                </div>
                <span className="text-slate-400">›</span>
              </Link>

              {/* Support Hotline */}
              <a
                href="tel:0937292769"
                className="p-3.5 flex items-center justify-between text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                  <Headphones className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Hotline Quản lý điều phối (0937.292.769)</span>
                </div>
                <span className="text-xs text-emerald-600 font-bold">Gọi</span>
              </a>

              {/* Sổ quỹ COD Link */}
              <Link
                href="/shipper/cod"
                className="p-3.5 flex items-center justify-between text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                  <Banknote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Sổ quỹ đối soát tiền mặt COD</span>
                </div>
                <span className="text-slate-400">›</span>
              </Link>
            </div>
          </div>

          {/* 5. Logout Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full min-h-[48px] rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất tài khoản tài xế</span>
            </button>
          </div>
        </div>
      </ShipperShell>
    </RouteGuard>
  );
}
