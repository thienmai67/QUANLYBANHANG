'use client';

import React, { useState, useEffect } from 'react';
import { Brand, CORE_BRANDS, Product } from '@/types/manager';
import { useManagerStore } from '@/store/useManagerStore';
import { useToast } from '@/hooks/useToast';
import { calculateDiscountedPrice } from '@/lib/stock';
import { formatCurrencyVND } from '@/lib/formatters';
import {
  X,
  Pencil,
  AlertCircle,
  Loader2,
  Tag,
} from 'lucide-react';

interface EditMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
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

export function EditMaterialModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: EditMaterialModalProps) {
  const { updateProduct } = useManagerStore();
  const toast = useToast();

  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [brand, setBrand] = useState<Brand>('Cadivi');
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [unit, setUnit] = useState<string>('cái');
  const [basePrice, setBasePrice] = useState<number>(100000);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [description, setDescription] = useState<string>('');

  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && product) {
      setCode(product.code || '');
      setName(product.name || '');
      setBrand(product.brand || 'Cadivi');
      setCategory(product.category || DEFAULT_CATEGORIES[0]);
      setUnit(product.unit || 'cái');
      setBasePrice(product.basePrice || 0);
      setDiscountPercent(product.discountPercent || 0);
      setDescription(product.description || '');
      setError('');
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const discountedPrice = calculateDiscountedPrice(basePrice, discountPercent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Mã vật tư (SKU) không được để trống');
      return;
    }
    if (!name.trim()) {
      setError('Tên vật tư không được để trống');
      return;
    }
    if (basePrice <= 0) {
      setError('Đơn giá niêm yết phải lớn hơn 0');
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateProduct(product.id, {
        code: code.trim(),
        name: name.trim(),
        brand,
        category,
        unit: unit.trim(),
        basePrice,
        discountPercent,
        description: description.trim(),
      });

      if (res.success && res.product) {
        toast.success(`Đã cập nhật thông tin vật tư ${res.product.name}`);
        if (onSuccess) onSuccess(res.product);
        onClose();
      } else {
        setError(res.error || 'Cập nhật sản phẩm thất bại');
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi kết nối khi cập nhật sản phẩm');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-material-title"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 id="edit-material-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Chỉnh Sửa Vật Tư M&E
              </h3>
              <p className="text-xs text-slate-500">Mã SKU: {product.code}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SKU */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Mã vật tư (SKU) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: CADIVI-CV-1.5"
                disabled={submitting}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-slate-100 font-mono font-bold"
              />
            </div>

            {/* Brand */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Thương hiệu <span className="text-rose-500">*</span>
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value as Brand)}
                disabled={submitting}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-slate-100 font-medium"
              >
                {CORE_BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Tên vật tư kỹ thuật <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Dây điện đơn mềm ruột đồng CADIVI CV 1.5mm2"
              disabled={submitting}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-slate-100 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Nhóm danh mục
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-slate-100 font-medium"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Đơn vị tính <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="VD: cuộn, cây, cái, mét..."
                disabled={submitting}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Base Price */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Đơn giá niêm yết (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1000"
                step="500"
                value={basePrice}
                onChange={(e) => setBasePrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                disabled={submitting}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-slate-100 font-mono font-bold"
              />
            </div>

            {/* Discount Percent */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Chiết khấu nhà thầu (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                disabled={submitting}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-slate-100 font-mono font-bold"
              />
            </div>
          </div>

          {/* Pricing Summary preview */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Tag className="w-4 h-4 text-blue-500" />
              <span>Giá sau chiết khấu ({discountPercent}%):</span>
            </div>
            <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
              {formatCurrencyVND(discountedPrice)}
            </span>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Mô tả kỹ thuật / Ghi chú
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Thông số kỹ thuật tiêu chuẩn..."
              disabled={submitting}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl shadow transition-all flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu thay đổi</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
