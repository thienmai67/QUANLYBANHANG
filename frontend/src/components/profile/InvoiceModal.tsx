'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Image as ImageIcon,
  FileText,
  Building2,
  CheckCircle2,
  Calendar,
  CreditCard,
  User,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export interface DBOrderItem {
  id?: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface DBOrder {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  totalAmount: number;
  status: 'PENDING' | 'PACKING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  paymentMethod?: string;
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUND_PENDING' | 'REFUNDED';
  payosOrderCode?: number;
  paidAt?: string;
  is2h: boolean;
  deadline2h?: string;
  deliveredAt?: string;
  cancellationReason?: string;
  podPhotoUrl?: string;
  podRecipientName?: string;
  podConfirmedAt?: string;
  createdAt: string;
  updatedAt: string;
  items: DBOrderItem[];
}

export interface InvoiceModalProps {
  order: DBOrder | null;
  isOpen: boolean;
  onClose: () => void;
  customerPhone?: string;
  customerEmail?: string;
}

function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'Không đồng';
  const units = ['', 'nghìn', 'triệu', 'tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readThreeDigits(n: number, isLast: boolean): string {
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    let res = '';

    if (h > 0 || !isLast) {
      res += digits[h] + ' trăm ';
    }
    if (t > 1) {
      res += digits[t] + ' mươi ';
      if (u === 1) res += 'mốt ';
      else if (u === 5) res += 'lăm ';
      else if (u > 0) res += digits[u] + ' ';
    } else if (t === 1) {
      res += 'mười ';
      if (u === 5) res += 'lăm ';
      else if (u > 0) res += digits[u] + ' ';
    } else if (h > 0 && u > 0) {
      res += 'lẻ ' + digits[u] + ' ';
    } else if (u > 0) {
      res += digits[u] + ' ';
    }
    return res;
  }

  let strNum = Math.round(num).toString();
  const groups: number[] = [];
  while (strNum.length > 0) {
    groups.unshift(parseInt(strNum.slice(-3), 10));
    strNum = strNum.slice(0, -3);
  }

  let result = '';
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    if (g > 0) {
      const isLast = i === groups.length - 1;
      result += readThreeDigits(g, isLast) + units[groups.length - 1 - i] + ' ';
    }
  }

  const trimmed = result.trim();
  return (trimmed.charAt(0).toUpperCase() + trimmed.slice(1) + ' đồng chẵn.').replace(/\s+/g, ' ');
}

