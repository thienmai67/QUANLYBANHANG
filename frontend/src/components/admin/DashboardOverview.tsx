'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Package,
  Users,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';

export function DashboardOverview() {
  const {
    orders,
    customers,
    products,
    fetchOrders,
    fetchProducts,
  } = useAdminStore();

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [fetchOrders, fetchProducts]);

  const totalRev = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.finalAmount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">Đã hoàn tất</span>;
      case 'Shipping2H':
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 rounded-full animate-pulse">Giao 2H</span>;
      case 'Preparing':
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-full">Đang chuẩn bị</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">Chờ xác nhận</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Tổng Quan Kinh Doanh TDT M&E
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi doanh số vật tư điện nước &amp; đơn hàng công trình
          </p>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Revenue */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Doanh Thu Vật Tư
            </span>
            <div className="p-2.5 bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {totalRev.toLocaleString('vi-VN')} <span className="text-sm font-semibold">VND</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Tổng doanh thu thực tế từ đơn hàng</span>
            </div>
          </div>
        </div>

        {/* Card 2: Orders */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Đơn Hàng Công Trình
            </span>
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {orders.length} <span className="text-sm font-semibold">đơn</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Tổng số đơn trên hệ thống</span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Products */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Sản Phẩm Đang Kinh Doanh
            </span>
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {products.length} <span className="text-sm font-semibold">sản phẩm</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Danh mục vật tư M&amp;E sẵn kho</span>
            </div>
          </div>
        </div>

        {/* Card 4: Contractors */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Nhà Thầu &amp; Đại Lý
            </span>
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {customers.length} <span className="text-sm font-semibold">đối tác</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Khách hàng phát sinh đơn</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width Recent Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Đơn Hàng Công Trình Gần Đây
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Danh sách các đơn hàng M&amp;E vừa khởi tạo
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
          >
            Tất cả đơn hàng <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-4">Mã đơn</th>
                <th className="py-3 px-4">Nhà thầu / Công trình</th>
                <th className="py-3 px-4 text-right">Tổng tiền (VND)</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400 font-medium">
                    Chưa có dữ liệu
                  </td>
                </tr>
              ) : (
                orders.slice(0, 8).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {order.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                        {order.contractorName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">
                        {order.deliveryAddress}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                      {order.finalAmount.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
