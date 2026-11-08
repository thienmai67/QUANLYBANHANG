'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle,
  User,
  ShoppingBag,
  Truck,
  CreditCard,
  ChevronDown,
} from 'lucide-react';
import { useSaleStore } from '@/store/useSaleStore';
import { formatCurrencyVND } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';

interface OrderItemRow {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  conversionFactor: number;
  availableUnits: Array<{ unit: string; factor: number }>;
  basePrice: number;
  unitPrice: number;
  discountRate: number;
  quantity: number;
}

export function OrderCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';

  const { customers, products, fetchCustomers, fetchProducts, createOrder } = useSaleStore();
  const toast = useToast();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [is2h, setIs2h] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, [fetchCustomers, fetchProducts]);

  // When customer is selected, fill info
  useEffect(() => {
    if (selectedCustomerId && customers.length > 0) {
      const cust = customers.find((c) => c.id === selectedCustomerId);
      if (cust) {
        setCustomerName(cust.fullName);
        setCustomerPhone(cust.phone || '');
        setDeliveryAddress(cust.profile?.siteAddress || '');
      }
    }
  }, [selectedCustomerId, customers]);

  // Add new item row
  const handleAddItem = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    const availableUnits = [
      { unit: defaultProduct.unit, factor: 1 },
      ...(defaultProduct.conversions || []).map((c: { unit: string; factor: number }) => ({ unit: c.unit, factor: c.factor })),
    ];

    setItems((prev) => [
      ...prev,
      {
        productId: defaultProduct.id,
        productName: defaultProduct.name,
        sku: defaultProduct.sku || defaultProduct.code || '',
        unit: defaultProduct.unit,
        conversionFactor: 1,
        availableUnits,
        basePrice: defaultProduct.basePrice,
        unitPrice: defaultProduct.basePrice,
        discountRate: defaultProduct.discountRate || 0,
        quantity: 1,
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

    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku || prod.code || '',
          unit: prod.unit,
          conversionFactor: 1,
          availableUnits,
          basePrice: prod.basePrice,
          unitPrice: prod.basePrice,
          discountRate: prod.discountRate || 0,
          quantity: 1,
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
          conversionFactor: factor,
          unitPrice: newUnitPrice,
        };
      })
    );
  };

  const handleItemFieldChange = (
    index: number,
    field: 'quantity' | 'unitPrice' | 'discountRate',
    value: number
  ) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculations
  const { subtotal, discountTotal, totalAmount } = useMemo(() => {
    let sub = 0;
    let disc = 0;
    items.forEach((item) => {
      const lineSub = item.unitPrice * item.quantity;
      const lineDisc = (lineSub * item.discountRate) / 100;
      sub += lineSub;
      disc += lineDisc;
    });
    return {
      subtotal: sub,
      discountTotal: disc,
      totalAmount: Math.max(0, sub - disc),
    };
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('Vui lòng chọn khách hàng phụ trách');
      return;
    }
    if (items.length === 0) {
      toast.error('Vui lòng thêm ít nhất một sản phẩm vào đơn');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        customerId: selectedCustomerId,
        customerName: customerName.trim() || 'Khách hàng',
        paymentMethod,
        is2h,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: Math.round(i.unitPrice * (1 - i.discountRate / 100)),
          unit: i.unit,
        })),
      };

      const newOrder = await createOrder(payload);
      toast.success(`Tạo đơn hàng hỗ trợ ${newOrder.orderNumber} thành công!`);
      router.push('/sale/orders');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo đơn hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Back button and page title */}
      <div className="flex items-center gap-3">
        <Link
          href="/sale/orders"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Tạo đơn hàng hỗ trợ (Assisted Order)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Nhân viên kinh doanh lên đơn trực tiếp thay cho khách hàng phụ trách. Đơn hàng sẽ gắn liền với mã khách hàng và tài khoản Sale.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Customer Selection */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              1. Khách hàng nhận đơn
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Chọn khách hàng phụ trách <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors shadow-xs"
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.profile?.companyName || c.phone || c.email})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tên người nhận hàng
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Họ tên người nhận"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Số điện thoại liên hệ
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0912..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Địa chỉ công trình / Điểm giao hàng
            </label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="VD: Số 123 đường Song Hành, TP. Thủ Đức"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors shadow-xs"
            />
          </div>
        </div>

        {/* Step 2: Order Items Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                2. Danh mục vật tư xuất bán ({items.length} món)
              </h2>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-98 rounded-xl shadow-md shadow-blue-600/20 transition-all shrink-0 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Thêm sản phẩm</span>
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 text-xs sm:text-sm text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Chưa có sản phẩm nào trong đơn hàng. Nhấn nút &quot;Thêm sản phẩm&quot; để bắt đầu.
            </div>
          ) : (
            <>
              {/* Mobile Item Cards View (< md) */}
              <div className="space-y-3 md:hidden">
                {items.map((item, index) => {
                  const lineSub = item.unitPrice * item.quantity;
                  const lineTotal = lineSub * (1 - item.discountRate / 100);
                  return (
                    <div
                      key={index}
                      className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700/80 space-y-3 shadow-xs"
                    >
                      {/* Card Header: Index + Delete */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          Sản phẩm #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>

                      {/* Product select */}
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                          Vật tư
                        </label>
                        <div className="relative">
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductChange(index, e.target.value)}
                            className="w-full appearance-none pl-3 pr-9 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                [{typeof p.brand === 'object' && p.brand !== null ? (p.brand as any).name : p.brand}] {p.name} ({p.sku || p.code || ''})
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Unit & Quantity */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                            Đơn vị
                          </label>
                          <div className="relative">
                            <select
                              value={item.unit}
                              onChange={(e) => handleUnitChange(index, e.target.value)}
                              className="w-full appearance-none pl-3 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            >
                              {item.availableUnits.map((u) => (
                                <option key={u.unit} value={u.unit}>
                                  {u.unit} {u.factor !== 1 ? `(x${u.factor})` : ''}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                            Số lượng
                          </label>
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
                            className="w-full px-2 py-1.5 text-xs text-center font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          />
                        </div>
                      </div>

                      {/* Price & Discount */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                            Đơn giá (VNĐ)
                          </label>
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
                            className="w-full px-2 py-1.5 text-xs text-right font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                            Chiết khấu (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="0.5"
                            value={item.discountRate}
                            onChange={(e) =>
                              handleItemFieldChange(
                                index,
                                'discountRate',
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-full px-2 py-1.5 text-xs text-center font-bold text-blue-600 dark:text-blue-400 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          />
                        </div>
                      </div>

                      {/* Line Total & Delete */}
                      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Thành tiền:
                        </span>
                        <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                          {formatCurrencyVND(lineTotal)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Items Table (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 px-3">Sản phẩm</th>
                      <th className="py-2.5 px-3 w-32">Đơn vị</th>
                      <th className="py-2.5 px-3 w-28 text-center">Số lượng</th>
                      <th className="py-2.5 px-3 w-36 text-right">Đơn giá niêm yết</th>
                      <th className="py-2.5 px-3 w-24 text-center">CK (%)</th>
                      <th className="py-2.5 px-3 w-36 text-right">Thành tiền</th>
                      <th className="py-2.5 px-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((item, index) => {
                      const lineSub = item.unitPrice * item.quantity;
                      const lineTotal = lineSub * (1 - item.discountRate / 100);
                      return (
                        <tr key={index} className="hover:bg-slate-50/50">
                          {/* Product selection */}
                          <td className="py-2 px-3">
                            <div className="relative">
                              <select
                                value={item.productId}
                                onChange={(e) => handleProductChange(index, e.target.value)}
                                className="w-full appearance-none pl-2.5 pr-8 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    [{typeof p.brand === 'object' && p.brand !== null ? (p.brand as any).name : p.brand}] {p.name} ({p.sku || p.code || ''})
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </td>

                          {/* Unit selection with conversions */}
                          <td className="py-2 px-3">
                            <div className="relative">
                              <select
                                value={item.unit}
                                onChange={(e) => handleUnitChange(index, e.target.value)}
                                className="w-full appearance-none pl-2.5 pr-7 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {item.availableUnits.map((u) => (
                                  <option key={u.unit} value={u.unit}>
                                    {u.unit} {u.factor !== 1 ? `(x${u.factor})` : ''}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown className="w-3 h-3" />
                              </div>
                            </div>
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
                              className="w-full px-2 py-1.5 text-xs text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                              className="w-full px-2 py-1.5 text-xs text-right font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          {/* Discount */}
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              max="50"
                              step="0.5"
                              value={item.discountRate}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  index,
                                  'discountRate',
                                  Number(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1.5 text-xs text-center font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
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
                              className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors"
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
            </>
          )}
        </div>

        {/* Step 3: Payment & Delivery Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                3. Hình thức thanh toán & Giao nhận
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Phương thức thanh toán
              </label>
              <div className="relative">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors shadow-xs"
                >
                  <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                  <option value="CASH">Tiền mặt tại kho / giao hàng</option>
                  <option value="COD">Thu hộ (COD)</option>
                  <option value="DEBT">Ghi nợ hợp đồng (Công nợ B2B)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center gap-3">
              <input
                type="checkbox"
                id="is2h"
                checked={is2h}
                onChange={(e) => setIs2h(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="is2h" className="text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                <strong>Giao hỏa tốc 2 giờ (Express 2H)</strong> — Ưu tiên điều xe & bốc xếp ngay trong 120 phút.
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ghi chú đơn hàng / Chỉ dẫn giao hàng
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Giao buổi sáng, xe tải 2.5T vào được..."
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors shadow-xs"
              />
            </div>
          </div>

          {/* Order Summary & Confirmation Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm pb-3 border-b border-slate-100 dark:border-slate-800">
              Tổng kết giá trị đơn hàng
            </h2>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tiền hàng niêm yết:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatCurrencyVND(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Chiết khấu thương mại:</span>
                <span className="font-medium">- {formatCurrencyVND(discountTotal)}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  Tổng thanh toán:
                </span>
                <span className="font-black text-xl sm:text-2xl text-blue-600 dark:text-blue-400 font-mono">
                  {formatCurrencyVND(totalAmount)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <Link
                href="/sale/orders"
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-center order-2 sm:order-1"
              >
                Hủy bỏ
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl shadow-md shadow-blue-600/20 active:scale-98 transition-all order-1 sm:order-2 flex-1 sm:flex-none"
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{isSubmitting ? 'Đang tạo đơn...' : 'Xác nhận tạo đơn'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
export default OrderCreateForm;
