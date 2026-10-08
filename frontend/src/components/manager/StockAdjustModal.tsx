'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/types/manager';
import { useManagerStore } from '@/store/useManagerStore';
import { useToast } from '@/hooks/useToast';
import { formatNumberVND } from '@/lib/formatters';
import {
  X,
  Boxes,
  ArrowRight,
  AlertCircle,
  Loader2,
  FileEdit,
} from 'lucide-react';

interface StockAdjustModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function StockAdjustModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: StockAdjustModalProps) {
  const { adjustStock } = useManagerStore();
  const toast = useToast();

  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && product) {
      setNewQuantity(product.stockQuantity || 0);
      setReason('');
      setError('');
    }
  }, [isOpen, product]);

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

  if (!isOpen || !product) return null;

  const currentStock = product.stockQuantity || 0;
  const diff = newQuantity - currentStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isNaN(newQuantity) || newQuantity < 0) {
      setError('Số lượng tồn kho mới phải là số nguyên không âm');
      return;
    }

    if (!reason.trim()) {
      setError('Vui lòng nhập lý do điều chỉnh tồn kho');
      return;
    }

    setSubmitting(true);
    try {
      const res = adjustStock(
        product.id,
        Math.floor(newQuantity),
        reason.trim(),
        'Manager Hải Đăng'
      );

      if (res.success) {
        toast.success(
          `Đã điều chỉnh tồn kho ${product.name}: ${currentStock} -> ${newQuantity} ${product.unit}`
        );
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || 'Điều chỉnh tồn kho thất bại');
        toast.error(res.error || 'Điều chỉnh tồn kho thất bại');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi điều chỉnh tồn kho');
      toast.error(err.message || 'Lỗi khi điều chỉnh tồn kho');
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
        aria-labelledby="stock-adjust-title"
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="stock-adjust-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Điều chỉnh tồn kho vật tư
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mã: {product.code} • {product.brand}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product info banner */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {product.name}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Đơn vị tính: {product.unit}</span>
              <span>Định mức an toàn: {product.minStockLevel} {product.unit}</span>
            </div>
          </div>

          {/* Current -> New quantity preview */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/20">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Hiện có trong kho:
              </span>
              <span className="text-lg font-black text-slate-800 dark:text-slate-200">
                {formatNumberVND(currentStock)}{' '}
                <span className="text-xs font-normal text-slate-400">{product.unit}</span>
              </span>
            </div>

            <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-amber-50/40 dark:bg-amber-950/20">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block">
                Chênh lệch điều chỉnh:
              </span>
              <span
                className={`text-lg font-black ${
                  diff > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : diff < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {diff > 0 ? `+${diff}` : diff}{' '}
                <span className="text-xs font-normal">{product.unit}</span>
              </span>
            </div>
          </div>

          {/* New quantity input */}
          <div className="space-y-1.5">
            <label
              htmlFor="new-quantity-input"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Số lượng tồn kho thực tế mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="new-quantity-input"
                type="number"
                min="0"
                step="1"
                value={newQuantity}
                onChange={(e) => {
                  setNewQuantity(Number(e.target.value));
                  if (error) setError('');
                }}
                className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">
                {product.unit}
              </span>
            </div>
          </div>

          {/* Reason input */}
          <div className="space-y-1.5">
            <label
              htmlFor="adjust-reason-input"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Lý do điều chỉnh / Chứng từ kiểm kê <span className="text-rose-500">*</span>
            </label>
            <input
              id="adjust-reason-input"
              type="text"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="VD: Kiểm kê định kỳ kho, Bù hao hụt công trình, Nhập tồn đầu kỳ..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              required
            />
          </div>

          {/* Error notification */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu thay đổi kho</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StockAdjustModal;
