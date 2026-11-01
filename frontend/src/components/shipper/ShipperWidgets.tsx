'use client';

import React from 'react';
import Link from 'next/link';
import { useManagerStore } from '@/store/useManagerStore';
import { Order } from '@/types/manager';

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

  // Group into:
  // 1. Delivered orders (chấm đen)
  // 2. Next order (chấm xanh #1d5fbf)
  // 3. Waiting / remaining orders (chấm xám)
  const deliveredOrders = myOrders.filter((o) => o.status === 'DELIVERED');
  const activeOrders = myOrders.filter(
    (o) => o.status === 'SHIPPING' || o.status === 'PACKING'
  );

  const effectiveNextId =
    nextOrderId ||
    (activeOrders.find((o) => o.status === 'SHIPPING')?.id || activeOrders[0]?.id);

  const nextOrder = activeOrders.find((o) => o.id === effectiveNextId);
  const waitingOrders = activeOrders.filter((o) => o.id !== effectiveNextId);

  // Ordered list according to route spec
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
    return '-';
  };

  const getStatusBadge = (order: Order, type: 'delivered' | 'next' | 'waiting') => {
    if (type === 'delivered') {
      return (
        <span className="text-[14px] px-2 py-0.5 rounded-[6px] bg-[#dcfae5] text-[#04250e] font-normal shrink-0">
          Đã giao
        </span>
      );
    }
    if (order.status === 'SHIPPING') {
      return (
        <span className="text-[14px] px-2 py-0.5 rounded-[6px] bg-[#dcfae5] text-[#04250e] font-normal shrink-0">
          Đang giao
        </span>
      );
    }
    return (
      <span className="text-[14px] px-2 py-0.5 rounded-[6px] bg-[#fffbeb] text-[#92400e] font-normal shrink-0">
        Chờ
      </span>
    );
  };

  return (
    <div className="bg-white border border-[#e6e6e6] rounded-[8px] p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[16px] font-semibold text-[#0a0a0a]">
          Lộ trình hôm nay
        </h2>
        <span className="text-[14px] text-[#6b6b6b] tabular-nums">
          {routeList.length} điểm dừng
        </span>
      </div>

      {routeList.length === 0 ? (
        <p className="text-[14px] text-[#6b6b6b] py-3">
          Chưa có đơn hàng trên lộ trình hôm nay.
        </p>
      ) : (
        <div className="divide-y divide-[#e6e6e6]">
          {routeList.map(({ order, type }) => {
            const timeDisplay = formatDeliveryTime(order);
            const customerName =
              order.siteContact?.name || order.customerName || 'Khách hàng';

            return (
              <Link
                key={order.id}
                href={`/shipper/orders/${order.id}`}
                className="min-h-[48px] py-2 flex items-center gap-3 transition-colors hover:bg-[#f8f8f8] -mx-2 px-2 rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fbf]"
              >
                {/* Route dot indicator */}
                {type === 'delivered' && (
                  <span
                    aria-label="Điểm đã giao"
                    className="w-2.5 h-2.5 rounded-full bg-[#0a0a0a] shrink-0"
                  />
                )}
                {type === 'next' && (
                  <span
                    aria-label="Điểm tiếp theo"
                    className="w-2.5 h-2.5 rounded-full bg-[#1d5fbf] shrink-0"
                  />
                )}
                {type === 'waiting' && (
                  <span
                    aria-label="Điểm chờ"
                    className="w-2.5 h-2.5 rounded-full bg-[#6b6b6b] shrink-0"
                  />
                )}

                {/* Status pill */}
                {getStatusBadge(order, type)}

                {/* Customer name */}
                <span className="text-[14px] text-[#0a0a0a] font-normal truncate flex-1">
                  {customerName}
                </span>

                {/* Real time or dash */}
                <span className="text-[14px] text-[#6b6b6b] tabular-nums shrink-0">
                  {timeDisplay}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
