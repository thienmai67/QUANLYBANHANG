'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  AlertCircle,
  Clock,
  CheckCircle,
  DollarSign,
  Plus,
  Filter,
  Search,
  MessageSquare,
  AlertTriangle,
  Calendar,
  X,
  Phone,
  Building,
  User,
  ChevronDown,
} from 'lucide-react';
import { useSaleStore } from '@/store/useSaleStore';
import { SalePaymentItem, PaymentNote, OVERDUE_DEBT_DAYS } from '@/types/sale';
import { formatCurrencyVND, formatDateTime } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import SearchableSelect from '@/components/sale/SearchableSelect';

export default function SalePaymentsPage() {
  const { payments, fetchPayments, addPaymentNote, markPaid, isLoading } = useSaleStore();
  const toast = useToast();

  const [filterMode, setFilterMode] = useState<'ALL' | 'UNPAID' | 'OVERDUE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Note Modal
  const [selectedPaymentForNote, setSelectedPaymentForNote] = useState<SalePaymentItem | null>(null);
  const [noteAmount, setNoteAmount] = useState<number>(0);
  const [noteMethod, setNoteMethod] = useState<string>('BANK_TRANSFER');
  const [noteContent, setNoteContent] = useState<string>('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Mark Paid Modal
  const [markPaidTarget, setMarkPaidTarget] = useState<SalePaymentItem | null>(null);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  useEffect(() => {
    fetchPayments({
      unpaidOnly: filterMode === 'UNPAID',
      overdueOnly: filterMode === 'OVERDUE',
    });
  }, [fetchPayments, filterMode]);

  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const matchOrder = (item.order.orderNumber || item.order.code || '').toLowerCase().includes(term);
      const matchCustomer = (item.order.customerName || '').toLowerCase().includes(term);
      const matchPhone = (item.order.customerPhone || '').toLowerCase().includes(term);
      return matchOrder || matchCustomer || matchPhone;
    });
  }, [payments, searchTerm]);

  // Overall Stats
  const { totalOutstanding, overdueCount, overdueTotal } = useMemo(() => {
    let out = 0;
    let odCount = 0;
    let odTotal = 0;
    payments.forEach((p) => {
      if (p.order.paymentStatus !== 'PAID') {
        const amt = p.order.finalAmount || p.order.totalAmount || 0;
        out += amt;
        if (p.isOverdue || p.daysDelivered > OVERDUE_DEBT_DAYS) {
          odCount += 1;
          odTotal += amt;
        }
      }
    });
    return {
      totalOutstanding: out,
      overdueCount: odCount,
      overdueTotal: odTotal,
    };
  }, [payments]);

  const handleOpenNoteModal = (item: SalePaymentItem) => {
    setSelectedPaymentForNote(item);
    setNoteAmount(item.order.finalAmount || item.order.totalAmount || 0);
    setNoteMethod('BANK_TRANSFER');
    setNoteContent('');
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForNote) return;
    try {
      setIsAddingNote(true);
      await addPaymentNote(selectedPaymentForNote.order.id, {
        amount: Number(noteAmount) || 0,
        method: noteMethod,
        note: noteContent.trim() || undefined,
      });
      toast.success('Đã lưu nhật ký thu nợ thành công');
      setSelectedPaymentForNote(null);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi thêm ghi chú thu nợ');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleConfirmMarkPaid = async () => {
    if (!markPaidTarget) return;
    try {
      setIsMarkingPaid(true);
      await markPaid(markPaidTarget.order.id);
      toast.success(
        `Đã xác nhận thanh toán thành công cho đơn ${markPaidTarget.order.orderNumber || markPaidTarget.order.code}`
      );
      setMarkPaidTarget(null);
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xác nhận thanh toán');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
          Theo dõi Thu hồi Công nợ & Thanh toán
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Theo dõi các đơn hàng giao thành công, kiểm soát công nợ quá hạn {OVERDUE_DEBT_DAYS} ngày và ghi nhật ký thu tiền.
        </p>
      </div>

      {/* KPI Cards (Compact 3-column strip on mobile, 3-card on desktop) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* KPI 1: Chưa thu */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 text-center sm:text-left">
          <div className="p-2 sm:p-3 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 w-full">
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              Chưa thu
            </div>
            <div className="text-xs sm:text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5 truncate">
              {formatCurrencyVND(totalOutstanding)}
            </div>
          </div>
        </div>

        {/* KPI 2: Quá hạn */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 text-center sm:text-left">
          <div className="p-2 sm:p-3 rounded-xl bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 w-full">
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              Nợ quá hạn
            </div>
            <div className="text-xs sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 truncate">
              {formatCurrencyVND(overdueTotal)}
            </div>
          </div>
        </div>

        {/* KPI 3: Số đơn quá hạn */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 text-center sm:text-left">
          <div className="p-2 sm:p-3 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 w-full">
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              Cần giục nợ
            </div>
            <div className="text-xs sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {overdueCount} đơn
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2.5">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, khách hàng, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Category Pills (Lướt ngang không thanh cuộn) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95 ${
              filterMode === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            Tất cả các đơn
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('UNPAID')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95 ${
              filterMode === 'UNPAID'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            Chưa thanh toán
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('OVERDUE')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95 ${
              filterMode === 'OVERDUE'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            Quá hạn &gt;30 ngày
          </button>
        </div>
      </div>

      {/* Mobile Payments Card View (< md) */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400">
            <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-xs">Đang tải dữ liệu công nợ...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 space-y-2">
            <CheckCircle className="w-10 h-10 mx-auto text-emerald-500/50 mb-2" />
            <p className="text-xs">Không có đơn nợ nào trong danh mục này.</p>
          </div>
        ) : (
          filteredPayments.map((item) => {
            const isPaid = item.order.paymentStatus === 'PAID';
            const isOverdue = !isPaid && (item.isOverdue || item.daysDelivered > OVERDUE_DEBT_DAYS);

            return (
              <div
                key={item.order.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-xs space-y-3 transition-shadow hover:shadow-md ${
                  isOverdue
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header: Code + Overdue Status */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                  <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                    {item.order.orderNumber || item.order.code}
                  </span>
                  <div>
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <CheckCircle className="w-3 h-3" /> Đã tất toán
                      </span>
                    ) : isOverdue ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> Quá hạn {item.daysDelivered} ngày
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Clock className="w-3 h-3" /> Trong hạn ({item.daysDelivered || 0}d)
                      </span>
                    )}
                  </div>
                </div>

                {/* Body: Customer & Amount */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                      {item.order.customerName}
                    </div>
                    {item.order.customerPhone && (
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.order.customerPhone}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Giao: {item.order.deliveredAt ? formatDateTime(item.order.deliveredAt) : 'Chưa giao'}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Tiền công nợ
                    </div>
                    <div className="text-base font-black text-rose-600 dark:text-rose-400 font-mono leading-tight mt-0.5">
                      {formatCurrencyVND(item.order.finalAmount || item.order.totalAmount)}
                    </div>
                  </div>
                </div>

                {/* Latest Payment Note if exists */}
                {item.notes && item.notes.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      <MessageSquare className="w-3 h-3" />
                      <span>Nhật ký gần nhất:</span>
                    </div>
                    <div className="line-clamp-2 italic">
                      &quot;{item.notes[item.notes.length - 1].note || 'Đã ghi nhận thanh toán'}&quot;
                    </div>
                  </div>
                )}

                {/* Card Footer Actions */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.order.customerPhone && (
                      <a
                        href={`tel:${item.order.customerPhone}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 active:scale-95 transition-all"
                        title="Gọi khách"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Gọi</span>
                      </a>
                    )}

                    {!isPaid && (
                      <button
                        type="button"
                        onClick={() => setMarkPaidTarget(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs active:scale-95 transition-all"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Thu tiền</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenNoteModal(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 active:scale-95 transition-all ml-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ghi chú</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Payments Table (>= md) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Mã đơn hàng</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Ngày giao / Tuổi nợ</th>
                <th className="py-3 px-4 text-right">Tổng tiền</th>
                <th className="py-3 px-4 text-center">Thanh toán</th>
                <th className="py-3 px-4">Nhật ký theo dõi ({OVERDUE_DEBT_DAYS}d)</th>
                <th className="py-3 px-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Đang tải dữ liệu công nợ...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Không có đơn nợ nào trong danh sách.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((item) => {
                  const isPaid = item.order.paymentStatus === 'PAID';
                  const isOverdue = !isPaid && (item.isOverdue || item.daysDelivered > OVERDUE_DEBT_DAYS);

                  return (
                    <tr
                      key={item.order.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isOverdue ? 'bg-red-50/30 dark:bg-red-950/20' : ''
                      }`}
                    >
                      {/* Order Code */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {item.order.orderNumber || item.order.code}
                        </span>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Tạo: {formatDateTime(item.order.createdAt)}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.order.customerName}
                        </div>
                        {item.order.customerPhone && (
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{item.order.customerPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Delivery Date & Days delivered */}
                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-700 dark:text-slate-300">
                          {item.order.deliveredAt
                            ? formatDateTime(item.order.deliveredAt)
                            : 'Đang giao / Chưa giao'}
                        </div>
                        <div className="mt-1">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle className="w-3 h-3" /> Đã tất toán
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> Quá hạn {item.daysDelivered} ngày
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                              <Clock className="w-3 h-3" /> Trong hạn ({item.daysDelivered || 0} ngày)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrencyVND(item.order.finalAmount || item.order.totalAmount)}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.order.paymentStatus || 'UNPAID'}
                        </span>
                      </td>

                      {/* Payment notes history */}
                      <td className="py-3 px-4 max-w-xs">
                        {item.notes && item.notes.length > 0 ? (
                          <div className="space-y-1">
                            <div className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2">
                              <strong>Mới nhất:</strong> {item.notes[item.notes.length - 1].note || 'Đã ghi nhận thu'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {formatDateTime(item.notes[item.notes.length - 1].collectedAt)} •{' '}
                              {formatCurrencyVND(item.notes[item.notes.length - 1].amount)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa có nhật ký</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenNoteModal(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Ghi nhật ký đôn đốc / thu nợ"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Ghi chú</span>
                          </button>

                          {!isPaid && (
                            <button
                              onClick={() => setMarkPaidTarget(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                              title="Xác nhận đã nhận đủ tiền"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Thu đủ</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Note Modal */}
      {selectedPaymentForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Ghi nhật ký thu nợ & Đôn đốc
                </h3>
              </div>
              <button
                onClick={() => setSelectedPaymentForNote(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Đơn hàng:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedPaymentForNote.order.orderNumber || selectedPaymentForNote.order.code}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedPaymentForNote.order.customerName}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Số tiền thu được (VND) — Điền 0 nếu chỉ ghi nhận hẹn trả
                </label>
                <input
                  type="number"
                  step="100000"
                  value={noteAmount}
                  onChange={(e) => setNoteAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hình thức thanh toán
                </label>
                <SearchableSelect
                  options={[
                    { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', badge: 'Ngân hàng' },
                    { value: 'CASH', label: 'Tiền mặt', badge: 'Trực tiếp' },
                    { value: 'OTHER', label: 'Hẹn ngày thanh toán', badge: 'Hẹn trả' },
                  ]}
                  value={noteMethod}
                  onChange={setNoteMethod}
                  placeholder="Chọn hình thức..."
                  searchPlaceholder="Tìm hình thức thanh toán..."
                  title="Hình thức thanh toán"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung ghi chú đôn đốc
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Khách hứa chuyển khoản trước 17h thứ 6, đã đối soát công nợ..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentForNote(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isAddingNote}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
                >
                  {isAddingNote ? 'Đang lưu...' : 'Lưu ghi chú'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Mark Paid */}
      {markPaidTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Xác nhận Thu tiền hoàn tất
                </h3>
                <p className="text-xs text-slate-500">
                  Đơn {markPaidTarget.order.orderNumber || markPaidTarget.order.code}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Bạn xác nhận đã thu đủ số tiền{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {formatCurrencyVND(
                  markPaidTarget.order.finalAmount || markPaidTarget.order.totalAmount
                )}
              </strong>{' '}
              cho đơn hàng này? Trạng thái thanh toán sẽ đổi sang <strong className="text-emerald-600">ĐÃ THANH TOÁN (PAID)</strong>.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMarkPaidTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isMarkingPaid}
                onClick={handleConfirmMarkPaid}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
              >
                {isMarkingPaid ? 'Đang cập nhật...' : 'Xác nhận Đã thu tiền'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
