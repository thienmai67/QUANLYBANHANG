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
  CheckCircle2,
  AlertTriangle,
  Power,
  ChevronRight,
  TrendingUp,
  Moon,
  ShieldCheck,
  Flame,
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

  const currentShift =
    shipper.shiftStatus ||
    (shipper.status?.toLowerCase() === 'offline'
      ? 'offline'
      : shipper.status?.toLowerCase() === 'busy'
      ? 'busy'
      : 'available');

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
          ? 'Đã bật ca: Sẵn sàng nhận đơn mới!'
          : targetStatus === 'busy'
          ? 'Đã chuyển trạng thái: Đang bận giao hàng!'
          : 'Đã tắt ca: Nghỉ ngơi an toàn!'
      );
    } else {
      toast.error(res.error || 'Không thể chuyển trạng thái ca');
    }
  };

  return (
    <div className="space-y-3 px-4 pt-3">
      {/* 1. Quick Shift Status Selector (Tactile Segmented Controller) */}
      <div
        className={`p-3.5 rounded-3xl border transition-all ${
          isHighContrast
            ? 'bg-white border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
            : 'bg-slate-900/90 border-slate-800/90 backdrop-blur-md shadow-lg shadow-black/20'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span
            className={`text-xs font-extrabold flex items-center gap-1.5 uppercase tracking-wider ${
              isHighContrast ? 'text-black font-black' : 'text-slate-300'
            }`}
          >
            <Power className="w-3.5 h-3.5 text-amber-500" />
            Ca làm việc trực tuyến:
          </span>
          <span
            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
              isHighContrast
                ? 'bg-black text-white font-black'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            Hôm nay
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            {
              id: 'available',
              label: 'Sẵn sàng',
              icon: CheckCircle2,
              color: 'emerald',
            },
            {
              id: 'busy',
              label: 'Đang bận',
              icon: Clock,
              color: 'amber',
            },
            {
              id: 'offline',
              label: 'Nghỉ ca',
              icon: Moon,
              color: 'slate',
            },
          ].map((item) => {
            const isActive = currentShift === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleShiftChange(item.id as any)}
                className={`min-h-[50px] py-2 px-1 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 border active:scale-95 ${
                  isActive
                    ? isHighContrast
                      ? 'bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : item.id === 'available'
                      ? 'bg-gradient-to-b from-emerald-600 to-emerald-700 text-white border-emerald-500 shadow-md shadow-emerald-900/40'
                      : item.id === 'busy'
                      ? 'bg-gradient-to-b from-amber-600 to-amber-700 text-white border-amber-500 shadow-md shadow-amber-900/40'
                      : 'bg-gradient-to-b from-slate-700 to-slate-800 text-white border-slate-600 shadow-md shadow-slate-900/40'
                    : isHighContrast
                    ? 'bg-slate-100 text-black border-2 border-black hover:bg-slate-200'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="text-[9px] opacity-90 font-mono tracking-tight">
                    • Đang kích hoạt •
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Field Metrics Grid (Tải đơn, Sổ quỹ COD, Tỷ lệ 2H) */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Metric 1: Workload */}
        <div
          className={`p-3.5 rounded-3xl border flex flex-col justify-between transition-all shadow-sm ${
            isHighContrast
              ? 'bg-white border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-slate-900/90 border-slate-800/90 backdrop-blur-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-tight ${
                isHighContrast ? 'text-black font-black' : 'text-slate-400'
              }`}
            >
              Tải đơn
            </span>
            <Zap
              className={`w-4 h-4 ${
                workload >= MAX_SHIPPER_ACTIVE_ORDERS
                  ? 'text-rose-500 animate-bounce'
                  : workload >= 4
                  ? 'text-amber-500'
                  : 'text-emerald-400'
              }`}
            />
          </div>

          <div className="mt-2.5">
            <div className="flex items-baseline gap-1">
              <span
                className={`text-2xl font-black font-mono leading-none tracking-tight ${
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
              <span
                className={`text-xs font-bold ${
                  isHighContrast ? 'text-black' : 'text-slate-500'
                }`}
              >
                /{MAX_SHIPPER_ACTIVE_ORDERS}
              </span>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden border border-slate-700/60">
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

        {/* Metric 2: COD Wallet */}
        <Link
          href="/shipper/cod"
          className={`p-3.5 rounded-3xl border flex flex-col justify-between transition-all active:scale-95 shadow-sm ${
            isHighContrast
              ? 'bg-white border-4 border-black text-black hover:bg-amber-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-slate-900/90 border-slate-800/90 hover:border-amber-500/50 backdrop-blur-md group'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-tight ${
                isHighContrast ? 'text-black font-black' : 'text-slate-400'
              }`}
            >
              Ví COD
            </span>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 group-hover:text-amber-400 transition-transform" />
          </div>

          <div className="mt-2.5">
            <p
              className={`text-xs font-black font-mono truncate leading-tight ${
                isHighContrast
                  ? 'text-black font-extrabold'
                  : unsettledCod.totalAmount > 0
                  ? 'text-amber-400 font-extrabold'
                  : 'text-slate-300'
              }`}
            >
              {unsettledCod.totalAmount > 0
                ? formatCurrencyVND(unsettledCod.totalAmount)
                : '0 đ'}
            </p>
            <p
              className={`text-[10px] font-medium truncate mt-1 flex items-center gap-1 ${
                isHighContrast ? 'text-black font-bold' : 'text-slate-400'
              }`}
            >
              <span>{unsettledCod.orders.length} đơn chờ nộp</span>
            </p>
          </div>
        </Link>

        {/* Metric 3: 2H On-Time Rate */}
        <div
          className={`p-3.5 rounded-3xl border flex flex-col justify-between transition-all shadow-sm ${
            isHighContrast
              ? 'bg-white border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-slate-900/90 border-slate-800/90 backdrop-blur-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-tight flex items-center gap-1 ${
                isHighContrast ? 'text-black font-black' : 'text-slate-400'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              2H SLA
            </span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="mt-2.5">
            <div className="flex items-baseline justify-between">
              <span
                className={`text-xl font-black font-mono leading-none tracking-tight ${
                  isHighContrast ? 'text-black font-black' : 'text-cyan-400'
                }`}
              >
                {onTimeStats.rateFormatted}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  isHighContrast ? 'text-black' : 'text-slate-500'
                }`}
              >
                {onTimeStats.onTime2H}/{onTimeStats.total2H}
              </span>
            </div>

            {/* Filter Toggle Pill (Nay / 7N) */}
            <div className="flex items-center gap-1 mt-2">
              <button
                type="button"
                onClick={() => setRateFilter('today')}
                className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold transition-all ${
                  rateFilter === 'today'
                    ? isHighContrast
                      ? 'bg-black text-white font-black'
                      : 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Nay
              </button>
              <button
                type="button"
                onClick={() => setRateFilter('7days')}
                className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold transition-all ${
                  rateFilter === '7days'
                    ? isHighContrast
                      ? 'bg-black text-white font-black'
                      : 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-500 hover:text-slate-300'
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
