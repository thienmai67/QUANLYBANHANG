'use client';

import React, { useState, useEffect } from 'react';
import { Brand, CORE_BRANDS, Product } from '@/types/manager';
import { useManagerStore } from '@/store/useManagerStore';
import { useToast } from '@/hooks/useToast';
import { calculateDiscountedPrice } from '@/lib/stock';
import { formatCurrencyVND } from '@/lib/formatters';
import {
  X,
  PlusCircle,
  PackagePlus,
  AlertCircle,
  Loader2,
  Tag,
} from 'lucide-react';

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (product: Product) => void;
}

const DEFAULT_CATEGORIES = [
  'Dây & Cáp điện hạ thế',
  'Ống & Phụ kiện luồn dây',
  'Ống & Phụ kiện nhựa uPVC/PPR',
  'Thiết bị đóng cắt & Aptomat',
  'Công tắc & Ổ cắm dân dụng',
  'Thiết bị chiếu sáng & LED',
  'Tủ điện & Phụ kiện M&E',
];

export function AddMaterialModal({
  isOpen,
  onClose,
  onSuccess,
}: AddMaterialModalProps) {
  const { addProduct } = useManagerStore();
  const toast = useToast();

  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [brand, setBrand] = useState<Brand>('Cadivi');
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [unit, setUnit] = useState<string>('cuộn');
  const [basePrice, setBasePrice] = useState<number>(100000);
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [stockQuantity, setStockQuantity] = useState<number>(50);
  const [minStockLevel, setMinStockLevel] = useState<number>(10);
  const [description, setDescription] = useState<string>('');

  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setName('');
      setBrand('Cadivi');
      setCategory(DEFAULT_CATEGORIES[0]);
      setUnit('cuộn');
      setBasePrice(100000);
      setDiscountPercent(10);
      setStockQuantity(50);
      setMinStockLevel(10);
      setDescription('');
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

  if (!isOpen) return null;

  const discountedPrice = calculateDiscountedPrice(basePrice, discountPercent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('Vui lòng nhập mã định danh vật tư');
      return;
    }
    if (!name.trim()) {
      setError('Vui lòng nhập tên vật tư');
      return;
    }
    if (basePrice <= 0) {
      setError('Đơn giá niêm yết phải lớn hơn 0');
      return;
    }
    if (discountPercent < 0 || discountPercent > 100) {
      setError('Chiết khấu phải trong khoảng từ 0% đến 100%');
      return;
    }
    if (stockQuantity < 0) {
      setError('Số lượng nhập kho ban đầu không thể âm');
      return;
    }

    setSubmitting(true);
    try {
      const res = addProduct({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        brand,
        category,
        unit: unit.trim() || 'cái',
        basePrice: Math.round(basePrice),
        discountPercent: Math.round(discountPercent),
        stockQuantity: Math.floor(stockQuantity),
        minStockLevel: Math.floor(minStockLevel || 5),
        description: description.trim() || undefined,
      });

      if (res.success && res.product) {
        toast.success(`Đã thêm vật tư mới "${res.product.name}" vào danh mục`);
        onClose();
        if (onSuccess) onSuccess(res.product);
      } else {
        setError(res.error || 'Thêm vật tư thất bại');
        toast.error(res.error || 'Thêm vật tư thất bại');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi hệ thống khi thêm vật tư');
      toast.error(err.message || 'Lỗi hệ thống khi thêm vật tư');
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
        aria-labelledby="add-material-title"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-amber-50/40 dark:bg-amber-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="add-material-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Thêm vật tư cơ điện mới (M&E)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nhập kho vật tư 4 thương hiệu phân phối chính hãng
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brand select */}
            <div className="space-y-1.5">
              <label
                htmlFor="material-brand-select"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Thương hiệu phân phối <span className="text-rose-500">*</span>
              </label>
              <select
                id="material-brand-select"
                value={brand}
                onChange={(e) => setBrand(e.target.value as Brand)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {CORE_BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Category select / text */}
            <div className="space-y-1.5">
              <label
                htmlFor="material-category-select"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Nhóm danh mục <span className="text-rose-500">*</span>
              </label>
              <select
                id="material-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Code */}
            <div className="space-y-1.5">
              <label
                htmlFor="material-code-input"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Mã vật tư (SKU) <span className="text-rose-500">*</span>
              </label>
              <input
                id="material-code-input"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError('');
                }}
                placeholder="VD: CDV-CV4, BM-UPVC90..."
                className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                required
              />
            </div>

            {/* Name */}
            <div className="sm:col-span-2 space-y-1.5">
              <label
                htmlFor="material-name-input"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Tên vật tư chi tiết <span className="text-rose-500">*</span>
              </label>
              <input
                id="material-name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="VD: Dây điện đơn mềm Cadivi CV 4.0mm² (100m/cuộn)..."
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Pricing & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="material-unit-input"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Đơn vị tính (ĐVT) <span className="text-rose-500">*</span>
              </label>
              <input
                id="material-unit-input"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="cuộn, m, cây, cái..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="material-baseprice-input"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Đơn giá niêm yết (VND) <span className="text-rose-500">*</span>
              </label>
              <input
                id="material-baseprice-input"
                type="number"
                min="0"
                step="1000"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="material-discount-input"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Chiết khấu chuẩn (%)
              </label>
              <input
                id="material-discount-input"
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Discounted price banner preview */}
          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between text-xs">
            <span className="text-amber-800 dark:text-amber-300 font-medium">
              Giá xuất kho sau chiết khấu (tính tự động):
            </span>
            <span className="font-extrabold text-amber-700 dark:text-amber-400 text-sm">
              {formatCurrencyVND(discountedPrice)}
            </span>
          </div>

          {/* Stock info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="material-initial-stock-input"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Số lượng nhập kho ban đầu <span className="text-rose-500">*</span>
              </label>
              <input
                id="material-initial-stock-input"
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="material-minstock-input"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Mức cảnh báo tồn tối thiểu
              </label>
              <input
                id="material-minstock-input"
                type="number"
                min="1"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="material-description-input"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Mô tả thông số kỹ thuật (tùy chọn)
            </label>
            <textarea
              id="material-description-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tiêu chuẩn TCVN, chứng nhận Quatest, quy cách đóng gói..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Error Message */}
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
              className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tạo vật tư...</span>
                </>
              ) : (
                <span>Lưu vật tư vào kho</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMaterialModal;
