'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  FileText,
  Percent,
  CreditCard,
  Calendar,
  Filter,
  Award,
  Users,
  Layers,
} from 'lucide-react';
import { useSaleStore } from '@/store/useSaleStore';
import { formatCurrencyVND } from '@/lib/formatters';

export default function SaleReportsPage() {
  const { reports, fetchReports, isLoading } = useSaleStore();

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchReports(fromDate, toDate);
  }, [fetchReports, fromDate, toDate]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports(fromDate, toDate);
  };

  const maxRevenueDate = Math.max(
    ...(reports?.revenueByDate?.map((r) => r.amount) || [1000000])
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Báo cáo Hiệu quả Kinh doanh Cá nhân (Sales KPIs)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Theo dõi doanh số giao hàng thực tế, tỷ lệ chốt đơn và công nợ phát sinh theo kỳ kế toán.
          </p>
        </div>

        <form onSubmit={handleApplyFilter} className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Từ:</span>
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-xs text-slate-500">-</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            Lọc
          </button>
        </form>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Delivered Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Doanh số đã giao (DELIVERED)
            </span>
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrencyVND(reports?.totalDeliveredRevenue || 0)}
          </div>
          <div className="text-xs text-slate-500">
            Từ {reports?.totalOrdersCount || 0} đơn hàng hoàn tất
          </div>
        </div>

        {/* Quotes & Conversion Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tỷ lệ chốt Báo giá B2B
            </span>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {(reports?.conversionRate || 0).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500">
            {reports?.quotesConverted || 0} chuyển đổi / {reports?.quotesSent || 0} đã gửi
          </div>
        </div>

        {/* Total Quotes Created */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Báo giá khách đã chốt
            </span>
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {reports?.quotesAccepted || 0}
          </div>
          <div className="text-xs text-slate-500">
            Đạt đồng thuận với chủ thầu / dự án
          </div>
        </div>

        {/* Outstanding Debt */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Công nợ cần thu hồi
            </span>
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {formatCurrencyVND(reports?.outstandingDebt || 0)}
          </div>
          <div className="text-xs text-slate-500">
            Cần đối soát theo dõi hàng tuần
          </div>
        </div>
      </div>

      {/* Revenue Over Time Chart (CSS Bar Chart) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Biểu đồ Doanh số Thực tế theo ngày
            </h2>
          </div>
          <span className="text-xs text-slate-500">Đơn vị: VND</span>
        </div>

        {reports?.revenueByDate && reports.revenueByDate.length > 0 ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-end gap-2 h-44 border-b border-slate-200 dark:border-slate-800 pb-2">
              {reports.revenueByDate.map((item, idx) => {
                const heightPercent = maxRevenueDate > 0 ? (item.amount / maxRevenueDate) * 100 : 0;
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
                  >
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-900 text-white text-[11px] px-2 py-1 rounded shadow pointer-events-none whitespace-nowrap">
                      <div>{item.date}</div>
                      <div>{formatCurrencyVND(item.amount)} ({item.orders} đơn)</div>
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${Math.max(6, heightPercent)}%` }}
                      className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-all"
                    />

                    {/* Date label */}
                    <span className="text-[10px] text-slate-400 truncate max-w-[40px] text-center">
                      {item.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            Chưa có phát sinh đơn hàng giao thành công trong khoảng thời gian này.
          </div>
        )}
      </div>

      {/* Breakdown: Customers & Brands */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Customers Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Top Khách hàng Đóng góp Doanh số
            </h3>
          </div>

          {reports?.revenueByCustomer && reports.revenueByCustomer.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.revenueByCustomer.map((c, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {c.customerName}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrencyVND(c.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">Chưa có dữ liệu khách hàng.</div>
          )}
        </div>

        {/* Top Brands Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Cơ cấu Doanh số theo Thương hiệu
            </h3>
          </div>

          {reports?.revenueByBrand && reports.revenueByBrand.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.revenueByBrand.map((b, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {b.brandName}
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrencyVND(b.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">Chưa có dữ liệu thương hiệu.</div>
          )}
        </div>
      </div>
    </div>
  );
}
