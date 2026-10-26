'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  Bell,
  Search,
  User,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { useManagerShellStore } from '@/store/useManagerShellStore';
import { useManagerStore } from '@/store/useManagerStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useToast } from '@/hooks/useToast';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/manager': {
    title: 'Tổng Quan Vận Hành',
    subtitle: 'Theo dõi doanh thu, sản lượng và hiệu suất phân phối',
  },
  '/manager/dashboard': {
    title: 'Tổng Quan Vận Hành',
    subtitle: 'Theo dõi doanh thu, sản lượng và hiệu suất phân phối',
  },
  '/manager/orders': {
    title: 'Quản Lý Đơn Hàng',
    subtitle: 'Duyệt đơn bán lẻ, điều phối Shipper giao hỏa tốc 2H & theo dõi tiến độ',
  },
  '/manager/products': {
    title: 'Kho Vật Tư M&E',
    subtitle: 'Tra cứu tồn kho 4 thương hiệu, cảnh báo mức an toàn & điều chỉnh kho',
  },
  '/manager/customers': {
    title: 'Khách Hàng Bán Lẻ',
    subtitle: 'Hồ sơ đại lý, thợ thầu và khách hàng công trình thân thiết',
  },
};

export function ManagerHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  const { toggleMobileDrawer, toggleSidebar } = useManagerShellStore();
  const { orders } = useManagerStore();
  const { user } = useAuthStore();

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const pendingCount = pendingOrders.length;

  const currentInfo = pageTitles[pathname] || {
    title: 'Quản Lý Vận Hành',
    subtitle: 'Hệ thống phân phối vật tư cơ điện M&E',
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between h-full px-4 lg:px-8 max-w-7xl mx-auto gap-4">
        {/* Left: Mobile trigger & Page title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger menu */}
          <button
            type="button"
            onClick={toggleMobileDrawer}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Mở thanh điều hướng di động"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop sidebar toggle icon */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Thu gọn hoặc mở rộng sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex flex-col min-w-0">
            <h1 className="text-sm lg:text-base font-bold text-slate-900 dark:text-white truncate leading-tight">
              {currentInfo.title}
            </h1>
            <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions, Notification Bell, ThemeToggle, User */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          {/* NOTIFICATION BELL: Links to /manager/orders?status=PENDING with PENDING badge */}
          <Link
            href="/manager/orders?status=PENDING"
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            aria-label={`Thông báo: ${pendingCount} đơn hàng chờ duyệt`}
            title={
              pendingCount > 0
                ? `${pendingCount} đơn hàng mới đang chờ duyệt`
                : 'Không có đơn chờ duyệt'
            }
          >
            <Bell className="w-5 h-5 group-hover:scale-105 transition-transform" />

            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-rose-600 rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
                {pendingCount}
              </span>
            )}
          </Link>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
                {user?.name || user?.email?.split('@')[0] || 'Quản lý'}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold leading-none">
                {user?.role || 'MANAGER'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default ManagerHeader;
