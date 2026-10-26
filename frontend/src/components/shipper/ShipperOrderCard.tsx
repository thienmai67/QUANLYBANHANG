'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Order } from '@/types/manager';
import { useNow } from '@/hooks/useNow';
import { useToast } from '@/hooks/useToast';
import { useManagerStore } from '@/store/useManagerStore';
import { useShipperUIStore } from '@/store/useShipperUIStore';
import {
  getRemaining2HMinutes,
  isOrderOverdue2H,
} from '@/lib/orderRules';
import {
  formatCurrencyVND,
  formatDateTime,
} from '@/lib/formatters';
import {
  getTelUrl,
  getGoogleMapsUrl,
} from '@/lib/shipperHelpers';
import {
  Truck,
  Phone,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Camera,
  MapPin,
  User,
  Banknote,
  ChevronRight,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

interface ShipperOrderCardProps {
  order: Order;
  shipperId: string;
  shipperName: string;
  onOpenPod: (order: Order) => void;
  onOpenIncident: (order: Order) => void;
  onPickupSuccess?: () => void;
}

export default function ShipperOrderCard({
  order,
  shipperId,
  shipperName,
  onOpenPod,
  onOpenIncident,
  onPickupSuccess,
}: ShipperOrderCardProps) {
  const toast = useToast();
  const now = useNow(60000); // 1-minute live tick
  const { isHighContrast } = useShipperUIStore();
  const { updateOrderStatusWithActor } = useManagerStore();

  const [isPickingUp, setIsPickingUp] = useState(false);

  const is2H = Boolean(order.is2H || order.deliveryType === '2H');
  const isCod = order.paymentMethod === 'COD';
  const totalAmount = order.total ?? order.totalAmount ?? 0;

  // 2H countdown calculations
  const remainingMinutes = is2H
    ? getRemaining2HMinutes(
        { is2H: true, deadline2H: order.deadline2H, createdAt: order.createdAt },
        now
      )
    : null;
  const isOverdue = is2H && remainingMinutes !== null && remainingMinutes <= 0;

  // Phone and maps navigation
  const telUrl = getTelUrl({
    siteContact: order.siteContact,
    customerPhone: order.customerPhone,
  });
  const mapsUrl = getGoogleMapsUrl({
    deliveryCoords: order.deliveryCoords,
    shippingAddress: order.shippingAddress,
  });

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
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              isHighContrast
                ? 'bg-amber-300 text-black border border-black'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Chờ lấy hàng
          </span>
        );
      case 'SHIPPING':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              isHighContrast
                ? 'bg-blue-400 text-black border border-black'
                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Đang giao hàng
          </span>
        );
      case 'DELIVERED':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              isHighContrast
                ? 'bg-emerald-400 text-black border border-black'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã giao
          </span>
        );
      case 'CANCELLED':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              isHighContrast
                ? 'bg-rose-400 text-black border border-black'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Đã hủy / Sự cố
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {order.status}
          </span>
        );
    }
  };

  const contactName = order.siteContact?.name || order.customerName;
  const contactRole = order.siteContact?.roleLabel;
  const contactPhone = order.siteContact?.phone || order.customerPhone;

  return (
    <div
      className={`rounded-2xl transition-all shadow-sm ${
        isHighContrast
          ? 'bg-black border-2 border-yellow-400 text-white'
          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* 1. Header: Code, Badges, 2H Countdown */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Link
            href={`/shipper/orders/${order.id}`}
            className="flex items-center gap-1.5 group min-h-[48px] py-2"
          >
            <span
              className={`font-mono text-base font-black tracking-tight ${
                isHighContrast
                  ? 'text-yellow-400 underline decoration-yellow-400'
                  : 'text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'
              }`}
            >
              {order.code}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            {getStatusBadge()}
          </div>
        </div>

        {/* 2H Countdown / SLA alert */}
        {is2H && (
          <div className="mt-1 flex items-center justify-between gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider ${
                isHighContrast
                  ? 'bg-yellow-400 text-black border border-black'
                  : 'bg-amber-500 text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Giao 2H
            </span>

            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && remainingMinutes !== null && (
              <span
                className={`text-xs font-bold flex items-center gap-1 px-2 py-0.5 rounded-full ${
                  isOverdue
                    ? isHighContrast
                      ? 'bg-rose-500 text-white border-2 border-yellow-400 animate-pulse font-black'
                      : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 animate-pulse'
                    : isHighContrast
                    ? 'text-yellow-300 font-extrabold'
                    : 'text-amber-700 dark:text-amber-400 font-semibold'
                }`}
              >
                {isOverdue ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    Quá hạn {Math.abs(remainingMinutes)} phút!
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    Còn {Math.floor(remainingMinutes / 60)}h {remainingMinutes % 60}p
                  </>
                )}
              </span>
            )}

            {order.status === 'DELIVERED' && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Giao lúc: {formatDateTime(order.deliveredAt || order.pod?.capturedAt)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Destination & Contact Information */}
      <div className="p-4 space-y-3">
        {/* Recipient / Site Engineer */}
        <div className="flex items-start gap-2.5">
          <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-bold truncate ${
                isHighContrast ? 'text-white font-extrabold' : 'text-slate-900 dark:text-white'
              }`}
            >
              {contactName}
              {contactRole && (
                <span className="ml-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  ({contactRole})
                </span>
              )}
            </p>
            {contactPhone && (
              <p
                className={`text-xs font-mono font-medium ${
                  isHighContrast ? 'text-yellow-300' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {contactPhone}
              </p>
            )}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p
            className={`text-xs leading-relaxed line-clamp-2 ${
              isHighContrast ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {order.shippingAddress}
          </p>
        </div>

        {/* Items Summary */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          <Package className="w-4 h-4 text-slate-400 shrink-0" />
          <span
            className={`truncate ${
              isHighContrast ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {order.items.length} mặt hàng
            {order.items[0] && ` • ${order.items[0].productName || order.items[0].name} (x${order.items[0].quantity} ${order.items[0].unit})`}
            {order.items.length > 1 && ` +${order.items.length - 1} loại khác`}
          </span>
        </div>

        {/* Payment & COD Badge */}
        <div
          className={`p-3 rounded-xl flex items-center justify-between gap-2 ${
            isCod
              ? isHighContrast
                ? 'bg-yellow-400/10 border-2 border-yellow-400 text-yellow-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200'
              : isHighContrast
              ? 'bg-slate-900 border border-white text-emerald-300'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isCod ? 'Thu hộ COD:' : 'Đã thanh toán:'}
            </span>
          </div>
          <span
            className={`text-sm font-black font-mono ${
              isCod ? (isHighContrast ? 'text-yellow-400' : 'text-amber-700 dark:text-amber-300') : ''
            }`}
          >
            {isCod ? formatCurrencyVND(order.codCollected ?? totalAmount) : 'Chuyển khoản (0 ₫)'}
          </span>
        </div>

        {/* POD details if already delivered */}
        {order.status === 'DELIVERED' && (order.pod || order.podRecipientName) && (
          <div
            className={`p-2.5 rounded-xl text-xs space-y-1 ${
              isHighContrast
                ? 'bg-slate-900 border border-yellow-400'
                : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Người ký nhận: {order.podRecipientName || order.pod?.receiverName}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {order.podPhotoUrl ? '1 ảnh POD' : `${order.pod?.photos?.length || 0} ảnh POD`}
              </span>
            </div>
            {order.podPhotoUrl && (
              <div className="pt-1">
                <img
                  src={order.podPhotoUrl}
                  alt="POD"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm"
                />
              </div>
            )}
            {(order.codRemitted || (order.cod && order.cod.settlementId)) && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Tiền COD đã nộp về quỹ kế toán
              </p>
            )}
          </div>
        )}

        {/* Incident details if cancelled */}
        {order.status === 'CANCELLED' && (order.incident || order.incidentDetail || order.cancellationReason) && (
          <div
            className={`p-2.5 rounded-xl text-xs space-y-1 ${
              isHighContrast
                ? 'bg-rose-950 border border-rose-500 text-rose-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-1 font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              Sự cố: {order.incident?.category || 'Đã hủy'}
            </div>
            <p className="text-[11px] leading-relaxed">{order.incidentDetail || order.cancellationReason || order.incident?.detail}</p>
          </div>
        )}
      </div>

      {/* 3. Action Buttons Section (Thumb ergonomics, >= 48px touch targets) */}
      <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
        {/* Secondary Actions: Call & Map Navigation & Incident */}
        <div className="grid grid-cols-2 gap-2">
          {telUrl ? (
            <a
              href={telUrl}
              className={`min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                isHighContrast
                  ? 'bg-slate-900 text-white border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>Gọi điện</span>
            </a>
          ) : (
            <button
              disabled
              className="min-h-[48px] px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 flex items-center justify-center gap-1.5 cursor-not-allowed opacity-50"
            >
              <Phone className="w-4 h-4" />
              <span>Không có SĐT</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.open(mapsUrl, '_blank')}
            className={`min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              isHighContrast
                ? 'bg-slate-900 text-white border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            <Navigation className="w-4 h-4 text-blue-500" />
            <span>Chỉ đường</span>
          </button>
        </div>

        {/* Primary Action Button (>= 48px height) */}
        {order.status === 'PACKING' && (
          <button
            type="button"
            onClick={handlePickup}
            disabled={isPickingUp}
            className={`w-full min-h-[52px] px-4 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${
              isHighContrast
                ? 'bg-yellow-400 text-black hover:bg-yellow-300 border-2 border-black font-extrabold'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/30'
            }`}
          >
            {isPickingUp ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang nhận hàng...</span>
              </>
            ) : (
              <>
                <Package className="w-5 h-5" />
                <span>LẤY HÀNG TẠI KHO</span>
              </>
            )}
          </button>
        )}

        {order.status === 'SHIPPING' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onOpenPod(order)}
              className={`w-full min-h-[52px] px-4 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${
                isHighContrast
                  ? 'bg-yellow-400 text-black hover:bg-yellow-300 border-2 border-black font-extrabold'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30'
              }`}
            >
              <Camera className="w-5 h-5" />
              <span>GIAO HÀNG (POD)</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenIncident(order)}
              className={`w-full min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                isHighContrast
                  ? 'bg-black text-rose-400 border border-rose-500 hover:bg-rose-950'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Báo sự cố giao hàng</span>
            </button>
          </div>
        )}

        {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
          <Link
            href={`/shipper/orders/${order.id}`}
            className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              isHighContrast
                ? 'bg-slate-900 text-yellow-400 border border-yellow-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>Xem chi tiết đơn hàng</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
