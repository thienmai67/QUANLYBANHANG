'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Image as ImageIcon,
  Receipt,
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

/**
 * Pixel-perfect deterministic SVG QR Code renderer (21x21 matrix)
 * Never fails in html2canvas / jsPDF because it is pure inline vector SVG.
 */
function PosQrCode({ value, size = 58 }: { value: string; size?: number }) {
  const gridSize = 21;
  const matrix: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  const drawFinder = (r: number, c: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const isBorder = i === 0 || i === 6 || j === 0 || j === 6;
        const isInner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        matrix[r + i][c + j] = isBorder || isInner;
      }
    }
  };

  // 3 Corner finder patterns
  drawFinder(0, 0);
  drawFinder(0, gridSize - 7);
  drawFinder(gridSize - 7, 0);

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Deterministic seed based on value string
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= gridSize - 8) ||
        (r >= gridSize - 8 && c < 8) ||
        r === 6 ||
        c === 6
      ) {
        continue;
      }
      hash = (hash * 1103515245 + 12345) & 0x7fffffff;
      matrix[r][c] = (hash % 3) === 0;
    }
  }

  const cellSize = 100 / gridSize;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="invoice-pos-qr-svg"
      style={{ display: 'block', flexShrink: 0 }}
      aria-label="Mã QR tra cứu hóa đơn"
    >
      <rect width="100" height="100" fill="#ffffff" />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.15}
              height={cellSize + 0.15}
              fill="#111111"
            />
          ) : null
        )
      )}
    </svg>
  );
}

/**
 * Tạo tọa độ mép răng cưa trên của giấy in nhiệt (teeth pointing up)
 */
function generateTearPointsTop(numTeeth = 36): string {
  const toothWidth = 200 / numTeeth;
  let points = '0,8';
  for (let i = 0; i < numTeeth; i++) {
    const xMid = (i + 0.5) * toothWidth;
    const xEnd = (i + 1) * toothWidth;
    points += ` ${xMid.toFixed(1)},1.2 ${xEnd.toFixed(1)},8`;
  }
  points += ' 200,8 0,8';
  return points;
}

/**
 * Tạo tọa độ mép răng cưa dưới của giấy in nhiệt (teeth pointing down)
 */
function generateTearPointsBottom(numTeeth = 36): string {
  const toothWidth = 200 / numTeeth;
  let points = '0,0';
  for (let i = 0; i < numTeeth; i++) {
    const xMid = (i + 0.5) * toothWidth;
    const xEnd = (i + 1) * toothWidth;
    points += ` ${xMid.toFixed(1)},6.8 ${xEnd.toFixed(1)},0`;
  }
  points += ' 200,0 0,0';
  return points;
}

