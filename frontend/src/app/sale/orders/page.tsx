'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  Package,
  Truck,
  AlertCircle,
  X,
  CreditCard,
  Building,
  Phone,
  User,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useSaleStore } from '@/store/useSaleStore';
import { Order, OrderStatus, PaymentStatus } from '@/types/manager';
import { formatCurrencyVND, formatDateTime } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';

export default function SaleOrdersPage() {
  const { orders, fetchOrders, markPaid, isLoading } = useSaleStore();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Confirmation Modal for Mark Paid
  const [confirmMarkPaidOrder, setConfirmMarkPaidOrder] = useState<Order | null>(null);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  useEffect(() => {
    fetchOrders({
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      paymentStatus: paymentFilter !== 'ALL' ? paymentFilter : undefined,
      q: searchTerm.trim() ? searchTerm.trim() : undefined,
    });
  }, [fetchOrders, statusFilter, paymentFilter, searchTerm]);

  const handleMarkPaid = async (order: Order) => {
    // If bank transfer or COD, show confirmation modal
    setConfirmMarkPaidOrder(order);
  };

  const handleConfirmMarkPaid = async () => {
    if (!confirmMarkPaidOrder) return;
    try {
      setIsMarkingPaid(true);
      await markPaid(confirmMarkPaidOrder.id);
      toast.success(`Đã xác nhận thanh toán thành công cho đơn ${confirmMarkPaidOrder.orderNumber}`);
      setConfirmMarkPaidOrder(null);
      if (selectedOrder?.id === confirmMarkPaidOrder.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, paymentStatus: 'PAID' } : null));
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể đánh dấu thanh toán');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <Clock className="w-3 h-3" /> Chờ xử lý
          </span>
        );
      case 'PACKING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
            <Package className="w-3 h-3" /> Đang đóng gói
          </span>
        );
      case 'SHIPPING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
            <Truck className="w-3 h-3" /> Đang giao hàng
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle className="w-3 h-3" /> Đã giao hàng
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <X className="w-3 h-3" /> Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  const getPaymentBadge = (paymentStatus?: PaymentStatus) => {
    switch (paymentStatus) {
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            ĐÃ THANH TOÁN
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            CHỜ XÁC NHẬN
          </span>
        );
      case 'UNPAID':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            CHƯA THANH TOÁN
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Search, Filters & Action Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, khách hàng, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          >
            <option value="ALL">Tất cả trạng thái đơn</option>
            <option value="PENDING">Chờ xử lý (Pending)</option>
            <option value="PACKING">Đang đóng gói (Packing)</option>
            <option value="SHIPPING">Đang giao hàng (Shipping)</option>
            <option value="DELIVERED">Đã giao hàng (Delivered)</option>
            <option value="CANCELLED">Đã hủy (Cancelled)</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="hidden md:block px-3 py-2 text-xs rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          >
            <option value="ALL">Tất cả thanh toán</option>
            <option value="UNPAID">Chưa thanh toán</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="PAID">Đã thanh toán</option>
          </select>
        </div>

        <Link
          href="/sale/orders/new"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo đơn hộ khách</span>
        </Link>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Mã Đơn</th>
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Ngày Tạo</th>
                <th className="py-3 px-4">Tổng Tiền</th>
                <th className="py-3 px-4">Trạng Thái Đơn</th>
                <th className="py-3 px-4">Thanh Toán</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Order Code */}
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-slate-900 dark:text-white font-mono">
                        {order.orderNumber}
                      </span>
                      {order.is2H && (
                        <span className="ml-2 px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500/20 text-rose-500 border border-rose-500/30">
                          HỎA TỐC 2H
                        </span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {order.customerName || 'Khách Vãng Lai'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {order.customerPhone || '—'}
                      </div>
                    </td>

                    {/* Created At */}
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDateTime(order.createdAt)}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                        {formatCurrencyVND(order.totalAmount)}
                      </span>
                    </td>

                    {/* Order Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(order.status)}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4">
                      {getPaymentBadge(order.paymentStatus)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {order.paymentStatus !== 'PAID' && (
                          <button
                            type="button"
                            onClick={() => handleMarkPaid(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 transition-colors"
                            title="Xác nhận thanh toán"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Thu tiền</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-xs">
                      {isLoading ? 'Đang tải dữ liệu đơn hàng...' : 'Không tìm thấy đơn hàng nào trong phạm vi phụ trách.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal (Read-Only for Sale) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <span className="font-extrabold text-slate-900 dark:text-white font-mono text-base">
                  {selectedOrder.orderNumber}
                </span>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Customer Info Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600" />
                  <span>Thông Tin Khách Hàng</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400">Tên: </span>
                    <span className="font-semibold">{selectedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Số ĐT: </span>
                    <span className="font-semibold">{selectedOrder.customerPhone || '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Địa chỉ giao: </span>
                    <span className="font-semibold">{selectedOrder.shippingAddress || 'Theo thỏa thuận'}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">Danh Sách Vật Tư Đặt Hàng</div>
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-[11px] border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2 px-3">Sản phẩm</th>
                        <th className="py-2 px-3 text-right">Đơn giá</th>
                        <th className="py-2 px-3 text-right">Số lượng</th>
                        <th className="py-2 px-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {item.productName || item.name}
                              </div>
                              {item.sku && <div className="text-[10px] text-slate-400">{item.sku}</div>}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                              {formatCurrencyVND(item.unitPrice)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold">
                              {item.quantity} {item.unit || ''}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                              {formatCurrencyVND(item.total || item.quantity * item.unitPrice)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-400">
                            Không có dữ liệu mặt hàng
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50">
                <div className="space-y-1">
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Trạng thái thanh toán</div>
                  <div className="flex items-center gap-2">
                    {getPaymentBadge(selectedOrder.paymentStatus)}
                    <span className="text-[11px] text-slate-500">
                      ({selectedOrder.paymentMethod || 'Chuyển khoản'})
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Tổng giá trị đơn hàng</div>
                  <div className="text-lg font-black text-purple-700 dark:text-purple-300 font-mono">
                    {formatCurrencyVND(selectedOrder.totalAmount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400">
                Quyền hạn Sale: Xem chi tiết &amp; Đánh dấu thu tiền
              </span>
              <div className="flex items-center gap-2">
                {selectedOrder.paymentStatus !== 'PAID' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleMarkPaid(selectedOrder);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
                  >
                    Xác nhận thanh toán (Mark Paid)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Mark Paid */}
      {confirmMarkPaidOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Xác Nhận Thu Tiền Đơn Hàng?
              </h3>
              <p className="text-xs text-slate-500">
                Bạn sắp đánh dấu đơn hàng <strong className="text-slate-900 dark:text-white font-mono">{confirmMarkPaidOrder.orderNumber}</strong> thành trạng thái <span className="text-emerald-600 font-bold">ĐÃ THANH TOÁN (PAID)</span>.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Khách hàng:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{confirmMarkPaidOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số tiền:</span>
                <span className="font-bold text-emerald-600">{formatCurrencyVND(confirmMarkPaidOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hình thức:</span>
                <span className="font-medium text-slate-600 dark:text-slate-300">{confirmMarkPaidOrder.paymentMethod || 'Chuyển khoản'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isMarkingPaid}
                onClick={() => setConfirmMarkPaidOrder(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isMarkingPaid}
                onClick={handleConfirmMarkPaid}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30"
              >
                {isMarkingPaid ? 'Đang xử lý...' : 'Xác nhận đã thu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
