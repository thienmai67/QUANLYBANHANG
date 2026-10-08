'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useManagerStore } from '@/store/useManagerStore';
import {
  calculateDeliveredRevenue,
  countPendingOrders,
} from '@/lib/aggregates';
import { formatCurrencyVND, formatDateTime, formatNumberVND } from '@/lib/formatters';
import { RevenueBrandChart } from '@/components/manager/RevenueBrandChart';
import { RevenueTrendChart } from '@/components/manager/RevenueTrendChart';
import { OrderStatusBadge } from '@/components/manager/OrderStatusBadge';
import { OrderCountdownBadge } from '@/components/manager/OrderCountdownBadge';
import { OrderDetailModal } from '@/components/manager/OrderDetailModal';
import { Order } from '@/types/manager';
import {
  DollarSign,
  Clock,
  CheckCircle2,
  Truck,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Eye,
  TrendingUp,
  Layers,
} from 'lucide-react';

export default function ManagerDashboardPage() {
  const { orders, products, shippers, getBrandStats, getRevenueTrend, fetchOrders } = useManagerStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const [trendPeriod, setTrendPeriod] = useState<'day' | 'month'>('month');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Compute KPIs
  const deliveredRevenue = calculateDeliveredRevenue(orders);
  const pendingCount = countPendingOrders(orders);
  const completedCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const activeShippersCount = shippers.filter((s) => s.status?.toLowerCase() !== 'offline').length;
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockLevel).length;

  const brandStats = getBrandStats();
  const trendData = getRevenueTrend(trendPeriod);

  // Recent 6 orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Bảng Điều Khiển Vận Hành
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tổng quan doanh số, điều phối đơn hàng và giám sát kho vật tư M&E
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/manager/orders?status=PENDING"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20 transition-all"
          >
            <Clock className="w-4 h-4" />
            <span>Duyệt đơn chờ ({pendingCount})</span>
          </Link>
        </div>
      </div>

      {/* 5 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* KPI 1: Delivered Revenue */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Doanh thu đã giao
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
              {formatCurrencyVND(deliveredRevenue)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Từ các đơn hàng DELIVERED
            </p>
          </div>
        </div>

        {/* KPI 2: Pending Orders */}
        <Link
          href="/manager/orders?status=PENDING"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-500/50 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Đơn hàng chờ duyệt
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400">
              {pendingCount}{' '}
              <span className="text-xs font-normal text-slate-400">đơn</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 group-hover:text-amber-600">
              <span>Cần duyệt kho ngay</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </p>
          </div>
        </Link>

        {/* KPI 3: Completed Orders */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Đơn hoàn thành
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {completedCount}{' '}
              <span className="text-xs font-normal text-slate-400">đơn</span>
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
              Giao hàng thành công
            </p>
          </div>
        </div>

        {/* KPI 4: Active Shippers */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Shipper trực tuyến
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {activeShippersCount} / {shippers.length}{' '}
              <span className="text-xs font-normal text-slate-400">người</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Sẵn sàng nhận giao hỏa tốc 2H
            </p>
          </div>
        </div>

        {/* KPI 5: Inventory Alert Count */}
        <Link
          href="/manager/products"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-rose-400 dark:hover:border-rose-500/50 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              Cảnh báo tồn kho
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400">
              {lowStockCount}{' '}
              <span className="text-xs font-normal text-slate-400">mã hàng</span>
            </div>
            <p className="text-[10px] text-rose-500 dark:text-rose-400/80 mt-0.5 flex items-center gap-1">
              <span>Tồn kho ≤ mức tối thiểu</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </p>
          </div>
        </Link>
      </div>

      {/* Main Charts Row: Revenue Trend & 4-Brand Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Revenue Trend Chart (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span>Xu Hướng Doanh Thu Vận Hành</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Doanh số ghi nhận từ các đơn giao thành công (chuỗi dữ liệu zero-fill)
              </p>
            </div>
          </div>

          <RevenueTrendChart
            data={trendData}
            period={trendPeriod}
            onPeriodChange={(p) => setTrendPeriod(p)}
          />
        </div>

        {/* Right: 4-Brand Breakdown Chart (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Cơ Cấu Doanh Số 4 Thương Hiệu</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Cadivi, Bình Minh, Schneider và Panasonic
            </p>
          </div>

          <RevenueBrandChart brandStats={brandStats} />
        </div>
      </div>

      {/* Quick Recent Orders List */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Đơn Hàng Gần Đây</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Cập nhật mới nhất từ khách hàng bán lẻ và công trình
            </p>
          </div>

          <Link
            href="/manager/orders"
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1 group"
          >
            <span>Xem tất cả ({orders.length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Orders Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Giao hàng</th>
                  <th className="px-4 py-3 text-right">Giá trị đơn</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      #{order.code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">
                        {order.customerName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                        {order.customerPhone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {order.is2H ? (
                        <OrderCountdownBadge order={order} size="sm" />
                      ) : (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Tiêu chuẩn
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrencyVND(order.finalAmount ?? order.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <OrderStatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(order)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Xem chi tiết đơn hàng"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
