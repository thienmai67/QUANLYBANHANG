'use client';

import React, { useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
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

const CATEGORY_COLORS: Record<string, string> = {
  'Dây & Cáp Điện': '#DC2626',
  'Ống & Phụ Kiện Nhựa': '#1D4ED8',
  'Tủ & Thiết Bị Đóng Cắt': '#166534',
  'Van & Phụ Kiện Đường Ống': '#0891B2',
};

export function AnalyticsView() {
  const { orders, products, bomRequests, fetchOrders, fetchProducts } = useAdminStore();

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [fetchOrders, fetchProducts]);

  const validOrders = useMemo(
    () => orders.filter((o) => o.status !== 'Cancelled'),
    [orders]
  );

  const avgOrderValue = useMemo(() => {
    if (validOrders.length === 0) return 0;
    const sum = validOrders.reduce((s, o) => s + (o.finalAmount || 0), 0);
    return Math.round(sum / validOrders.length);
  }, [validOrders]);

  const bomConversionRate = useMemo(() => {
    if (bomRequests.length === 0) return null;
    const converted = bomRequests.filter((b) => b.status === 'ConvertedToOrder').length;
    return ((converted / bomRequests.length) * 100).toFixed(1);
  }, [bomRequests]);

  const { categorySales, brandShare, topBrandName } = useMemo(() => {
    const prodById = new Map(products.map((p) => [p.id, p]));
    const prodBySku = new Map(products.map((p) => [p.sku.toLowerCase(), p]));

    const catTotals = new Map<string, number>();
    const brandTotals = new Map<string, number>();

    validOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const matched =
          prodById.get(it.productId) ||
          (it.sku ? prodBySku.get(it.sku.toLowerCase()) : undefined);
        const cat = matched?.category || 'Dây & Cáp Điện';
        const brand = matched?.brand || 'Cadivi';
        const lineTotal =
          it.quantity * it.unitPrice * (1 - (it.discountRate || 0) / 100);
        catTotals.set(cat, (catTotals.get(cat) || 0) + lineTotal);
        brandTotals.set(brand, (brandTotals.get(brand) || 0) + lineTotal);
      });
    });

    const catList = Array.from(catTotals.entries())
      .filter(([, sales]) => sales > 0)
      .map(([category, sales]) => ({
        category,
        sales,
        color: CATEGORY_COLORS[category] || '#0891B2',
      }));

    const grandBrandTotal = Array.from(brandTotals.values()).reduce((s, v) => s + v, 0);
    const brandList =
      grandBrandTotal > 0
        ? Array.from(brandTotals.entries()).map(([brand, amt]) => ({
            brand,
            value: Math.round((amt / grandBrandTotal) * 100),
            amount: amt,
            color: BRAND_COLORS[brand] || '#0891B2',
          }))
        : [];

    const sortedBrands = [...brandList].sort((a, b) => b.amount - a.amount);
    const topBrand = sortedBrands.length > 0 ? sortedBrands[0].brand : null;

    return {
      categorySales: catList,
      brandShare: brandList,
      topBrandName: topBrand,
    };
  }, [validOrders, products]);

  const dailyRevenue30Days = useMemo(() => {
    if (validOrders.length === 0) return [];
    const today = new Date();
    const buckets: Array<{ date: string; key: string; revenue: number; orders: number }> = [];
    for (let i = 29; i >= 0; i--) {
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
    const map = new Map(buckets.map((b) => [b.key, b]));
    validOrders.forEach((o) => {
      const k = String(o.createdAt || '').slice(0, 10);
      const b = map.get(k);
      if (b) {
        b.revenue += o.finalAmount || 0;
        b.orders += 1;
      }
    });
    return buckets;
  }, [validOrders]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Báo Cáo & Phân Tích Chuyên Sâu TDT M&E
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Phân tích chi tiết doanh số theo thương hiệu, tỷ lệ chốt BOM & tăng trưởng đơn hàng
        </p>
      </div>

      {/* Highlights Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Tỷ lệ chốt BOM tự động</span>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {bomConversionRate !== null ? `${bomConversionRate}%` : 'Chưa có dữ liệu'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {bomRequests.length > 0 ? `${bomRequests.length} yêu cầu BOM` : 'Chưa có yêu cầu BOM'}
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Giá trị TB đơn công trình</span>
          <h3 className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-2">
            {validOrders.length > 0 ? (
              <>
                {avgOrderValue.toLocaleString('vi-VN')} <span className="text-xs">VND</span>
              </>
            ) : (
              'Chưa có dữ liệu'
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {validOrders.length > 0 ? `Tính trên ${validOrders.length} đơn hàng` : 'Chưa phát sinh đơn hàng'}
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Thương hiệu dẫn đầu doanh số</span>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {topBrandName || 'Chưa có dữ liệu'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {topBrandName ? 'Thương hiệu có doanh thu cao nhất' : 'Chưa có dữ liệu'}
          </p>
        </div>
      </div>

      {/* Recharts Bar Chart: Sales by Category */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
          Doanh Số Theo Nhóm Vật Tư M&E (VND)
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Thống kê tổng tiền xuất kho theo ngành hàng thực tế
        </p>

        {categorySales.length === 0 ? (
          <div className="h-72 w-full flex items-center justify-center text-sm font-semibold text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            Chưa có dữ liệu
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySales} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="category" tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(val: any) => [`${Number(val || 0).toLocaleString('vi-VN')} VND`, 'Doanh số']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="sales" radius={[8, 8, 0, 0]}>
                  {categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Grid 2 Charts: Daily Revenue 30 Days + Brand Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart: 30-Day Revenue */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
            Biến Động Doanh Thu 30 Ngày Gần Nhất
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Tổng hợp doanh thu thực tế theo ngày (VND)
          </p>

          {dailyRevenue30Days.length === 0 ? (
            <div className="h-64 w-full flex items-center justify-center text-sm font-semibold text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Chưa có dữ liệu
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyRevenue30Days}>
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
                      borderRadius: '12px',
                      color: '#FFF',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ r: 3, fill: '#10B981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Brand Share Pie */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Phân Phối Sản Lượng Thương Hiệu
            </h3>
            <p className="text-xs text-slate-500 mb-4">Tỷ trọng đóng góp vào tổng doanh số M&E</p>

            {brandShare.length === 0 ? (
              <div className="h-48 w-full flex items-center justify-center text-sm font-semibold text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Chưa có dữ liệu
              </div>
            ) : (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={brandShare}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {brandShare.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, 'Tỷ lệ']}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '12px',
                        color: '#FFF',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {brandShare.length > 0 && (
            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              {brandShare.map((b) => (
                <div key={b.brand} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                    {b.brand} ({b.value}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

