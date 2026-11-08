'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Eye,
  Send,
  Copy,
  Printer,
  ShoppingBag,
  Building,
  User,
} from 'lucide-react';
import { useSaleStore } from '@/store/useSaleStore';
import { SaleQuote, QuoteStatus } from '@/types/sale';
import { formatCurrencyVND, formatDateTime } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';

export default function SaleQuotesPage() {
  const router = useRouter();
  const { quotes, fetchQuotes, sendQuote, convertQuote, isLoading } = useSaleStore();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Convert confirmation modal
  const [convertingQuote, setConvertingQuote] = useState<SaleQuote | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // 300ms debounce on search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchQuotes({
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      q: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
    });
  }, [fetchQuotes, statusFilter, debouncedSearch]);

  const handleSend = async (quote: SaleQuote) => {
    try {
      await sendQuote(quote.id);
      toast.success(`Đã cập nhật trạng thái Báo giá ${quote.quoteNumber} sang ĐÃ GỬI (SENT)`);
      fetchQuotes({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        q: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
      });
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi báo giá');
    }
  };

  const handleConfirmConvert = async () => {
    if (!convertingQuote) return;
    try {
      setIsConverting(true);
      const newOrder = await convertQuote(convertingQuote.id);
      toast.success(
        `Chuyển đổi thành công! Đã tạo đơn hàng mới #${newOrder.orderNumber || newOrder.code}`
      );
      setConvertingQuote(null);
      router.push('/sale/orders');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi chuyển đổi báo giá sang đơn hàng');
    } finally {
      setIsConverting(false);
    }
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Clock className="w-3 h-3" /> Bản nháp
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <AlertTriangle className="w-3 h-3" /> Chờ duyệt CK
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
            <Send className="w-3 h-3" /> Đã gửi khách
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle className="w-3 h-3" /> Khách đã chốt
          </span>
        );
      case 'CONVERTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
            <ShoppingBag className="w-3 h-3" /> Đã tạo đơn hàng
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <XCircle className="w-3 h-3" /> Khách từ chối
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            <Clock className="w-3 h-3" /> Hết hiệu lực
          </span>
        );
      default:
        return <span className="text-xs font-semibold">{status}</span>;
    }
  };

  const statusTabs = [
    { key: 'ALL', label: 'Tất cả báo giá' },
    { key: 'DRAFT', label: 'Bản nháp' },
    { key: 'PENDING_APPROVAL', label: 'Chờ duyệt CK' },
    { key: 'SENT', label: 'Đã gửi' },
    { key: 'ACCEPTED', label: 'Đã chốt' },
    { key: 'CONVERTED', label: 'Đã lên đơn' },
    { key: 'EXPIRED', label: 'Hết hạn' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Quản lý Báo giá B2B (Quotes Lifecycle)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tạo, gửi duyệt chiết khấu, xuất file in ấn và chuyển đổi báo giá thành đơn hàng chính thức.
          </p>
        </div>

        <Link
          href="/sale/quotes/new"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-98 rounded-2xl shadow-md shadow-blue-600/20 transition-all whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo báo giá mới</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo số báo giá (BG-...), khách hàng, SĐT..."
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
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Category Pills (Lướt ngang không thanh cuộn) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                statusFilter === tab.key
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Quotes Card View (< md) */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400">
            <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-xs">Đang tải danh sách báo giá...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs">Chưa có báo giá nào trong mục này.</p>
          </div>
        ) : (
          quotes.map((q) => {
            const isExpired = new Date(q.validUntil) < new Date();
            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3 transition-shadow hover:shadow-md"
              >
                {/* Header: Quote Number + Status */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                  <Link
                    href={`/sale/quotes/${q.id}`}
                    className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm hover:underline"
                  >
                    {q.quoteNumber}
                  </Link>
                  <div className="shrink-0">{getStatusBadge(q.status)}</div>
                </div>

                {/* Customer & Project info */}
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {q.customerName || 'Khách hàng B2B'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    {q.customerPhone && <span>{q.customerPhone}</span>}
                    {q.customerPhone && <span>•</span>}
                    <span>Tạo: {formatDateTime(q.createdAt)}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-400">Hiệu lực đến: </span>
                    <span
                      className={`font-medium ${
                        isExpired && q.status !== 'CONVERTED'
                          ? 'text-rose-600 dark:text-rose-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {new Date(q.validUntil).toLocaleDateString('vi-VN')}
                      {isExpired && q.status !== 'CONVERTED' && ' (Hết hạn)'}
                    </span>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-2.5 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Tổng hàng</div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                      {formatCurrencyVND(q.subtotal)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Chiết khấu</div>
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                      -{formatCurrencyVND(q.discountTotal)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Thực thu</div>
                    <div className="text-xs font-black text-blue-600 dark:text-blue-400 mt-0.5 truncate">
                      {formatCurrencyVND(q.totalAmount)}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {q.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => handleSend(q)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 active:scale-95 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi khách</span>
                      </button>
                    )}

                    {(q.status === 'ACCEPTED' || q.status === 'SENT') && (
                      <button
                        type="button"
                        onClick={() => setConvertingQuote(q)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs active:scale-95 transition-all"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Lên đơn</span>
                      </button>
                    )}
                  </div>

                  <Link
                    href={`/sale/quotes/${q.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 active:scale-95 transition-all ml-auto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem/In</span>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quotes Table (Desktop >= md) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Số báo giá</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Hiệu lực đến</th>
                <th className="py-3 px-4 text-right">Tổng tiền hàng</th>
                <th className="py-3 px-4 text-right">Chiết khấu</th>
                <th className="py-3 px-4 text-right">Thực thu</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang tải danh sách báo giá...
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Chưa có báo giá nào trong mục này.
                  </td>
                </tr>
              ) : (
                quotes.map((q) => {
                  const isExpired = new Date(q.validUntil) < new Date();
                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Quote Number */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/sale/quotes/${q.id}`}
                          className="font-mono font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors"
                        >
                          {q.quoteNumber}
                        </Link>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Tạo lúc: {formatDateTime(q.createdAt)}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {q.customerName || 'Khách hàng B2B'}
                        </div>
                        {q.customerPhone && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {q.customerPhone}
                          </div>
                        )}
                      </td>

                      {/* Valid Until */}
                      <td className="py-3 px-4">
                        <div
                          className={`text-xs font-medium ${
                            isExpired && q.status !== 'CONVERTED'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {new Date(q.validUntil).toLocaleDateString('vi-VN')}
                        </div>
                        {isExpired && q.status !== 'CONVERTED' && (
                          <span className="text-[10px] text-red-500 font-bold block">
                            Đã hết hạn
                          </span>
                        )}
                      </td>

                      {/* Subtotal */}
                      <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                        {formatCurrencyVND(q.subtotal)}
                      </td>

                      {/* Discount Total */}
                      <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                        -{formatCurrencyVND(q.discountTotal)}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrencyVND(q.totalAmount)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(q.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View details */}
                          <Link
                            href={`/sale/quotes/${q.id}`}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Xem chi tiết báo giá"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Send to customer if DRAFT */}
                          {q.status === 'DRAFT' && (
                            <button
                              onClick={() => handleSend(q)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors"
                              title="Gửi báo giá cho khách"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          {/* Convert to order if ACCEPTED or SENT */}
                          {(q.status === 'ACCEPTED' || q.status === 'SENT') && (
                            <button
                              onClick={() => setConvertingQuote(q)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors"
                              title="Chuyển đổi thành đơn hàng"
                            >
                              <ShoppingBag className="w-4 h-4" />
                            </button>
                          )}

                          {/* Clone & Revise for SENT or EXPIRED or REJECTED */}
                          {(q.status === 'SENT' ||
                            q.status === 'EXPIRED' ||
                            q.status === 'REJECTED' ||
                            q.status === 'CONVERTED') && (
                            <Link
                              href={`/sale/quotes/new?cloneFrom=${q.id}`}
                              className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-lg transition-colors"
                              title="Tạo bản sửa đổi (Clone & Revise)"
                            >
                              <Copy className="w-4 h-4" />
                            </Link>
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

      {/* Convert to Order Confirmation Modal */}
      {convertingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Chuyển báo giá thành Đơn hàng
                </h3>
                <p className="text-xs text-slate-500">Mã: {convertingQuote.quoteNumber}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Bạn có chắc chắn muốn chuyển đổi báo giá này thành đơn hàng chính thức? Đơn hàng sẽ được tạo ở trạng thái{' '}
              <strong className="text-blue-600">PENDING (Chờ duyệt)</strong> và báo giá này sẽ được đánh dấu là{' '}
              <strong className="text-purple-600">CONVERTED</strong>.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {convertingQuote.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng giá trị:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyVND(convertingQuote.totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConvertingQuote(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isConverting}
                onClick={handleConfirmConvert}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
              >
                {isConverting ? 'Đang tạo đơn...' : 'Xác nhận tạo đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
