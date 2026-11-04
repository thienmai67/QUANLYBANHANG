'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useManagerStore } from '@/store/useManagerStore';
import { Order } from '@/types/manager';
import {
  CheckCircle2,
  Navigation,
  Clock,
  MapPin,
  ChevronRight,
  Route,
  ArrowRight,
} from 'lucide-react';
import { formatShortAddress } from './ShipperOrderCard';

interface ShipperWidgetsProps {
  shipperId?: string;
  orders?: Order[];
  nextOrderId?: string;
}

export default function ShipperWidgets({
  shipperId = '',
  orders: propOrders,
  nextOrderId,
}: ShipperWidgetsProps) {
  const { orders: storeOrders } = useManagerStore();

  const myOrders =
    propOrders ??
    (shipperId
      ? storeOrders.filter((o) => o.shipperId === shipperId)
      : storeOrders);

  const deliveredOrders = myOrders.filter((o) => o.status === 'DELIVERED');
  const activeOrders = myOrders.filter(
    (o) => o.status === 'SHIPPING' || o.status === 'PACKING'
  );

  const effectiveNextId =
    nextOrderId ||
    (activeOrders.find((o) => o.status === 'SHIPPING')?.id || activeOrders[0]?.id);

  const nextOrder = activeOrders.find((o) => o.id === effectiveNextId);
  const waitingOrders = activeOrders.filter((o) => o.id !== effectiveNextId);

  const routeList: Array<{
    order: Order;
    type: 'delivered' | 'next' | 'waiting';
  }> = [];

  deliveredOrders.forEach((o) => {
    routeList.push({ order: o, type: 'delivered' });
  });

  if (nextOrder) {
    routeList.push({ order: nextOrder, type: 'next' });
  }

  waitingOrders.forEach((o) => {
    routeList.push({ order: o, type: 'waiting' });
  });

  const completedCount = deliveredOrders.length;
  const totalCount = routeList.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const formatDeliveryTime = (order: Order): string => {
    if (order.status === 'DELIVERED') {
      const timeStr = order.deliveredAt || order.pod?.capturedAt;
      if (timeStr) {
        try {
          const d = new Date(timeStr);
          if (!isNaN(d.getTime())) {
            return d.toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            });
          }
        } catch {
          return '-';
        }
      }
    }
    return '';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3.5">
      {/* Header with Route summary & Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Route className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              Lộ trình hôm nay
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {completedCount}/{totalCount} điểm dừng hoàn thành ({progressPercent}%)
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 tabular-nums">
          {totalCount} điểm
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Route Stepper List */}
      {routeList.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
          Chưa có đơn hàng trên lộ trình hôm nay.
        </p>
      ) : (
        <div className="space-y-1.5 pt-1">
          {routeList.map(({ order, type }, index) => {
            const timeDisplay = formatDeliveryTime(order);
            const customerName =
              order.siteContact?.name || order.customerName || 'Khách hàng';
            const shortAddr = formatShortAddress(order.shippingAddress);

            return (
              <Link
                key={order.id}
                href={`/shipper/orders/${order.id}`}
                className={`group flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                  type === 'next'
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 shadow-sm'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {/* Stepper Node Indicator */}
                <div className="relative flex items-center justify-center shrink-0">
                  {type === 'delivered' && (
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                  {type === 'next' && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 animate-pulse">
                      <Navigation className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {type === 'waiting' && (
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      {index + 1}
                    </div>
                  )}
                </div>

                {/* Customer & Address Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-semibold truncate ${
                        type === 'next'
                          ? 'text-blue-900 dark:text-blue-100 font-bold'
                          : type === 'delivered'
                          ? 'text-slate-500 dark:text-slate-400 line-through'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {customerName}
                    </span>
                    {type === 'next' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white">
                        Tiếp theo
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                    <span>{shortAddr}</span>
                  </div>
                </div>

                {/* Status or Time pill */}
                <div className="text-right shrink-0">
                  {timeDisplay ? (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                      {timeDisplay}
                    </span>
                  ) : order.status === 'SHIPPING' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      Đang giao
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                      Chờ
                    </span>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
