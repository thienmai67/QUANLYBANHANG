'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TimeBucket } from '@/lib/aggregates';
import { formatCurrencyVND } from '@/lib/formatters';
import { Calendar, BarChart2 } from 'lucide-react';

interface RevenueTrendChartProps {
  data?: TimeBucket[];
  period?: 'day' | 'month';
  onPeriodChange?: (period: 'day' | 'month') => void;
  className?: string;
}

// Compact currency formatter for Y-axis (e.g. 50M, 100M VND)
function formatCompactVND(val: number): string {
  if (val >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toFixed(1).replace('.0', '')} tỷ`;
  }
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(0)} tr`;
  }
  if (val >= 1_000) {
    return `${(val / 1_000).toFixed(0)} k`;
  }
  return `${val}`;
}

export function RevenueTrendChart({
  data = [],
  period = 'month',
  onPeriodChange,
  className = '',
}: RevenueTrendChartProps) {
  const [mounted, setMounted] = useState(false);
  const [activePeriod, setActivePeriod] = useState<'day' | 'month'>(period);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePeriodChange = (newPeriod: 'day' | 'month') => {
    setActivePeriod(newPeriod);
    if (onPeriodChange) {
      onPeriodChange(newPeriod);
    }
  };

  if (!mounted) {
    return (
      <div className={`h-72 flex items-center justify-center text-slate-400 text-xs ${className}`}>
        Đang tải biểu đồ doanh số...
      </div>
    );
  }

  const totalPeriodRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);

  return (
    <div className={`w-full flex flex-col ${className}`}>
      {/* Header with period toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Tổng doanh thu kỳ:
          </span>{' '}
          <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
            {formatCurrencyVND(totalPeriodRevenue)}
          </span>
        </div>

        {/* Day / Month Toggle Buttons */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => handlePeriodChange('day')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activePeriod === 'day'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Theo ngày
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange('month')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activePeriod === 'month'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Theo tháng
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-64 sm:h-72 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            Chưa có dữ liệu cho khoảng thời gian này
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148, 163, 184, 0.2)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="currentColor"
                className="text-[11px] text-slate-400"
                tickLine={false}
                axisLine={false}
                dy={6}
              />
              <YAxis
                stroke="currentColor"
                className="text-[11px] text-slate-400"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactVND}
                dx={-4}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const rev = payload[0].value as number;
                    const orderCount = payload[0].payload.orderCount as number;
                    return (
                      <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                        <div className="font-bold text-slate-300">{label}</div>
                        <div className="text-amber-400 font-extrabold text-sm">
                          {formatCurrencyVND(rev)}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          Số đơn hoàn thành: <span className="text-white font-semibold">{orderCount}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#revenueGradient)"
                activeDot={{ r: 6, fill: '#d97706', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default RevenueTrendChart;
