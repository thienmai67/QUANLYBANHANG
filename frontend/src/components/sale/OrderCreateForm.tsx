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
  Store,
  Printer,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useSaleStore } from '@/store/useSaleStore';
import { formatCurrencyVND } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import { ThermalReceiptModal, ThermalOrderData } from '@/components/ThermalReceiptModal';
import { isValidVietnamesePhone, sanitizePhone } from '@/lib/validation';
import { getFriendlyErrorMessage } from '@/lib/api';
import SearchableSelect from '@/components/sale/SearchableSelect';

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
  quantity: number | string;
}

export function OrderCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';

  const { customers, products, fetchCustomers, fetchProducts, createOrder, markPaid } = useSaleStore();
  const toast = useToast();

  // Mode: Bán tại quầy (Khách vãng lai POS) vs Khách hàng có hồ sơ quản lý
  const [orderMode, setOrderMode] = useState<'WALK_IN' | 'ASSIGNED'>(
    initialCustomerId ? 'ASSIGNED' : 'WALK_IN'
  );

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId);
  const [customerName, setCustomerName] = useState<string>('Khách lẻ tại quầy');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('Mua trực tiếp tại quầy');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Thermal Receipt Modal State
  const [createdOrderForReceipt, setCreatedOrderForReceipt] = useState<ThermalOrderData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, [fetchCustomers, fetchProducts]);

  // When switching modes
  const handleModeChange = (mode: 'WALK_IN' | 'ASSIGNED') => {
    setOrderMode(mode);
    if (mode === 'WALK_IN') {
      setSelectedCustomerId('');
      setCustomerName('Khách lẻ tại quầy');
      setCustomerPhone('');
      setDeliveryAddress('Mua trực tiếp tại quầy');
      setPaymentMethod('CASH');
    } else {
      setCustomerName('');
      setDeliveryAddress('');
      setPaymentMethod('BANK_TRANSFER');
      if (customers.length > 0) {
        const first = customers[0];
        setSelectedCustomerId(first.id);
        setCustomerName(first.fullName);
        setCustomerPhone(first.phone || '');
        setDeliveryAddress(first.profile?.siteAddress || '');
      }
    }
  };

  // When customer is selected in ASSIGNED mode, fill info
  useEffect(() => {
    if (orderMode === 'ASSIGNED' && selectedCustomerId && customers.length > 0) {
      const cust = customers.find((c) => c.id === selectedCustomerId);
      if (cust) {
        setCustomerName(cust.fullName);
        setCustomerPhone(cust.phone || '');
        setDeliveryAddress(cust.profile?.siteAddress || '');
      }
    }
  }, [selectedCustomerId, customers, orderMode]);

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

  const handleQuantityChange = (index: number, val: string) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, quantity: val } : item))
    );
  };

  const handleQuantityBlur = (index: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const parsed = parseFloat(String(item.quantity));
        const safeQty = Number.isFinite(parsed)
          ? Math.max(1, Math.min(10000, parsed))
          : 1;
        return { ...item, quantity: safeQty };
      })
    );
  };

  const handleDiscountChange = (index: number, disc: number) => {
    const safeDisc = Math.min(100, Math.max(0, disc || 0));
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, discountRate: safeDisc } : item))
    );
  };

  const handleDiscountBlur = (index: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const rate =
          typeof item.discountRate === 'number'
            ? item.discountRate
            : parseFloat(String(item.discountRate)) || 0;
        return { ...item, discountRate: Math.max(0, Math.min(100, rate)) };
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
      const qtyNum =
        typeof item.quantity === 'number'
          ? item.quantity
          : parseFloat(String(item.quantity)) || 0;
      const lineSub = item.unitPrice * qtyNum;
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

  // Cash tendered & change calculation
  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'CASH') return 0;
    const tendered =
      cashTendered === '' ? totalAmount : parseFloat(cashTendered) || 0;
    return Math.max(0, tendered - totalAmount);
  }, [cashTendered, totalAmount, paymentMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (orderMode === 'ASSIGNED' && !selectedCustomerId) {
      toast.error('Vui lòng chọn khách hàng phụ trách');
      return;
    }
    if (items.length === 0) {
      toast.error('Vui lòng thêm ít nhất một sản phẩm vào đơn');
      return;
    }

    const trimmedPhone = customerPhone.trim();
    if (trimmedPhone) {
      if (!isValidVietnamesePhone(trimmedPhone)) {
        toast.error(
          'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số (bắt đầu bằng 03, 05, 07, 08, 09).'
        );
        return;
      }
    }

    if (paymentMethod === 'CASH') {
      const effectiveCashTendered =
        cashTendered === '' ? totalAmount : parseFloat(cashTendered);
      if (Number.isNaN(effectiveCashTendered) || effectiveCashTendered < totalAmount) {
        toast.error(
          `Số tiền khách đưa (${formatCurrencyVND(effectiveCashTendered || 0)}) chưa đủ thanh toán đơn hàng (${formatCurrencyVND(totalAmount)})`
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const sanitizedPhone = trimmedPhone ? sanitizePhone(trimmedPhone) : undefined;
      const payload = {
        customerId: orderMode === 'ASSIGNED' ? selectedCustomerId : undefined,
        customerName:
          customerName.trim() ||
          (orderMode === 'WALK_IN' ? 'Khách lẻ tại quầy' : 'Khách hàng'),
        customerPhone: sanitizedPhone,
        paymentMethod,
        items: items.map((i) => {
          const qty = Math.max(1, Math.min(10000, parseFloat(String(i.quantity)) || 1));
          return {
            productId: i.productId,
            quantity: qty,
            unitPrice: Math.round(i.unitPrice * (1 - i.discountRate / 100)),
            unit: i.unit,
          };
        }),
      };

      const newOrder = await createOrder(payload);

      // Upon creating a CASH order successfully, call markPaid(newOrder.id) to sync order status to PAID
      if (paymentMethod === 'CASH') {
        try {
          await markPaid(newOrder.id);
        } catch (markErr) {
          console.error('Không thể cập nhật trạng thái đã thanh toán:', markErr);
        }
      }

      toast.success(`Tạo đơn ${newOrder.orderNumber} thành công!`);

      // Prepare receipt for instant printing
      setCreatedOrderForReceipt({
        orderNumber: newOrder.orderNumber,
        createdAt: new Date(),
        customerName: payload.customerName,
        customerPhone: sanitizedPhone,
        shippingAddress: deliveryAddress,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'CASH' ? 'PAID' : 'UNPAID',
        totalAmount: totalAmount,
        items: items.map((i) => {
          const qty = Math.max(1, Math.min(10000, parseFloat(String(i.quantity)) || 1));
          return {
            productName: i.productName,
            sku: i.sku,
            quantity: qty,
            unitPrice: Math.round(i.unitPrice * (1 - i.discountRate / 100)),
            unit: i.unit,
          };
        }),
      });

      setShowReceiptModal(true);
    } catch (err: any) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerOptions = useMemo(() => {
    return customers.map((c) => ({
      value: c.id,
      label: c.fullName,
      sublabel: `${c.profile?.companyName ? c.profile.companyName + ' • ' : ''}${c.phone || c.email}`,
      badge: c.profile?.tier,
    }));
  }, [customers]);

  const productOptions = useMemo(() => {
    return products.map((p) => {
      const brandName = typeof p.brand === 'object' && p.brand !== null ? (p.brand as any).name : p.brand;
      return {
        value: p.id,
        label: p.name,
        sublabel: `SKU: ${p.sku || p.code || 'N/A'} • ${formatCurrencyVND(p.basePrice)}/${p.unit}`,
        badge: brandName ? String(brandName) : undefined,
      };
    });
  }, [products]);

  const paymentMethodOptions = [
    { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', badge: 'Ngân hàng' },
    { value: 'CASH', label: 'Tiền mặt tại kho / giao hàng', badge: 'Tiền mặt' },
    { value: 'COD', label: 'Thu hộ (COD)', badge: 'COD' },
    { value: 'DEBT', label: 'Ghi nợ hợp đồng (Công nợ B2B)', badge: 'Công nợ' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Back button and page title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/sale/orders"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Tạo Đơn Hàng Bán Lẻ & Quầy POS</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">
                O2O Retail
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hỗ trợ bán trực tiếp cho khách vãng lai ghé tiệm hoặc tạo đơn theo dõi cho khách quen.
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => handleModeChange('WALK_IN')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              orderMode === 'WALK_IN'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Bán Tại Quầy (Khách Lẻ)</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('ASSIGNED')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              orderMode === 'ASSIGNED'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Khách Có Hồ Sơ</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Customer Selection */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500 dark:text-orange-400" />
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                1. Thông tin khách mua hàng {orderMode === 'WALK_IN' ? '(Bán lẻ tại quầy)' : '(Khách hồ sơ)'}
              </h2>
            </div>
            {orderMode === 'WALK_IN' && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Không cần tạo tài khoản khách
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {orderMode === 'ASSIGNED' && (
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Chọn khách hàng phụ trách <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={customerOptions}
                  value={selectedCustomerId}
                  onChange={setSelectedCustomerId}
                  placeholder="-- Chọn khách hàng --"
                  searchPlaceholder="Tìm theo tên, SĐT, công ty..."
                  title="Khách hàng phụ trách"
                  required
                />
              </div>
            )}

            <div className={orderMode === 'WALK_IN' ? 'md:col-span-1' : ''}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tên khách mua hàng
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={orderMode === 'WALK_IN' ? 'Khách lẻ tại quầy' : 'Họ tên người nhận'}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors shadow-xs"
              />
            </div>

            <div className={orderMode === 'WALK_IN' ? 'md:col-span-1' : ''}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Số điện thoại {orderMode === 'WALK_IN' && <span className="text-slate-400 font-normal">(Tra cứu / Bảo hành)</span>}
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0912..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors shadow-xs font-mono"
              />
            </div>

            <div className={orderMode === 'WALK_IN' ? 'md:col-span-1' : ''}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Địa điểm nhận hàng
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder={orderMode === 'WALK_IN' ? 'Mua trực tiếp tại quầy' : 'VD: Số 123 đường Song Hành, TP. Thủ Đức'}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Order Items Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-500 dark:text-orange-400 shrink-0" />
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                2. Danh mục vật tư xuất bán ({items.length} món)
              </h2>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 active:scale-98 rounded-xl shadow-md shadow-orange-600/20 transition-all shrink-0 w-full sm:w-auto cursor-pointer"
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
                  const qtyNum =
                    typeof item.quantity === 'number'
                      ? item.quantity
                      : parseFloat(String(item.quantity)) || 0;
                  const lineSub = item.unitPrice * qtyNum;
                  const lineTotal = lineSub * (1 - item.discountRate / 100);
                  return (
                    <div
                      key={index}
                      className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700/80 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          Sản phẩm #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                          Vật tư
                        </label>
                        <SearchableSelect
                          options={productOptions}
                          value={item.productId}
                          onChange={(val) => handleProductChange(index, val)}
                          placeholder="Chọn vật tư..."
                          searchPlaceholder="Tìm sản phẩm, SKU..."
                          title="Chọn vật tư"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                            Đơn vị
                          </label>
                          <SearchableSelect
                            options={item.availableUnits.map((u) => ({
                              value: u.unit,
                              label: u.unit,
                              sublabel: u.factor !== 1 ? `x${u.factor}` : 'Đơn vị chuẩn',
                            }))}
                            value={item.unit}
                            onChange={(val) => handleUnitChange(index, val)}
                            placeholder="ĐVT"
                            title="Đơn vị tính"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                            Số lượng
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="1"
                            max="10000"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            onBlur={() => handleQuantityBlur(index)}
                            className="w-full px-2 py-1.5 text-xs text-center font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                            Đơn giá (VNĐ)
                          </label>
                          <div className="w-full px-2.5 py-2 text-xs text-right font-mono font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {formatCurrencyVND(item.unitPrice)}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                            Chiết khấu (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountRate}
                            onChange={(e) => handleDiscountChange(index, parseFloat(e.target.value))}
                            onBlur={() => handleDiscountBlur(index)}
                            className="w-full px-2 py-1.5 text-xs text-center font-bold text-orange-600 dark:text-orange-400 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-mono"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Thành tiền:
                        </span>
                        <span className="text-sm font-extrabold text-orange-600 dark:text-orange-400 font-mono">
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
                      const qtyNum =
                        typeof item.quantity === 'number'
                          ? item.quantity
                          : parseFloat(String(item.quantity)) || 0;
                      const lineSub = item.unitPrice * qtyNum;
                      const lineTotal = lineSub * (1 - item.discountRate / 100);
                      return (
                        <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          {/* Product selection */}
                          <td className="py-2 px-3">
                            <SearchableSelect
                              options={productOptions}
                              value={item.productId}
                              onChange={(val) => handleProductChange(index, val)}
                              placeholder="Chọn vật tư..."
                              searchPlaceholder="Tìm sản phẩm, SKU..."
                              title="Chọn vật tư"
                              triggerClassName="!py-1.5 !text-xs !rounded-lg"
                            />
                          </td>

                          {/* Unit selection with conversions */}
                          <td className="py-2 px-3">
                            <SearchableSelect
                              options={item.availableUnits.map((u) => ({
                                value: u.unit,
                                label: u.unit,
                                sublabel: u.factor !== 1 ? `x${u.factor}` : undefined,
                              }))}
                              value={item.unit}
                              onChange={(val) => handleUnitChange(index, val)}
                              placeholder="ĐVT"
                              title="Đơn vị tính"
                              triggerClassName="!py-1.5 !text-xs !rounded-lg"
                            />
                          </td>

                          {/* Quantity */}
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              step="any"
                              min="1"
                              max="10000"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              onBlur={() => handleQuantityBlur(index)}
                              className="w-full px-2 py-1.5 text-xs text-center font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </td>

                          {/* Unit price */}
                          <td className="py-2 px-3 text-right font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                            {formatCurrencyVND(item.unitPrice)}
                          </td>

                          {/* Discount */}
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discountRate}
                              onChange={(e) => handleDiscountChange(index, parseFloat(e.target.value))}
                              onBlur={() => handleDiscountBlur(index)}
                              className="w-full px-2 py-1.5 text-xs text-center font-semibold font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </td>

                          {/* Line total */}
                          <td className="py-2 px-3 text-right font-bold font-mono text-orange-600 dark:text-orange-400">
                            {formatCurrencyVND(lineTotal)}
                          </td>

                          {/* Delete button */}
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
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

        {/* Step 3: Payment & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CreditCard className="w-5 h-5 text-orange-500" />
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                3. Hình thức thanh toán tại quầy
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Phương thức thanh toán <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={paymentMethodOptions}
                value={paymentMethod}
                onChange={setPaymentMethod}
                placeholder="Chọn phương thức thanh toán..."
                title="Phương thức thanh toán"
              />
            </div>

            {paymentMethod === 'CASH' && (
              <div className="p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-orange-900 dark:text-orange-200">
                      Tiền khách đưa (VND)
                    </label>
                    <button
                      type="button"
                      onClick={() => setCashTendered(String(totalAmount))}
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer"
                    >
                      Khách đưa đúng {formatCurrencyVND(totalAmount)}
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder="VD: 500000"
                    className="w-full px-3 py-2 text-base font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 rounded-lg border border-orange-300 dark:border-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                  {/* Quick cash denomination chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[100000, 200000, 500000, 1000000, 2000000, 5000000].map((den) => (
                      <button
                        key={den}
                        type="button"
                        onClick={() => setCashTendered(String(den))}
                        className="px-2 py-0.5 text-[11px] font-medium rounded bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-700 hover:bg-orange-100 text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        {formatCurrencyVND(den)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-orange-200 dark:border-orange-800/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-900 dark:text-orange-200">
                    Tiền thối lại khách:
                  </span>
                  <span
                    className={`font-mono text-base font-black ${
                      changeAmount < 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {changeAmount < 0 ? `Thiếu ${formatCurrencyVND(Math.abs(changeAmount))}` : formatCurrencyVND(changeAmount)}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ghi chú đơn hàng / Dặn dò giao hàng
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú cắt ống, quấn băng keo, dặn dò thợ..."
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors shadow-xs resize-none"
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
                <span>Chiết khấu bán hàng:</span>
                <span className="font-medium">- {formatCurrencyVND(discountTotal)}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Tổng thu khách:
                </span>
                <span className="font-black text-2xl text-orange-600 dark:text-orange-400 font-mono">
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
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-xl shadow-md shadow-orange-600/20 active:scale-98 transition-all order-1 sm:order-2 flex-1 sm:flex-none cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{isSubmitting ? 'Đang tạo...' : 'Hoàn tất & Xuất Hóa Đơn'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
      {/* Thermal Receipt Modal */}
      <ThermalReceiptModal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          router.push('/sale/orders');
        }}
        order={createdOrderForReceipt}
      />
    </div>
  );
}

export default OrderCreateForm;
