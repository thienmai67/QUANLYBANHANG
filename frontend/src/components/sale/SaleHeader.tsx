'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  Bell,
  Search,
  User,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { useSaleShellStore } from '@/store/useSaleShellStore';
import { useSaleStore } from '@/store/useSaleStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ThemeToggle } from '@/components/common/ThemeToggle';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/sale': {
    title: 'Tổng Quan Kinh Doanh',
    subtitle: 'Bảng điều khiển hiệu suất cá nhân, việc cần làm và tiến độ',
  },
  '/sale/dashboard': {
    title: 'Tổng Quan Kinh Doanh',
    subtitle: 'Bảng điều khiển hiệu suất cá nhân, việc cần làm và tiến độ',
  },
  '/sale/orders': {
    title: 'Đơn Hàng Của Tôi',
    subtitle: 'Theo dõi đơn do sale tạo hộ và đơn của khách hàng phụ trách',
  },
  '/sale/orders/new': {
    title: 'Tạo Đơn Hàng Hộ Khách',
    subtitle: 'Lên đơn bán buôn vật tư theo giá niêm yết và chiết khấu thương hiệu',
  },
  '/sale/customers': {
    title: 'Khách Hàng Phụ Trách',
    subtitle: 'Hồ sơ đại lý, thợ thầu, công nợ và lịch sử mua sắm',
  },
  '/sale/quotes': {
    title: 'Quản Lý Báo Giá B2B',
    subtitle: 'Lập báo giá dự án, gửi khách và chuyển đổi thành đơn hàng',
  },
  '/sale/quotes/new': {
    title: 'Lập Báo Giá Mới',
    subtitle: 'Báo giá vật tư cơ điện với chiết khấu thương hiệu và hạn mức sale',
  },
  '/sale/products': {
    title: 'Tra Cứu Vật Tư M&E',
    subtitle: 'Tra cứu thông số kỹ thuật, quy đổi đơn vị và giá niêm yết (Chỉ xem)',
  },
  '/sale/payments': {
    title: 'Thanh Toán & Công Nợ',
    subtitle: 'Theo dõi đơn chưa thanh toán, công nợ quá hạn và ghi chú thu tiền',
  },
  '/sale/activities': {
    title: 'Chăm Sóc Khách Hàng',
    subtitle: 'Nhật ký liên hệ khách hàng và nhắc việc follow-up đến hạn',
  },
  '/sale/reports': {
    title: 'Báo Cáo Hiệu Suất Cá Nhân',
    subtitle: 'Doanh số theo kỳ, tỷ lệ chuyển đổi báo giá và phân tích khách hàng',
  },
};

export function SaleHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const { toggleMobileDrawer } = useSaleShellStore();
  const { dashboard, orders, activities } = useSaleStore();
  const { user } = useAuthStore();

  const currentMeta = pageTitles[pathname] || {
    title: 'Khu Vực Bán Hàng',
    subtitle: 'Hệ thống hỗ trợ kinh doanh vật tư cơ điện TDT M&E',
  };

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const dueFollowups = activities.filter((a) => !a.isDone).length;

  return (
    <header className="sticky top-0 z-20 h-14 lg:h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between h-full px-3 sm:px-4 lg:px-8">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={toggleMobileDrawer}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight leading-tight truncate">
              {currentMeta.title}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-md lg:max-w-xl">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Quick actions, notifications, user avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
          {/* Quick Order button */}
          <Link
            href="/sale/orders/new"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-all shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đơn hộ</span>
          </Link>

          {/* Quick Quote button */}
          <Link
            href="/sale/quotes/new"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
          >
            <Plus className="w-4 h-4" />
            <span>Báo giá mới</span>
          </Link>

          {/* Notification Bell */}
          <Link
            href="/sale/activities"
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Việc cần làm hôm nay"
            aria-label="Thông báo việc cần làm"
          >
            <Bell className="w-4 h-4" />
            {dueFollowups > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </Link>

          {/* Dark / Light theme toggle */}
          <ThemeToggle />

          {/* Profile Dropdown indicator */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="hidden xl:flex flex-col">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {user?.name || user?.email?.split('@')[0] || 'Sale'}
              </span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold leading-tight">
                Kinh doanh
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
