'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Calculator,
  Layers,
  ShieldAlert,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { useSaleStore } from '@/store/useSaleStore';
import { Product } from '@/types/manager';
import { formatCurrencyVND } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';

function getBrandDisplay(b: any): string {
  if (!b) return 'Chưa cập nhật';
  if (typeof b === 'object') return String(b.name || b.code || 'Chưa cập nhật');
  return String(b);
}

function getCategoryDisplay(c: any): string {
  if (!c) return 'Chưa cập nhật';
  if (typeof c === 'object') return String(c.name || c.code || 'Chưa cập nhật');
  return String(c);
}

export default function SaleProductsPage() {
  const { products, fetchProducts, isLoading } = useSaleStore();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Calculator modal state
  const [calcProduct, setCalcProduct] = useState<Product | null>(null);
  const [calcQuantity, setCalcQuantity] = useState<number>(100);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Extract unique brands and categories
  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const b = getBrandDisplay(p.brand);
      if (b && b !== 'Chưa cập nhật') set.add(b);
    });
    return Array.from(set);
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const c = getCategoryDisplay(p.category);
      if (c && c !== 'Chưa cập nhật') set.add(c);
    });
    return Array.from(set);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const b = getBrandDisplay(p.brand);
      const c = getCategoryDisplay(p.category);
      const matchBrand = selectedBrand === 'ALL' || b === selectedBrand;
      const matchCategory = selectedCategory === 'ALL' || c === selectedCategory;
      const matchSearch =
        !searchTerm.trim() ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku || p.code || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchBrand && matchCategory && matchSearch;
    });
  }, [products, selectedBrand, selectedCategory, searchTerm]);

  const openCalculator = (product: Product) => {
    setCalcProduct(product);
    setSelectedUnit(product.unit || 'Đơn vị');
    setCalcQuantity(100);
    setCustomDiscount(product.discountRate || 0);
  };

  // Calculator calculations
  const calcResult = useMemo(() => {
    if (!calcProduct) return null;
    let factor = 1;
    if (calcProduct.conversions && selectedUnit !== calcProduct.unit) {
      const conv = calcProduct.conversions.find((c) => c.unit === selectedUnit);
      if (conv && conv.factor) {
        factor = conv.factor;
      }
    }
    const unitPrice = calcProduct.basePrice * factor;
    const subtotal = unitPrice * calcQuantity;
    const discountAmt = (subtotal * customDiscount) / 100;
    const total = subtotal - discountAmt;

    return {
      factor,
      unitPrice,
      subtotal,
      discountAmt,
      total,
    };
  }, [calcProduct, calcQuantity, selectedUnit, customDiscount]);

  const handleCopyQuote = () => {
    if (!calcProduct || !calcResult) return;
    const text = `Báo giá sản phẩm:
- Mã SKU: ${calcProduct.sku || calcProduct.code || ''}
- Sản phẩm: ${calcProduct.name} (${getBrandDisplay(calcProduct.brand)})
- Số lượng: ${calcQuantity} ${selectedUnit}
- Đơn giá niêm yết: ${formatCurrencyVND(calcResult.unitPrice)}/${selectedUnit}
- Chiết khấu: ${customDiscount}% (-${formatCurrencyVND(calcResult.discountAmt)})
- Thành tiền: ${formatCurrencyVND(calcResult.total)} (Chưa VAT)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Đã sao chép báo giá nhanh vào clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Read-only Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Tra cứu danh mục sản phẩm & Bảng giá chuẩn
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Chế độ chỉ đọc dành cho nhân viên kinh doanh. Sử dụng công cụ tính giá nhanh để tư vấn khách hàng.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>Quyền hạn: Xem giá & Chiết khấu</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, mã SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả thương hiệu</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <span>
            Tìm thấy <strong className="text-slate-800 dark:text-slate-200">{filteredProducts.length}</strong> sản phẩm
          </span>
          {(searchTerm || selectedBrand !== 'ALL' || selectedCategory !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedBrand('ALL');
                setSelectedCategory('ALL');
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Sản phẩm / SKU</th>
                <th className="py-3 px-4">Thương hiệu & Phân loại</th>
                <th className="py-3 px-4">Thông số kỹ thuật</th>
                <th className="py-3 px-4">Đơn vị & Quy cách</th>
                <th className="py-3 px-4 text-right">Giá niêm yết</th>
                <th className="py-3 px-4 text-center">CK Hãng</th>
                <th className="py-3 px-4 text-right">Giá sau CK</th>
                <th className="py-3 px-4 text-center">Tồn kho</th>
                <th className="py-3 px-4 text-center">Công cụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Đang tải danh mục sản phẩm...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Không tìm thấy sản phẩm nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const netPrice = p.basePrice * (1 - (p.discountRate || 0) / 100);
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Product Name & SKU */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                          {p.name}
                        </div>
                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          {p.sku || p.code}
                        </div>
                      </td>

                      {/* Brand & Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                          {getBrandDisplay(p.brand)}
                        </span>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {getCategoryDisplay(p.category)}
                        </div>
                      </td>

                      {/* Tech specs */}
                      <td className="py-3 px-4">
                        <div className="text-xs space-y-0.5 text-slate-600 dark:text-slate-300">
                          {p.diameterMm && (
                            <div>
                              Đường kính: <span className="font-medium">Ø{p.diameterMm} mm</span>
                            </div>
                          )}
                          {p.pressureClass && (
                            <div>
                              Áp lực: <span className="font-medium">{p.pressureClass}</span>
                            </div>
                          )}
                          {p.crossSectionMm2 && (
                            <div>
                              Tiết diện: <span className="font-medium">{p.crossSectionMm2} mm²</span>
                            </div>
                          )}
                          {p.ampRating && (
                            <div>
                              Dòng định mức: <span className="font-medium">{p.ampRating} A</span>
                            </div>
                          )}
                          {!p.diameterMm && !p.pressureClass && !p.crossSectionMm2 && !p.ampRating && (
                            <span className="text-slate-400 italic">Theo quy cách chuẩn</span>
                          )}
                        </div>
                      </td>

                      {/* Unit & Conversions */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-200">
                          Đơn vị chuẩn: <span className="text-blue-600 dark:text-blue-400 font-bold">{p.unit}</span>
                        </div>
                        {p.conversions && p.conversions.length > 0 && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Quy đổi:{' '}
                            {p.conversions
                              .map((c) => `1 ${c.unit} = ${c.factor} ${p.unit}`)
                              .join(', ')}
                          </div>
                        )}
                      </td>

                      {/* Base Price */}
                      <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                        {formatCurrencyVND(p.basePrice)}
                      </td>

                      {/* Brand Discount */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {p.discountRate || 0}%
                        </span>
                      </td>

                      {/* Net Price */}
                      <td className="py-3 px-4 text-right font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrencyVND(netPrice)}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            (p.stock ?? 0) > 20
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {p.stock ?? 0} {p.unit}
                        </span>
                      </td>

                      {/* Fast Calc tool */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => openCalculator(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/70 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
                          title="Tính nhanh giá & chiết khấu"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          <span>Tính giá</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fast Price Calculator Modal */}
      {calcProduct && calcResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Bảng tính giá nhanh B2B
                </h3>
              </div>
              <button
                onClick={() => setCalcProduct(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product info banner */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {calcProduct.sku || calcProduct.code} • {getBrandDisplay(calcProduct.brand)}
              </div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {calcProduct.name}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Giá gốc: {formatCurrencyVND(calcProduct.basePrice)} / {calcProduct.unit}
              </div>
            </div>

            {/* Input Form */}
            <div className="grid grid-cols-2 gap-4">
              {/* Unit selection */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Đơn vị tính
                </label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={calcProduct.unit}>{calcProduct.unit} (Chuẩn)</option>
                  {calcProduct.conversions?.map((c) => (
                    <option key={c.unit} value={c.unit}>
                      {c.unit} (x{c.factor} {calcProduct.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Số lượng
                </label>
                <input
                  type="number"
                  min="1"
                  value={calcQuantity}
                  onChange={(e) => setCalcQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Discount Percentage */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Mức chiết khấu (%)
                  </label>
                  <span className="text-xs text-slate-500">
                    Mặc định hãng: {calcProduct.discountRate || 0}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.5"
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(Number(e.target.value))}
                    className="flex-1 accent-blue-600"
                  />
                  <div className="w-16">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={customDiscount}
                      onChange={(e) => setCustomDiscount(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-center text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-500">%</span>
                </div>
              </div>
            </div>

            {/* Calculation Breakdown Result */}
            <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50 space-y-2">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Đơn giá quy đổi:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatCurrencyVND(calcResult.unitPrice)} / {selectedUnit}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Tổng tiền niêm yết ({calcQuantity} {selectedUnit}):</span>
                <span>{formatCurrencyVND(calcResult.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Chiết khấu ({customDiscount}%):</span>
                <span>- {formatCurrencyVND(calcResult.discountAmt)}</span>
              </div>
              <div className="pt-2 border-t border-blue-200 dark:border-blue-900 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Thực thu (Chưa VAT):
                </span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                  {formatCurrencyVND(calcResult.total)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCalcProduct(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleCopyQuote}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép báo giá'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
