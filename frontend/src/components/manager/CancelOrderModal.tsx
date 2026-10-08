'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '@/types/manager';
import { useManagerStore } from '@/store/useManagerStore';
import { validateCancellation } from '@/lib/orderRules';
import { useToast } from '@/hooks/useToast';
import {
  X,
  AlertTriangle,
  RotateCcw,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface CancelOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CancelOrderModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: CancelOrderModalProps) {
  const { cancelOrder } = useManagerStore();
  const toast = useToast();
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const willRestock = order.status === 'PACKING' || order.status === 'SHIPPING';

  const handleConfirmCancel = () => {
    const validation = validateCancellation(reason);
    if (!validation.valid) {
      setError(validation.error || 'Lý do hủy đơn phải có ít nhất 5 ký tự');
      return;
    }

    setSubmitting(true);
    try {
      const res = cancelOrder(order.id, reason, 'Manager Hải Đăng');
      if (res.success) {
        toast.success(
          `Đã hủy đơn hàng #${order.code}${
            willRestock ? ' và tự động hoàn lại tồn kho vật tư' : ''
          }`
        );
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || 'Hủy đơn hàng thất bại');
        toast.error(res.error || 'Hủy đơn hàng thất bại');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi xử lý khi hủy đơn hàng');
      toast.error(err.message || 'Lỗi xử lý khi hủy đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-title"
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-rose-50/40 dark:bg-rose-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="cancel-order-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Hủy đơn hàng #{order.code}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Khách hàng: {order.customerName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Restock indicator banner */}
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              willRestock
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400'
            }`}
          >
            <RotateCcw className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold">
                {willRestock
                  ? 'Tự động hoàn trả tồn kho:'
                  : 'Đơn hàng chưa duyệt (PENDING):'}
              </span>{' '}
              {willRestock
                ? `Đơn hàng đang ở trạng thái ${order.status}. Hủy đơn sẽ tự động cộng lại toàn bộ ${
                    order.items?.length || 0
                  } mặt hàng vào kho và ghi nhật ký kiểm kê.`
                : 'Đơn chưa duyệt nên chưa trừ tồn kho, hủy đơn sẽ không thay đổi số lượng kho.'}
            </div>
          </div>

          {/* Reason input */}
          <div className="space-y-1.5">
            <label
              htmlFor="cancellation-reason"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Lý do hủy đơn <span className="text-rose-500">*</span>{' '}
              <span className="text-[11px] font-normal text-slate-400">
                (bắt buộc tối thiểu 5 ký tự)
              </span>
            </label>
            <textarea
              id="cancellation-reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ví dụ: Khách báo hủy thay đổi thiết kế công trình, thiếu mã cáp chuyên dụng..."
              className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                error
                  ? 'border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-amber-500/20 focus:border-amber-500'
              }`}
            />

            <div className="flex items-center justify-between text-[11px]">
              {error ? (
                <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </span>
              ) : (
                <span className="text-slate-400">Tối thiểu 5 ký tự</span>
              )}
              <span
                className={`font-mono ${
                  reason.trim().length >= 5
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                {reason.trim().length}/5
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang hủy đơn...</span>
              </>
            ) : (
              <span>Xác nhận hủy đơn</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CancelOrderModal;
