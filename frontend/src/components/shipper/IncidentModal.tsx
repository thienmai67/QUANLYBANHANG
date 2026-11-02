'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Order } from '@/types/manager';

interface IncidentModalProps {
  isOpen: boolean;
  order: Order | null;
  shipperId?: string;
  shipperName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function IncidentModal({
  isOpen,
  order,
  onClose,
}: IncidentModalProps) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-manager-title"
        className="relative w-full max-w-sm rounded-[8px] shadow-xl border border-[#e6e6e6] bg-white text-[#0a0a0a] overflow-hidden z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e6e6e6]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[6px] bg-[#ffedea] text-[#831c1e] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 id="contact-manager-title" className="font-semibold text-[16px] leading-tight text-[#0a0a0a]">
                Liên hệ quản lý
              </h2>
              <p className="text-[14px] text-[#6b6b6b]">
                Đơn #{order.code}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[6px] text-[#6b6b6b] hover:text-[#0a0a0a] hover:bg-[#f2f2f2] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3 text-[14px] leading-normal">
          <div className="p-3 rounded-[6px] bg-[#fffbeb] border border-[#fef3c7] text-[#92400e]">
            <p className="font-medium">
              Quy định điều phối: Shipper không tự ý hủy đơn hàng.
            </p>
          </div>

          <div className="p-3 rounded-[6px] bg-[#f8f8f8] border border-[#e6e6e6] text-[#0a0a0a] space-y-1">
            <p className="font-medium text-[#831c1e]">
              Hotline điều phối: Chưa thiết lập
            </p>
            <p className="text-[13px] text-[#6b6b6b] leading-relaxed">
              Hiện tại hệ thống chưa có số điện thoại điều phối trực tiếp. Khi phát sinh sự cố (khách không nghe máy, sai địa chỉ, giao thất bại, hàng cồng kềnh), vui lòng báo cáo trực tiếp cho <strong>Quản lý kho</strong> tại trạm giao dịch để được hỗ trợ xử lý theo đúng quy trình.
            </p>
          </div>

          <div className="bg-[#f8f8f8] border border-[#e6e6e6] rounded-[6px] p-3 space-y-1 text-[#6b6b6b]">
            <p className="text-[14px]">Khách hàng: <span className="font-medium text-[#0a0a0a]">{order.customerName || '-'}</span></p>
            <p className="text-[14px]">Địa chỉ: <span className="font-medium text-[#0a0a0a]">{order.shippingAddress || '-'}</span></p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#e6e6e6] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] rounded-[6px] bg-[#141414] text-white hover:bg-[#222222] text-[14px] font-semibold flex items-center justify-center transition-colors"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
