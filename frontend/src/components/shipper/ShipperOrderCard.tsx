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
  Flame,
  Check,
  Boxes,
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
  const isUrgent = is2H && remainingMinutes !== null && remainingMinutes <= 15 && remainingMinutes > 0;

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
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-tight ${
              isHighContrast
                ? 'bg-amber-300 text-black border-2 border-black'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Chờ lấy hàng
          </span>
        );
      case 'SHIPPING':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-tight ${
              isHighContrast
                ? 'bg-blue-300 text-black border-2 border-black'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Đang giao
          </span>
        );
      case 'DELIVERED':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-tight ${
              isHighContrast
                ? 'bg-emerald-300 text-black border-2 border-black'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã giao
          </span>
        );
      case 'CANCELLED':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-tight ${
              isHighContrast
                ? 'bg-rose-300 text-black border-2 border-black'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Sự cố / Hủy
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {order.status}
          </span>
        );
    }
  };

  const contactName = order.siteContact?.name || order.customerName || 'Khách hàng';
  const contactRole = order.siteContact?.roleLabel;
  const contactPhone = order.siteContact?.phone || order.customerPhone;

  return (
    <div
      className={`rounded-3xl transition-all shadow-md overflow-hidden ${
        isHighContrast
          ? 'bg-white border-4 border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
          : 'bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 text-white backdrop-blur-md'
      }`}
    >
      {/* 1. Header: Code, Badges, 2H Countdown */}
      <div
        className={`p-4 border-b ${
          isHighContrast ? 'border-b-4 border-black bg-slate-50' : 'border-slate-800/90 bg-slate-900/60'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/shipper/orders/${order.id}`}
            className="flex items-center gap-1.5 group min-h-[44px] py-1"
          >
            <span
              className={`font-mono text-base font-black tracking-tight ${
                isHighContrast
                  ? 'text-black underline decoration-2'
                  : 'text-white group-hover:text-emerald-400 transition-colors'
              }`}
            >
              {order.code}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 group-hover:text-emerald-400 transition-transform" />
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            {getStatusBadge()}
          </div>
        </div>

        {/* 2H Countdown & SLA Banner */}
        {is2H && (
          <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                isHighContrast
                  ? 'bg-black text-yellow-300 border border-black'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black shadow-sm'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Giao Hỏa Tốc 2H
            </span>

            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && remainingMinutes !== null && (
              <span
                className={`text-xs font-black flex items-center gap-1.5 px-3 py-1 rounded-full ${
                  isOverdue
                    ? isHighContrast
                      ? 'bg-rose-600 text-white border-2 border-black animate-pulse'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                    : isUrgent
                    ? isHighContrast
                      ? 'bg-amber-400 text-black border-2 border-black animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    : isHighContrast
                    ? 'bg-slate-200 text-black font-extrabold'
                    : 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {isOverdue ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    QUÁ HẠN {Math.abs(remainingMinutes)} PHÚT!
                  </>
                ) : isUrgent ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    CÒN {remainingMinutes} PHÚT (KHẨN CẤP)!
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Còn {Math.floor(remainingMinutes / 60)}h {remainingMinutes % 60}p
                  </>
                )}
              </span>
            )}

            {order.status === 'DELIVERED' && (
              <span
                className={`text-xs font-mono font-medium ${
                  isHighContrast ? 'text-black font-bold' : 'text-slate-400'
                }`}
              >
                Giao lúc: {formatDateTime(order.deliveredAt || order.pod?.capturedAt)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Destination, Contact & Material Items */}
      <div className="p-4 space-y-3.5">
        {/* Recipient / Site Engineer */}
        <div className="flex items-start gap-3">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
              isHighContrast
                ? 'bg-black text-white border border-black'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-extrabold truncate ${
                isHighContrast ? 'text-black font-black' : 'text-white'
              }`}
            >
              {contactName}
              {contactRole && (
                <span
                  className={`ml-1.5 text-xs font-semibold ${
                    isHighContrast ? 'text-black' : 'text-slate-400'
                  }`}
                >
                  ({contactRole})
                </span>
              )}
            </p>
            {contactPhone && (
              <p
                className={`text-xs font-mono font-bold mt-0.5 ${
                  isHighContrast ? 'text-black' : 'text-slate-400'
                }`}
              >
                {contactPhone}
              </p>
            )}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="flex items-start gap-3">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
              isHighContrast
                ? 'bg-rose-300 text-black border border-black font-bold'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}
          >
            <MapPin className="w-4 h-4" />
          </div>
          <p
            className={`text-xs leading-relaxed line-clamp-2 font-medium ${
              isHighContrast ? 'text-black font-bold' : 'text-slate-300'
            }`}
          >
            {order.shippingAddress}
          </p>
        </div>

        {/* Material Items Preview */}
        <div
          className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-xs ${
            isHighContrast
              ? 'bg-slate-100 border-2 border-black text-black'
              : 'bg-slate-800/40 border-slate-800 text-slate-300'
          }`}
        >
          <Boxes className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate flex-1 font-medium">
            <strong className="font-extrabold">{order.items.length} chủng loại vật tư:</strong>{' '}
            {order.items[0] &&
              `${order.items[0].productName || order.items[0].name} (x${order.items[0].quantity} ${order.items[0].unit})`}
            {order.items.length > 1 && ` +${order.items.length - 1} món khác`}
          </span>
        </div>

        {/* Prominent Payment & COD Money Box (Taste-first Visual Clarity) */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
            isCod
              ? isHighContrast
                ? 'bg-amber-300 border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/40 text-amber-300 shadow-sm'
              : isHighContrast
              ? 'bg-emerald-200 border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500/40 text-emerald-300 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Banknote className="w-5 h-5 shrink-0" />
            <div>
              <p
                className={`text-[10px] font-black uppercase tracking-wider ${
                  isCod
                    ? isHighContrast
                      ? 'text-black'
                      : 'text-amber-400'
                    : isHighContrast
                    ? 'text-black'
                    : 'text-emerald-400'
                }`}
              >
                {isCod ? 'TIỀN MẶT CẦN THU (COD):' : 'THANH TOÁN TRƯỚC:'}
              </p>
              <p
                className={`text-base font-black font-mono leading-tight tracking-tight ${
                  isCod
                    ? isHighContrast
                      ? 'text-black font-black'
                      : 'text-amber-300 font-black'
                    : isHighContrast
                    ? 'text-black font-black'
                    : 'text-emerald-300 font-black'
                }`}
              >
                {isCod
                  ? formatCurrencyVND(order.codCollected ?? totalAmount)
                  : '0 ₫ (Đã thanh toán Online)'}
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shrink-0 ${
              isCod
                ? isHighContrast
                  ? 'bg-black text-white font-black'
                  : 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                : isHighContrast
                ? 'bg-black text-white font-black'
                : 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50'
            }`}
          >
            {isCod ? 'Thu COD' : 'Đã thanh toán'}
          </span>
        </div>

        {/* POD details if already delivered */}
        {order.status === 'DELIVERED' && (order.pod || order.podRecipientName) && (
          <div
            className={`p-3 rounded-2xl text-xs space-y-1.5 border ${
              isHighContrast
                ? 'bg-slate-100 border-2 border-black text-black'
                : 'bg-slate-800/40 border-slate-700/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 text-emerald-400 font-extrabold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Người ký nhận: {order.podRecipientName || order.pod?.receiverName}
              </span>
              <span className="text-slate-400 font-mono">
                {order.podPhotoUrl ? '1 ảnh POD' : `${order.pod?.photos?.length || 0} ảnh POD`}
              </span>
            </div>
            {order.podPhotoUrl && (
              <div className="pt-1">
                <img
                  src={order.podPhotoUrl}
                  alt="POD"
                  className="w-16 h-16 object-cover rounded-xl border border-slate-700 shadow-sm"
                />
              </div>
            )}
            {(order.codRemitted || (order.cod && order.cod.settlementId)) && (
              <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Tiền COD đã được nộp về quỹ kế toán
              </p>
            )}
          </div>
        )}

        {/* Incident details if cancelled */}
        {order.status === 'CANCELLED' &&
          (order.incident || order.incidentDetail || order.cancellationReason) && (
            <div
              className={`p-3 rounded-2xl text-xs space-y-1 border ${
                isHighContrast
                  ? 'bg-rose-100 border-2 border-black text-black'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black text-rose-400">
                <ShieldAlert className="w-4 h-4" />
                Sự cố: {order.incident?.category || 'Đã hủy giao'}
              </div>
              <p className="text-[11px] leading-relaxed">
                {order.incidentDetail || order.cancellationReason || order.incident?.detail}
              </p>
            </div>
          )}
      </div>

      {/* 3. Action Buttons Section (Thumb ergonomics, >= 48px touch targets) */}
      <div
        className={`p-4 pt-2 border-t space-y-2.5 ${
          isHighContrast ? 'border-t-4 border-black bg-slate-50' : 'border-slate-800/80 bg-slate-900/40'
        }`}
      >
        {/* Quick Action Cluster: Call & Map Navigation */}
        <div className="grid grid-cols-2 gap-2.5">
          {telUrl ? (
            <a
              href={telUrl}
              className={`min-h-[48px] px-3 py-2 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 border ${
                isHighContrast
                  ? 'bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-100'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-emerald-500/40 hover:text-white shadow-sm'
              }`}
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Gọi điện</span>
            </a>
          ) : (
            <button
              disabled
              className="min-h-[48px] px-3 py-2 rounded-2xl text-xs font-bold bg-slate-800 text-slate-500 flex items-center justify-center gap-2 cursor-not-allowed opacity-50 border border-slate-700/40"
            >
              <Phone className="w-4 h-4" />
              <span>Không có SĐT</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.open(mapsUrl, '_blank')}
            className={`min-h-[48px] px-3 py-2 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 border ${
              isHighContrast
                ? 'bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-100'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-cyan-500/40 hover:text-white shadow-sm'
            }`}
          >
            <Navigation className="w-4 h-4 text-cyan-400" />
            <span>Mở Maps</span>
          </button>
        </div>

        {/* Primary Action Button (>= 50px height) */}
        {order.status === 'PACKING' && (
          <button
            type="button"
            onClick={handlePickup}
            disabled={isPickingUp}
            className={`w-full min-h-[52px] px-4 py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] border shadow-lg ${
              isHighContrast
                ? 'bg-amber-300 text-black border-4 border-black font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-400'
                : 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-slate-950 border-amber-400 shadow-amber-900/40 hover:brightness-110'
            }`}
          >
            {isPickingUp ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang xác nhận lấy hàng...</span>
              </>
            ) : (
              <>
                <Package className="w-5 h-5" />
                <span>XÁC NHẬN LẤY HÀNG TẠI KHO</span>
              </>
            )}
          </button>
        )}

        {order.status === 'SHIPPING' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onOpenPod(order)}
              className={`w-full min-h-[54px] px-4 py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] border shadow-xl ${
                isHighContrast
                  ? 'bg-emerald-300 text-black border-4 border-black font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-400'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white border-emerald-400 shadow-emerald-900/50 hover:brightness-110'
              }`}
            >
              <Camera className="w-5 h-5" />
              <span>GIAO HÀNG & CHỤP ẢNH (POD)</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenIncident(order)}
              className={`w-full min-h-[48px] px-3 py-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border active:scale-[0.98] ${
                isHighContrast
                  ? 'bg-white text-rose-700 border-2 border-black hover:bg-rose-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border-rose-500/30'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Báo sự cố (Khách không nghe máy, hẹn lại...)</span>
            </button>
          </div>
        )}

        {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
          <Link
            href={`/shipper/orders/${order.id}`}
            className={`w-full min-h-[48px] px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all border active:scale-[0.98] ${
              isHighContrast
                ? 'bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-100'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700'
            }`}
          >
            <span>Xem chi tiết hồ sơ đơn hàng</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