export default function InvoiceModal({
  order,
  isOpen,
  onClose,
  customerPhone,
  customerEmail,
}: InvoiceModalProps) {
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const invoicePaperRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen || !order) return null;

  const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const exportDate = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportPNG = async () => {
    if (!invoicePaperRef.current) return;
    try {
      setIsExportingPng(true);
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(invoicePaperRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      } as any);

      const imgData = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = imgData;
      downloadLink.download = `HoaDon_${order.orderNumber.replace(/[^a-zA-Z0-9-_]/g, '')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Lỗi khi xuất file PNG:', err);
      alert('Không thể tạo file ảnh PNG. Vui lòng thử lại hoặc sử dụng tính năng In trực tiếp.');
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleExportPDF = async () => {
    if (!invoicePaperRef.current) return;
    try {
      setIsExportingPdf(true);
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(invoicePaperRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      } as any);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`HoaDon_${order.orderNumber.replace(/[^a-zA-Z0-9-_]/g, '')}.pdf`);
    } catch (err) {
      console.error('Lỗi khi xuất file PDF:', err);
      alert('Không thể tạo file PDF. Vui lòng thử lại hoặc sử dụng tính năng In trực tiếp.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const totalWords = numberToVietnameseWords(order.totalAmount || 0);

  return (
    <div
      className="invoice-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="invoice-modal-container" role="dialog" aria-modal="true">
        {/* TOP BAR / ACTIONS */}
        <header className="invoice-modal-topbar">
          <div className="invoice-modal-meta">
            <span className="invoice-badge-status">
              <FileText size={14} />
              Hóa đơn điện tử
            </span>
            <span className="invoice-order-ref">#{order.orderNumber}</span>
          </div>

          <div className="invoice-modal-actions">
            <button
              type="button"
              className="invoice-btn-act invoice-btn-png"
              onClick={handleExportPNG}
              disabled={isExportingPng}
              title="Tải ảnh PNG độ nét cao"
            >
              {isExportingPng ? (
                <Loader2 size={15} className="spin-icon" />
              ) : (
                <ImageIcon size={15} />
              )}
              <span>Xuất PNG</span>
            </button>

            <button
              type="button"
              className="invoice-btn-act invoice-btn-pdf"
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              title="Tải văn bản PDF A4 chuẩn"
            >
              {isExportingPdf ? (
                <Loader2 size={15} className="spin-icon" />
              ) : (
                <Download size={15} />
              )}
              <span>Xuất PDF</span>
            </button>

            <button
              type="button"
              className="invoice-btn-act invoice-btn-print"
              onClick={handlePrint}
              title="In bằng máy in hoặc lưu PDF hệ thống"
            >
              <Printer size={15} />
              <span>In ngay</span>
            </button>

            <button
              type="button"
              className="invoice-btn-close"
              onClick={onClose}
              aria-label="Đóng hóa đơn và quay lại chi tiết đơn hàng"
              title="Đóng hóa đơn và quay lại chi tiết đơn hàng"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* INVOICE PAPER (Target of PDF/PNG & Print) */}
        <div className="invoice-paper-wrapper">
          <div
            id="invoice-paper"
            ref={invoicePaperRef}
            className="invoice-paper"
          >
            {/* Header: Company Info & Invoice Title */}
            <div className="invoice-paper-header">
              <div className="invoice-brand-group">
                <div className="invoice-brand-logo">
                  <Building2 size={28} />
                </div>
                <div className="invoice-brand-details">
                  <h1 className="invoice-company-name">CÔNG TY TNHH VẬT TƯ CƠ ĐIỆN TDT</h1>
                  <p className="invoice-company-sub">HỆ THỐNG PHÂN PHỐI VẬT TƯ XÂY DỰNG &amp; CƠ ĐIỆN CHÍNH HÃNG</p>
                  <p className="invoice-company-meta">
                    <b>Mã số thuế:</b> 0317891234 · <b>Hotline:</b> 1900 6868 · <b>Website:</b> tdt-me.vn
                  </p>
                  <p className="invoice-company-meta">
                    <b>Trụ sở:</b> Tòa nhà TDT M&amp;E Tower, Quận 7, TP. Hồ Chí Minh
                  </p>
                </div>
              </div>

              <div className="invoice-title-box">
                <h2 className="invoice-title-text">HÓA ĐƠN BÁN HÀNG</h2>
                <div className="invoice-title-sub">PHIẾU XUẤT KHO VẬT TƯ</div>
                <div className="invoice-number-tag">
                  <span>Số HĐ:</span> <b>{order.orderNumber}</b>
                </div>
              </div>
            </div>

            <div className="invoice-paper-divider" />

            {/* Invoice Meta Grid */}
            <div className="invoice-info-grid">
              <div className="invoice-info-block">
                <div className="invoice-info-title">
                  <User size={13} />
                  <span>THÔNG TIN KHÁCH HÀNG</span>
                </div>
                <div className="invoice-info-item">
                  <span className="lbl">Người nhận hàng:</span>
                  <span className="val bold">{order.customerName}</span>
                </div>
                <div className="invoice-info-item">
                  <span className="lbl">Số điện thoại:</span>
                  <span className="val">{customerPhone || 'Theo hợp đồng cung ứng'}</span>
                </div>
                <div className="invoice-info-item">
                  <span className="lbl">Email liên hệ:</span>
                  <span className="val">{customerEmail || '—'}</span>
                </div>
              </div>

              <div className="invoice-info-block">
                <div className="invoice-info-title">
                  <Calendar size={13} />
                  <span>THÔNG TIN ĐƠN HÀNG</span>
                </div>
                <div className="invoice-info-item">
                  <span className="lbl">Thời gian tạo đơn:</span>
                  <span className="val">{orderDate}</span>
                </div>
                <div className="invoice-info-item">
                  <span className="lbl">Phương thức:</span>
                  <span className="val">{order.paymentMethod || 'Thanh toán khi nhận hàng (COD)'}</span>
                </div>
                <div className="invoice-info-item">
                  <span className="lbl">Trạng thái thanh toán:</span>
                  <span className="val status-paid">
                    {order.paymentStatus === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN / CHỜ THU COD'}
                  </span>
                </div>
                {order.is2h && (
                  <div className="invoice-info-item">
                    <span className="lbl">Hình thức giao hàng:</span>
                    <span className="val text-orange">⚡ Giao hàng hỏa tốc 2 giờ</span>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="invoice-table-wrapper">
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>STT</th>
                    <th style={{ width: '130px' }}>Mã vật tư</th>
                    <th>Tên vật tư quy cách kỹ thuật</th>
                    <th style={{ width: '60px', textAlign: 'center' }}>ĐVT</th>
                    <th style={{ width: '80px', textAlign: 'right' }}>Số lượng</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Đơn giá (đ)</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>Thành tiền (đ)</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => {
                    const lineTotal = (item.unitPrice || 0) * (item.quantity || 1);
                    return (
                      <tr key={item.id || index}>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                          {index + 1}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {item.sku}
                        </td>
                        <td>
                          <div className="invoice-item-name">{item.name}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>Cái/Bộ</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          {item.quantity}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          {item.unitPrice.toLocaleString('vi-VN')}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {lineTotal.toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="invoice-calc-grid">
              <div className="invoice-calc-left">
                <div className="invoice-words-block">
                  <span className="lbl">Số tiền viết bằng chữ:</span>
                  <div className="val">{totalWords}</div>
                </div>
                <div className="invoice-note-box">
                  * Hóa đơn kiêm phiếu bảo hành vật tư công trình. Vui lòng kiểm tra đối chiếu chủng loại và quy cách vật tư trước khi ký nhận.
                </div>
              </div>

              <div className="invoice-calc-right">
                <div className="invoice-calc-row">
                  <span>Cộng tiền hàng:</span>
                  <b>{order.totalAmount.toLocaleString('vi-VN')} đ</b>
                </div>
                <div className="invoice-calc-row">
                  <span>Thuế GTGT (VAT):</span>
                  <span>Đã bao gồm trong giá</span>
                </div>
                <div className="invoice-calc-row">
                  <span>Phí vận chuyển công trình:</span>
                  <span>Miễn phí</span>
                </div>
                <div className="invoice-calc-row invoice-calc-total">
                  <span>TỔNG CỘNG THANH TOÁN:</span>
                  <span className="total-val">{order.totalAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </div>



            {/* Footer Watermark */}
            <div className="invoice-paper-footer">
              <span>Hệ thống quản lý vật tư xây dựng TDT M&amp;E</span>
              <span>·</span>
              <span>Ngày in: {exportDate}</span>
              <span>·</span>
              <span>Trang 1 / 1</span>
            </div>
          </div>
        </div>

        {/* FOOTER ACTION BAR */}
        <footer className="invoice-modal-footer">
          <button
            type="button"
            className="invoice-btn-back"
            onClick={onClose}
          >
            &larr; Đóng và quay lại chi tiết đơn hàng
          </button>
          <div className="invoice-footer-hint">
            Hóa đơn được mã hóa chuẩn hóa đơn điện tử TDT M&amp;E
          </div>
        </footer>
      </div>
    </div>
  );
}