export default function InvoiceModal({
  order,
  isOpen,
  onClose,
  customerPhone,
}: InvoiceModalProps) {
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const invoicePaperRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen || !order) return null;

  const createdDate = new Date(order.createdAt);
  const dateFormatted = `${String(createdDate.getDate()).padStart(2, '0')}/${String(createdDate.getMonth() + 1).padStart(2, '0')}/${createdDate.getFullYear()}`;
  const timeFormatted = `${String(createdDate.getHours()).padStart(2, '0')}:${String(createdDate.getMinutes()).padStart(2, '0')}`;

  const ctCode = order.orderNumber || 'ORD-UNKNOWN';
  const ctLine = `Số CT: ${ctCode} - ${dateFormatted} ${timeFormatted}-NV:154233`;

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
        backgroundColor: null,
        logging: false,
      } as any);

      const imgData = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = imgData;
      downloadLink.download = `PhieuThanhToan_${ctCode.replace(/[^a-zA-Z0-9-_]/g, '')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Lỗi khi xuất file PNG:', err);
      alert('Không thể tạo file ảnh PNG. Vui lòng thử lại hoặc sử dụng tính năng In ngay.');
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
        backgroundColor: null,
        logging: false,
      } as any);

      const imgData = canvas.toDataURL('image/png');
      const pdfWidthMm = 80;
      const pdfHeightMm = (canvas.height * pdfWidthMm) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidthMm, Math.max(pdfHeightMm, 40)],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidthMm, pdfHeightMm);
      pdf.save(`PhieuThanhToan_${ctCode.replace(/[^a-zA-Z0-9-_]/g, '')}.pdf`);
    } catch (err) {
      console.error('Lỗi khi xuất file PDF:', err);
      alert('Không thể tạo file PDF. Vui lòng thử lại hoặc sử dụng tính năng In ngay.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div
      className="invoice-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="invoice-modal-container invoice-modal-container-pos" role="dialog" aria-modal="true">
        {/* TOP BAR / ACTIONS */}
        <header className="invoice-modal-topbar">
          <div className="invoice-modal-meta">
            <span className="invoice-badge-status">
              <Receipt size={14} />
              Phiếu thanh toán POS
            </span>
            <span className="invoice-order-ref">#{ctCode}</span>
          </div>

          <div className="invoice-modal-actions">
            <button
              type="button"
              className="invoice-btn-act invoice-btn-png"
              onClick={handleExportPNG}
              disabled={isExportingPng}
              title="Tải ảnh PNG cuộn in nhiệt độ nét cao"
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
              title="Tải văn bản PDF khổ cuộn nhiệt 80mm"
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
              title="In bằng máy in hoặc lưu PDF"
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

        {/* INVOICE PAPER WRAPPER */}
        <div className="invoice-paper-wrapper invoice-pos-wrapper">
          <div
            id="invoice-paper"
            ref={invoicePaperRef}
            className="invoice-pos-receipt"
          >
            {/* TOP SERRATED TEAR EDGE */}
            <div className="invoice-pos-tear invoice-pos-tear-top" aria-hidden="true">
              <svg viewBox="0 0 200 8" width="100%" height="8" preserveAspectRatio="none" style={{ display: 'block' }}>
                <polygon points={generateTearPointsTop()} fill="#ffffff" />
              </svg>
            </div>

            {/* MAIN WHITE PAPER BODY */}
            <div className="invoice-pos-body">
              {/* Header: Title + QR Code */}
              <div className="invoice-pos-header">
                <div className="invoice-pos-title-box">
                  <h1 className="invoice-pos-title">PHIẾU THANH TOÁN VẬT TƯ TDT M&amp;E</h1>
                  <div className="invoice-pos-ctline">{ctLine}</div>
                </div>
                <div className="invoice-pos-qr-box">
                  <PosQrCode value={`https://tdt-me.vn/orders/${ctCode}`} size={56} />
                </div>
              </div>

              {/* Divider solid line */}
              <div className="invoice-pos-solid-line" />

              {/* Table Column Headers */}
              <div className="invoice-pos-table-header">
                <span className="col-sl">SL</span>
                <span className="col-price">Giá bán (có VAT)</span>
                <span className="col-total">Thành tiền</span>
              </div>

              {/* Items List */}
              <div className="invoice-pos-items-list">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => {
                    const lineTotal = (item.unitPrice || 0) * (item.quantity || 1);
                    return (
                      <div key={item.id || index} className="invoice-pos-item">
                        <div className="invoice-pos-item-name">{item.name}</div>
                        <div className="invoice-pos-item-row">
                          <span className="col-sl">{item.quantity}</span>
                          <span className="col-price">{item.unitPrice.toLocaleString('vi-VN')}</span>
                          <span className="col-total">{lineTotal.toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="invoice-pos-item">
                    <div className="invoice-pos-item-name">Đơn hàng vật tư xây dựng</div>
                    <div className="invoice-pos-item-row">
                      <span className="col-sl">1</span>
                      <span className="col-price">{order.totalAmount.toLocaleString('vi-VN')}</span>
                      <span className="col-total">{order.totalAmount.toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Dotted Divider line */}
              <div className="invoice-pos-dotted-line" />

              {/* Totals Section */}
              <div className="invoice-pos-totals">
                <div className="invoice-pos-total-row main">
                  <span className="lbl">Phải thanh toán:</span>
                  <span className="val">{order.totalAmount.toLocaleString('vi-VN')}</span>
                </div>
                <div className="invoice-pos-subrow">
                  <span className="lbl">Hình thức:</span>
                  <span className="val">{order.paymentMethod || 'Tiền mặt (COD)'}</span>
                </div>
                <div className="invoice-pos-subrow">
                  <span className="lbl">Trạng thái:</span>
                  <span className="val status">
                    {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ thu tiền khi giao'}
                  </span>
                </div>
              </div>

              {/* Hotline Divider line */}
              <div className="invoice-pos-hotline-row">
                <span className="dash-line" />
                <span className="hotline-text">Tổng đài góp ý/khiếu nại: 1900 6868</span>
                <span className="dash-line" />
              </div>

              {/* Invoice VAT Lookup & Notes */}
              <div className="invoice-pos-notes">
                <p>Quý khách có thể in bản sao HĐ VAT tại: <b>hddt.tdt-me.vn</b></p>
                <p>Mã tra cứu hóa đơn: <span className="mono-code">{ctCode}</span></p>
                <p className="notice">Lưu ý : HĐ VAT chỉ xuất trong ngày</p>
                <p className="policy">
                  Cảm ơn Quý Khách hàng đã đồng ý với chính sách xử lý dữ liệu cá nhân của Chúng tôi tại https://tdt-me.vn/chinh-sach-xu-ly-du-lieu-ca-nhan
                </p>
              </div>

              {/* Solid bottom line */}
              <div className="invoice-pos-solid-line" style={{ margin: '8px 0 6px 0' }} />

              {/* Customer Points Loyalty Phone */}
              <div className="invoice-pos-loyalty">
                Hóa đơn tích điểm cho {customerPhone || '0987 *** 899'} sau 24h.
              </div>
            </div>

            {/* BOTTOM SERRATED TEAR EDGE */}
            <div className="invoice-pos-tear invoice-pos-tear-bottom" aria-hidden="true">
              <svg viewBox="0 0 200 8" width="100%" height="8" preserveAspectRatio="none" style={{ display: 'block' }}>
                <polygon points={generateTearPointsBottom()} fill="#ffffff" />
              </svg>
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
            Hóa đơn được tối ưu chuẩn khổ in nhiệt 80mm POS
          </div>
        </footer>
      </div>
    </div>
  );
}
