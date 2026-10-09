'use client';

import React, { useEffect, useState } from 'react';
import { useManagerStore } from '@/store/useManagerStore';
import { formatCurrencyVND, formatDateTime } from '@/lib/formatters';
import {
  X,
  Banknote,
  FileCheck2,
  Calendar,
  User,
  Layers,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface CodSettlementListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CodSettlementListModal({
  isOpen,
  onClose,
}: CodSettlementListModalProps) {
  const { codSettlements, shippers, fetchCodSettlements, fetchShippers } = useManagerStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([fetchCodSettlements(), fetchShippers()]).finally(() => {
        setLoading(false);
      });
    }
  }, [isOpen, fetchCodSettlements, fetchShippers]);

  // Handle ESC key
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

  if (!isOpen) return null;

  const totalAmountSum = (codSettlements || []).reduce(
    (sum, s) => sum + (s.totalAmount || 0),
    0
  );

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
        aria-labelledby="cod-settlements-title"
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="cod-settlements-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Sổ Quyết Toán Thu Hộ COD
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toàn bộ biên bản nộp tiền mặt cuối ca từ đội ngũ Shipper (GET /api/v1/cod-settlements)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchCodSettlements().finally(() => setLoading(false));
              }}
              disabled={loading}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Tải lại danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Metric */}
        <div className="px-6 py-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Tổng biên bản:</span>
            <strong className="text-slate-900 dark:text-white">
              {codSettlements?.length || 0} đợt quyết toán
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Tổng tiền đã nộp quỹ:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
              {formatCurrencyVND(totalAmountSum)}
            </strong>
          </div>
        </div>

        {/* Content Table */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              <span className="text-xs">Đang tải danh sách biên bản quyết toán...</span>
            </div>
          ) : !codSettlements || codSettlements.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Chưa có biên bản quyết toán COD nào được tạo.
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                  <tr>
                    <th className="px-3.5 py-2.5">Mã biên bản</th>
                    <th className="px-3.5 py-2.5">Shipper</th>
                    <th className="px-3.5 py-2.5 text-center">Số đơn</th>
                    <th className="px-3.5 py-2.5 text-right">Tổng tiền quyết toán</th>
                    <th className="px-3.5 py-2.5">Thời gian lập</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {codSettlements.map((item) => {
                    const shipper = shippers.find((s) => s.id === item.shipperId);
                    const shipperDisplay = shipper ? shipper.name : item.shipperId;
                    const dateDisplay = item.createdAt || item.settledAt || '';

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-3.5 py-2.5 font-mono font-medium text-slate-900 dark:text-white truncate max-w-[140px]" title={item.id}>
                          {item.id}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {shipperDisplay}
                          </div>
                          {shipper?.phone && (
                            <div className="text-[10px] text-slate-400">
                              {shipper.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold">
                          {item.orderCount || item.orderIds?.length || 1}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrencyVND(item.totalAmount)}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400 text-[11px]">
                          {formatDateTime(dateDisplay)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
export default CodSettlementListModal;
