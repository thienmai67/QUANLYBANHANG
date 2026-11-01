'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Order } from '@/types/manager';
import { formatCurrencyVND } from '@/lib/formatters';
import { getTelUrl, getGoogleMapsUrl } from '@/lib/shipperHelpers';
import { useManagerStore } from '@/store/useManagerStore';
import { useToast } from '@/hooks/useToast';
import { Phone, Navigation, Loader2 } from 'lucide-react';

/**
 * Shortens a shipping address to the most relevant local district/ward/city
 * for quick recognition under sunlight (e.g. "An Phú, TP. Thủ Đức").
 */
export function formatShortAddress(address?: string | null): string {
  if (!address || typeof address !== 'string') return '-';
  const clean = address.trim();
  if (!clean) return '-';
  const segments = clean.split(',').map((s) => s.trim()).filter(Boolean);
  if (segments.length <= 2) return clean;
  return segments.slice(-2).join(', ');
}

interface ShipperOrderCardProps {
  order: Order;
  shipperId: string;
  shipperName: string;
  variant?: 'featured' | 'list';
  onOpenPod?: (order: Order) => void;
  onOpenIncident?: (order: Order) => void;
  onPickupSuccess?: () => void;
}

export default function ShipperOrderCard({
  order,
  shipperId,
  shipperName,
  variant = 'list',
  onOpenPod,
  onOpenIncident,
  onPickupSuccess,
}: ShipperOrderCardProps) {
  const toast = useToast();
  const { updateOrderStatusWithActor } = useManagerStore();
  const [isPickingUp, setIsPickingUp] = useState(false);

  const isCod = order.paymentMethod === 'COD';
  const totalAmount = order.total ?? order.totalAmount ?? 0;
  const customerName =
    order.siteContact?.name || order.customerName || 'Khách hàng';

  const telUrl = getTelUrl({
    siteContact: order.siteContact,
    customerPhone: order.customerPhone,
  });

  const mapsUrl = getGoogleMapsUrl({
    deliveryCoords: order.deliveryCoords,
    shippingAddress: order.shippingAddress,
  });

  const orderAny = order as any;
  const weightText = orderAny.totalWeight
    ? `${orderAny.totalWeight} kg`
    : orderAny.weight
    ? `${orderAny.weight} kg`
    : '-';

  const handlePickup = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPickingUp) return;
    setIsPickingUp(true);

    try {
      const result = await updateOrderStatusWithActor(order.id, 'SHIPPING', {
        role: 'SHIPPER',
        shipperId,
        name: shipperName,
      });

      if (result.success) {
        toast.success(`Đã nhận hàng đơn ${order.code}! Bắt đầu di chuyển giao.`);
        onPickupSuccess?.();
      } else {
        toast.error(result.error || 'Không thể lấy hàng. Vui lòng thử lại.');
      }
    } finally {
      setIsPickingUp(false);
    }
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case 'PACKING':
        return (
          <span className="text-[14px] px-2.5 py-1 rounded-[6px] bg-[#fffbeb] text-[#92400e] font-normal inline-block">
            Chờ nhận
          </span>
        );
      case 'SHIPPING':
        return (
          <span className="text-[14px] px-2.5 py-1 rounded-[6px] bg-[#dcfae5] text-[#04250e] font-normal inline-block">
            Đang giao
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="text-[14px] px-2.5 py-1 rounded-[6px] bg-[#dcfae5] text-[#04250e] font-normal inline-block">
            Đã giao
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="text-[14px] px-2.5 py-1 rounded-[6px] bg-[#ffedea] text-[#831c1e] font-normal inline-block">
            Sự cố / Hủy
          </span>
        );
      default:
        return (
          <span className="text-[14px] px-2.5 py-1 rounded-[6px] bg-[#eeeeee] text-[#3d3d3d] font-normal inline-block">
            {order.status}
          </span>
        );
    }
  };

  // 1. Featured card: "Đơn tiếp theo" (border-strong #d0d0d0, 8px radius)
  if (variant === 'featured') {
    return (
      <div className="bg-white border border-[#d0d0d0] rounded-[8px] p-4 space-y-3">
        {/* Row 1: Status pill */}
        <div>{getStatusBadge()}</div>

        {/* Row 2: Customer name */}
        <h3 className="text-[16px] font-medium text-[#0a0a0a] leading-tight">
          {customerName}
        </h3>

        {/* Row 3: Full shipping address */}
        <p className="text-[14px] text-[#6b6b6b] leading-[1.5]">
          {order.shippingAddress}
        </p>

        {/* Row 4: Code, item count, weight */}
        <p className="text-[14px] text-[#6b6b6b]">
          {order.code} • {order.items.length} món • {weightText}
        </p>

        {/* Row 5: COD Amount */}
        <div className="flex items-baseline justify-between pt-2 border-t border-[#e6e6e6]">
          <span className="text-[14px] text-[#6b6b6b]">Thu hộ COD</span>
          <span className="text-[20px] font-bold tabular-nums text-[#0a0a0a]">
            {isCod ? formatCurrencyVND(totalAmount) : '0 ₫ (Đã thanh toán)'}
          </span>
        </div>

        {/* Row 6: Primary Black Full-width Action Button */}
        {order.status === 'SHIPPING' && (
          <button
            type="button"
            onClick={() => onOpenPod?.(order)}
            className="w-full min-h-[48px] rounded-[6px] bg-[#141414] text-white hover:bg-[#222222] text-[16px] font-semibold flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fbf]"
          >
            Xác nhận đã giao
          </button>
        )}

        {order.status === 'PACKING' && (
          <button
            type="button"
            onClick={handlePickup}
            disabled={isPickingUp}
            className="w-full min-h-[48px] rounded-[6px] bg-[#141414] text-white hover:bg-[#222222] text-[16px] font-semibold flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fbf]"
          >
            {isPickingUp ? (
              <>
                <Loader2 className="w-[18px] h-[18px] animate-spin" />
                <span>Đang nhận hàng...</span>
              </>
            ) : (
              <span>Xác nhận lấy hàng</span>
            )}
          </button>
        )}

        {order.status === 'DELIVERED' && (
          <Link
            href={`/shipper/orders/${order.id}`}
            className="w-full min-h-[48px] rounded-[6px] bg-[#141414] text-white hover:bg-[#222222] text-[16px] font-semibold flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fbf]"
          >
            Xem chi tiết đơn đã giao
          </Link>
        )}

        {/* Row 7: 2 Secondary Buttons: Call & Maps */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {telUrl ? (
            <a
              href={telUrl}
              className="min-h-[48px] rounded-[6px] bg-white text-[#0a0a0a] border border-[#e6e6e6] hover:bg-[#f2f2f2] text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fbf]"
            >
              <Phone className="w-[18px] h-[18px]" />
              <span>Gọi khách</span>
            </a>
          ) : (
            <button
              disabled
              className="min-h-[48px] rounded-[6px] bg-[#f8f8f8] text-[#6b6b6b] border border-[#e6e6e6] text-[14px] font-normal flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
            >
              <Phone className="w-[18px] h-[18px]" />
              <span>Không có SĐT</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.open(mapsUrl, '_blank')}
            className="min-h-[48px] rounded-[6px] bg-white text-[#0a0a0a] border border-[#e6e6e6] hover:bg-[#f2f2f2] text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fbf]"
          >
            <Navigation className="w-[18px] h-[18px]" />
            <span>Mở bản đồ</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. List variant: 2 lines per order
  return (
    <Link
      href={`/shipper/orders/${order.id}`}
      className="block bg-white border border-[#e6e6e6] rounded-[8px] p-3.5 hover:border-[#d0d0d0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fbf]"
    >
      {/* Line 1: Customer Name + Amount (tabular-nums font-bold right) */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[16px] font-medium text-[#0a0a0a] truncate">
          {customerName}
        </span>
        <span className="text-[16px] font-bold tabular-nums text-[#0a0a0a] shrink-0">
          {isCod ? formatCurrencyVND(totalAmount) : '0 ₫'}
        </span>
      </div>

      {/* Line 2: Shortened address + status */}
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="text-[14px] text-[#6b6b6b] truncate flex-1">
          {formatShortAddress(order.shippingAddress)}
        </p>
        <div className="shrink-0">{getStatusBadge()}</div>
      </div>
    </Link>
  );
}
