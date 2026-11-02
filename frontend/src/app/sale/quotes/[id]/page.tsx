'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  Send,
  ShoppingBag,
  Copy,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { useSaleStore } from '@/store/useSaleStore';
import { SaleQuote, QuoteStatus } from '@/types/sale';
import { formatCurrencyVND, formatDateTime } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';

export default function SaleQuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  const { sendQuote, convertQuote } = useSaleStore();
  const toast = useToast();

  const [quote, setQuote] = useState<SaleQuote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (!quoteId) return;

    let isMounted = true;
    setIsLoading(true);

    api
      .get<SaleQuote>(`/sale/quotes/${quoteId}`)
      .then((data) => {
        if (isMounted) {
          setQuote(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          toast.error('Không tìm thấy báo giá hoặc bạn không có quyền xem');
          router.push('/sale/quotes');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [quoteId]); // Removed router & toast to prevent infinite re-render loop

  const handleSend = async () => {
    if (!quote) return;
    try {
      setIsSending(true);
      const updated = await sendQuote(quote.id);
      setQuote(updated);
      toast.success(`Đã cập nhật trạng thái báo giá ${quote.quoteNumber} sang ĐÃ GỬI`);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi gửi báo giá');
    } finally {
      setIsSending(false);
    }
  };

  const handleConvert = async () => {
    if (!quote) return;
    try {
      setIsConverting(true);
      const order = await convertQuote(quote.id);
      toast.success(`Đã chuyển đổi báo giá thành đơn hàng ${order.orderNumber || order.code}!`);
      setQuote((prev) => (prev ? { ...prev, status: 'CONVERTED', convertedOrderId: order.id } : null));
      router.push('/sale/orders');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi chuyển đổi báo giá');
    } finally {
      setIsConverting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
        <p className="font-medium text-sm">Đang tải thông tin báo giá...</p>
      </div>
    );
  }

  if (!quote) {
    return null;
  }

  const isExpired = new Date(quote.validUntil) < new Date();

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top action bar - Hidden when printing */}
      <div className="print:hidden flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/sale/quotes"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Báo giá #{quote.quoteNumber}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  quote.status === 'CONVERTED'
                    ? 'bg-purple-100 text-purple-800'
                    : quote.status === 'ACCEPTED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : quote.status === 'SENT'
                    ? 'bg-blue-100 text-blue-800'
                    : quote.status === 'PENDING_APPROVAL'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {quote.status}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Tạo ngày: {formatDateTime(quote.createdAt)} • Hiệu lực đến:{' '}
              {new Date(quote.validUntil).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Print button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>In / Xuất PDF</span>
          </button>

          {/* Send to customer */}
          {quote.status === 'DRAFT' && (
            <button
              onClick={handleSend}
              disabled={isSending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Đang gửi...' : 'Gửi cho khách'}</span>
            </button>
          )}

          {/* Convert to order */}
          {(quote.status === 'ACCEPTED' || quote.status === 'SENT') && (
            <button
              onClick={handleConvert}
              disabled={isConverting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isConverting ? 'Đang chuyển...' : 'Chuyển thành Đơn hàng'}</span>
            </button>
          )}

          {/* Clone & Revise */}
          <Link
            href={`/sale/quotes/new?cloneFrom=${quote.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>Sao chép & Sửa đổi</span>
          </Link>
        </div>
      </div>

      {/* Approval banner if PENDING_APPROVAL */}
      {quote.status === 'PENDING_APPROVAL' && (
        <div className="print:hidden p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300">
            <strong className="block text-sm font-semibold">Đang chờ Quản lý phê duyệt chiết khấu (&gt;10%):</strong>
            Báo giá này có mức chiết khấu bổ sung vượt thẩm quyền nhân viên kinh doanh. Quản lý cần duyệt trước khi báo giá có thể chuyển sang trạng thái ĐÃ GỬI hoặc Chuyển thành Đơn hàng.
          </div>
        </div>
      )}

      {/* Converted Order Banner */}
      {quote.status === 'CONVERTED' && (
        <div className="print:hidden p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-purple-800 dark:text-purple-300">
            <CheckCircle className="w-4 h-4 text-purple-600" />
            <span>Báo giá này đã được chuyển đổi thành đơn hàng chính thức.</span>
          </div>
          <Link
            href="/sale/orders"
            className="text-xs font-bold text-purple-700 hover:underline"
          >
            Xem danh sách đơn hàng &rarr;
          </Link>
        </div>
      )}

      {/* Professional B2B Quotation Document (Paper sheet styling) */}
      <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
        {/* Document Header */}
        <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
          <div>
            <div className="text-2xl font-black tracking-tight text-blue-900">
              CÔNG TY TNHH VẬT LIỆU XÂY DỰNG TDT
            </div>
            <div className="text-xs text-slate-600 mt-1 space-y-0.5">
              <div>Trụ sở: 123 Đường Song Hành, Phường An Khánh, TP. Thủ Đức, TP. Hồ Chí Minh</div>
              <div>Hotline B2B: (028) 3899 9999 • Email: kinhdoanh@tdt.vn • Website: vlxdtdt.vn</div>
              <div>Mã số thuế: <strong>0318999999</strong></div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-slate-900 uppercase tracking-wider">
              BẢNG BÁO GIÁ
            </div>
            <div className="text-sm font-mono font-bold text-blue-700 mt-1">
              Số: {quote.quoteNumber}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Ngày lập: {new Date(quote.createdAt).toLocaleDateString('vi-VN')}
            </div>
            <div className="text-xs text-slate-500">
              Hiệu lực đến: {new Date(quote.validUntil).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>

        {/* Customer & Project Info */}
        <div className="grid grid-cols-2 gap-8 py-6 text-xs border-b border-slate-200">
          <div className="space-y-1.5">
            <div className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
              KÍNH GỬI QUÝ KHÁCH HÀNG:
            </div>
            <div className="text-sm font-bold text-slate-900">
              {quote.customerName || 'Khách hàng B2B'}
            </div>
            {quote.customerPhone && (
              <div className="text-slate-700">Điện thoại: {quote.customerPhone}</div>
            )}
            <div className="text-slate-700">Đơn vị: Khách hàng đối tác công trình</div>
          </div>

          <div className="space-y-1.5 text-right">
            <div className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
              ĐẠI DIỆN BÁN HÀNG:
            </div>
            <div className="text-sm font-bold text-blue-900">
              {quote.saleName || 'Nguyễn Văn Kinh Doanh'}
            </div>
            <div className="text-slate-700">Bộ phận: Phòng Kinh doanh Dự án & B2B</div>
            <div className="text-slate-700">Hotline hỗ trợ: 0912.888.999</div>
          </div>
        </div>

        {/* Introduction sentence */}
        <div className="py-4 text-xs italic text-slate-600">
          Công ty TDT trân trọng gửi tới Quý khách hàng bảng báo giá các hạng mục vật tư ống nhựa & thiết bị M&E chính hãng như sau:
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto my-2">
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[11px] border-b border-slate-300">
                <th className="py-2.5 px-3 border-r border-slate-300 text-center w-10">STT</th>
                <th className="py-2.5 px-3 border-r border-slate-300 w-24">Mã SKU</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Tên vật tư / Quy cách kỹ thuật</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center w-16">ĐVT</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center w-16">SL</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-right w-28">Đơn giá niêm yết</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">Chiết khấu (%)</th>
                <th className="py-2.5 px-3 text-right w-32">Thành tiền (VND)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {quote.items && quote.items.length > 0 ? (
                quote.items.map((it, idx) => {
                  const hasBrand = it.brandDiscountRate && it.brandDiscountRate > 0;
                  const hasAdd = it.additionalDiscountRate && it.additionalDiscountRate > 0;

                  return (
                    <tr key={it.id || idx} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px]">
                        {it.productSku || '-'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-medium">
                        {it.productName || 'Sản phẩm'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center">{it.unit}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-semibold">
                        {it.quantity}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-right">
                        {formatCurrencyVND(it.unitPrice)}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                        <div className="font-bold text-blue-700">{it.discountRate}%</div>
                        {(hasBrand || hasAdd) && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            {hasBrand ? `Hãng: ${it.brandDiscountRate}%` : ''}
                            {hasBrand && hasAdd ? ' + ' : ''}
                            {hasAdd ? `Sale: ${it.additionalDiscountRate}%` : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {formatCurrencyVND(it.lineTotal)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500 italic">
                    Chưa có hạng mục chi tiết.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Calculation Totals */}
        <div className="flex justify-end pt-4">
          <div className="w-80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Cộng tiền hàng niêm yết:</span>
              <span className="font-semibold text-slate-800">{formatCurrencyVND(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Tổng chiết khấu thương mại:</span>
              <span>- {formatCurrencyVND(quote.discountTotal)}</span>
            </div>
            <div className="pt-2 border-t-2 border-slate-800 flex justify-between items-baseline font-bold text-sm">
              <span className="text-slate-900 uppercase">Tổng tiền thanh toán (Chưa VAT):</span>
              <span className="text-blue-900 text-base">{formatCurrencyVND(quote.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mt-8 pt-4 border-t border-slate-300 space-y-2 text-xs text-slate-700">
          <div className="font-bold uppercase text-slate-900 text-[11px]">
            ĐIỀU KHOẢN VÀ GHI CHÚ THƯƠNG MẠI:
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
            <li>Báo giá có hiệu lực trong vòng 07 ngày kể từ ngày phát hành.</li>
            <li>Hàng hóa mới 100%, bảo hành chính hãng theo tiêu chuẩn của nhà sản xuất. Đầy đủ CO/CQ.</li>
            <li>Địa điểm giao hàng: Tận chân công trình theo thỏa thuận trong bán kính TP.HCM.</li>
            <li>Phương thức thanh toán: Chuyển khoản ngân hàng hoặc ghi nợ theo hạn mức tín dụng được duyệt.</li>
            {quote.notes && <li className="font-semibold text-slate-800">Ghi chú riêng: {quote.notes}</li>}
          </ul>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
          <div>
            <div className="font-bold uppercase text-slate-900">ĐẠI DIỆN KHÁCH HÀNG</div>
            <div className="text-[11px] text-slate-500 italic mt-0.5">(Ký, ghi rõ họ tên và đóng dấu)</div>
            <div className="h-24"></div>
            <div className="font-semibold text-slate-800">{quote.customerName || '...........................................'}</div>
          </div>

          <div>
            <div className="font-bold uppercase text-slate-900">ĐẠI DIỆN CÔNG TY TDT</div>
            <div className="text-[11px] text-slate-500 italic mt-0.5">(Nhân viên kinh doanh phụ trách)</div>
            <div className="h-24"></div>
            <div className="font-semibold text-blue-900">{quote.saleName || 'Nguyễn Văn Kinh Doanh'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
