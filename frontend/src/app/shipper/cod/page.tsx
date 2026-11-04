'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/auth/RouteGuard';
import ShipperShell from '@/components/shipper/ShipperShell';
import { useAuthStore } from '@/store/useAuthStore';
import { useManagerStore } from '@/store/useManagerStore';
import { useShipperUIStore } from '@/store/useShipperUIStore';
import { useToast } from '@/hooks/useToast';
import { CODSettlement } from '@/types/manager';
import {
  formatCurrencyVND,
  formatDateTime,
  formatDate,
} from '@/lib/formatters';
import {
  Banknote,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  Layers,
  Loader2,
  Calendar,
  CheckSquare,
  Square,
  FileCheck2,
  X,
  Wallet,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export default function ShipperCodLedgerPage() {
  const toast = useToast();
  const { user } = useAuthStore();
  const {
    orders,
    codSettlements,
    settleCod,
    submitCODSettlement,
    fetchOrders,
    fetchCodSettlements,
  } = useManagerStore();
  const { isHighContrast } = useShipperUIStore();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState<CODSettlement | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  const currentShipperId = user?.shipperId || user?.id || '';

  // Fetch live orders and settlements on mount
  useEffect(() => {
    fetchOrders();
    fetchCodSettlements(currentShipperId);
  }, [fetchOrders, fetchCodSettlements, currentShipperId]);

  // Unsettled DELIVERED COD orders for current shipper
  const unsettledOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.shipperId === currentShipperId &&
        o.status === 'DELIVERED' &&
        (o.paymentMethod === 'COD' || o.cod) &&
        !o.codRemitted &&
        (!o.cod || !o.cod.settlementId)
    );
  }, [orders, currentShipperId]);

  // Selected order IDs for settlement (default all)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedOrderIds(unsettledOrders.map((o) => o.id));
  }, [unsettledOrders]);

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === unsettledOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(unsettledOrders.map((o) => o.id));
    }
  };

  const selectedOrders = useMemo(() => {
    return unsettledOrders.filter((o) => selectedOrderIds.includes(o.id));
  }, [unsettledOrders, selectedOrderIds]);

  const totalUnsettled = useMemo(() => {
    return selectedOrders.reduce(
      (sum, o) => sum + (o.codCollected ?? o.cod?.amount ?? o.total ?? o.totalAmount ?? 0),
      0
    );
  }, [selectedOrders]);

  // Group by local calendar date to detect previous days' pending COD
  const todayStr = formatDate(new Date());
  const ordersFromPastDays = unsettledOrders.filter((o) => {
    const orderDateStr = formatDate(o.deliveredAt || o.cod?.collectedAt);
    return orderDateStr && orderDateStr !== todayStr;
  });

  const hasPastDaysPending = ordersFromPastDays.length > 0;
  const pastDaysAmount = ordersFromPastDays.reduce(
    (sum, o) => sum + (o.codCollected ?? o.cod?.amount ?? o.total ?? o.totalAmount ?? 0),
    0
  );

  // Recent 10 settlements
  const recentSettlements = (codSettlements || [])
    .filter((s) => s.shipperId === currentShipperId)
    .sort(
      (a, b) =>
        new Date(b.settledAt || b.createdAt || '').getTime() -
        new Date(a.settledAt || a.createdAt || '').getTime()
    )
    .slice(0, 10);

  const handleConfirmSettle = async () => {
    if (isSettling) return;
    const idsToSettle = selectedOrderIds.length > 0 ? selectedOrderIds : unsettledOrders.map((o) => o.id);
    if (idsToSettle.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 đơn hàng để nộp COD');
      setShowConfirmModal(false);
      return;
    }

    setIsSettling(true);
    try {
      const res = await submitCODSettlement(idsToSettle);
      if (res.success && res.settlement) {
        setCreatedReceipt(res.settlement);
        toast.success(
          `Đã nộp thành công ${formatCurrencyVND(res.settlement.totalAmount)} về quỹ kế toán!`
        );
        setShowConfirmModal(false);
      } else {
        toast.error(res.error || 'Quyết toán COD thất bại từ máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <RouteGuard
      allowedRoles={['SHIPPER']}
      fallbackUrl="/login"
      forbiddenUrl="/403"
    >
      <ShipperShell>
        {/* Navigation & Header */}
        <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
          <Link
            href="/shipper"
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-100 transition-all shrink-0"
            aria-label="Quay lại đơn hàng"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="text-center flex-1">
            <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
              Sổ Quỹ Thu Hộ COD
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Đối soát tiền mặt &amp; nộp quỹ kế toán
            </p>
          </div>

          <div className="w-10" />
        </div>

        {/* Page Content */}
        <div className="p-4 space-y-4">
          {/* 1. Wallet Balance Hero Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 text-white shadow-xl shadow-amber-600/20 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                Tiền mặt COD đang giữ
              </span>
              <Wallet className="w-6 h-6 text-white/90" />
            </div>

            <p className="text-3xl font-black font-mono tracking-tight">
              {formatCurrencyVND(totalUnsettled)}
            </p>

            <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs text-amber-100">
              <span>{unsettledOrders.length} đơn đã giao thành công</span>
              <span className="font-bold underline">Chưa nộp thủ quỹ</span>
            </div>
          </div>

          {/* 2. Past Days Overdue Warning */}
          {hasPastDaysPending && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-rose-800 dark:text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-sm">
                  Cảnh báo: Có {formatCurrencyVND(pastDaysAmount)} từ ca trước chưa nộp!
                </p>
                <p className="leading-relaxed text-rose-700 dark:text-rose-400">
                  Phát hiện {ordersFromPastDays.length} đơn thu COD từ ngày trước chưa nộp về quỹ kế toán. Vui lòng nộp ngay để tránh bị tạm khóa ca nhận đơn mới.
                </p>
              </div>
            </div>
          )}

          {/* 3. Action Button (min-h-[52px]) */}
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={unsettledOrders.length === 0 || selectedOrderIds.length === 0}
            className={`w-full min-h-[52px] px-4 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${
              unsettledOrders.length === 0 || selectedOrderIds.length === 0
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30'
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span>NỘP TIỀN VỀ QUỸ KẾ TOÁN ({selectedOrderIds.length} ĐƠN)</span>
          </button>

          {/* 4. List of Unsettled Orders */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-500" /> Các đơn COD cần nộp ({unsettledOrders.length})
              </h2>
              {unsettledOrders.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  {selectedOrderIds.length === unsettledOrders.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              )}
            </div>

            {unsettledOrders.length === 0 ? (
              <div className="p-8 rounded-2xl text-center space-y-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Tất cả tiền COD đã được nộp đầy đủ về kế toán!
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Sổ quỹ hiện tại đang trống. Chúc bạn một ca làm việc an toàn!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {unsettledOrders.map((o) => {
                  const isChecked = selectedOrderIds.includes(o.id);
                  const orderCodAmount = o.codCollected ?? o.cod?.amount ?? o.total ?? o.totalAmount;

                  return (
                    <div
                      key={o.id}
                      onClick={() => toggleSelectOrder(o.id)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          className="text-amber-600 dark:text-amber-400 shrink-0"
                          aria-label={isChecked ? 'Bỏ chọn' : 'Chọn đơn'}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              #{o.code}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatDateTime(o.deliveredAt || o.cod?.collectedAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {o.siteContact?.name || o.customerName}
                          </p>
                        </div>
                      </div>

                      <span className="font-mono font-bold text-sm shrink-0 text-amber-600 dark:text-amber-400">
                        {formatCurrencyVND(orderCodAmount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Past Settlements History */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-500" /> Lịch sử 10 lần nộp gần nhất
            </h2>

            {recentSettlements.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                Chưa có lịch sử nộp tiền nào
              </p>
            ) : (
              <div className="space-y-2">
                {recentSettlements.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrencyVND(s.totalAmount)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(s.settledAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono truncate max-w-[200px]">Mã phiếu: {s.id}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {s.orderIds.length} đơn hàng
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Xác nhận nộp quỹ COD</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Quyết toán tiền mặt cuối ca</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Số lượng đơn:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedOrders.length} đơn</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Tổng tiền nộp:</span>
                  <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrencyVND(totalUnsettled)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                  Các mã đơn: {selectedOrders.map((o) => o.code).join(', ')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSettling}
                  className="min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSettle}
                  disabled={isSettling}
                  className="min-h-[48px] px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                >
                  {isSettling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang nộp...</span>
                    </>
                  ) : (
                    <span>XÁC NHẬN NỘP</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Created Settlement Receipt Modal */}
        {createdReceipt && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">Biên bản quyết toán COD</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Đã nộp thành công về kế toán</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCreatedReceipt(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Mã biên bản:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                    {createdReceipt.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Tổng tiền nộp:</span>
                  <span className="font-black text-base text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrencyVND(createdReceipt.totalAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Số đơn hoàn tất:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{createdReceipt.orderCount} đơn</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Thời gian tạo:</span>
                  <span className="text-slate-600 dark:text-slate-300">{formatDateTime(createdReceipt.createdAt)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCreatedReceipt(null)}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
              >
                Hoàn tất &amp; Đóng
              </button>
            </div>
          </div>
        )}
      </ShipperShell>
    </RouteGuard>
  );
}
