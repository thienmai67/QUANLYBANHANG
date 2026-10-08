'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import RouteGuard from '@/components/auth/RouteGuard';
import ShipperShell from '@/components/shipper/ShipperShell';
import PodModal from '@/components/shipper/PodModal';
import IncidentModal from '@/components/shipper/IncidentModal';
import { useAuthStore } from '@/store/useAuthStore';
import { useManagerStore } from '@/store/useManagerStore';
import { useShipperUIStore } from '@/store/useShipperUIStore';
import { useNow } from '@/hooks/useNow';
import { useToast } from '@/hooks/useToast';
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
  ArrowLeft,
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Navigation,
  MapPin,
  User,
  Banknote,
  Camera,
  ShieldAlert,
  Loader2,
  FileText,
  Boxes,
} from 'lucide-react';

export default function ShipperOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const now = useNow(60000);
  const { user } = useAuthStore();
  const { orders, shippers, updateOrderStatusWithActor, fetchOrders } = useManagerStore();
  const { isHighContrast } = useShipperUIStore();

  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isPickingUp, setIsPickingUp] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const orderId = params?.orderId as string;
  const currentShipperId = user?.shipperId || 'ship-02';
  const currentShipperName =
    user?.name ||
    shippers.find((s) => s.id === currentShipperId)?.name ||
    'Trần Quốc Toản';

  const order = orders.find((o) => o.id === orderId);

  // STRICT DATA ISOLATION:
  // If order not found OR order is not assigned to current shipper (and actor not admin/manager)
  const isAuthorizedShipper =
    order &&
    (order.shipperId === currentShipperId ||
      user?.role === 'ADMIN' ||
      user?.role === 'MANAGER');

  if (!order || !isAuthorizedShipper) {
    return (
      <RouteGuard allowedRoles={['SHIPPER', 'ADMIN']}>
        <ShipperShell>
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">
              404 — Không Tìm Thấy Đơn Hàng
            </h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Đơn hàng không tồn tại hoặc không thuộc quyền giao vận của bạn. Vui lòng quay lại danh sách đơn hàng.
            </p>
            <button
              onClick={() => router.replace('/shipper')}
              className="min-h-[48px] px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              Về Danh Sách Đơn Hàng
            </button>
          </div>
        </ShipperShell>
      </RouteGuard>
    );
  }

  const is2H = Boolean(order.is2H || order.deliveryType === '2H');
  const isCod = order.paymentMethod === 'COD';
  const totalAmount = order.total ?? order.totalAmount ?? 0;

  const remainingMinutes = is2H
    ? getRemaining2HMinutes(
        { is2H: true, deadline2H: order.deadline2H, createdAt: order.createdAt },
        now
      )
    : null;
  const isOverdue = is2H && remainingMinutes !== null && remainingMinutes <= 0;

  const telUrl = getTelUrl({
    siteContact: order.siteContact,
    customerPhone: order.customerPhone,
  });
  const mapsUrl = getGoogleMapsUrl({
    deliveryCoords: order.deliveryCoords,
    shippingAddress: order.shippingAddress,
  });

  const handlePickup = async () => {
    if (isPickingUp) return;
    setIsPickingUp(true);

    try {
      const result = await updateOrderStatusWithActor(order.id, 'SHIPPING', {
        role: 'SHIPPER',
        shipperId: currentShipperId,
        name: currentShipperName,
      });

      if (result.success) {
        toast.success(`Đã nhận hàng đơn ${order.code}! Bắt đầu di chuyển.`);
      } else {
        toast.error(result.error || 'Không thể lấy hàng');
      }
    } finally {
      setIsPickingUp(false);
    }
  };

  return (
    <RouteGuard allowedRoles={['SHIPPER', 'ADMIN']}>
      <ShipperShell>
        {/* Navigation & Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <Link
            href="/shipper"
            className="min-h-[48px] min-w-[48px] p-2.5 rounded-xl flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            aria-label="Quay lại danh sách"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="text-center">
            <h1
              className={`text-base font-black font-mono tracking-tight ${
                isHighContrast ? 'text-yellow-400' : 'text-white'
              }`}
            >
              {order.code}
            </h1>
            <p className="text-[11px] text-slate-400">
              {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className="shrink-0">
            {order.status === 'PACKING' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-500/30">
                Chờ lấy hàng
              </span>
            )}
            {order.status === 'SHIPPING' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-400/20 text-blue-300 border border-blue-500/30">
                Đang giao
              </span>
            )}
            {order.status === 'DELIVERED' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-500/30">
                Đã giao
              </span>
            )}
            {order.status === 'CANCELLED' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-400/20 text-rose-300 border border-rose-500/30">
                Đã hủy
              </span>
            )}
          </div>
        </div>

        {/* Detail Content */}
        <div className="p-4 space-y-4">
          {/* 2H Countdown Banner */}
          {is2H && (
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                isOverdue
                  ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 shrink-0 text-amber-400" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    Đơn Hàng Hỏa Tốc 2H
                  </p>
                  <p className="text-[11px] opacity-80">
                    Cam kết giao tận chân công trình trong 2 giờ
                  </p>
                </div>
              </div>

              {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && remainingMinutes !== null && (
                <div
                  className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                    isOverdue
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-amber-500 text-black'
                  }`}
                >
                  {isOverdue ? `Quá hạn ${Math.abs(remainingMinutes)}p!` : `Còn ${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}p`}
                </div>
              )}
            </div>
          )}

          {/* Customer & Site Contact Card */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isHighContrast
                ? 'bg-black border-2 border-yellow-400 text-white'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-400" /> Thông tin nhận hàng & công trình
            </h2>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-white">
                  {order.siteContact?.name || order.customerName}
                </span>
                {order.siteContact?.roleLabel && (
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {order.siteContact.roleLabel}
                  </span>
                )}
              </div>

              <p className="text-xs font-mono text-emerald-400">
                {order.siteContact?.phone || order.customerPhone}
              </p>

              <div className="flex items-start gap-2 pt-1 text-xs text-slate-300">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{order.shippingAddress}</span>
              </div>
            </div>

            {/* Quick Contact Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              {telUrl ? (
                <a
                  href={telUrl}
                  className="min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 hover:bg-emerald-900"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Gọi người nhận</span>
                </a>
              ) : (
                <button
                  disabled
                  className="min-h-[48px] px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-500 flex items-center justify-center gap-1.5 cursor-not-allowed opacity-50"
                >
                  <Phone className="w-4 h-4" />
                  <span>Không có SĐT</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => window.open(mapsUrl, '_blank')}
                className="min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-blue-950/60 border border-blue-600/40 text-blue-300 hover:bg-blue-900"
              >
                <Navigation className="w-4 h-4 text-blue-400" />
                <span>Mở bản đồ Maps</span>
              </button>
            </div>
          </div>

          {/* Payment & COD Breakdown */}
          <div
            className={`p-4 rounded-2xl border ${
              isCod
                ? 'bg-amber-950/30 border-amber-600/40'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-amber-400" /> Thanh toán
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isCod
                    ? 'bg-amber-400 text-black'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isCod ? 'Thu hộ COD' : 'Chuyển khoản (Đã thanh toán)'}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs text-slate-300">
                {isCod ? 'Số tiền shipper cần thu:' : 'Số tiền mặt thu khách:'}
              </span>
              <span className="text-xl font-black font-mono text-amber-400">
                {isCod ? formatCurrencyVND(totalAmount) : '0 ₫'}
              </span>
            </div>
          </div>

          {/* Items List */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isHighContrast
                ? 'bg-black border-2 border-yellow-400 text-white'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-blue-400" /> Danh mục vật tư M&E ({order.items.length})
            </h2>

            <div className="divide-y divide-slate-800">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{item.productName || item.name}</p>
                    <p className="text-[11px] text-slate-400">
                      SKU: {item.sku} • Hãng: {item.brand}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-amber-300">
                      x{item.quantity} {item.unit}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatCurrencyVND(item.unitPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* POD Information if Delivered */}
          {order.status === 'DELIVERED' && order.pod && (
            <div className="p-4 rounded-2xl border border-emerald-600/40 bg-emerald-950/20 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Bằng chứng giao hàng (POD)
              </h2>

              <div className="text-xs space-y-1">
                <p className="text-slate-200">
                  <span className="text-slate-400">Người ký nhận:</span>{' '}
                  <span className="font-bold text-white">{order.pod.receiverName}</span>
                </p>
                <p className="text-slate-400">
                  Thời gian: {formatDateTime(order.pod.capturedAt || order.deliveredAt)}
                </p>
              </div>

              {/* Photos Gallery */}
              {order.pod.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {order.pod.photos.map((p, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-800"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.thumbnail}
                        alt={`POD ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Incident Information if Cancelled */}
          {order.status === 'CANCELLED' && order.incident && (
            <div className="p-4 rounded-2xl border border-rose-600/40 bg-rose-950/30 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" /> Báo cáo sự cố giao hàng
              </h2>
              <div className="text-xs space-y-1">
                <p className="font-bold text-white">
                  Phân loại: {order.incident.category}
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Chi tiết: {order.incident.detail}
                </p>
                <p className="text-slate-400 text-[11px]">
                  Báo lúc: {formatDateTime(order.incident.at)}
                </p>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" /> Nhật ký trạng thái
            </h2>

            <div className="space-y-3">
              {order.statusHistory.map((h, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-bold text-white">{h.status}</span>
                      <span className="text-[11px] text-slate-500">
                        {formatDateTime(h.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{h.changedBy}</p>
                    {h.note && (
                      <p className="text-[11px] text-slate-300 mt-0.5 italic">
                        &quot;{h.note}&quot;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Primary Action Button (Fixed Bottom on Mobile) */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md sticky bottom-16 space-y-2">
          {order.status === 'PACKING' && (
            <button
              type="button"
              onClick={handlePickup}
              disabled={isPickingUp}
              className="w-full min-h-[52px] px-4 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/30 transition-all active:scale-[0.98]"
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
                onClick={() => setIsPodModalOpen(true)}
                className="w-full min-h-[52px] px-4 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98]"
              >
                <Camera className="w-5 h-5" />
                <span>XÁC NHẬN GIAO HÀNG (POD)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsIncidentModalOpen(true)}
                className="w-full min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-rose-950/60 text-rose-300 hover:bg-rose-900 border border-rose-600/40"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Báo sự cố giao thất bại</span>
              </button>
            </div>
          )}
        </div>

        {/* Modals */}
        <PodModal
          order={order}
          shipperId={currentShipperId}
          shipperName={currentShipperName}
          isOpen={isPodModalOpen}
          onClose={() => setIsPodModalOpen(false)}
          onSuccess={() => setIsPodModalOpen(false)}
        />

        <IncidentModal
          order={order}
          shipperId={currentShipperId}
          shipperName={currentShipperName}
          isOpen={isIncidentModalOpen}
          onClose={() => setIsIncidentModalOpen(false)}
          onSuccess={() => setIsIncidentModalOpen(false)}
        />
      </ShipperShell>
    </RouteGuard>
  );
}
