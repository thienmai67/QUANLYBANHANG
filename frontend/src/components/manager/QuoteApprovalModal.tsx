'use client';

import React, { useState, useEffect } from 'react';
import { useSaleStore } from '@/store/useSaleStore';
import { SaleQuote } from '@/types/sale';
import { formatCurrencyVND, formatDateTime } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import {
  X,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  Building,
  ShieldAlert,
} from 'lucide-react';

interface QuoteApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuoteApprovalModal({ isOpen, onClose }: QuoteApprovalModalProps) {
  const { quotes, fetchQuotes, approveQuote, rejectQuote, isLoading } = useSaleStore();
  const toast = useToast();

  const [selectedQuote, setSelectedQuote] = useState<SaleQuote | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchQuotes({ status: 'PENDING_APPROVAL' });
    }
  }, [isOpen, fetchQuotes]);

  const pendingQuotes = quotes.filter((q) => q.status === 'PENDING_APPROVAL');

  useEffect(() => {
    if (pendingQuotes.length > 0 && !selectedQuote) {
      setSelectedQuote(pendingQuotes[0]);
    } else if (pendingQuotes.length === 0) {
      setSelectedQuote(null);
    }
  }, [pendingQuotes, selectedQuote]);

  if (!isOpen) return null;

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(true);
      const ok = await approveQuote(id);
      if (ok) {
        toast.success('Đã phê duyệt báo giá thành công!');
        setSelectedQuote(null);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối báo giá');
      return;
    }
    try {
      setActionLoading(true);
      const ok = await rejectQuote(id, rejectReason.trim());
      if (ok) {
        toast.success('Đã từ chối báo giá');
        setIsRejecting(false);
        setRejectReason('');
        setSelectedQuote(null);
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Phê duyệt Báo giá Sale chiết khấu cao ({pendingQuotes.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {pendingQuotes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
              <p className="font-medium text-slate-800 dark:text-slate-200">
                Không có báo giá nào đang chờ phê duyệt.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Tất cả báo giá với mức chiết khấu &gt; 10% đã được xử lý.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left sidebar: list of quotes */}
              <div className="md:col-span-1 space-y-2 border-r border-slate-200 dark:border-slate-800 pr-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Danh sách chờ duyệt
                </span>
                {pendingQuotes.map((q) => {
                  const isSelected = selectedQuote?.id === q.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setSelectedQuote(q);
                        setIsRejecting(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-1">
                        <span>{q.quoteNumber}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 font-bold">
                          CK &gt; 10%
                        </span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 truncate">
                        {q.customerName || 'Khách hàng'}
                      </div>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
                        Sale: {q.saleName || 'Chưa rõ'}
                      </div>
                      <div className="text-right font-black text-slate-900 dark:text-slate-100 mt-1.5">
                        {formatCurrencyVND(q.totalAmount)}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right panel: quote detail and actions */}
              {selectedQuote && (
                <div className="md:col-span-2 space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          Báo giá #{selectedQuote.quoteNumber}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Lập ngày {formatDateTime(selectedQuote.createdAt)} • Hiệu lực đến{' '}
                          {formatDateTime(selectedQuote.validUntil)}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                        CHỜ QUẢN LÝ DUYỆT
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">Khách hàng:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {selectedQuote.customerName}
                        </strong>
                        {selectedQuote.customerPhone && (
                          <span className="text-slate-500 block">
                            SĐT: {selectedQuote.customerPhone}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400 block">Sale phụ trách:</span>
                        <strong className="text-blue-600 dark:text-blue-400">
                          {selectedQuote.saleName || 'Chưa rõ'}
                        </strong>
                      </div>
                    </div>

                    {selectedQuote.notes && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <strong>Ghi chú:</strong> {selectedQuote.notes}
                      </div>
                    )}
                  </div>

                  {/* Items Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                      Danh mục vật tư ({selectedQuote.items?.length || 0} mục)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100/60 dark:bg-slate-800/30 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-2 px-3">Sản phẩm</th>
                            <th className="py-2 px-3 text-center">SL</th>
                            <th className="py-2 px-3 text-right">Đơn giá</th>
                            <th className="py-2 px-3 text-center">CK (%)</th>
                            <th className="py-2 px-3 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {(selectedQuote.items || []).map((it, idx) => {
                            const isHigh = it.discountRate > 10;
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                                  {it.productName || it.productSku || 'Vật tư'}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {it.quantity} {it.unit}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {formatCurrencyVND(it.unitPrice)}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-bold ${
                                      isHigh
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold'
                                        : 'text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {it.discountRate}%
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                                  {formatCurrencyVND(it.lineTotal)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary & Buttons */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-xs space-y-0.5">
                      <div className="text-slate-500">
                        Chiết khấu: -{formatCurrencyVND(selectedQuote.discountTotal)}
                      </div>
                      <div className="text-sm font-black text-blue-600 dark:text-blue-400">
                        Tổng thanh toán: {formatCurrencyVND(selectedQuote.totalAmount)}
                      </div>
                    </div>

                    {!isRejecting ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsRejecting(true)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-300 transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Từ chối
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(selectedQuote.id)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" /> Phê duyệt báo giá
                        </button>
                      </div>
                    ) : (
                      <div className="w-full max-w-sm space-y-2">
                        <input
                          type="text"
                          required
                          placeholder="Nhập lý do từ chối (VD: Chiết khấu quá cao...)"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsRejecting(false);
                              setRejectReason('');
                            }}
                            className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(selectedQuote.id)}
                            disabled={actionLoading}
                            className="px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded shadow-sm"
                          >
                            Xác nhận từ chối
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default QuoteApprovalModal;
