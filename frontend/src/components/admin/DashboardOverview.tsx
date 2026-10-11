'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  FileSpreadsheet,
  Users,
  Calendar,
  ExternalLink,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAdminStore } from '../../store/useAdminStore';

const BRAND_COLORS: Record<string, string> = {
  Cadivi: '#DC2626',
  'Bình Minh': '#1D4ED8',
  Schneider: '#166534',
  Panasonic: '#D97706',
  'Minh Hòa': '#0891B2',
  Legrand: '#7C3AED',
};

export function DashboardOverview() {
  const {
    selectedPeriod,
    setSelectedPeriod,
    orders,
    bomRequests,
    customers,
    products,
    fetchOrders,
    fetchProducts,
  } = useAdminStore();

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [fetchOrders, fetchProducts]);

  const daysCount =
    selectedPeriod === '7days'
      ? 7
      : selectedPeriod === '30days'
        ? 30
        : selectedPeriod === '3months'
          ? 90
          : 365;

  const chartData = useMemo(() => {
    const today = new Date();
    const buckets: Array<{ date: string; key: string; revenue: number; orders: number }> = [];
    const displayDays = Math.min(daysCount, 30);

    for (let i = displayDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      buckets.push({
        date: `${dd}/${mm}`,
        key: `${yyyy}-${mm}-${dd}`,
        revenue: 0,
        orders: 0,
      });
    }

    const bucketMap = new Map(buckets.map((b) => [b.key, b]));
    orders.forEach((o) => {
      if (o.status === 'Cancelled') return;
      const dateKey = String(o.createdAt || '').slice(0, 10);
      const target = bucketMap.get(dateKey);
      if (target) {
        target.revenue += o.finalAmount || 0;
        target.orders += 1;
      }
    });

    return buckets;
  }, [orders, daysCount]);

  const hasChartData = useMemo(
    () => orders.length > 0 && chartData.some((d) => d.revenue > 0 || d.orders > 0),
    [orders, chartData]
  );

  const brandShareData = useMemo(() => {
    const prodById = new Map(products.map((p) => [p.id, p]));
    const prodBySku = new Map(products.map((p) => [p.sku.toLowerCase(), p]));
    const totals = new Map<string, number>();

    orders.forEach((o) => {
      if (o.status === 'Cancelled') return;
      (o.items || []).forEach((it) => {
        const matched =
          prodById.get(it.productId) ||
          (it.sku ? prodBySku.get(it.sku.toLowerCase()) : undefined);
        const brand = matched?.brand || 'Cadivi';
        const lineTotal =
          it.quantity * it.unitPrice * (1 - (it.discountRate || 0) / 100);
        totals.set(brand, (totals.get(brand) || 0) + lineTotal);
      });
    });

    const grandTotal = Array.from(totals.values()).reduce((s, v) => s + v, 0);
    if (grandTotal <= 0) return [];

    return Array.from(totals.entries()).map(([brand, amt]) => ({
      brand,
      value: Math.round((amt / grandTotal) * 100),
      color: BRAND_COLORS[brand] || '#0891B2',
    }));
  }, [orders, products]);

  const totalRev = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.finalAmount, 0);
  const pendingBom = bomRequests.filter((b) => b.status === 'PendingReview').length;

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
      {/* Page Title & Time Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Tổng Quan Kinh Doanh TDT M&E
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi doanh số vật tư điện nước, tiến độ BOM & đơn hàng công trình
          </p>
        </div>

        {/* Filter selector */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-slate-400 ml-2" />
          {[
            { id: '7days', label: '7 ngày' },
            { id: '30days', label: '30 ngày' },
            { id: '3months', label: '3 tháng' },
            { id: '12months', label: '12 tháng' },
          ].map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                selectedPeriod === period.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {period.label}
            </button>
          ))}
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

        {/* Card 3: Pending BOM */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Yêu Cầu BOM Chờ Duyệt
            </span>
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {pendingBom} <span className="text-sm font-semibold">file BOM</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <span>{pendingBom > 0 ? 'Cần báo giá trong 2H' : 'Chưa có yêu cầu'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Contractors */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Nhà Thầu & Đại Lý
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Recharts AreaChart (2 cols) */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Xu Hướng Doanh Thu Vật Tư M&E
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Doanh số theo thời gian (VND)
              </p>
            </div>
            <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-3 py-1.5 rounded-xl border border-cyan-200 dark:border-cyan-900">
              Live updates
            </span>
          </div>

          {!hasChartData ? (
            <div className="h-72 w-full flex items-center justify-center text-sm font-semibold text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Chưa có dữ liệu
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891B2" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0891B2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${Number(val || 0).toLocaleString('vi-VN')} VND`, 'Doanh thu']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '12px',
                      color: '#FFF',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0891B2"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Brand Share PieChart (1 col) */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Thị Phần Doanh Số Theo Thương Hiệu
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Cadivi, Bình Minh, Schneider, Panasonic
            </p>

            {brandShareData.length === 0 ? (
              <div className="h-48 w-full mt-4 flex items-center justify-center text-sm font-semibold text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Chưa có dữ liệu
              </div>
            ) : (
              <div className="h-48 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={brandShareData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {brandShareData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, 'Tỷ trọng']}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '12px',
                        color: '#FFF',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {brandShareData.length > 0 && (
            <div className="space-y-2 mt-4">
              {brandShareData.map((item) => (
                <div key={item.brand} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.brand}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{item.value}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tables Row: Recent Orders + Top Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Đơn Hàng Công Trình Gần Đây
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Danh sách các đơn hàng M&E vừa khởi tạo
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
                  orders.slice(0, 5).map((order) => (
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

        {/* Top Materials (1 col) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Vật Tư Bán Chạy Nhất
            </h3>
            <Link
              href="/admin/products"
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
            >
              Xem kho
            </Link>
          </div>

          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="py-8 text-center text-xs font-medium text-slate-400">
                Chưa có sản phẩm
              </div>
            ) : (
              products.slice(0, 5).map((prod, index) => (
                <div key={prod.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 text-xs">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {prod.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        SKU: {prod.sku} · Tồn kho: <span className="font-bold text-slate-700 dark:text-slate-300">{prod.stock} {prod.unit}</span>
                      </p>
                    </div>
                  </div>

                  <span className="font-bold text-cyan-600 dark:text-cyan-400 shrink-0 ml-2">
                    -{prod.discountRate}% CK
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

