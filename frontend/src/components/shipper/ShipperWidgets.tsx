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
  Gauge,
  CircleDot,
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
      {/* 1. Tactical Shift Switch Bar (Hardware feel) */}
      <div
        className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
          isHighContrast
            ? 'bg-black text-white border-2 border-yellow-400'
            : 'bg-slate-900/90 border-slate-800/90 backdrop-blur-md shadow-md'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-3 w-3 shrink-0">
            {currentShift === 'available' ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </>
            ) : currentShift === 'busy' ? (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-500"></span>
            )}
          </span>
          <span className="text-xs font-black tracking-tight truncate">
            {currentShift === 'available'
              ? 'TRỰC TUYẾN • SẴN SÀNG NHẬN ĐƠN'
              : currentShift === 'busy'
              ? 'ĐANG BẬN • TẠM DỪNG NHẬN ĐƠN'
              : 'NGHỈ CA • KHÔNG NHẬN ĐƠN'}
          </span>
        </div>

        {/* Switch Buttons */}
        <div className="flex items-center gap-1 shrink-0 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleShiftChange('available')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 ${
              currentShift === 'available'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Bật ca</span>
          </button>
          <button
            type="button"
            onClick={() => handleShiftChange('busy')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              currentShift === 'busy'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Bận</span>
          </button>
          <button
            type="button"
            onClick={() => handleShiftChange('offline')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              currentShift === 'offline'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Nghỉ</span>
          </button>
        </div>
      </div>

      {/* 2. Cockpit Telemetry Ribbon (3 Dynamic Metric Cards) */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Metric 1: Tải đơn (Active Workload) */}
        <div
          className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
            isHighContrast
              ? 'bg-black text-white border-2 border-yellow-400'
              : 'bg-slate-900/80 border-slate-800/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Tải đơn
            </span>
            <Zap className={`w-3.5 h-3.5 ${workload >= 4 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
          </div>

          <div className="my-1.5">
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black font-mono tracking-tight ${isHighContrast ? 'text-yellow-400' : 'text-white'}`}>
                {workload}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                /{MAX_SHIPPER_ACTIVE_ORDERS}
              </span>
            </div>

            {/* 5-segment LED gauge */}
            <div className="grid grid-cols-5 gap-1 mt-1.5">
              {[1, 2, 3, 4, 5].map((idx) => {
                const filled = idx <= workload;
                return (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      filled
                        ? workload >= 5
                          ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                          : workload >= 4
                          ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                          : 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                        : isHighContrast
                        ? 'bg-slate-800'
                        : 'bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <span className="text-[10px] text-slate-400 truncate">
            {workload >= 5 ? 'Đầy tải (Max)' : `${5 - workload} chỗ trống`}
          </span>
        </div>

        {/* Metric 2: Ví COD (Driver Cash in Pocket) */}
        <Link
          href="/shipper/cod"
          className={`p-3 rounded-2xl border flex flex-col justify-between transition-all active:scale-95 group ${
            isHighContrast
              ? 'bg-yellow-400 text-black border-2 border-white font-extrabold'
              : 'bg-gradient-to-br from-amber-500/15 via-amber-600/10 to-transparent border-amber-500/40 hover:border-amber-400 text-white shadow-lg shadow-amber-500/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isHighContrast ? 'text-black' : 'text-amber-400'}`}>
              Ví COD
            </span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${isHighContrast ? 'text-black' : 'text-amber-400'}`} />
          </div>

          <div className="my-1.5">
            <p className={`text-base font-black font-mono tracking-tight truncate ${isHighContrast ? 'text-black' : 'text-amber-300'}`}>
              {formatCurrencyVND(unsettledCod.totalAmount)}
            </p>
          </div>

          <div className="flex items-center justify-between text-[10px] opacity-90 truncate">
            <span>{unsettledCod.orders.length} đơn giữ tiền</span>
            <span className="font-bold underline">Nộp quỹ</span>
          </div>
        </Link>

        {/* Metric 3: Hiệu suất SLA 2H (Speedometer) */}
        <div
          className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
            isHighContrast
              ? 'bg-black text-white border-2 border-yellow-400'
              : 'bg-slate-900/80 border-slate-800/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              2H SLA
            </span>
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
          </div>

          <div className="my-1.5">
            <p className={`text-xl font-black font-mono tracking-tight ${isHighContrast ? 'text-yellow-400' : 'text-cyan-400'}`}>
              {onTimeStats.ratePercent !== null ? `${Math.round(onTimeStats.ratePercent)}%` : '100%'}
            </p>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Hỏa tốc</span>
            <span className="font-bold text-emerald-400">Đúng giờ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
