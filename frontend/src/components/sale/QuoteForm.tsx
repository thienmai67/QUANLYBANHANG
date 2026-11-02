'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  CheckCircle,
  User,
  ShieldAlert,
} from 'lucide-react';
import { useSaleStore } from '@/store/useSaleStore';
import { formatCurrencyVND } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import { SALE_MAX_ADDITIONAL_DISCOUNT } from '@/types/sale';

interface QuoteItemRow {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  availableUnits: Array<{ unit: string; factor: number }>;
  basePrice: number;
  unitPrice: number;
  brandDiscountRate: number;
  additionalDiscountRate: number;
  discountRate: number;
  quantity: number;
}

export function QuoteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';
  const cloneFromId = searchParams.get('cloneFrom') || '';

  const { customers, products, quotes, fetchCustomers, fetchProducts, fetchQuotes, createQuote } =
    useSaleStore();
  const toast = useToast();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId);
  // Default validUntil to 7 days from today
  const defaultValidDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }, []);

  const [validUntil, setValidUntil] = useState<string>(defaultValidDate);
  const [notes, setNotes] = useState<string>(
    'Giá đã bao gồm chiết khấu công trình, chưa bao gồm VAT. Giao hàng tận chân công trình.'
  );
  const [items, setItems] = useState<QuoteItemRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    if (cloneFromId) {
      fetchQuotes();
    }
  }, [cloneFromId]); // Stable actions do not need to thrash effect

  // If cloning from existing quote
  useEffect(() => {
    if (cloneFromId && quotes.length > 0 && products.length > 0) {
      const source = quotes.find((q) => q.id === cloneFromId);
      if (source) {
        setSelectedCustomerId(source.customerId);
        setNotes(source.notes || '');
        if (source.items && source.items.length > 0) {
          const loadedRows: QuoteItemRow[] = source.items.map((it) => {
            const p = products.find((prod) => prod.id === it.productId);
            const availableUnits = p
              ? [
                  { unit: p.unit, factor: 1 },
                  ...(p.conversions || []).map((c: { unit: string; factor: number }) => ({ unit: c.unit, factor: c.factor })),
                ]
              : [{ unit: it.unit, factor: 1 }];

            const brandDiscount = it.brandDiscountRate ?? (typeof p?.brand === 'object' && p?.brand !== null ? (p.brand as any).discountRate : p?.discountRate) ?? 0;
            const additionalDiscount = it.additionalDiscountRate ?? (it.discountRate > brandDiscount ? it.discountRate - brandDiscount : 0);

            return {
              productId: it.productId,
              productName: it.productName || p?.name || 'Sản phẩm',
              sku: it.productSku || p?.sku || p?.code || '',
              unit: it.unit,
              availableUnits,
              basePrice: p?.basePrice || it.unitPrice,
              unitPrice: it.unitPrice,
              brandDiscountRate: brandDiscount,
              additionalDiscountRate: additionalDiscount,
              discountRate: brandDiscount + additionalDiscount,
              quantity: it.quantity,
            };
          });
          setItems(loadedRows);
        }
      }
    }
  }, [cloneFromId, quotes, products]);

  // Add Item
  const handleAddItem = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    const availableUnits = [
      { unit: defaultProduct.unit, factor: 1 },
      ...(defaultProduct.conversions || []).map((c: { unit: string; factor: number }) => ({ unit: c.unit, factor: c.factor })),
    ];

    const brandDiscount = (typeof defaultProduct.brand === 'object' && defaultProduct.brand !== null
      ? (defaultProduct.brand as any).discountRate
      : defaultProduct.discountRate) || 0;

    setItems((prev) => [
      ...prev,
      {
        productId: defaultProduct.id,
        productName: defaultProduct.name,
        sku: defaultProduct.sku || defaultProduct.code || '',
        unit: defaultProduct.unit,
        availableUnits,
        basePrice: defaultProduct.basePrice,
        unitPrice: defaultProduct.basePrice,
        brandDiscountRate: brandDiscount,
        additionalDiscountRate: 0,
        discountRate: brandDiscount,
        quantity: 10,
      },
    ]);
  };

  const handleProductChange = (index: number, newProductId: string) => {
    const prod = products.find((p) => p.id === newProductId);
    if (!prod) return;

    const availableUnits = [
      { unit: prod.unit, factor: 1 },
      ...(prod.conversions || []).map((c: { unit: string; factor: number }) => ({ unit: c.unit, factor: c.factor })),
    ];

    const brandDiscount = (typeof prod.brand === 'object' && prod.brand !== null
      ? (prod.brand as any).discountRate
      : prod.discountRate) || 0;

    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku || prod.code || '',
          unit: prod.unit,
          availableUnits,
          basePrice: prod.basePrice,
          unitPrice: prod.basePrice,
          brandDiscountRate: brandDiscount,
          additionalDiscountRate: item.additionalDiscountRate,
          discountRate: brandDiscount + item.additionalDiscountRate,
        };
      })
    );
  };

  const handleUnitChange = (index: number, newUnit: string) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const conv = item.availableUnits.find((u) => u.unit === newUnit);
        const factor = conv ? conv.factor : 1;
        const newUnitPrice = item.basePrice * factor;
        return {
          ...item,
          unit: newUnit,
          unitPrice: newUnitPrice,
        };
      })
    );
  };

  const handleItemFieldChange = (
    index: number,
    field: 'quantity' | 'unitPrice' | 'additionalDiscountRate',
    value: number
  ) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = {
          ...item,
          [field]: value,
        };
        if (field === 'additionalDiscountRate') {
          updated.discountRate = updated.brandDiscountRate + value;
        }
        return updated;
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculations
  const { subtotal, discountTotal, totalAmount, hasHighDiscount } = useMemo(() => {
    let sub = 0;
    let disc = 0;
    let highDisc = false;
    items.forEach((item) => {
      const lineSub = item.unitPrice * item.quantity;
      const effectiveRate = Math.min(100, item.brandDiscountRate + item.additionalDiscountRate);
      const lineDisc = (lineSub * effectiveRate) / 100;
      sub += lineSub;
      disc += lineDisc;
      if (item.additionalDiscountRate > SALE_MAX_ADDITIONAL_DISCOUNT) {
        highDisc = true;
      }
    });
    return {
      subtotal: sub,
      discountTotal: disc,
      totalAmount: Math.max(0, sub - disc),
      hasHighDiscount: highDisc,
    };
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('Vui lòng chọn khách hàng lập báo giá');
      return;
    }
    if (items.length === 0) {
      toast.error('Vui lòng thêm ít nhất một sản phẩm vào bảng báo giá');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        customerId: selectedCustomerId,
        validUntil: new Date(validUntil).toISOString(),
        notes,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.unitPrice,
          brandDiscountRate: i.brandDiscountRate,
          additionalDiscountRate: i.additionalDiscountRate,
          discountRate: Math.min(100, i.brandDiscountRate + i.additionalDiscountRate),
        })),
      };

      const newQuote = await createQuote(payload);
      if (newQuote.status === 'PENDING_APPROVAL') {
        toast.warning(
          `Báo giá ${newQuote.quoteNumber} có mức CK thêm > 10% và đã chuyển sang trạng thái CHỜ QUẢN LÝ DUYỆT!`
        );
      } else {
        toast.success(`Đã tạo bản nháp báo giá ${newQuote.quoteNumber} thành công!`);
      }
      router.push(`/sale/quotes/${newQuote.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo báo giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/sale/quotes"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {cloneFromId ? 'Tạo bản sửa đổi Báo giá (Clone & Revise)' : 'Lập Báo giá B2B mới'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chiết khấu bổ sung Sale tối đa 10%. Mức chiết khấu cao hơn sẽ tự động gửi Quản lý phê duyệt.
          </p>
        </div>
      </div>

      {hasHighDiscount && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300">
            <strong className="block text-sm font-semibold">Cảnh báo hạn mức chiết khấu Sale:</strong>
            Có sản phẩm được áp mức chiết khấu bổ sung &gt; {SALE_MAX_ADDITIONAL_DISCOUNT}%. Khi tạo, báo giá sẽ ở trạng thái{' '}
            <span className="font-bold underline">CHỜ DUYỆT (PENDING_APPROVAL)</span> và cần Quản lý duyệt trước khi có thể gửi cho khách hàng.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Quote Header Info */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" /> Thông tin khách hàng & Thời hạn báo giá
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Khách hàng B2B phụ trách <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn khách hàng --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} - {c.phone} {c.companyName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Hiệu lực báo giá đến ngày <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={validUntil}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setValidUntil(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Ghi chú điều khoản thương mại
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Điều khoản giao hàng, địa điểm giao nhận, phương thức thanh toán..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Product Items Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Danh mục vật tư báo giá ({items.length})
              </h2>
              <p className="text-xs text-slate-500">
                Giá niêm yết tự động lấy từ danh mục vật tư. Chiết khấu hãng được áp dụng mặc định.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Thêm sản phẩm
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Chưa có sản phẩm nào. Nhấn &quot;Thêm sản phẩm&quot; để lập báo giá.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-3">Sản phẩm</th>
                    <th className="py-2.5 px-3 w-28">Đơn vị</th>
                    <th className="py-2.5 px-3 w-24 text-center">Số lượng</th>
                    <th className="py-2.5 px-3 w-32 text-right">Đơn giá niêm yết</th>
                    <th className="py-2.5 px-3 w-24 text-center">CK Hãng</th>
                    <th className="py-2.5 px-3 w-28 text-center">CK Sale (%)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Tổng CK</th>
                    <th className="py-2.5 px-3 w-36 text-right">Thành tiền</th>
                    <th className="py-2.5 px-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item, index) => {
                    const lineSub = item.unitPrice * item.quantity;
                    const totalRate = Math.min(100, item.brandDiscountRate + item.additionalDiscountRate);
                    const lineTotal = lineSub * (1 - totalRate / 100);
                    const isOverLimit = item.additionalDiscountRate > SALE_MAX_ADDITIONAL_DISCOUNT;

                    return (
                      <tr key={index} className="hover:bg-slate-50/50">
                        {/* Product selection */}
                        <td className="py-2 px-3">
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductChange(index, e.target.value)}
                            className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {products.map((p) => {
                              const brandName = typeof p.brand === 'object' && p.brand !== null ? (p.brand as any).name : p.brand;
                              return (
                                <option key={p.id} value={p.id}>
                                  [{brandName || 'TDT'}] {p.name} ({p.sku || p.code || ''})
                                </option>
                              );
                            })}
                          </select>
                        </td>

                        {/* Unit selection */}
                        <td className="py-2 px-3">
                          <select
                            value={item.unit}
                            onChange={(e) => handleUnitChange(index, e.target.value)}
                            className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {item.availableUnits.map((u) => (
                              <option key={u.unit} value={u.unit}>
                                {u.unit} {u.factor !== 1 ? `(x${u.factor})` : ''}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Quantity */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemFieldChange(
                                index,
                                'quantity',
                                Math.max(1, Number(e.target.value) || 1)
                              )
                            }
                            className="w-full px-2 py-1.5 text-xs text-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Unit price */}
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="1000"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemFieldChange(
                                index,
                                'unitPrice',
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-full px-2 py-1.5 text-xs text-right font-medium rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Brand discount (read only) */}
                        <td className="py-2 px-3 text-center">
                          <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {item.brandDiscountRate}%
                          </span>
                        </td>

                        {/* Additional discount entered by sale */}
                        <td className="py-2 px-3">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="50"
                              step="0.5"
                              value={item.additionalDiscountRate}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  index,
                                  'additionalDiscountRate',
                                  Number(e.target.value) || 0
                                )
                              }
                              className={`w-full px-2 py-1.5 text-xs text-center font-bold rounded border ${
                                isOverLimit
                                  ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            />
                            {isOverLimit && (
                              <span
                                className="absolute -top-2 -right-1 text-[9px] bg-amber-500 text-white px-1 rounded-full font-bold"
                                title="Vượt hạn mức 10%"
                              >
                                !
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Effective Total Discount */}
                        <td className="py-2 px-3 text-center">
                          <span className={`text-xs font-bold ${isOverLimit ? 'text-amber-600' : 'text-blue-600'}`}>
                            {totalRate}%
                          </span>
                        </td>

                        {/* Line total */}
                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrencyVND(lineTotal)}
                        </td>

                        {/* Delete button */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Total Summary & Action Buttons */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-sm w-full sm:w-auto">
            <div className="flex justify-between sm:justify-start gap-4 text-slate-500">
              <span>Tổng tiền niêm yết:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatCurrencyVND(subtotal)}
              </span>
            </div>
            <div className="flex justify-between sm:justify-start gap-4 text-emerald-600 dark:text-emerald-400">
              <span>Tổng chiết khấu thương mại:</span>
              <span className="font-semibold">-{formatCurrencyVND(discountTotal)}</span>
            </div>
            <div className="flex justify-between sm:justify-start gap-4 text-base font-bold text-slate-900 dark:text-slate-100 pt-1">
              <span>Tổng thanh toán B2B:</span>
              <span className="text-xl text-blue-600 dark:text-blue-400 font-black">
                {formatCurrencyVND(totalAmount)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              href="/sale/quotes"
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-md transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang lưu...' : 'Lưu bản nháp Báo giá'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
export default QuoteForm;
