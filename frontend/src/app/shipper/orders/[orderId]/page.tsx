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
import { api } from '@/lib/api';
import { mapOrderFromApi } from '@/lib/orderMapper';
import { Order } from '@/types/manager';
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
  Flame,
  Check,
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
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const orderId = params?.orderId as string;

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    api
      .get<any>(`/orders/${orderId}`)
      .then((raw) => {
        if (!cancelled && raw) {
          setDetailOrder(mapOrderFromApi(raw));
        }
      })
      .catch(() => {
        // Fallback to store order
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const currentShipperId = user?.shipperId || user?.id || '';
  const currentShipperName =
    shippers.find((s) => s.id === currentShipperId)?.name ||
    user?.name ||
    user?.fullName ||
    'Nhân viên giao hàng';

  const storeOrder = orders.find((o) => o.id === orderId);
  const order = detailOrder
    ? {
        ...storeOrder,
        ...detailOrder,
        items:
          detailOrder.items && detailOrder.items.length > 0
            ? detailOrder.items
            : storeOrder?.items || [],
      }
    : storeOrder;

  // STRICT DATA ISOLATION:
  const isAuthorizedShipper =
    order &&
    (order.shipperId === currentShipperId ||
      order.shipperId === user?.id ||
      user?.role === 'MANAGER');

  if (!order || !isAuthorizedShipper) {
    return (
      <RouteGuard allowedRoles={['SHIPPER', 'MANAGER']}>
        <ShipperShell>
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              404 — Không Tìm Thấy Đơn Hàng
            </h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Đơn hàng không tồn tại hoặc không thuộc quyền giao vận của bạn. Vui lòng quay lại danh sách đơn hàng.
            </p>
            <button
              onClick={() => router.replace('/shipper')}
              className="min-h-[48px] px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-black transition-all active:scale-95 border border-slate-700"
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
  const isUrgent = is2H && remainingMinutes !== null && remainingMinutes <= 15 && remainingMinutes > 0;

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
    <RouteGuard allowedRoles={['SHIPPER', 'MANAGER']}>
      <ShipperShell>
        {/* Navigation & Header */}
        <div
          className={`p-4 border-b flex items-center justify-between gap-3 ${
            isHighContrast
              ? 'bg-white border-b-4 border-black text-black'
              : 'bg-slate-900/90 border-slate-800 backdrop-blur-md'
          }`}
        >
          <Link
            href="/shipper"
            className={`min-h-[48px] min-w-[48px] p-2.5 rounded-2xl flex items-center justify-center transition-all active:scale-95 border ${
              isHighContrast
                ? 'bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 shadow-sm'
            }`}
            aria-label="Quay lại danh sách"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="text-center min-w-0">
            <h1
              className={`text-base font-black font-mono tracking-tight ${
                isHighContrast ? 'text-black' : 'text-white'
              }`}
            >
              {order.code}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className="shrink-0">
            {order.status === 'PACKING' && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-black tracking-tight ${
                  isHighContrast
                    ? 'bg-amber-300 text-black border-2 border-black'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                Chờ lấy kho
              </span>
            )}
            {order.status === 'SHIPPING' && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-black tracking-tight ${
                  isHighContrast
                    ? 'bg-blue-300 text-black border-2 border-black'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}
              >
                Đang giao
              </span>
            )}
            {order.status === 'DELIVERED' && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-black tracking-tight ${
                  isHighContrast
                    ? 'bg-emerald-300 text-black border-2 border-black'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                Đã giao
              </span>
            )}
            {order.status === 'CANCELLED' && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-black tracking-tight ${
                  isHighContrast
                    ? 'bg-rose-300 text-black border-2 border-black'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
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
              className={`p-4 rounded-3xl border flex items-center justify-between gap-3 shadow-md ${
                isOverdue
                  ? isHighContrast
                    ? 'bg-rose-300 border-4 border-black text-black'
                    : 'bg-rose-950/60 border-rose-500 text-rose-200'
                  : isUrgent
                  ? isHighContrast
                    ? 'bg-amber-300 border-4 border-black text-black'
                    : 'bg-amber-950/60 border-amber-500 text-amber-200'
                  : isHighContrast
                  ? 'bg-slate-100 border-2 border-black text-black'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Flame className="w-5 h-5 shrink-0 text-orange-400" />
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">
                    Đơn Hỏa Tốc 2H Công Trình
                  </p>
                  <p className="text-[11px] opacity-80 font-medium">
                    Cam kết giao tận chân công trình trong 120 phút
                  </p>
                </div>
              </div>

              {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && remainingMinutes !== null && (
                <div
                  className={`text-xs font-black px-3 py-1.5 rounded-xl font-mono ${
                    isOverdue
                      ? 'bg-rose-600 text-white animate-pulse'
                      : isUrgent
                      ? 'bg-amber-500 text-black animate-pulse'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {isOverdue
                    ? `Quá hạn ${Math.abs(remainingMinutes)}p!`
                    : isUrgent
                    ? `CÒN ${remainingMinutes}P (GẤP)!`
                    : `Còn ${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}p`}
                </div>
              )}
            </div>
          )}

          {/* Construction Site Contact & Delivery Location */}
          <div
            className={`p-4 rounded-3xl border space-y-3.5 shadow-md ${
              isHighContrast
                ? 'bg-white border-4 border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-slate-900/90 border-slate-800 text-white backdrop-blur-md'
            }`}
          >
            <h2
              className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                isHighContrast ? 'text-black font-black' : 'text-slate-400'
              }`}
            >
              <User className="w-4 h-4 text-emerald-400" /> Thông tin nhận hàng & công trình
            </h2>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span
                  className={`text-base font-black ${
                    isHighContrast ? 'text-black' : 'text-white'
                  }`}
                >
                  {order.siteContact?.name || order.customerName || 'Khách hàng'}
                </span>
                {order.siteContact?.roleLabel && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-lg font-bold ${
                      isHighContrast
                        ? 'bg-black text-white font-black'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {order.siteContact.roleLabel}
                  </span>
                )}
              </div>

              <p
                className={`text-xs font-mono font-bold ${
                  isHighContrast ? 'text-black' : 'text-emerald-400'
                }`}
              >
                {order.siteContact?.phone || order.customerPhone}
              </p>

              <div className="flex items-start gap-2.5 pt-1 text-xs">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span
                  className={`leading-relaxed font-medium ${
                    isHighContrast ? 'text-black font-bold' : 'text-slate-300'
                  }`}
                >
                  {order.shippingAddress}
                </span>
              </div>
            </div>

            {/* Quick 1-Tap Contact Cluster */}
            <div
              className={`grid grid-cols-2 gap-2.5 pt-3 border-t ${
                isHighContrast ? 'border-t-2 border-black' : 'border-slate-800'
              }`}
            >
              {telUrl ? (
                <a
                  href={telUrl}
                  className={`min-h-[48px] px-3 py-2 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 border ${
                    isHighContrast
                      ? 'bg-black text-white border-2 border-black hover:bg-slate-800'
                      : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                  }`}
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Gọi người nhận</span>
                </a>
              ) : (
                <button
                  disabled
                  className="min-h-[48px] px-3 py-2 rounded-2xl text-xs font-bold bg-slate-800 text-slate-500 flex items-center justify-center gap-2 cursor-not-allowed opacity-50 border border-slate-700/50"
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
                    ? 'bg-black text-white border-2 border-black hover:bg-slate-800'
                    : 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-600/30'
                }`}
              >
                <Navigation className="w-4 h-4 text-cyan-400" />
                <span>Mở bản đồ Maps</span>
              </button>
            </div>
          </div>

          {/* Prominent Payment & COD Money Box */}
          <div
            className={`p-4 rounded-3xl border shadow-md ${
              isCod
                ? isHighContrast
                  ? 'bg-amber-300 border-4 border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/50'
                : isHighContrast
                ? 'bg-emerald-200 border-4 border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  isCod
                    ? isHighContrast
                      ? 'text-black'
                      : 'text-amber-400'
                    : isHighContrast
                    ? 'text-black'
                    : 'text-emerald-400'
                }`}
              >
                <Banknote className="w-4 h-4" /> Thanh toán đơn hàng
              </span>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isCod
                    ? isHighContrast
                      ? 'bg-black text-white font-black'
                      : 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                    : isHighContrast
                    ? 'bg-black text-white font-black'
                    : 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50'
                }`}
              >
                {isCod ? 'Thu hộ COD' : 'Đã thanh toán (0 ₫)'}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span
                className={`text-xs font-bold ${
                  isHighContrast ? 'text-black font-extrabold' : 'text-slate-300'
                }`}
              >
                {isCod ? 'Số tiền tài xế cần thu:' : 'Số tiền mặt thu khách:'}
              </span>
              <span
                className={`text-2xl font-black font-mono tracking-tight ${
                  isCod
                    ? isHighContrast
                      ? 'text-black font-black'
                      : 'text-amber-300'
                    : isHighContrast
                    ? 'text-black font-black'
                    : 'text-emerald-300'
                }`}
              >
                {isCod ? formatCurrencyVND(totalAmount) : '0 ₫'}
              </span>
            </div>
          </div>

          {/* Manifest Item List for Warehouse Inspection */}
          <div
            className={`p-4 rounded-3xl border space-y-3.5 shadow-md ${
              isHighContrast
                ? 'bg-white border-4 border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-slate-900/90 border-slate-800 text-white backdrop-blur-md'
            }`}
          >
            <h2
              className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                isHighContrast ? 'text-black font-black' : 'text-slate-400'
              }`}
            >
              <Boxes className="w-4 h-4 text-blue-400" /> Danh mục vật tư kiểm đếm ({order.items.length} món)
            </h2>

            <div
              className={`divide-y ${
                isHighContrast ? 'divide-black' : 'divide-slate-800'
              }`}
            >
              {order.items.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-black truncate ${
                        isHighContrast ? 'text-black' : 'text-white'
                      }`}
                    >
                      {item.productName || item.name}
                    </p>
                    <p
                      className={`text-[11px] font-mono mt-0.5 ${
                        isHighContrast ? 'text-black font-semibold' : 'text-slate-400'
                      }`}
                    >
                      SKU: {item.sku} • Hãng: {item.brand}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`font-mono font-black text-sm ${
                        isHighContrast ? 'text-black' : 'text-amber-300'
                      }`}
                    >
                      x{item.quantity} {item.unit}
                    </p>
                    <p
                      className={`text-[11px] font-mono ${
                        isHighContrast ? 'text-black' : 'text-slate-400'
                      }`}
                    >
                      {formatCurrencyVND(item.unitPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* POD Information if Delivered */}
          {order.status === 'DELIVERED' && order.pod && (
            <div
              className={`p-4 rounded-3xl border space-y-3 shadow-md ${
                isHighContrast
                  ? 'bg-emerald-100 border-4 border-black text-black'
                  : 'bg-emerald-950/20 border-emerald-600/40'
              }`}
            >
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Bằng chứng giao hàng (POD)
              </h2>

              <div className="text-xs space-y-1 font-medium">
                <p>
                  <span className="text-slate-400">Người ký nhận:</span>{' '}
                  <span className="font-extrabold text-white">{order.pod.receiverName}</span>
                </p>
                <p className="text-slate-400 font-mono text-[11px]">
                  Thời gian: {formatDateTime(order.pod.capturedAt || order.deliveredAt)}
                </p>
              </div>

              {/* Photos Gallery */}
              {order.pod.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {order.pod.photos.map((p, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 shadow-sm"
                    >
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
            <div
              className={`p-4 rounded-3xl border space-y-2 shadow-md ${
                isHighContrast
                  ? 'bg-rose-100 border-4 border-black text-black'
                  : 'bg-rose-950/30 border-rose-600/40 text-rose-200'
              }`}
            >
              <h2 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" /> Báo cáo sự cố giao hàng
              </h2>
              <div className="text-xs space-y-1">
                <p className="font-black text-white">
                  Phân loại: {order.incident.category}
                </p>
                <p className="leading-relaxed">
                  Chi tiết: {order.incident.detail}
                </p>
                <p className="text-[11px] opacity-80 font-mono">
                  Báo lúc: {formatDateTime(order.incident.at)}
                </p>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div
            className={`p-4 rounded-3xl border space-y-3 shadow-md ${
              isHighContrast
                ? 'bg-white border-4 border-black text-black'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <h2
              className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isHighContrast ? 'text-black' : 'text-slate-400'
              }`}
            >
              <FileText className="w-4 h-4" /> Nhật ký trạng thái
            </h2>

            <div className="space-y-3">
              {order.statusHistory.map((h, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 mt-1 shrink-0 ring-4 ring-cyan-900/40" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={`font-black ${
                          isHighContrast ? 'text-black' : 'text-white'
                        }`}
                      >
                        {h.status}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {formatDateTime(h.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">{h.changedBy}</p>
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

        {/* Primary Action Button (Fixed Bottom on Mobile for 1-Tap Thumb Execution) */}
        <div
          className={`p-4 border-t sticky bottom-16 space-y-2.5 z-30 ${
            isHighContrast
              ? 'bg-white border-t-4 border-black'
              : 'bg-slate-950/95 border-slate-800 backdrop-blur-xl shadow-2xl'
          }`}
        >
          {order.status === 'PACKING' && (
            <button
              type="button"
              onClick={handlePickup}
              disabled={isPickingUp}
              className={`w-full min-h-[54px] px-4 py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] border shadow-xl ${
                isHighContrast
                  ? 'bg-amber-300 text-black border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-slate-950 border-amber-400 shadow-amber-900/50'
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
                  <span>XÁC NHẬN LẤY HÀNG TẠI KHO</span>
                </>
              )}
            </button>
          )}

          {order.status === 'SHIPPING' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsPodModalOpen(true)}
                className={`w-full min-h-[54px] px-4 py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] border shadow-2xl ${
                  isHighContrast
                    ? 'bg-emerald-300 text-black border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white border-emerald-400 shadow-emerald-900/60'
                }`}
              >
                <Camera className="w-5 h-5" />
                <span>GIAO HÀNG & CHỤP ẢNH (POD)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsIncidentModalOpen(true)}
                className={`w-full min-h-[48px] px-3 py-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border active:scale-[0.98] ${
                  isHighContrast
                    ? 'bg-white text-rose-700 border-2 border-black hover:bg-rose-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border-rose-500/30'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Báo sự cố giao hàng</span>
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
          onSuccess={() => {
            setIsPodModalOpen(false);
            fetchOrders();
          }}
        />

        <IncidentModal
          order={order}
          shipperId={currentShipperId}
          shipperName={currentShipperName}
          isOpen={isIncidentModalOpen}
          onClose={() => setIsIncidentModalOpen(false)}
          onSuccess={() => {
            setIsIncidentModalOpen(false);
            fetchOrders();
          }}
        />
      </ShipperShell>
    </RouteGuard>
  );
}
