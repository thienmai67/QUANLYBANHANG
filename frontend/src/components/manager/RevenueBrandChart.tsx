'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { Brand, CORE_BRANDS } from '@/types/manager';
import { BrandMetric } from '@/lib/aggregates';
import { formatCurrencyVND } from '@/lib/formatters';

interface RevenueBrandChartProps {
  brandStats?: Record<Brand, BrandMetric>;
  className?: string;
}

const BRAND_COLORS: Record<Brand, string> = {
  Cadivi: '#ef4444', // Red
  'Bình Minh': '#3b82f6', // Blue
  Schneider: '#10b981', // Emerald
  Panasonic: '#6366f1', // Indigo
};

export function RevenueBrandChart({
  brandStats,
  className = '',
}: RevenueBrandChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`h-72 flex items-center justify-center text-slate-400 text-xs ${className}`}>
        Đang tải biểu đồ thương hiệu...
      </div>
    );
  }

  // Format data for Recharts
  const chartData = CORE_BRANDS.map((brand) => {
    const metric = brandStats ? brandStats[brand] : undefined;
    return {
      name: brand,
      value: metric?.revenue || 0,
      percentage: metric?.percentage || 0,
      orderCount: metric?.orderCount || 0,
      color: BRAND_COLORS[brand],
    };
  });

  const totalRevenue = chartData.reduce((sum, item) => sum + item.value, 0);

  if (totalRevenue === 0) {
    return (
      <div className={`h-72 flex flex-col items-center justify-center text-slate-400 text-xs gap-2 ${className}`}>
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400">
          %
        </div>
        <span>Chưa có dữ liệu doanh thu đơn hàng đã giao</span>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any, item: any) => [
                `${formatCurrencyVND(Number(value))} (${item?.payload?.percentage || 0}%)`,
                name,
              ]}
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: 'rgba(51, 65, 85, 0.8)',
                borderRadius: '0.75rem',
                color: '#fff',
                fontSize: '12px',
                padding: '8px 12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Brand Breakdown Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        {chartData.map((b) => (
          <div
            key={b.name}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 flex flex-col"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: b.color }}
              />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                {b.name}
              </span>
            </div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
              {formatCurrencyVND(b.value)}
            </span>
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{b.percentage}% thị phần</span>
              <span>{b.orderCount} đơn</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RevenueBrandChart;
