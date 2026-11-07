'use client';

import React, { useRef } from 'react';
import { Printer, X, CheckCircle2, Phone, MapPin, Store } from 'lucide-react';

export interface ThermalOrderData {
  orderNumber: string;
  createdAt?: string | Date;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: string;
  deliveryAddress?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  totalAmount: number;
  items: Array<{
    productName?: string;
    name?: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
  }>;
}

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ThermalOrderData | null;
}

export function ThermalReceiptModal({ isOpen, onClose, order }: ThermalReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('vi-VN');

  const paymentMethodLabel = (method?: string) => {
    const m = (method || '').toUpperCase();
    if (m === 'CASH') return 'Tiền mặt tại quầy';
    if (m === 'BANK_TRANSFER' || m === 'BANK') return 'Chuyển khoản VietQR';
    if (m === 'COD') return 'Thu hộ khi giao (COD)';
    return method || 'Tiền mặt';
  };

  const address = order.shippingAddress || order.deliveryAddress || 'Mua trực tiếp tại quầy';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-transparent">
      {/* Modal Card */}
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-w-none print:w-[80mm]">
        {/* Header - Not printed */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-orange-400" />
            <span className="font-bold text-sm">Xem trước hóa đơn nhiệt (Khổ 80mm)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Canvas */}
        <div
          ref={receiptRef}
          id="printable-receipt"
          className="p-6 font-mono text-[13px] leading-relaxed select-text bg-white print:p-2 print:text-[11px] print:w-[76mm] print:mx-auto"
        >
          {/* Shop Header */}
          <div className="text-center pb-3 border-b-2 border-dashed border-slate-400">
            <h1 className="text-base font-extrabold uppercase tracking-wide">
              ĐIỆN NƯỚC DÂN DỤNG MINH LÝ
            </h1>
            <p className="text-[11px] text-slate-600 mt-1 font-sans">
              Chuyên thiết bị điện dân dụng, ống nước PVC/PPR, phụ kiện ngành nước
            </p>
            <div className="text-[11px] text-slate-700 mt-2 space-y-0.5 font-sans">
              <p>📍 CN1: 120/4 Lý Thường Kiệt, TT. Hóc Môn</p>
              <p>📍 CN2: 45 Lê Đức Thọ, P.7, Q. Gò Vấp</p>
              <p className="font-bold text-slate-900">
                📞 Hotline kỹ thuật: 0988.248.524 (A. Tuấn)
              </p>
            </div>
          </div>

          {/* Receipt Title */}
          <div className="text-center py-2.5 border-b border-dashed border-slate-300">
            <h2 className="text-sm font-black uppercase">PHIẾU XUẤT BÁN LẺ VẬT TƯ</h2>
            <p className="text-[11px] text-slate-600 font-sans">
              Mã đơn: <strong className="font-mono text-slate-900">{order.orderNumber}</strong>
            </p>
            <p className="text-[11px] text-slate-500 font-sans">Ngày: {formattedDate}</p>
          </div>

          {/* Customer Info */}
          <div className="py-2.5 border-b border-dashed border-slate-300 text-xs font-sans space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Khách hàng:</span>
              <span className="font-bold text-slate-900">{order.customerName || 'Khách lẻ tại quầy'}</span>
            </div>
            {order.customerPhone && (
              <div className="flex justify-between">
                <span className="text-slate-500">Số ĐT:</span>
                <span className="font-mono font-semibold">{order.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-500 shrink-0">Nhận hàng:</span>
              <span className="font-medium text-right text-slate-800 text-[11px]">{address}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3 border-b-2 border-dashed border-slate-400">
            <div className="flex justify-between font-bold pb-1.5 border-b border-slate-300 text-[11px] uppercase">
              <span className="w-1/2">Vật tư</span>
              <span className="w-1/6 text-center">SL</span>
              <span className="w-1/3 text-right">T.Tiền</span>
            </div>

            <div className="divide-y divide-slate-100 py-1">
              {order.items.map((item, idx) => {
                const lineTotal = (item.unitPrice || 0) * (item.quantity || 1);
                const title = item.productName || item.name || `Sản phẩm ${item.sku || idx + 1}`;
                return (
                  <div key={idx} className="py-1.5 space-y-0.5">
                    <div className="font-bold text-slate-900 text-xs">
                      {idx + 1}. {title}
                    </div>
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>
                        {item.quantity} {item.unit || 'cái'} x {Number(item.unitPrice).toLocaleString('vi-VN')} đ
                      </span>
                      <span className="font-bold text-slate-900 font-mono">
                        {lineTotal.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="py-3 border-b-2 border-dashed border-slate-400 space-y-1.5 text-xs">
            <div className="flex justify-between font-sans">
              <span className="text-slate-600">Tổng tiền hàng:</span>
              <span className="font-bold text-slate-900 font-mono">
                {Number(order.totalAmount).toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="flex justify-between font-sans">
              <span className="text-slate-600">Hình thức TT:</span>
              <span className="font-semibold text-slate-800">{paymentMethodLabel(order.paymentMethod)}</span>
            </div>
            <div className="flex justify-between font-sans pt-1 border-t border-slate-200 text-sm">
              <span className="font-black uppercase">THANH TOÁN:</span>
              <span className="font-black text-slate-950 font-mono text-base">
                {Number(order.totalAmount).toLocaleString('vi-VN')} đ
              </span>
            </div>
            {order.paymentStatus === 'PAID' ? (
              <p className="text-center font-bold text-emerald-700 bg-emerald-50 py-1 rounded text-xs">
                ✓ ĐÃ THANH TOÁN ĐỦ
              </p>
            ) : (
              <p className="text-center font-bold text-amber-700 bg-amber-50 py-1 rounded text-xs">
                ⏳ THU TIỀN KHI NHẬN HÀNG
              </p>
            )}
          </div>

          {/* Footer Note */}
          <div className="pt-3 text-center space-y-1 font-sans text-[11px] text-slate-600">
            <p className="font-bold text-slate-800">CẢM ƠN QUÝ KHÁCH ĐÃ ỦNG HỘ!</p>
            <p>Đổi trả trong 3 ngày nếu nguyên tem/bao bì.</p>
            <p className="text-[10px] text-slate-400">Website: diennuocminhly.com • Tra cứu bảo hành theo SĐT</p>
          </div>
        </div>

        {/* Action Buttons - Not printed */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Phiếu K80 Ngay</span>
          </button>
        </div>
      </div>

      {/* Print CSS styling */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt,
          #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 76mm !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ThermalReceiptModal;
