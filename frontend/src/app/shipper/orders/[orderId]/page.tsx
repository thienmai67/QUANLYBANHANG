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
import { useToast } from '@/hooks/useToast';
import { formatCurrencyVND, formatDateTime } from '@/lib/formatters';
import { getTelUrl, getGoogleMapsUrl } from '@/lib/shipperHelpers';
import { formatShortAddress } from '@/components/shipper/ShipperOrderCard';
import { api } from '@/lib/api';
import { mapOrderFromApi } from '@/lib/orderMapper';
import { Order } from '@/types/manager';
import {
  ArrowLeft,
  Phone,
  Navigation,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Package,
  Boxes,
  Banknote,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function ShipperOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;
  const toast = useToast();
  const { user } = useAuthStore();
  const { orders, updateOrderStatusWithActor, fetchOrders } = useManagerStore();

  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isPickingUp, setIsPickingUp] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [localIncident, setLocalIncident] = useState<{
    category: string;
    detail: string;
    reportedAt: string;
  } | null>(null);

  const loadLocalIncident = React.useCallback(() => {
    if (typeof window !== 'undefined' && orderId) {
      try {
        const stored = JSON.parse(
          localStorage.getItem('shipper_incidents') || '{}'
        );
        if (stored[orderId]) {
          setLocalIncident(stored[orderId]);
        }
      } catch {
        // ignore
      }
    }
  }, [orderId]);

  useEffect(() => {
    loadLocalIncident();
  }, [loadLocalIncident]);

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
    user?.fullName ||
    user?.name ||
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
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              404 — Không tìm thấy đơn hàng
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Đơn hàng không tồn tại hoặc không thuộc quyền giao vận của bạn.
            </p>
            <button
              onClick={() => router.replace('/shipper')}
              className="min-h-[46px] px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-md"
            >
              Về danh sách đơn hàng
            </button>
          </div>
        </ShipperShell>
      </RouteGuard>
    );
  }

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

  const getStatusBadge = () => {
    switch (order.status) {
      case 'PACKING':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ nhận tại kho</span>
          </span>
        );
      case 'SHIPPING':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 animate-pulse">
            <Navigation className="w-3.5 h-3.5" />
            <span>Đang giao hàng</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã giao thành công</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
            <span>Sự cố / Hủy đơn</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
            <span>{order.status}</span>
          </span>
        );
    }
  };

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
        <div className="px-4 py-3.5 space-y-4">
          {/* 1. Top Bar: Back Button + Code + Status */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/shipper"
              aria-label="Quay lại danh sách đơn"
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-100 transition-all shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="min-w-0 text-center flex-1">
              <span className="text-[11px] font-mono font-bold text-slate-400">
                Chi tiết đơn vận chuyển
              </span>
              <h1 className="text-base font-black text-slate-900 dark:text-white truncate">
                #{order.code}
              </h1>
            </div>

            <div className="shrink-0">{getStatusBadge()}</div>
          </div>

          {/* 2. Customer Contact & Location Hero Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Người nhận hàng
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                  {customerName}
                </h2>
              </div>
              {order.customerPhone && (
                <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                  {order.customerPhone}
                </span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2 text-xs">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Địa chỉ giao tận nơi:
                </span>
                {order.shippingAddress}
              </div>
            </div>

            {/* Quick Tactical Call & Navigation Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {telUrl ? (
                <a
                  href={telUrl}
                  className="min-h-[46px] rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Gọi người nhận</span>
                </a>
              ) : (
                <button
                  disabled
                  className="min-h-[46px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-medium flex items-center justify-center gap-1.5 cursor-not-allowed"
                >
                  <Phone className="w-4 h-4" />
                  <span>Không có SĐT</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => window.open(mapsUrl, '_blank')}
                className="min-h-[46px] rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Chỉ đường Maps</span>
              </button>
            </div>
          </div>

          {/* 3. COD & Payment Highlight Box */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              isCod
                ? 'bg-amber-50/90 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
                : 'bg-emerald-50/90 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isCod
                    ? 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                    : 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                }`}
              >
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  {isCod ? 'Số tiền cần thu hộ (COD)' : 'Thanh toán trực tuyến'}
                </span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {isCod ? 'Thu tiền mặt trước khi giao' : 'Đã trả đủ qua PayOS (0 ₫)'}
                </span>
              </div>
            </div>

            <div
              className={`text-xl font-black tabular-nums ${
                isCod
                  ? 'text-amber-900 dark:text-amber-300'
                  : 'text-emerald-800 dark:text-emerald-300'
              }`}
            >
              {isCod ? formatCurrencyVND(totalAmount) : '0 ₫'}
            </div>
          </div>

          {/* 4. Goods Manifest: "Hàng cần giao" */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Danh sách hàng giao ({order.items.length} món)
                </h3>
              </div>
              {weightText && (
                <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                  ⚖️ {weightText}
                </span>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-1">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.productName || item.name}
                    </p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold tabular-nums mt-0.5">
                      Số lượng: x{item.quantity} {item.unit || 'món'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                      {item.unitPrice ? formatCurrencyVND(item.unitPrice) : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivered POD details (if delivered) */}
          {order.status === 'DELIVERED' && order.pod && (
            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Bằng chứng đã giao (POD)</span>
                </span>
                <span className="text-[11px] text-slate-500 tabular-nums">
                  {formatDateTime(order.pod.capturedAt || order.deliveredAt)}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Người ký nhận hàng:{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {order.pod.receiverName}
                </span>
              </p>
            </div>
          )}

          {/* Incident details (if cancelled) */}
          {order.status === 'CANCELLED' && order.incident && (
            <div className="bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4" />
                <span>Sự cố: {order.incident.category}</span>
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {order.incident.detail}
              </p>
            </div>
          )}

          {/* Active Local Incident Report Badge for SHIPPING status */}
          {localIncident && order.status === 'SHIPPING' && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 rounded-2xl p-4 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Biên bản sự cố hiện trường: {localIncident.category}</span>
                </span>
                <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
                  {new Date(localIncident.reportedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                &ldquo;{localIncident.detail}&rdquo;
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  Đã chuyển tiếp Điều phối kho xử lý
                </span>
                <a
                  href="tel:0937292769"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Gọi Hotline kho</span>
                </a>
              </div>
            </div>
          )}

          {/* 5. Floating Bottom Action Controls */}
          <div className="space-y-2 pt-2">
            {order.status === 'SHIPPING' && (
              <>
                <button
                  type="button"
                  onClick={() => setIsPodModalOpen(true)}
                  className="w-full min-h-[52px] rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Đã giao — Chụp ảnh POD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsIncidentModalOpen(true)}
                  className="w-full min-h-[46px] rounded-xl bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Báo cáo sự cố cho Quản lý kho</span>
                </button>
              </>
            )}

            {order.status === 'PACKING' && (
              <button
                type="button"
                onClick={handlePickup}
                disabled={isPickingUp}
                className="w-full min-h-[52px] rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
              >
                {isPickingUp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang cập nhật lấy hàng...</span>
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    <span>Xác nhận lấy hàng tại kho</span>
                  </>
                )}
              </button>
            )}

            {order.status === 'DELIVERED' && (
              <div className="space-y-2">
                <Link
                  href="/shipper"
                  className="w-full min-h-[50px] rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay về danh sách đơn hôm nay</span>
                </Link>
                {isCod && (
                  <Link
                    href="/shipper/cod"
                    className="w-full min-h-[46px] rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Banknote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Xem đối soát tiền thu hộ COD</span>
                  </Link>
                )}
              </div>
            )}

            {order.status === 'CANCELLED' && (
              <Link
                href="/shipper"
                className="w-full min-h-[50px] rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay về danh sách đơn hôm nay</span>
              </Link>
            )}
          </div>
        </div>

        {/* POD Modal */}
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

        {/* Incident Modal */}
        <IncidentModal
          order={order}
          shipperId={currentShipperId}
          shipperName={currentShipperName}
          isOpen={isIncidentModalOpen}
          onClose={() => setIsIncidentModalOpen(false)}
          onSuccess={() => {
            setIsIncidentModalOpen(false);
            loadLocalIncident();
            fetchOrders();
          }}
        />
      </ShipperShell>
    </RouteGuard>
  );
}
