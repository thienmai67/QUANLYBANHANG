'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Order } from '@/types/manager';
import { formatCurrencyVND } from '@/lib/formatters';
import { getTelUrl, getGoogleMapsUrl } from '@/lib/shipperHelpers';
import { useManagerStore } from '@/store/useManagerStore';
import { useToast } from '@/hooks/useToast';
import {
  Phone,
  Navigation,
  Loader2,
  PackageCheck,
  CheckCircle2,
  MapPin,
  Clock,
  Banknote,
  Boxes,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

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
    customerName: order.customerName,
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
    : '';

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
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            <span>Chờ nhận tại kho</span>
          </span>
        );
      case 'SHIPPING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 animate-pulse">
            <Navigation className="w-3 h-3" />
            <span>Đang giao hàng</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Đã giao thành công</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
            <span>Sự cố / Đã hủy</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
            <span>{order.status}</span>
          </span>
        );
    }
  };

  // 1. Featured card: "Đơn tiếp theo" (HERO CARD FOR SHIPPER)
  if (variant === 'featured') {
    return (
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 border-2 border-blue-500/70 dark:border-blue-500/50 rounded-2xl p-4 shadow-lg shadow-blue-500/10 space-y-3.5">
        {/* Top Tag Banner */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-sm">
              Đơn tiếp theo
            </span>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
              #{order.code}
            </span>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Customer & Destination */}
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
            {customerName}
          </h3>
          <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span className="font-medium">{order.shippingAddress}</span>
          </div>
        </div>

        {/* Goods brief pill */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
          <Boxes className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {order.items.length} mặt hàng
          </span>
          {weightText && (
            <>
              <span>•</span>
              <span>{weightText}</span>
            </>
          )}
          <span className="ml-auto font-mono text-[11px] text-blue-600 dark:text-blue-400">
            {order.code}
          </span>
        </div>

        {/* COD Amount High-Visibility Box */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between ${
            isCod
              ? 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/80'
              : order.paymentStatus === 'PAID'
                ? 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/80'
                : 'bg-slate-50/80 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isCod
                  ? 'bg-amber-200/80 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                  : order.paymentStatus === 'PAID'
                    ? 'bg-emerald-200/80 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isCod ? 'Thu hộ tiền mặt (COD)' : 'Thanh toán Online'}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                {isCod
                  ? 'Thu đủ khi giao'
                  : order.paymentStatus === 'PAID'
                    ? 'Đã thanh toán Online qua PayOS'
                    : 'Chờ khách thanh toán'}
              </div>
            </div>
          </div>

          <div
            className={`text-lg font-black tabular-nums ${
              isCod
                ? 'text-amber-900 dark:text-amber-300'
                : order.paymentStatus === 'PAID'
                  ? 'text-emerald-800 dark:text-emerald-300'
                  : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {isCod ? formatCurrencyVND(totalAmount) : order.paymentStatus === 'PAID' ? '0 ₫' : formatCurrencyVND(totalAmount)}
          </div>
        </div>

        {/* Primary Action Button (min-height: 50px, ergonomic 1-tap) */}
        {order.status === 'SHIPPING' && (
          <button
            type="button"
            onClick={() => onOpenPod?.(order)}
            className="w-full min-h-[50px] rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Xác nhận đã giao — Chụp ảnh POD</span>
          </button>
        )}

        {order.status === 'PACKING' && (
          <button
            type="button"
            onClick={handlePickup}
            disabled={isPickingUp}
            className="w-full min-h-[50px] rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isPickingUp ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang lấy hàng...</span>
              </>
            ) : (
              <>
                <PackageCheck className="w-5 h-5" />
                <span>Xác nhận lấy hàng tại kho</span>
              </>
            )}
          </button>
        )}

        {order.status === 'DELIVERED' && (
          <Link
            href={`/shipper/orders/${order.id}`}
            className="w-full min-h-[50px] rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Xem bằng chứng đã giao</span>
          </Link>
        )}

        {/* 2 Quick Tactical Buttons: Call & Maps */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {telUrl ? (
            <a
              href={telUrl}
              className="min-h-[46px] rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:bg-slate-800 dark:hover:bg-emerald-950/50 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Gọi khách</span>
            </a>
          ) : (
            <button
              disabled
              className="min-h-[46px] rounded-xl bg-slate-100 dark:bg-slate-800/40 text-slate-400 text-xs font-medium flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200/60 dark:border-slate-800"
            >
              <Phone className="w-4 h-4" />
              <span>Không có SĐT</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.open(mapsUrl, '_blank')}
            className="min-h-[46px] rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:bg-slate-800 dark:hover:bg-blue-950/50 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Mở Google Maps</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. List variant: Queued orders with clean card styling
  return (
    <Link
      href={`/shipper/orders/${order.id}`}
      className="group block bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all active:scale-[0.99]"
    >
      {/* Top line: Customer Name + COD Amount */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
          {customerName}
        </span>
        <span
          className={`text-sm font-black tabular-nums shrink-0 ${
            isCod
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {isCod ? formatCurrencyVND(totalAmount) : '0 ₫'}
        </span>
      </div>

      {/* Bottom line: Shortened address + status pill */}
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 truncate flex-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{formatShortAddress(order.shippingAddress)}</span>
          <span>•</span>
          <span className="shrink-0 font-mono text-[11px]">#{order.code}</span>
        </div>
        <div className="shrink-0">{getStatusBadge()}</div>
      </div>
    </Link>
  );
}
