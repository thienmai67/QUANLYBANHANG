'use client';

import React from 'react';
import { Order } from '@/types/manager';
import { AlertTriangle, X, ShieldAlert, PhoneOff } from 'lucide-react';

interface IncidentModalProps {
  order: Order | null;
  shipperId: string;
  shipperName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function IncidentModal({
  order,
  isOpen,
  onClose,
}: IncidentModalProps) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="incident-modal-title"
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl overflow-hidden space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 id="incident-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
                Báo cáo sự cố giao hàng
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Đơn #{order.code}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 space-y-3">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-rose-600 dark:text-rose-400">
              <PhoneOff className="w-4 h-4 shrink-0" />
              <span>Hotline điều phối: Chưa thiết lập</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Hiện tại hệ thống chưa có số điện thoại điều phối trực tiếp. Khi phát sinh sự cố (khách không nghe máy, sai địa chỉ, giao thất bại, hàng cồng kềnh), vui lòng báo cáo trực tiếp cho <strong>Quản lý kho</strong> tại trạm giao dịch để được hỗ trợ xử lý theo đúng quy trình.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1 text-slate-600 dark:text-slate-400">
            <p>
              Khách hàng: <span className="font-semibold text-slate-900 dark:text-white">{order.customerName || '-'}</span>
            </p>
            <p>
              Địa chỉ: <span className="font-semibold text-slate-900 dark:text-white">{order.shippingAddress || '-'}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white text-xs font-bold transition-all shadow-md"
          >
            Đã hiểu &amp; Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
