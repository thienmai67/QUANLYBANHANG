'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { api, getFriendlyErrorMessage } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber: string;
    version?: number;
  } | null;
  onCancelSuccess: (orderId: string, reason: string) => void;
}

export default function CancelOrderModal({
  isOpen,
  onClose,
  order,
  onCancelSuccess,
}: CancelOrderModalProps) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, order?.id]);

  if (!isOpen || !order) return null;

  const trimmedReason = reason.trim();
  const isValidLength = trimmedReason.length >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidLength) {
      setErrorMessage('Lý do hủy đơn hàng phải có tối thiểu 5 ký tự.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        status: 'CANCELLED',
        cancellationReason: trimmedReason,
      };
      if (typeof order.version === 'number') {
        payload.version = order.version;
      }

      await api.patch(`/orders/${order.id}/status`, payload);
      toast.success(`Đã hủy thành công đơn hàng #${order.orderNumber}`);
      onCancelSuccess(order.id, trimmedReason);
      onClose();
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err);
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-order-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 id="cancel-order-title" className="font-bold text-base text-slate-900 dark:text-white">
              Hủy Đơn Hàng #{order.orderNumber}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Đơn hàng của bạn đang ở trạng thái <strong>Chờ xử lý (PENDING)</strong>. Bạn có thể hủy đơn nếu chưa được duyệt đóng gói.
          </p>

          <div className="space-y-1.5">
            <label
              htmlFor="cancel-reason"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Lý do hủy đơn hàng <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="cancel-reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Nhập lý do hủy (ví dụ: đặt nhầm số lượng, thay đổi địa chỉ nhận...)"
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
            />
            <div className="flex items-center justify-between text-[11px]">
              <span
                className={
                  trimmedReason.length > 0 && !isValidLength
                    ? 'text-rose-500 font-semibold'
                    : 'text-slate-400'
                }
              >
                {trimmedReason.length < 5
                  ? `Cần tối thiểu 5 ký tự (hiện có ${trimmedReason.length}/5)`
                  : 'Đạt điều kiện tối thiểu'}
              </span>
              <span className="text-slate-400">{trimmedReason.length} ký tự</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Giữ lại đơn
            </button>
            <button
              type="submit"
              disabled={!isValidLength || isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 dark:disabled:bg-rose-900/50 rounded-xl shadow transition-all flex items-center gap-1.5 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Xác nhận hủy đơn</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
