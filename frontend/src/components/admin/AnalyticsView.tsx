'use client';

import React from 'react';
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
import { TrendingUp, PieChartIcon, ArrowUpRight, Award, Zap } from 'lucide-react';
import { mockRevenue30Days, mockBrandShare } from '../../data/adminMockData';

export function AnalyticsView() {
  const categorySales = [
    { category: 'Dây & Cáp Điện (Cadivi)', sales: 1280000000, color: '#DC2626' },
    { category: 'Ống & Phụ Kiện Nhựa (Bình Minh)', sales: 850000000, color: '#1D4ED8' },
    { category: 'Tủ & Thiết Bị Đóng Cắt (Schneider)', sales: 510000000, color: '#166534' },
    { category: 'Van & Phụ Kiện Đường Ống (Minh Hòa)', sales: 205000000, color: '#0891B2' },
  ];

  const contractorGrowth = [
    { month: 'Thg 10', contractors: 62 },
    { month: 'Thg 11', contractors: 68 },
    { month: 'Thg 12', contractors: 74 },
    { month: 'Thg 01', contractors: 79 },
    { month: 'Thg 02', contractors: 83 },
    { month: 'Thg 03', contractors: 89 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Báo Cáo & Phân Tích Chuyên Sâu TDT M&E
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Phân tích chi tiết doanh số theo thương hiệu, tỷ lệ chốt BOM & tăng trưởng nhà thầu
        </p>
      </div>

      {/* Highlights Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Tỷ lệ chốt BOM tự động</span>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            78.4%
          </h3>
          <p className="text-xs text-slate-500 mt-1">+4.2% so với tháng trước</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Giá trị TB đơn công trình</span>
          <h3 className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-2">
            142.500.000 <span className="text-xs">VND</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">Năng lực đáp ứng vật tư 2H</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Thương hiệu tăng trưởng mạnh</span>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            Cadivi (+24.5%)
          </h3>
          <p className="text-xs text-slate-500 mt-1">Dây cáp điện hạ thế CV/CXV</p>
        </div>
      </div>

      {/* Recharts Bar Chart: Sales by Category */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
          Doanh Số Theo Nhóm Vật Tư M&E (VND)
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Thống kê tổng tiền xuất kho theo 4 ngành hàng chủ lực
        </p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categorySales} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="category" tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickFormatter={(val) => `${(val / 1000000000).toFixed(1)}T`}
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
      </div>

      {/* Grid 2 Charts: Contractor Growth + Brand Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart: Contractor Growth */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
            Tăng Trưởng Số Lượng Nhà Thầu & Đại Lý
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Số đối tác ký hợp đồng nguyên tắc theo tháng
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={contractorGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} đối tác`, 'Tổng nhà thầu']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="contractors"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#10B981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Brand Share Pie */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Phân Phối Sản Lượng Thương Hiệu
            </h3>
            <p className="text-xs text-slate-500 mb-4">Tỷ trọng đóng góp vào tổng doanh số M&E</p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockBrandShare}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {mockBrandShare.map((entry, index) => (
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
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            {mockBrandShare.map((b) => (
              <div key={b.brand} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{b.brand}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
