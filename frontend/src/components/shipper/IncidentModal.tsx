'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '@/types/manager';
import { useToast } from '@/hooks/useToast';
import {
  AlertTriangle,
  X,
  ShieldAlert,
  Phone,
  Send,
  Loader2,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface IncidentModalProps {
  order: Order | null;
  shipperId: string;
  shipperName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const INCIDENT_CATEGORIES = [
  { id: 'CALL_FAILED', label: 'Không liên lạc được (Gọi 3 cuộc không nghe máy)' },
  { id: 'RESCHEDULE', label: 'Khách hẹn lại giờ giao khác' },
  { id: 'WRONG_ADDRESS', label: 'Sai địa chỉ công trình / Không vào được hẻm' },
  { id: 'REJECTED', label: 'Khách từ chối nhận hàng (Đổi ý / Bom hàng)' },
  { id: 'DAMAGED', label: 'Vật tư hư hỏng / Bể vỡ khi vận chuyển' },
  { id: 'OTHER', label: 'Sự cố phát sinh khác' },
];

export default function IncidentModal({
  order,
  shipperName,
  isOpen,
  onClose,
  onSuccess,
}: IncidentModalProps) {
  const toast = useToast();
  const [category, setCategory] = useState(INCIDENT_CATEGORIES[0].id);
  const [detail, setDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCategory(INCIDENT_CATEGORIES[0].id);
      setDetail('');
      setIsSubmitting(false);
    }
  }, [isOpen, order?.id]);

  if (!isOpen || !order) return null;

  const selectedCategoryLabel =
    INCIDENT_CATEGORIES.find((c) => c.id === category)?.label || category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!detail.trim() || detail.trim().length < 5) {
      toast.warning('Vui lòng nhập mô tả chi tiết sự cố (tối thiểu 5 ký tự)');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate incident reporting to manager dispatch desk
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Store reported incident locally on order notes/history if applicable
      const incidentPayload = {
        category: selectedCategoryLabel,
        detail: detail.trim(),
        reportedBy: shipperName,
        reportedAt: new Date().toISOString(),
      };

      try {
        const storedIncidents = JSON.parse(
          localStorage.getItem('shipper_incidents') || '{}'
        );
        storedIncidents[order.id] = incidentPayload;
        localStorage.setItem('shipper_incidents', JSON.stringify(storedIncidents));
      } catch {
        // ignore localStorage errors
      }

      toast.success(
        `Đã gửi báo cáo sự cố đơn #${order.code} về Quản lý kho Minh Lý thành công!`
      );
      onClose();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể gửi báo cáo sự cố. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Đơn #{order.code}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="px-4 space-y-3.5 text-xs">
          {/* Dispatch Hotline Quick Call */}
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
                Hotline Điều Phối Kho
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                0988.248.524 (A. Tuấn)
              </span>
            </div>
            <a
              href="tel:0988248524"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Gọi ngay</span>
            </a>
          </div>

          {/* Category Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              Phân loại sự cố <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {INCIDENT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Incident Details Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              Mô tả chi tiết tại hiện trường <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="VD: Đã gọi khách 3 lần lúc 11h15 và 11h25 nhưng thuê bao. Hàng cồng kềnh không gửi được bảo vệ công trình..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
            />
          </div>

          {/* Customer / Location Info Pill */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px] space-y-0.5 text-slate-600 dark:text-slate-400">
            <p>
              Khách hàng:{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {order.customerName || '-'}
              </span>
            </p>
            <p className="truncate">
              Địa chỉ: {order.shippingAddress || '-'}
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 pb-1 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] px-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || detail.trim().length < 5}
              className="min-h-[44px] flex-1 px-4 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 active:scale-98 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi báo cáo sự cố</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
