'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/auth/RouteGuard';
import ShipperShell from '@/components/shipper/ShipperShell';
import { useAuthStore } from '@/store/useAuthStore';
import { useManagerStore } from '@/store/useManagerStore';
import { useShipperUIStore } from '@/store/useShipperUIStore';
import { useToast } from '@/hooks/useToast';
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
} from 'lucide-react';

export default function ShipperCodLedgerPage() {
  const toast = useToast();
  const { user } = useAuthStore();
  const { orders, codSettlements, settleCod } = useManagerStore();
  const { isHighContrast } = useShipperUIStore();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  const currentShipperId = user?.shipperId || 'ship-02';

  // Unsettled orders for current shipper
  const unsettledOrders = orders.filter(
    (o) =>
      o.shipperId === currentShipperId &&
      o.status === 'DELIVERED' &&
      o.cod &&
      !o.cod.settlementId
  );

  const totalUnsettled = unsettledOrders.reduce(
    (sum, o) => sum + (o.cod?.amount ?? o.total ?? o.totalAmount ?? 0),
    0
  );

  // Group by local calendar date to detect previous days' pending COD
  const todayStr = formatDate(new Date());
  const ordersFromPastDays = unsettledOrders.filter((o) => {
    const orderDateStr = formatDate(o.deliveredAt || o.cod?.collectedAt);
    return orderDateStr && orderDateStr !== todayStr;
  });

  const hasPastDaysPending = ordersFromPastDays.length > 0;
  const pastDaysAmount = ordersFromPastDays.reduce(
    (sum, o) => sum + (o.cod?.amount ?? o.total ?? o.totalAmount ?? 0),
    0
  );

  // Recent 10 settlements
  const recentSettlements = (codSettlements || [])
    .filter((s) => s.shipperId === currentShipperId)
    .sort(
      (a, b) =>
        new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime()
    )
    .slice(0, 10);

  const handleConfirmSettle = async () => {
    if (isSettling) return;
    if (unsettledOrders.length === 0) {
      toast.warning('Không có khoản COD nào cần nộp');
      setShowConfirmModal(false);
      return;
    }

    setIsSettling(true);
    try {
      const res = settleCod(currentShipperId);
      if (res.success) {
        toast.success(
          `Đã nộp thành công ${formatCurrencyVND(totalUnsettled)} về quỹ kế toán! Mã đợt: ${res.settlement?.id || ''}`
        );
        setShowConfirmModal(false);
      } else {
        toast.error(res.error || 'Quyết toán thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <RouteGuard
      allowedRoles={['SHIPPER', 'ADMIN']}
      fallbackUrl="/login"
      forbiddenUrl="/403"
    >
      <ShipperShell>
        {/* Navigation & Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <Link
            href="/shipper"
            className="min-h-[48px] min-w-[48px] p-2.5 rounded-xl flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            aria-label="Quay lại đơn hàng"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="text-center">
            <h1
              className={`text-base font-black tracking-tight ${
                isHighContrast ? 'text-yellow-400' : 'text-white'
              }`}
            >
              Sổ Quỹ Thu Hộ COD
            </h1>
            <p className="text-[11px] text-slate-400">
              Đối soát tiền mặt & nộp quỹ kế toán
            </p>
          </div>

          <div className="w-10" />
        </div>

        {/* Page Content */}
        <div className="p-4 space-y-4">
          {/* 1. Wallet Balance Card */}
          <div
            className={`p-5 rounded-3xl ${
              isHighContrast
                ? 'bg-yellow-400 text-black border-2 border-white'
                : 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-xl shadow-amber-600/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                Tổng tiền COD đang giữ
              </span>
              <Banknote className="w-6 h-6 opacity-80" />
            </div>

            <p className="text-3xl font-black font-mono tracking-tight mt-2">
              {formatCurrencyVND(totalUnsettled)}
            </p>

            <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs opacity-95">
              <span>{unsettledOrders.length} đơn đã giao thành công</span>
              <span>Chưa nộp kế toán</span>
            </div>
          </div>

          {/* 2. Past Days Overdue Warning */}
          {hasPastDaysPending && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                isHighContrast
                  ? 'bg-rose-950 border-rose-500 text-rose-200'
                  : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
              }`}
            >
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-sm">
                  Cảnh báo: Có {formatCurrencyVND(pastDaysAmount)} từ ca trước chưa nộp!
                </p>
                <p className="leading-relaxed opacity-90">
                  Phát hiện {ordersFromPastDays.length} đơn thu COD từ ngày trước chưa nộp về quỹ kế toán. Vui lòng nộp ngay để tránh bị tạm khóa ca nhận đơn mới.
                </p>
              </div>
            </div>
          )}

          {/* 3. Action Button (min-h-[52px]) */}
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={unsettledOrders.length === 0}
            className={`w-full min-h-[52px] px-4 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${
              unsettledOrders.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : isHighContrast
                ? 'bg-yellow-400 text-black hover:bg-yellow-300 border-2 border-black font-extrabold'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30'
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span>NỘP TIỀN VỀ QUỸ KẾ TOÁN</span>
          </button>

          {/* 4. List of Unsettled Orders */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" /> Các đơn COD cần nộp ({unsettledOrders.length})
            </h2>

            {unsettledOrders.length === 0 ? (
              <div
                className={`p-8 rounded-2xl text-center space-y-2 ${
                  isHighContrast
                    ? 'bg-black border border-yellow-400 text-slate-300'
                    : 'bg-slate-900/60 border border-slate-800 text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold">
                  Tất cả tiền COD đã được nộp đầy đủ về kế toán!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {unsettledOrders.map((o) => (
                  <div
                    key={o.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                      isHighContrast
                        ? 'bg-black border-yellow-400 text-white'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-400">
                          {o.code}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDateTime(o.deliveredAt || o.cod?.collectedAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {o.siteContact?.name || o.customerName}
                      </p>
                    </div>

                    <span
                      className={`font-mono font-bold text-sm shrink-0 ${
                        isHighContrast ? 'text-yellow-400' : 'text-amber-400'
                      }`}
                    >
                      {formatCurrencyVND(o.cod?.amount ?? o.total ?? o.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Past Settlements History */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-400" /> Lịch sử 10 lần nộp gần nhất
            </h2>

            {recentSettlements.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                Chưa có lịch sử nộp tiền nào
              </p>
            ) : (
              <div className="space-y-2">
                {recentSettlements.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {formatCurrencyVND(s.totalAmount)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(s.settledAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Mã: {s.id}</span>
                      <span>{s.orderIds.length} đơn hàng</span>
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
            <div
              className={`w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl ${
                isHighContrast
                  ? 'bg-black border-2 border-yellow-400 text-white'
                  : 'bg-slate-900 border border-slate-800 text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Xác nhận nộp quỹ COD</h3>
                  <p className="text-xs text-slate-400">Quyết toán tiền mặt cuối ca</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Số lượng đơn:</span>
                  <span className="font-bold">{unsettledOrders.length} đơn</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tổng tiền nộp:</span>
                  <span className="font-black text-sm text-emerald-400 font-mono">
                    {formatCurrencyVND(totalUnsettled)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  Các mã đơn: {unsettledOrders.map((o) => o.code).join(', ')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSettling}
                  className="min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSettle}
                  disabled={isSettling}
                  className={`min-h-[48px] px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 ${
                    isHighContrast
                      ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
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
      </ShipperShell>
    </RouteGuard>
  );
}
