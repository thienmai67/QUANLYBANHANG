'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useManagerStore } from '@/store/useManagerStore';
import { useShipperUIStore } from '@/store/useShipperUIStore';
import { useToast } from '@/hooks/useToast';
import { useNow } from '@/hooks/useNow';
import {
  calculateShipper2HOnTimeRate,
  getShipperWorkload,
  MAX_SHIPPER_ACTIVE_ORDERS,
} from '@/lib/orderRules';
import { formatCurrencyVND } from '@/lib/formatters';
import {
  Clock,
  Wallet,
  Zap,
  CheckCircle,
  AlertTriangle,
  Power,
  ChevronRight,
} from 'lucide-react';

interface ShipperWidgetsProps {
  shipperId: string;
}

export default function ShipperWidgets({ shipperId }: ShipperWidgetsProps) {
  const toast = useToast();
  const now = useNow(60000);
  const { isHighContrast } = useShipperUIStore();
  const {
    shippers,
    orders,
    updateShipperShift,
    getShipperUnsettledCod,
  } = useManagerStore();

  const [rateFilter, setRateFilter] = useState<'today' | '7days'>('today');

  const shipper = shippers.find((s) => s.id === shipperId) || {
    id: shipperId,
    name: 'Nhân viên giao hàng',
    shiftStatus: 'available',
    status: 'available',
    activeOrders: 0,
  };

  const currentShift = shipper.shiftStatus || (shipper.status?.toLowerCase() === 'offline' ? 'offline' : shipper.status?.toLowerCase() === 'busy' ? 'busy' : 'available');
  const workload = getShipperWorkload(orders, shipperId);
  const unsettledCod = getShipperUnsettledCod(shipperId);
  const onTimeStats = calculateShipper2HOnTimeRate(
    orders,
    shipperId,
    rateFilter,
    now
  );

  const handleShiftChange = (targetStatus: 'available' | 'busy' | 'offline') => {
    if (targetStatus === currentShift) return;

    const res = updateShipperShift(shipperId, targetStatus);
    if (res.success) {
      toast.success(
        targetStatus === 'available'
          ? 'Đã bật ca: Sẵn sàng nhận đơn!'
          : targetStatus === 'busy'
          ? 'Đã chuyển trạng thái: Đang bận chở hàng!'
          : 'Đã tắt ca: Nghỉ ca an toàn!'
      );
    } else {
      toast.error(res.error || 'Không thể chuyển trạng thái ca');
    }
  };

  return (
    <div className="space-y-3 px-4 pt-3">
      {/* 1. Quick Shift Status Selector (Large touch targets >= 48px) */}
      <div
        className={`p-3 rounded-2xl border transition-colors ${
          isHighContrast
            ? 'bg-white border-2 border-black'
            : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-xs font-bold flex items-center gap-1.5 ${
              isHighContrast ? 'text-black' : 'text-slate-300'
            }`}
          >
            <Power className="w-3.5 h-3.5 text-amber-500" />
            Trạng thái ca làm việc:
          </span>
          <span
            className={`text-[11px] font-mono font-bold ${
              isHighContrast ? 'text-black' : 'text-slate-400'
            }`}
          >
            Hôm nay
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'available', label: 'Sẵn sàng', color: 'emerald' },
            { id: 'busy', label: 'Đang bận', color: 'amber' },
            { id: 'offline', label: 'Nghỉ ca', color: 'slate' },
          ].map((item) => {
            const isActive = currentShift === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleShiftChange(item.id as any)}
                className={`min-h-[48px] py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border active:scale-95 ${
                  isActive
                    ? isHighContrast
                      ? 'bg-black text-white border-2 border-black shadow-md'
                      : item.id === 'available'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30 font-black'
                      : item.id === 'busy'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/30 font-black'
                      : 'bg-slate-700 text-white border-slate-600 shadow-lg shadow-slate-700/30 font-black'
                    : isHighContrast
                    ? 'bg-slate-100 text-black border-2 border-black hover:bg-slate-200'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="text-[9px] opacity-80 mt-0.5">• Đang chọn •</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Three Metric Cards Grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* Workload Metric */}
        <div
          className={`p-3 rounded-2xl border flex flex-col justify-between transition-colors ${
            isHighContrast
              ? 'bg-white border-2 border-black text-black'
              : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400">
              Tải đơn
            </span>
            <Zap
              className={`w-3.5 h-3.5 ${
                workload >= MAX_SHIPPER_ACTIVE_ORDERS
                  ? 'text-rose-500'
                  : workload >= 4
                  ? 'text-amber-500'
                  : 'text-emerald-500'
              }`}
            />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span
                className={`text-xl font-black font-mono leading-none ${
                  isHighContrast
                    ? 'text-black'
                    : workload >= MAX_SHIPPER_ACTIVE_ORDERS
                    ? 'text-rose-400'
                    : workload >= 4
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {workload}
              </span>
              <span className="text-xs text-slate-400 font-bold">
                /{MAX_SHIPPER_ACTIVE_ORDERS}
              </span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full bg-slate-700/40 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-700/50">
              <div
                className={`h-full transition-all duration-300 ${
                  workload >= MAX_SHIPPER_ACTIVE_ORDERS
                    ? 'bg-rose-500'
                    : workload >= 4
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{
                  width: `${Math.min(100, (workload / MAX_SHIPPER_ACTIVE_ORDERS) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* COD Wallet Metric */}
        <Link
          href="/shipper/cod"
          className={`p-3 rounded-2xl border flex flex-col justify-between transition-all active:scale-95 ${
            isHighContrast
              ? 'bg-white border-2 border-black text-black hover:bg-slate-50'
              : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Ví COD</span>
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2">
            <p
              className={`text-sm font-black font-mono truncate leading-tight ${
                isHighContrast
                  ? 'text-black'
                  : unsettledCod.totalAmount > 0
                  ? 'text-emerald-400'
                  : 'text-slate-300'
              }`}
            >
              {formatCurrencyVND(unsettledCod.totalAmount)}
            </p>
            <p className="text-[10px] text-slate-400 truncate mt-1">
              Hôm nay: {formatCurrencyVND(unsettledCod.todayAmount)}
            </p>
          </div>
        </Link>

        {/* 2H On-Time Rate Metric */}
        <div
          className={`p-3 rounded-2xl border flex flex-col justify-between transition-colors ${
            isHighContrast
              ? 'bg-white border-2 border-black text-black'
              : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">2H chuẩn</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1">
            <div className="flex items-baseline justify-between">
              <span
                className={`text-xl font-black font-mono leading-none ${
                  isHighContrast ? 'text-black' : 'text-cyan-400'
                }`}
              >
                {onTimeStats.rateFormatted}
              </span>
              <span className="text-[10px] text-slate-400">
                {onTimeStats.onTime2H}/{onTimeStats.total2H}
              </span>
            </div>
            {/* Filter Toggle Pill */}
            <div className="flex items-center gap-1 mt-1.5">
              <button
                type="button"
                onClick={() => setRateFilter('today')}
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all ${
                  rateFilter === 'today'
                    ? isHighContrast
                      ? 'bg-black text-white'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Nay
              </button>
              <button
                type="button"
                onClick={() => setRateFilter('7days')}
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all ${
                  rateFilter === '7days'
                    ? isHighContrast
                      ? 'bg-black text-white'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                7N
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
