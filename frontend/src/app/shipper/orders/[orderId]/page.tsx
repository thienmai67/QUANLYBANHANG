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
import { ArrowLeft, Phone, Navigation, Loader2 } from 'lucide-react';

export default function ShipperOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuthStore();
  const { orders, shippers, updateOrderStatusWithActor, fetchOrders } = useManagerStore();

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

  const isAuthorizedShipper =
    order &&
    (order.shipperId === currentShipperId ||
      order.shipperId === user?.id ||
      user?.role === 'MANAGER');

  if (!order || !isAuthorizedShipper) {
    return (
      <RouteGuard allowedRoles={['SHIPPER', 'MANAGER']}>
        <ShipperShell>
          <div className="p-6 text-center space-y-4">
            <h2 className="text-[24px] font-bold text-[#0a0a0a]">
              404 — Không tìm thấy đơn hàng
            </h2>
            <p className="text-[14px] text-[#6b6b6b]">
              Đơn hàng không tồn tại hoặc không thuộc quyền giao vận của bạn.
            </p>
            <button
              onClick={() => router.replace('/shipper')}
              className="min-h-[48px] px-6 rounded-[6px] bg-[#141414] text-white hover:bg-[#222222] text-[16px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fbf]"
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

  const statusLabel =
    order.status === 'SHIPPING'
      ? 'Đang giao'
      : order.status === 'PACKING'
      ? 'Chờ nhận'
      : order.status === 'DELIVERED'
      ? 'Đã giao'
      : order.status === 'CANCELLED'
      ? 'Đã hủy'
      : order.status;

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
        <div className="px-4 py-4 space-y-4">
          {/* 1. Top bar: mã đơn + tên khách */}
          <div className="flex items-start gap-3">
            <Link
              href="/shipper"
              aria-label="Quay lại danh sách đơn"
              className="min-h-[48px] min-w-[48px] rounded-[6px] border border-[#e6e6e6] bg-white flex items-center justify-center text-[#0a0a0a] hover:bg-[#f2f2f2] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fbf]"
            >
              <ArrowLeft className="w-[18px] h-[18px]" />
            </Link>

            <div className="flex-1 min-w-0">
              <p className="text-[14px] text-[#6b6b6b] tabular-nums">
                {order.code}
              </p>
              <h1 className="text-[24px] font-bold text-[#0a0a0a] leading-tight truncate">
                {customerName}
              </h1>
              <p className="text-[14px] text-[#6b6b6b] mt-1 leading-[1.5]">
                {statusLabel} • {formatShortAddress(order.shippingAddress)} • Thu hộ khi giao:{' '}
                {isCod ? formatCurrencyVND(totalAmount) : '0 ₫'}
              </p>
            </div>
          </div>

          {/* 2. 2 ô số liệu: Thu hộ và Khối lượng (tính từ đơn thật) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-[#e6e6e6] rounded-[8px] p-3.5">
              <span className="text-[14px] text-[#6b6b6b]">Thu hộ</span>
              <p className="text-[20px] font-bold tabular-nums text-[#0a0a0a] mt-1">
                {isCod ? formatCurrencyVND(totalAmount) : '0 ₫'}
              </p>
            </div>
            <div className="bg-white border border-[#e6e6e6] rounded-[8px] p-3.5">
              <span className="text-[14px] text-[#6b6b6b]">Khối lượng</span>
              <p className="text-[20px] font-normal tabular-nums text-[#0a0a0a] mt-1">
                {weightText}
              </p>
            </div>
          </div>

          {/* 3. "Hàng cần giao": danh sách tên + số lượng từng món */}
          <div className="bg-white border border-[#e6e6e6] rounded-[8px] p-4 space-y-3">
            <h2 className="text-[16px] font-semibold text-[#0a0a0a]">
              Hàng cần giao ({order.items.length} món)
            </h2>

            <div className="divide-y divide-[#e6e6e6]">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="py-2.5 flex items-center justify-between gap-3 text-[14px]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-[#0a0a0a] truncate">
                      {item.productName || item.name}
                    </p>
                    <p className="text-[14px] text-[#6b6b6b] tabular-nums mt-0.5">
                      x{item.quantity} {item.unit || ''}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[14px] text-[#6b6b6b] tabular-nums">
                      {item.unitPrice ? formatCurrencyVND(item.unitPrice) : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivered POD details (if delivered) */}
          {order.status === 'DELIVERED' && order.pod && (
            <div className="bg-white border border-[#e6e6e6] rounded-[8px] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[14px] px-2 py-0.5 rounded-[6px] bg-[#dcfae5] text-[#04250e] font-normal">
                  Đã giao
                </span>
                <span className="text-[14px] text-[#6b6b6b] tabular-nums">
                  {formatDateTime(order.pod.capturedAt || order.deliveredAt)}
                </span>
              </div>
              <p className="text-[14px] text-[#0a0a0a]">
                Người ký nhận:{' '}
                <span className="font-semibold">{order.pod.receiverName}</span>
              </p>
            </div>
          )}

          {/* Incident details (if cancelled) */}
          {order.status === 'CANCELLED' && order.incident && (
            <div className="bg-white border border-[#ffedea] rounded-[8px] p-4 space-y-2">
              <span className="text-[14px] px-2 py-0.5 rounded-[6px] bg-[#ffedea] text-[#831c1e] font-normal">
                Sự cố: {order.incident.category}
              </span>
              <p className="text-[14px] text-[#6b6b6b] leading-[1.5]">
                {order.incident.detail}
              </p>
            </div>
          )}

          {/* 4. "Xác nhận giao hàng": Nút chính đen full-width + 2 nút phụ + Báo sự cố */}
          <div className="space-y-2 pt-2">
            {order.status === 'SHIPPING' && (
              <>
                <button
                  type="button"
                  onClick={() => setIsPodModalOpen(true)}
                  className="w-full min-h-[48px] rounded-[6px] bg-[#141414] text-white hover:bg-[#222222] text-[16px] font-semibold flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fbf]"
                >
                  Đã giao — Chụp ảnh POD
                </button>

                <div className="grid grid-cols-2 gap-2">
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

                <button
                  type="button"
                  onClick={() => setIsIncidentModalOpen(true)}
                  className="w-full min-h-[48px] rounded-[6px] bg-white text-[#831c1e] border border-[#e6e6e6] hover:bg-[#ffedea] text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fbf]"
                >
                  Liên hệ quản lý
                </button>
              </>
            )}

            {order.status === 'PACKING' && (
              <>
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
                    <span>Xác nhận lấy hàng tại kho</span>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
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
              </>
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
            fetchOrders();
          }}
        />
      </ShipperShell>
    </RouteGuard>
  );
}
