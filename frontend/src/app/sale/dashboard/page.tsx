'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  AlertTriangle,
  DollarSign,
  Package,
  Calendar,
  FileText,
  Users,
  CreditCard,
  Plus,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  PhoneCall,
  ChevronRight,
} from 'lucide-react';
import { useSaleStore } from '@/store/useSaleStore';
import { formatCurrencyVND, formatDate } from '@/lib/formatters';

export default function SaleDashboardPage() {
  const { dashboard, fetchDashboard, isLoading } = useSaleStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const stats = dashboard || {
    pendingOrdersCount: 0,
    expiring2hOrdersCount: 0,
    monthDeliveredRevenue: 0,
    overdueDebt: 0,
    dueFollowupsCount: 0,
    expiringQuotesCount: 0,
    unpaidOrdersCount: 0,
    topCustomers: [],
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Action Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 text-white shadow-xl shadow-purple-900/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/20 tracking-wider">
              Bán Hàng &amp; Dự Án
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight font-display">
            Không Gian Làm Việc Nhân Viên Bán Hàng
          </h2>
          <p className="text-[11px] sm:text-xs text-purple-200">
            Quản lý khách hàng phụ trách, lập báo giá dự án và tạo đơn hàng nhanh chóng
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href="/sale/orders/new"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold bg-white text-purple-900 hover:bg-purple-50 transition-all shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đơn hộ</span>
          </Link>
          <Link
            href="/sale/quotes/new"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold bg-purple-600/60 hover:bg-purple-600 text-white border border-purple-400/40 transition-all shrink-0"
          >
            <FileText className="w-4 h-4" />
            <span>Lập báo giá</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards: 2x2 on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Pending Orders */}
        <Link
          href="/sale/orders?status=PENDING"
          className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all shadow-xs hover:shadow-md group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
              Đơn Chờ Xử Lý
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
              {stats.pendingOrdersCount}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400">đơn</span>
          </div>
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-500 flex items-center gap-1">
            <span className="truncate">Chờ đóng gói &amp; điều phối</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform shrink-0" />
          </p>
        </Link>

        {/* Card 2: Expiring 2H Orders */}
        <Link
          href="/sale/orders"
          className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 dark:hover:border-rose-500/50 transition-all shadow-xs hover:shadow-md group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
              Đơn 2H Gấp
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
              {stats.expiring2hOrdersCount}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400">cần xử lý</span>
          </div>
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
            <span className="truncate">Dưới 2 giờ</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform shrink-0" />
          </p>
        </Link>

        {/* Card 3: Month Delivered Revenue */}
        <Link
          href="/sale/reports"
          className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all shadow-xs hover:shadow-md group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
              Doanh Số Tháng
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <span className="text-sm sm:text-lg lg:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-display truncate block">
              {formatCurrencyVND(stats.monthDeliveredRevenue)}
            </span>
          </div>
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-500 truncate">
            Đơn giao thành công
          </p>
        </Link>

        {/* Card 4: Overdue Debt */}
        <Link
          href="/sale/payments?overdue_only=true"
          className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 dark:hover:border-orange-500/50 transition-all shadow-xs hover:shadow-md group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
              Nợ Quá Hạn
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <span className="text-sm sm:text-lg lg:text-2xl font-extrabold text-orange-600 dark:text-orange-400 font-display truncate block">
              {formatCurrencyVND(stats.overdueDebt)}
            </span>
          </div>
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-500 truncate">
            Đôn đốc thu hồi
          </p>
        </Link>
      </div>

      {/* Main Grid: To-Do List & Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 1 Col: Today's Tasks & Urgent Reminders */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Việc Cần Xử Lý Hôm Nay</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                {stats.dueFollowupsCount + stats.expiringQuotesCount + stats.unpaidOrdersCount} mục
              </span>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {/* Item 1: Followup reminders */}
              <Link
                href="/sale/activities?due_today=true"
                className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/60 dark:border-slate-700/60 transition-all group"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      Lịch chăm sóc đến hạn
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                      Cần gọi điện / gặp gỡ trao đổi
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50">
                    {stats.dueFollowupsCount}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Item 2: Expiring quotes */}
              <Link
                href="/sale/quotes"
                className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/60 dark:border-slate-700/60 transition-all group"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      Báo giá sắp hết hạn
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                      Hiệu lực còn dưới 3 ngày
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50">
                    {stats.expiringQuotesCount}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Item 3: Unpaid orders */}
              <Link
                href="/sale/payments?unpaid_only=true"
                className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/60 dark:border-slate-700/60 transition-all group"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      Đơn chưa thanh toán
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                      Theo dõi COD / Chuyển khoản
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/50">
                    {stats.unpaidOrdersCount}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Top Customers */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Top Khách Hàng Phụ Trách</span>
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500">
                  Xếp hạng theo tổng doanh thu tích lũy từ các đơn hàng đã giao thành công
                </p>
              </div>

              <Link
                href="/sale/customers"
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stats.topCustomers && stats.topCustomers.length > 0 ? (
              <>
                {/* Mobile Customer Cards (< md) */}
                <div className="md:hidden space-y-2.5">
                  {stats.topCustomers.map((cust) => {
                    const tier = cust.profile?.tier || 'Retail';
                    const tierBadgeClass =
                      tier === 'Gold'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300'
                        : tier === 'Silver'
                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300'
                        : tier === 'Bronze'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border-orange-300'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200';

                    return (
                      <div
                        key={cust.id}
                        className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {cust.fullName}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border shrink-0 ${tierBadgeClass}`}>
                                {tier}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {cust.phone || cust.email}
                            </div>
                            {cust.profile?.companyName && (
                              <div className="text-[10px] text-purple-600 dark:text-purple-400 truncate">
                                {cust.profile.companyName}
                              </div>
                            )}
                          </div>

                          <Link
                            href={`/sale/orders/new?customerId=${cust.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs shrink-0 active:scale-95 transition-all"
                          >
                            <span>Tạo đơn</span>
                          </Link>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-center">
                          <div className="bg-white/60 dark:bg-slate-900/60 p-1.5 rounded-lg">
                            <div className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">Số đơn</div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                              {cust.orderCount}
                            </div>
                          </div>
                          <div className="bg-white/60 dark:bg-slate-900/60 p-1.5 rounded-lg">
                            <div className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">Đã mua</div>
                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono truncate">
                              {formatCurrencyVND(cust.totalSpent)}
                            </div>
                          </div>
                          <div className="bg-white/60 dark:bg-slate-900/60 p-1.5 rounded-lg">
                            <div className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">Công nợ</div>
                            <div className="text-xs font-bold text-orange-600 dark:text-orange-400 font-mono truncate">
                              {cust.currentDebt > 0 ? formatCurrencyVND(cust.currentDebt) : '0 ₫'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop / Tablet Table View (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3">Khách Hàng</th>
                        <th className="py-2.5 px-3">Phân Hạng</th>
                        <th className="py-2.5 px-3">Số Đơn</th>
                        <th className="py-2.5 px-3">Đã Mua</th>
                        <th className="py-2.5 px-3">Công Nợ</th>
                        <th className="py-2.5 px-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {stats.topCustomers.map((cust) => {
                        const tier = cust.profile?.tier || 'Retail';
                        const tierBadgeClass =
                          tier === 'Gold'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300'
                            : tier === 'Silver'
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300'
                            : tier === 'Bronze'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border-orange-300'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200';

                        return (
                          <tr key={cust.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {cust.fullName}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {cust.phone || cust.email}
                              </div>
                              {cust.profile?.companyName && (
                                <div className="text-[10px] text-purple-600 dark:text-purple-400 truncate max-w-[200px]">
                                  {cust.profile.companyName}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierBadgeClass}`}>
                                {tier}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                              {cust.orderCount}
                            </td>
                            <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrencyVND(cust.totalSpent)}
                            </td>
                            <td className="py-3 px-3 font-bold text-orange-600 dark:text-orange-400">
                              {cust.currentDebt > 0 ? formatCurrencyVND(cust.currentDebt) : '0 ₫'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <Link
                                href={`/sale/orders/new?customerId=${cust.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 transition-colors"
                              >
                                <span>Tạo đơn</span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs">Chưa có khách hàng phụ trách hoặc chưa phát sinh đơn giao thành công.</p>
                <Link
                  href="/sale/customers"
                  className="inline-block px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white"
                >
                  Thêm khách hàng mới
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
