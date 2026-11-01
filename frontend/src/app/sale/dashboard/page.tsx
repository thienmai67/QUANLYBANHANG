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
    <div className="space-y-6">
      {/* Quick Action Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 text-white shadow-xl shadow-purple-900/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/20 tracking-wider">
              Bán Hàng &amp; Dự Án
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight font-display">
            Không Gian Làm Việc Nhân Viên Bán Hàng
          </h2>
          <p className="text-xs text-purple-200">
            Quản lý khách hàng phụ trách, lập báo giá dự án và tạo đơn hàng nhanh chóng
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href="/sale/orders/new"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-white text-purple-900 hover:bg-purple-50 transition-all shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đơn hộ</span>
          </Link>
          <Link
            href="/sale/quotes/new"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-purple-600/60 hover:bg-purple-600 text-white border border-purple-400/40 transition-all shrink-0"
          >
            <FileText className="w-4 h-4" />
            <span>Lập báo giá</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Orders */}
        <Link
          href="/sale/orders?status=PENDING"
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Đơn Chờ Xử Lý
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
              {stats.pendingOrdersCount}
            </span>
            <span className="text-xs text-slate-400">đơn hàng</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>Chờ đóng gói &amp; điều phối</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>

        {/* Card 2: Expiring 2H Orders */}
        <Link
          href="/sale/orders"
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 dark:hover:border-rose-500/50 transition-all shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Đơn 2H Sắp Hạn
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
              {stats.expiring2hOrdersCount}
            </span>
            <span className="text-xs text-slate-400">đơn cần lưu ý</span>
          </div>
          <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
            <span>Hạn giao dưới 2 giờ</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>

        {/* Card 3: Month Delivered Revenue */}
        <Link
          href="/sale/reports"
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Doanh Số Tháng Này
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl lg:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-display">
              {formatCurrencyVND(stats.monthDeliveredRevenue)}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>Tính từ đơn giao thành công (Delivered)</span>
          </p>
        </Link>

        {/* Card 4: Overdue Debt */}
        <Link
          href="/sale/payments?overdue_only=true"
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 dark:hover:border-orange-500/50 transition-all shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Công Nợ Quá Hạn (&gt;30N)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl lg:text-2xl font-extrabold text-orange-600 dark:text-orange-400 font-display">
              {formatCurrencyVND(stats.overdueDebt)}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>Cần đôn đốc thu hồi công nợ</span>
          </p>
        </Link>
      </div>

      {/* Main Grid: To-Do List & Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Today's Tasks & Urgent Reminders */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Việc Cần Xử Lý Hôm Nay</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                {stats.dueFollowupsCount + stats.expiringQuotesCount + stats.unpaidOrdersCount} mục
              </span>
            </div>

            <div className="space-y-3">
              {/* Item 1: Followup reminders */}
              <Link
                href="/sale/activities?due_today=true"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/60 dark:border-slate-700/60 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Lịch chăm sóc đến hạn
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Cần gọi điện / gặp gỡ trao đổi
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50">
                    {stats.dueFollowupsCount}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Item 2: Expiring quotes */}
              <Link
                href="/sale/quotes"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/60 dark:border-slate-700/60 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Báo giá sắp hết hạn
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Hiệu lực còn dưới 3 ngày
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50">
                    {stats.expiringQuotesCount}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Item 3: Unpaid orders */}
              <Link
                href="/sale/payments?unpaid_only=true"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/60 dark:border-slate-700/60 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Đơn chưa thanh toán
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Theo dõi COD / Chuyển khoản
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
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
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Top Khách Hàng Phụ Trách</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Xếp hạng theo tổng doanh thu tích lũy từ các đơn hàng đã giao thành công
                </p>
              </div>

              <Link
                href="/sale/customers"
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stats.topCustomers && stats.topCustomers.length > 0 ? (
              <div className="overflow-x-auto">
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
