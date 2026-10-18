'use client';

import React, { useEffect, useState } from 'react';
import { Order } from '@/types/manager';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderCountdownBadge } from './OrderCountdownBadge';
import { formatCurrencyVND, formatDateTime } from '@/lib/formatters';
import { api } from '@/lib/api';
import { mapOrderFromApi } from '@/lib/orderMapper';
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Truck,
  Package,
  History,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailModal({
  order: propOrder,
  isOpen,
  onClose,
}: OrderDetailModalProps) {
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!isOpen || !propOrder?.id) {
      setDetailOrder(null);
      return;
    }
    let cancelled = false;
    api
      .get<any>(`/orders/${propOrder.id}`)
      .then((raw) => {
        if (!cancelled && raw) {
          const mapped = mapOrderFromApi(raw);
          setDetailOrder({
            ...propOrder,
            ...mapped,
            items:
              mapped.items && mapped.items.length > 0
                ? mapped.items
                : propOrder.items,
            shipperName: propOrder.shipperName || mapped.shipperName,
          });
        }
      })
      .catch(() => {
        // Fallback to propOrder if offline or mock ID
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, propOrder]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const order = detailOrder || propOrder;
  if (!isOpen || !order) return null;

  const totalAmount = order.totalAmount || 0;
  const discountAmount = order.discountAmount || 0;
  const finalAmount = order.finalAmount || Math.max(0, totalAmount - discountAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex flex-wrap items-center gap-3">
            <h2
              id="order-detail-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              Đơn hàng #{order.code}
            </h2>
            <OrderStatusBadge status={order.status} size="sm" />
            {order.is2H && <OrderCountdownBadge order={order} size="sm" />}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Đóng chi tiết đơn hàng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer & Delivery Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <User className="w-4 h-4 text-amber-500" />
                <span>Thông tin khách hàng</span>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {order.customerName}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{order.customerPhone}</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>{order.shippingAddress}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Truck className="w-4 h-4 text-blue-500" />
                <span>Vận chuyển & Điều phối</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Thời gian tạo:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatDateTime(order.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Loại giao hàng:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {order.is2H ? 'Hỏa tốc 2H' : 'Tiêu chuẩn'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Shipper phụ trách:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {order.shipperName || 'Chưa phân công'}
                </span>
              </div>
              {order.deliveredAt && (
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Thời gian giao:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatDateTime(order.deliveredAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Thanh toán:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {order.paymentMethod === 'BANK_TRANSFER' || order.paymentMethod === 'BANK' ? 'Chuyển khoản QR (PayOS)' : 'Thanh toán COD'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Trạng thái:</span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                order.paymentStatus === 'PAID'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : order.paymentStatus === 'PENDING'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {order.paymentStatus || 'UNPAID'}
              </span>
              {order.payosOrderCode && (
                <span className="font-mono text-slate-400 text-[11px]">
                  (Mã GD: #{order.payosOrderCode})
                </span>
              )}
              {order.paidAt && (
                <span className="text-slate-400 text-[11px]">
                  • Lúc {formatDateTime(order.paidAt)}
                </span>
              )}
            </div>
          </div>

          {/* Cancellation Notice if Cancelled */}
          {order.status === 'CANCELLED' && order.cancellationReason && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                  Lý do hủy đơn hàng
                </h4>
                <p className="text-sm text-rose-700 dark:text-rose-400 mt-0.5">
                  {order.cancellationReason}
                </p>
                {order.cancelledAt && (
                  <p className="text-[11px] text-rose-500 dark:text-rose-400/80 mt-1">
                    Thời điểm hủy: {formatDateTime(order.cancelledAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* POD Confirmation Details if Delivered */}
          {order.status === 'DELIVERED' && (order.podRecipientName || order.podPhotoUrl || order.codCollected !== undefined) && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Biên bản giao hàng (POD) & Tiền COD</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {order.podRecipientName && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Người ký nhận: </span>
                    <strong className="text-slate-900 dark:text-white">{order.podRecipientName}</strong>
                  </div>
                )}
                {order.codCollected !== undefined && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Tiền COD đã thu: </span>
                    <strong className="text-amber-600 dark:text-amber-400 font-mono">
                      {formatCurrencyVND(order.codCollected)}
                    </strong>
                    <span className="ml-1 text-[11px] text-slate-500">
                      ({order.codRemitted ? 'Đã nộp quỹ' : 'Chưa nộp quỹ'})
                    </span>
                  </div>
                )}
              </div>
              {order.podPhotoUrl && (
                <div className="pt-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Ảnh chụp đối chứng (POD):
                  </span>
                  <img
                    src={order.podPhotoUrl}
                    alt="Bằng chứng giao hàng"
                    className="w-32 h-32 object-cover rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-sm"
                  />
                </div>
              )}
            </div>
          )}

          {/* Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                <span>Danh mục vật tư ({order.items?.length || 0})</span>
              </h3>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-3 py-2.5">Sản phẩm</th>
                      <th className="px-3 py-2.5">Thương hiệu</th>
                      <th className="px-3 py-2.5 text-center">SL</th>
                      <th className="px-3 py-2.5 text-right">Đơn giá niêm yết</th>
                      <th className="px-3 py-2.5 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {order.items?.map((item, index) => {
                      const itemTotal =
                        typeof item.total === 'number'
                          ? item.total
                          : item.quantity * item.unitPrice;

                      return (
                        <tr
                          key={`${item.productId}-${index}`}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-white">
                            <div>{item.productName}</div>
                            {item.sku && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                SKU: {item.sku}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {item.brand}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold">
                            {item.quantity}{' '}
                            <span className="text-[10px] font-normal text-slate-400">
                              {item.unit}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium">
                            {formatCurrencyVND(item.unitPrice)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                            {formatCurrencyVND(itemTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Price summary */}
              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tổng tiền hàng:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrencyVND(totalAmount)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Chiết khấu đơn hàng:</span>
                    <span className="font-semibold">
                      -{formatCurrencyVND(discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60 text-sm font-extrabold text-slate-900 dark:text-white">
                  <span>Thực thu / Giá trị đơn:</span>
                  <span className="text-amber-600 dark:text-amber-400 text-base">
                    {formatCurrencyVND(finalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status History Timeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-amber-500" />
              <span>Lịch sử trạng thái</span>
            </h3>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-850/50">
              <ol className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-4">
                {order.statusHistory?.map((entry, idx) => (
                  <li key={idx} className="ml-5 relative">
                    <span className="absolute -left-[27px] top-1 flex items-center justify-center w-4 h-4 bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-full">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <OrderStatusBadge status={entry.status} size="sm" showIcon={false} />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {entry.changedBy}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(entry.timestamp)}
                      </span>
                    </div>
                    {entry.note && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 pl-0.5">
                        {entry.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailModal;
