'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useManagerStore } from '@/store/useManagerStore';
import { Brand, CORE_BRANDS, Product } from '@/types/manager';
import { calculateDiscountedPrice } from '@/lib/stock';
import { formatCurrencyVND, formatNumberVND } from '@/lib/formatters';
import { StockAdjustModal } from '@/components/manager/StockAdjustModal';
import { AddMaterialModal } from '@/components/manager/AddMaterialModal';
import { useToast } from '@/hooks/useToast';
import {
  Boxes,
  Search,
  PlusCircle,
  AlertTriangle,
  SlidersHorizontal,
  Package,
  Layers,
  CheckCircle2,
  Tag,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

type BrandTab = 'ALL' | Brand;

const BRAND_TABS: Array<{ id: BrandTab; label: string }> = [
  { id: 'ALL', label: 'Tất cả thương hiệu' },
  { id: 'Cadivi', label: 'Cadivi' },
  { id: 'Bình Minh', label: 'Bình Minh' },
  { id: 'Schneider', label: 'Schneider' },
  { id: 'Panasonic', label: 'Panasonic' },
];

export default function ManagerProductsPage() {
  const toast = useToast();
  const { products, getDiscountedPrice, fetchProducts, deleteProduct } = useManagerStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (prod: Product) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${prod.name}" (${prod.code})?`)) {
      return;
    }
    setDeletingId(prod.id);
    try {
      const res = await deleteProduct(prod.id);
      if (res.success) {
        toast.success(`Đã xóa sản phẩm ${prod.name} thành công`);
      } else {
        toast.error(res.error || 'Xóa sản phẩm thất bại');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const [selectedBrand, setSelectedBrand] = useState<BrandTab>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);

  // Modals state
  const [adjustTargetProduct, setAdjustTargetProduct] = useState<Product | null>(null);
  const [isAdjustOpen, setIsAdjustOpen] = useState<boolean>(false);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);

  // Summary counts
  const totalProducts = products.length;
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stockQuantity <= p.minStockLevel).length;
  }, [products]);
  const totalStockUnits = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
  }, [products]);

  // Brand product counts
  const brandCounts = useMemo(() => {
    const counts: Record<BrandTab, number> = {
      ALL: products.length,
      Cadivi: 0,
      'Bình Minh': 0,
      Schneider: 0,
      Panasonic: 0,
    };
    for (const p of products) {
      if (p.brand in counts) {
        counts[p.brand] += 1;
      }
    }
    return counts;
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Brand filter
      if (selectedBrand !== 'ALL' && p.brand !== selectedBrand) {
        return false;
      }

      // Low stock filter
      if (onlyLowStock && p.stockQuantity > p.minStockLevel) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = p.code.toLowerCase().includes(q);
        const matchName = p.name.toLowerCase().includes(q);
        const matchCat = p.category?.toLowerCase().includes(q);
        const matchBrand = p.brand.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchCat && !matchBrand) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedBrand, onlyLowStock, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Kho Vật Tư Cơ Điện (M&E)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tra cứu tồn kho 4 thương hiệu phân phối chính hãng & cảnh báo mức an toàn
          </p>
        </div>

        {/* Action: Add Material Modal Trigger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20 transition-all"
            title="Thêm mặt hàng M&E mới vào kho"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm vật tư mới</span>
          </button>
        </div>
      </div>

      {/* 3 Summary Stat Mini-Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Tổng số mặt hàng
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {totalProducts}{' '}
              <span className="text-xs font-normal text-slate-400">mã vật tư</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Cảnh báo thiếu hàng
            </span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
              {lowStockCount}{' '}
              <span className="text-xs font-normal text-slate-400">mã cần nhập</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Tổng lượng tồn kho
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {formatNumberVND(totalStockUnits)}{' '}
              <span className="text-xs font-normal text-slate-400">sản phẩm</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Brand Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 pb-px min-w-max">
          {BRAND_TABS.map((tab) => {
            const isActive = selectedBrand === tab.id;
            const count = brandCounts[tab.id];

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedBrand(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  isActive
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input & Low Stock Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã vật tư, tên sản phẩm, danh mục cơ điện..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        {/* Low Stock Toggle */}
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer select-none shrink-0 hover:border-rose-400 transition-colors">
          <input
            type="checkbox"
            checked={onlyLowStock}
            onChange={(e) => setOnlyLowStock(e.target.checked)}
            className="w-3.5 h-3.5 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
          />
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Chỉ sản phẩm sắp hết hàng ({lowStockCount})
          </span>
        </label>
      </div>

      {/* Products Table / Cards */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Boxes className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Không tìm thấy vật tư nào phù hợp
          </p>
          <p className="text-xs text-slate-400">
            Thử thay đổi bộ lọc thương hiệu hoặc từ khóa tìm kiếm
          </p>
        </div>
      ) : (
        <>
          {/* ===================== DESKTOP TABLE VIEW ===================== */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Mã SKU</th>
                    <th className="px-4 py-3">Tên vật tư</th>
                    <th className="px-4 py-3">Thương hiệu</th>
                    <th className="px-4 py-3">Danh mục</th>
                    <th className="px-4 py-3 text-right">Giá niêm yết</th>
                    <th className="px-4 py-3 text-right">Chiết khấu</th>
                    <th className="px-4 py-3 text-right">Giá bán (sau CK)</th>
                    <th className="px-4 py-3 text-center">Tồn kho</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredProducts.map((prod) => {
                    const discounted = getDiscountedPrice(prod);
                    const isLowStock = prod.stockQuantity <= prod.minStockLevel;

                    return (
                      <tr
                        key={prod.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Code */}
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                          {prod.code}
                        </td>

                        {/* Name */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[220px]">
                            {prod.name}
                          </div>
                          {prod.description && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[220px]">
                              {prod.description}
                            </div>
                          )}
                        </td>

                        {/* Brand */}
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {prod.brand}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                          {prod.category}
                        </td>

                        {/* Base Price */}
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                          {formatCurrencyVND(prod.basePrice)}
                        </td>

                        {/* Discount */}
                        <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {prod.discountPercent > 0 ? `-${prod.discountPercent}%` : '0%'}
                        </td>

                        {/* Discounted Price */}
                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrencyVND(discounted)}
                        </td>

                        {/* Stock Badge */}
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                              isLowStock
                                ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800 shadow-sm animate-pulse'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
                            }`}
                            title={`Tồn hiện tại: ${prod.stockQuantity} ${prod.unit} (Mức tối thiểu: ${prod.minStockLevel})`}
                          >
                            {isLowStock && <AlertTriangle className="w-3 h-3 shrink-0" />}
                            <span>
                              {formatNumberVND(prod.stockQuantity)} {prod.unit}
                            </span>
                          </span>
                        </td>

                        {/* Action: Stock Adjust & Delete Product */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setAdjustTargetProduct(prod);
                                setIsAdjustOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 transition-colors"
                              title="Điều chỉnh số lượng tồn kho"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                              <span>Điều chỉnh</span>
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === prod.id}
                              onClick={() => handleDelete(prod)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 transition-colors disabled:opacity-50"
                              title="Xóa vật tư"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===================== MOBILE CARD VIEW (< 768px, NO HORIZONTAL OVERFLOW) ===================== */}
          <div className="md:hidden space-y-3">
            {filteredProducts.map((prod) => {
              const discounted = getDiscountedPrice(prod);
              const isLowStock = prod.stockQuantity <= prod.minStockLevel;

              return (
                <div
                  key={prod.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  {/* Top: SKU & Brand */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                      {prod.code}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {prod.brand}
                    </span>
                  </div>

                  {/* Name & Category */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {prod.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {prod.category}
                    </p>
                  </div>

                  {/* Price info */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Đơn giá sau CK:</span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {formatCurrencyVND(discounted)}
                      </span>
                      {prod.discountPercent > 0 && (
                        <span className="text-[10px] text-emerald-600 ml-1">
                          (-{prod.discountPercent}%)
                        </span>
                      )}
                    </div>

                    {/* Stock badge */}
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Tồn kho:</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          isLowStock
                            ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}
                      >
                        {isLowStock && <AlertTriangle className="w-3 h-3" />}
                        <span>
                          {formatNumberVND(prod.stockQuantity)} {prod.unit}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setAdjustTargetProduct(prod);
                        setIsAdjustOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Điều chỉnh kho</span>
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === prod.id}
                      onClick={() => handleDelete(prod)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modals */}
      <StockAdjustModal
        product={adjustTargetProduct}
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
      />

      <AddMaterialModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
    </div>
  );
}
