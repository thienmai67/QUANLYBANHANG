'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useManagerStore } from '@/store/useManagerStore';
import { Order, OrderStatus } from '@/types/manager';
import { exportOrdersToExcel } from '@/lib/excel';
import { formatCurrencyVND, formatDateTime } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import { OrderStatusBadge } from '@/components/manager/OrderStatusBadge';
import { OrderCountdownBadge } from '@/components/manager/OrderCountdownBadge';
import { OrderDetailModal } from '@/components/manager/OrderDetailModal';
import { ShipperAssignModal } from '@/components/manager/ShipperAssignModal';
import { CancelOrderModal } from '@/components/manager/CancelOrderModal';
import { CodSettlementListModal } from '@/components/manager/CodSettlementListModal';
import {
  Search,
  Zap,
  FileSpreadsheet,
  Banknote,
  CheckCircle,
  Truck,
  Package,
  XCircle,
  Clock,
  Eye,
  Filter,
  AlertTriangle,
  RotateCcw,
  User,
  Phone,
  MapPin,
  Loader2,
} from 'lucide-react';

type StatusFilter = OrderStatus | 'ALL';

const STATUS_TABS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING', label: 'Chờ duyệt' },
  { id: 'PACKING', label: 'Đang đóng gói' },
  { id: 'SHIPPING', label: 'Đang giao' },
  { id: 'DELIVERED', label: 'Đã giao' },
  { id: 'CANCELLED', label: 'Đã hủy' },
];

function OrdersManagementContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const { orders, ordersLoading, ordersError, fetchOrders, fetchProducts, fetchShippers, approveOrder, deliverOrder } = useManagerStore();
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Fetch orders, products, and shippers from API on mount
  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchShippers();
  }, [fetchOrders, fetchProducts, fetchShippers]);

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [only2H, setOnly2H] = useState<boolean>(false);

  // Modals state
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const [assignOrder, setAssignOrder] = useState<Order | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState<boolean>(false);

  const [cancelTargetOrder, setCancelTargetOrder] = useState<Order | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);
  const [isCodListOpen, setIsCodListOpen] = useState<boolean>(false);

  const [exporting, setExporting] = useState<boolean>(false);

  // Sync status tab with URL query parameter (e.g. ?status=PENDING from Bell notification)
  useEffect(() => {
    const statusParam = searchParams.get('status') as OrderStatus | null;
    if (statusParam && ['PENDING', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED'].includes(statusParam)) {
      setSelectedStatus(statusParam);
    }
  }, [searchParams]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      ALL: orders.length,
      PENDING: 0,
      PACKING: 0,
      SHIPPING: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    for (const o of orders) {
      if (o.status in counts) {
        counts[o.status] += 1;
      }
    }
    return counts;
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Status filter
      if (selectedStatus !== 'ALL' && o.status !== selectedStatus) {
        return false;
      }

      // 2H filter
      if (only2H && !o.is2H) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = o.code.toLowerCase().includes(q);
        const matchCustomer = o.customerName.toLowerCase().includes(q);
        const matchPhone = o.customerPhone.includes(q);
        const matchAddress = o.shippingAddress.toLowerCase().includes(q);
        if (!matchCode && !matchCustomer && !matchPhone && !matchAddress) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, selectedStatus, only2H, searchQuery]);

  // Action: Approve Order (Atomic deduction with stock guard & backend sync)
  const handleApprove = async (order: Order) => {
    if (processingOrderId) return;
    setProcessingOrderId(order.id);
    try {
      const res = await approveOrder(order.id, 'Manager Hải Đăng');
      if (res.success) {
        toast.success(
          `Đã duyệt đơn #${order.code}, trừ tồn kho thành công và chuyển sang Đang đóng gói`
        );
      } else {
        toast.error(res.error || 'Duyệt đơn hàng thất bại do không đủ tồn kho');
      }
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Action: Deliver Order (Shipper completed delivery)
  const handleDeliver = async (order: Order) => {
    if (processingOrderId) return;
    setProcessingOrderId(order.id);
    try {
      const res = await deliverOrder(order.id, 'Manager Hải Đăng');
      if (res.success) {
        toast.success(`Đã xác nhận đơn #${order.code} giao thành công`);
      } else {
        toast.error(res.error || 'Xác nhận giao hàng thất bại');
      }
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Action: Export Excel
  const handleExportExcel = async () => {
    if (filteredOrders.length === 0) {
      toast.error('Không có đơn hàng nào trong danh sách lọc để xuất Excel');
      return;
    }

    setExporting(true);
    try {
      const filename = `TDT_Don_Hang_${new Date().toISOString().slice(0, 10)}.xlsx`;
      await exportOrdersToExcel(filteredOrders, filename);
      toast.success(
        `Đã xuất thành công ${filteredOrders.length} đơn hàng ra file "${filename}"`
      );
    } catch (err: any) {
      toast.error(err.message || 'Lỗi xuất file Excel');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Quản Lý & Phê Duyệt Đơn Hàng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Phê duyệt vật tư xuất kho, điều phối shipper giao hỏa tốc 2H và theo dõi trạng thái
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCodListOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition-all"
            title="Xem danh sách các biên bản quyết toán COD cuối ca"
          >
            <Banknote className="w-4 h-4" />
            <span>Sổ Quyết Toán COD</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || filteredOrders.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
            title="Xuất toàn bộ đơn hàng đang lọc ra Excel"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span>Xuất Excel ({filteredOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Status Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 pb-px min-w-max">
          {STATUS_TABS.map((tab) => {
            const isActive = selectedStatus === tab.id;
            const count = statusCounts[tab.id];

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  isActive
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input & 2H Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn (DH-...), tên khách, số điện thoại, công trình..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        {/* 2H Express Filter Toggle */}
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer select-none shrink-0 hover:border-amber-400 transition-colors">
          <input
            type="checkbox"
            checked={only2H}
            onChange={(e) => setOnly2H(e.target.checked)}
            className="w-3.5 h-3.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
          />
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Chỉ đơn hỏa tốc 2H
          </span>
        </label>
      </div>

      {/* Orders List Container */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Không tìm thấy đơn hàng nào phù hợp với điều kiện lọc
          </p>
          <p className="text-xs text-slate-400">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn tab trạng thái khác
          </p>
        </div>
      ) : (
        <>
          {/* ===================== DESKTOP TABLE VIEW (hidden on mobile < 768px) ===================== */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Mã đơn</th>
                    <th className="px-4 py-3">Khách hàng</th>
                    <th className="px-4 py-3">Thời gian đặt</th>
                    <th className="px-4 py-3">Giao hàng</th>
                    <th className="px-4 py-3 text-right">Tổng thanh toán</th>
                    <th className="px-4 py-3 text-center">Trạng thái</th>
                    <th className="px-4 py-3">Shipper</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredOrders.map((order) => {
                    const finalAmt = order.finalAmount ?? order.totalAmount;

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Order Code */}
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                          <button
                            type="button"
                            onClick={() => {
                              setDetailOrder(order);
                              setIsDetailOpen(true);
                            }}
                            className="hover:underline text-amber-600 dark:text-amber-400"
                          >
                            #{order.code}
                          </button>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                            {order.customerName}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {order.customerPhone}
                          </div>
                        </td>

                        {/* Order time */}
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {formatDateTime(order.createdAt)}
                        </td>

                        {/* 2H Badge */}
                        <td className="px-4 py-3">
                          {order.is2H ? (
                            <OrderCountdownBadge order={order} size="sm" />
                          ) : (
                            <span className="text-[11px] text-slate-400">Tiêu chuẩn</span>
                          )}
                        </td>

                        {/* Final Amount */}
                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrencyVND(finalAmt)}
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3 text-center">
                          <OrderStatusBadge status={order.status} size="sm" />
                        </td>

                        {/* Shipper */}
                        <td className="px-4 py-3 text-xs">
                          {order.shipperName ? (
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {order.shipperName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa gán</span>
                          )}
                        </td>

                        {/* Action buttons per status */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* PENDING: Duyệt đơn & Hủy đơn */}
                            {order.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  disabled={processingOrderId === order.id}
                                  onClick={() => handleApprove(order)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 transition-colors shadow-sm"
                                  title="Duyệt đơn và trừ tồn kho"
                                >
                                  {processingOrderId === order.id ? 'Đang duyệt...' : 'Duyệt đơn'}
                                </button>
                                <button
                                  type="button"
                                  disabled={processingOrderId === order.id}
                                  onClick={() => {
                                    setCancelTargetOrder(order);
                                    setIsCancelOpen(true);
                                  }}
                                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-50 transition-colors"
                                  title="Hủy đơn hàng"
                                >
                                  Hủy
                                </button>
                              </>
                            )}

                            {/* PACKING: Điều phối Shipper & Hủy đơn */}
                            {order.status === 'PACKING' && (
                              <>
                                <button
                                  type="button"
                                  disabled={processingOrderId === order.id}
                                  onClick={() => {
                                    setAssignOrder(order);
                                    setIsAssignOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white transition-colors shadow-sm"
                                  title="Phân công nhân viên giao hàng"
                                >
                                  Điều phối Shipper
                                </button>
                                <button
                                  type="button"
                                  disabled={processingOrderId === order.id}
                                  onClick={() => {
                                    setCancelTargetOrder(order);
                                    setIsCancelOpen(true);
                                  }}
                                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-50 transition-colors"
                                  title="Hủy đơn hàng và hoàn kho"
                                >
                                  Hủy
                                </button>
                              </>
                            )}

                            {/* SHIPPING: Xác nhận đã giao & Hủy đơn */}
                            {order.status === 'SHIPPING' && (
                              <>
                                <button
                                  type="button"
                                  disabled={processingOrderId === order.id}
                                  onClick={() => handleDeliver(order)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors shadow-sm"
                                  title="Xác nhận shipper đã giao hàng xong"
                                >
                                  {processingOrderId === order.id ? 'Đang xử lý...' : 'Đã giao'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancelTargetOrder(order);
                                    setIsCancelOpen(true);
                                  }}
                                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                  title="Hủy đơn hàng và hoàn kho"
                                >
                                  Hủy
                                </button>
                              </>
                            )}

                            {/* Always allow viewing details */}
                            <button
                              type="button"
                              onClick={() => {
                                setDetailOrder(order);
                                setIsDetailOpen(true);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Xem chi tiết đơn hàng"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===================== MOBILE CARD VIEW (< 768px, NO HORIZONTAL OVERFLOW) ===================== */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((order) => {
              const finalAmt = order.finalAmount ?? order.totalAmount;

              return (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  {/* Top: Code & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailOrder(order);
                        setIsDetailOpen(true);
                      }}
                      className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      #{order.code}
                    </button>
                    <OrderStatusBadge status={order.status} size="sm" />
                  </div>

                  {/* Customer info */}
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customerName}</span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customerPhone}</span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{order.shippingAddress}</span>
                    </div>
                  </div>

                  {/* 2H Badge & Time */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="text-slate-400">
                      {formatDateTime(order.createdAt)}
                    </span>
                    {order.is2H && <OrderCountdownBadge order={order} size="sm" />}
                  </div>

                  {/* Amount & Shipper */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="text-slate-500">
                      Shipper: <strong className="text-slate-800 dark:text-slate-200">{order.shipperName || 'Chưa gán'}</strong>
                    </div>
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {formatCurrencyVND(finalAmt)}
                    </div>
                  </div>

                  {/* Actions for mobile */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailOrder(order);
                        setIsDetailOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Chi tiết</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {order.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setCancelTargetOrder(order);
                              setIsCancelOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(order)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 shadow-sm"
                          >
                            Duyệt đơn
                          </button>
                        </>
                      )}

                      {order.status === 'PACKING' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setCancelTargetOrder(order);
                              setIsCancelOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAssignOrder(order);
                              setIsAssignOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white shadow-sm"
                          >
                            Gán Shipper
                          </button>
                        </>
                      )}

                      {order.status === 'SHIPPING' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setCancelTargetOrder(order);
                              setIsCancelOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeliver(order)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-sm"
                          >
                            Đã giao
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modals */}
      <OrderDetailModal
        order={detailOrder}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      <ShipperAssignModal
        order={assignOrder}
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
      />

      <CancelOrderModal
        order={cancelTargetOrder}
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
      />

      <CodSettlementListModal
        isOpen={isCodListOpen}
        onClose={() => setIsCodListOpen(false)}
      />
    </div>
  );
}

export default function ManagerOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 text-xs">
          Đang tải trang quản lý đơn hàng...
        </div>
      }
    >
      <OrdersManagementContent />
    </Suspense>
  );
}
