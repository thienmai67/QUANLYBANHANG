'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAdminStore } from '@/store/useAdminStore';
import { api, getFriendlyErrorMessage } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { useToast } from '@/hooks/useToast';
import {
  CreditCard,
  Banknote,
  QrCode,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Truck,
  MapPin,
  User,
  Phone,
  FileText,
  Store,
} from 'lucide-react';

interface PaymentInfo {
  orderId: string;
  orderNumber?: string;
  orderCode: number;
  amount: number;
  checkoutUrl: string;
  qrCode: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();
  const [mounted, setMounted] = useState(false);

  const { items, clearCart, getTotalPrice, getTotalItems } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [is2h, setIs2h] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK'>('COD');

  // Delivery Method: Giao tận nơi (DELIVERY) vs Ghé tiệm lấy (PICKUP)
  const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [pickupStore, setPickupStore] = useState<'HOC_MON' | 'GO_VAP'>('HOC_MON');

  // Submit & Order State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCreatedOrderId, setExistingCreatedOrderId] = useState<string | null>(null);

  // PayOS QR Payment State
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [underpaidMessage, setUnderpaidMessage] = useState<string | null>(null);
  const [isPollTimedOut, setIsPollTimedOut] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isRegeneratingQR, setIsRegeneratingQR] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(300); // 5 minutes countdown

  // Snapshot of items and total before clearing cart on PayOS
  const [orderSnapshot, setOrderSnapshot] = useState<{
    items: typeof items;
    total: number;
  }>({ items: [], total: 0 });

  // Autofill user info if authenticated
  useEffect(() => {
    setMounted(true);
    if (user) {
      if (user.fullName || user.name) {
        setCustomerName(user.fullName || user.name);
      }
      if (user.phone) {
        setCustomerPhone(user.phone);
      }
    }
  }, [user]);

  // Keep snapshot of items for order summary
  useEffect(() => {
    if (items.length > 0) {
      setOrderSnapshot({
        items: [...items],
        total: getTotalPrice(),
      });
    }
  }, [items, getTotalPrice]);

  // Countdown timer for QR payment
  useEffect(() => {
    if (!paymentInfo || isPollTimedOut) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          setIsPollTimedOut(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentInfo, isPollTimedOut]);

  // Poll payment status for PayOS
  const checkPaymentStatus = useCallback(
    async (orderId: string, isManual = false) => {
      if (!orderId) return false;
      if (isManual) setIsCheckingPayment(true);
      try {
        const res = await api.get<any>(`/orders/${orderId}/payment-status`);
        if (res.paymentStatus === 'PAID') {
          toast.success('Thanh toán thành công! Đơn hàng đang chờ quản lý duyệt đóng gói.');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('tdt-orders-updated'));
          }
          router.push(`/order-success/${orderId}`);
          return true;
        }
        if (res.payosStatus === 'UNDERPAID') {
          setUnderpaidMessage(
            res.message ||
              'Quý khách đã chuyển thiếu số tiền. Vui lòng chuyển tiếp phần còn lại để hoàn tất đơn hàng.'
          );
        }
        if (isManual && res.paymentStatus !== 'PAID') {
          toast.info('Hệ thống chưa ghi nhận thanh toán đủ. Vui lòng thử lại sau ít giây.');
        }
        return false;
      } catch (err: any) {
        if (isManual) {
          toast.error(getFriendlyErrorMessage(err));
        }
        return false;
      } finally {
        if (isManual) setIsCheckingPayment(false);
      }
    },
    [router, toast]
  );

  // Background polling every 5s
  useEffect(() => {
    if (!paymentInfo?.orderId || isPollTimedOut) return;

    const intervalId = setInterval(async () => {
      setPollCount((prev) => {
        const next = prev + 1;
        if (next >= 60) {
          setIsPollTimedOut(true);
          clearInterval(intervalId);
        }
        return next;
      });

      const isPaid = await checkPaymentStatus(paymentInfo.orderId, false);
      if (isPaid) {
        clearInterval(intervalId);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [paymentInfo?.orderId, isPollTimedOut, checkPaymentStatus]);

  // Regenerate QR
  const handleRegenerateQR = async () => {
    if (!paymentInfo?.orderId || isRegeneratingQR) return;
    setIsRegeneratingQR(true);
    try {
      const linkRes = await api.post<any>(`/orders/${paymentInfo.orderId}/payment-link`);
      setPaymentInfo((prev) =>
        prev
          ? {
              ...prev,
              orderCode: linkRes.orderCode,
              amount: linkRes.amount || prev.amount,
              checkoutUrl: linkRes.checkoutUrl,
              qrCode: linkRes.qrCode,
            }
          : null
      );
      setPollCount(0);
      setIsPollTimedOut(false);
      setCountdownSeconds(300);
      setUnderpaidMessage(null);
      toast.success('Đã tạo mã QR thanh toán mới thành công!');
    } catch (err: any) {
      toast.error(`Tạo lại mã QR thất bại: ${getFriendlyErrorMessage(err)}`);
    } finally {
      setIsRegeneratingQR(false);
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const token = getAccessToken();
    if (!token && !isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để hoàn tất đặt hàng');
      router.push('/login?redirect=/checkout');
      return;
    }

    if (items.length === 0) {
      toast.warning('Giỏ hàng của bạn đang trống');
      router.push('/cart');
      return;
    }

    if (!customerName || customerName.trim().length < 2) {
      toast.error('Vui lòng nhập họ và tên người nhận hợp lệ (tối thiểu 2 ký tự)');
      return;
    }
    const phoneRegex = /^0\d{9}$/;
    if (!customerPhone || !phoneRegex.test(customerPhone.trim())) {
      toast.error(
        'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số bắt đầu bằng số 0 (ví dụ: 0901234567)'
      );
      return;
    }
    let finalShippingAddress = customerAddress;
    if (deliveryMethod === 'PICKUP') {
      finalShippingAddress =
        pickupStore === 'HOC_MON'
          ? '[Nhận tại tiệm] Chi Nhánh 1: 120/4 Lý Thường Kiệt, TT. Hóc Môn, TP.HCM'
          : '[Nhận tại tiệm] Chi Nhánh 2: 45 Lê Đức Thọ, P.7, Q. Gò Vấp, TP.HCM';
    } else {
      if (!customerAddress || customerAddress.trim().length < 5) {
        toast.error('Vui lòng nhập địa chỉ giao hàng chi tiết (tối thiểu 5 ký tự)');
        return;
      }
    }

    setIsSubmitting(true);

    const total = getTotalPrice();
    const orderItems = items.map((i) => ({
      productId: i.id,
      productName: i.name,
      sku: i.sku,
      quantity: i.quantity,
      unit: 'Bộ' as const,
      unitPrice: i.unitPrice,
      discountRate: 0,
    }));

    const newOrder = {
      contractorName: customerName || 'Khách Mua Lẻ',
      contractorTier: 'Khách mua lẻ' as const,
      totalAmount: total,
      discountAmount: 0,
      finalAmount: total,
      status: 'Pending' as const,
      deliveryAddress: finalShippingAddress,
      items: orderItems,
    };

    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let catalogProducts: Array<{ id: string; sku?: string }> = [];
      if (items.some((i) => !uuidRegex.test(i.id))) {
        try {
          const res = await api.get<any>('/products');
          const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
          catalogProducts = list;
        } catch {
          // fallback
        }
      }

      const payload = {
        customerName: customerPhone ? `${customerName.trim()} (${customerPhone.trim()})` : (customerName || 'Khách Mua Lẻ'),
        customerPhone: customerPhone || undefined,
        shippingAddress: finalShippingAddress,
        paymentMethod: paymentMethod === 'BANK' ? 'BANK_TRANSFER' : 'COD',
        is2h: deliveryMethod === 'DELIVERY' ? is2h : false,
        items: items.map((i) => {
          let resolvedId = i.id;
          if (!uuidRegex.test(resolvedId)) {
            const matched = catalogProducts.find(
              (p) => p.sku && i.sku && p.sku.toLowerCase() === i.sku.toLowerCase()
            );
            if (matched && uuidRegex.test(matched.id)) {
              resolvedId = matched.id;
            } else {
              throw new Error(
                `Sản phẩm "${i.name}" (mã: ${i.sku || i.id}) không còn đúng mã trong danh mục. Vui lòng chọn lại.`
              );
            }
          }
          return {
            productId: resolvedId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          };
        }),
      };

      let activeOrderId: string | null = existingCreatedOrderId;
      let orderNumberForPayment = newOrder.contractorName;

      if (!activeOrderId) {
        const createdOrder = await api.post<any>('/orders', payload);
        activeOrderId = String(createdOrder?.id || '');
        orderNumberForPayment = createdOrder?.orderNumber || newOrder.contractorName;
        setExistingCreatedOrderId(activeOrderId);

        useAdminStore.getState().addOrder(newOrder);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('tdt-orders-updated'));
        }
      }

      if (!activeOrderId) {
        throw new Error('Không thể khởi tạo đơn hàng');
      }

      const validOrderId: string = activeOrderId;

      if (paymentMethod === 'BANK') {
        try {
          const linkRes = await api.post<any>(`/orders/${validOrderId}/payment-link`);
          setPaymentInfo({
            orderId: validOrderId,
            orderNumber: orderNumberForPayment,
            orderCode: linkRes.orderCode,
            amount: linkRes.amount || total,
            checkoutUrl: linkRes.checkoutUrl,
            qrCode: linkRes.qrCode,
          });
          setPollCount(0);
          setIsPollTimedOut(false);
          setCountdownSeconds(300);
          setUnderpaidMessage(null);
          setExistingCreatedOrderId(null);
          clearCart();
        } catch (linkErr: any) {
          const errMsg = getFriendlyErrorMessage(linkErr);
          toast.error(
            `Đơn hàng #${validOrderId.slice(0, 8)} đã ghi nhận nhưng tạo link PayOS thất bại: ${errMsg}. Nhấn đặt hàng để thử lại thanh toán.`
          );
        }
      } else {
        toast.success('Đặt hàng thành công! Đơn hàng đang được xử lý.');
        setExistingCreatedOrderId(null);
        clearCart();
        router.push(`/order-success/${validOrderId}`);
      }
    } catch (err: any) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayItems = paymentInfo ? orderSnapshot.items : items;
  const displayTotal = paymentInfo ? orderSnapshot.total : getTotalPrice();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] flex flex-col font-sans">
      <MaterialHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Stepper Header (3 Steps) */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-xl mx-auto px-4">
            {/* Step 1: Giỏ hàng */}
            <Link
              href="/cart"
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-md transition-transform group-hover:scale-105">
                ✓
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors hidden sm:inline">
                1. Giỏ hàng
              </span>
            </Link>

            <div className="flex-1 h-0.5 mx-3 bg-emerald-400 dark:bg-emerald-600" />

            {/* Step 2: Thanh toán */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-md ring-4 ring-orange-100 dark:ring-orange-950/60">
                2
              </div>
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 hidden sm:inline">
                2. Thanh toán
              </span>
            </div>

            <div className="flex-1 h-0.5 mx-3 bg-slate-200 dark:bg-slate-800" />

            {/* Step 3: Hoàn tất */}
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                3. Hoàn tất
              </span>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại giỏ hàng</span>
          </Link>
        </div>

        {!mounted ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Đang tải biểu mẫu thanh toán...</p>
          </div>
        ) : items.length === 0 && !paymentInfo ? (
          /* Empty state if user lands directly on /checkout without items */
          <div className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 text-center shadow-sm max-w-lg mx-auto">
            <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Chưa có sản phẩm nào để thanh toán
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Vui lòng chọn sản phẩm vào giỏ hàng trước khi tiến hành thanh toán.
            </p>
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về trang giỏ hàng</span>
            </Link>
          </div>
        ) : (
          /* Main 2-Column Checkout Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form or PayOS QR */}
            <div className="lg:col-span-7 space-y-6">
              {!paymentInfo ? (
                /* Standard Checkout Form */
                <div className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    <span>Thông Tin Giao Hàng & Thanh Toán</span>
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Customer Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Họ và tên người nhận <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Nguyễn Văn A"
                          className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-orange-500 rounded-xl text-xs md:text-sm text-slate-900 dark:text-white outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Customer Phone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Số điện thoại nhận hàng <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="0901234567"
                          className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-orange-500 rounded-xl text-xs md:text-sm text-slate-900 dark:text-white outline-none font-mono transition-colors"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Tài xế sẽ gọi vào số này trước khi giao hàng
                      </p>
                    </div>

                    {/* Delivery Method Choice */}
                    <div className="space-y-2 pt-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Hình thức nhận hàng <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div
                          onClick={() => setDeliveryMethod('DELIVERY')}
                          className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                            deliveryMethod === 'DELIVERY'
                              ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-orange-950 dark:text-orange-100 ring-2 ring-orange-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="deliveryMethod"
                            checked={deliveryMethod === 'DELIVERY'}
                            onChange={() => setDeliveryMethod('DELIVERY')}
                            className="w-4 h-4 text-orange-600 focus:ring-orange-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-xs md:text-sm text-slate-900 dark:text-white">
                              <Truck className="w-4 h-4 text-orange-500" />
                              <span>Giao Tận Nơi</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Giao nhanh trong ngày • Hỗ trợ Grab gấp
                            </p>
                          </div>
                        </div>

                        <div
                          onClick={() => setDeliveryMethod('PICKUP')}
                          className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                            deliveryMethod === 'PICKUP'
                              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="deliveryMethod"
                            checked={deliveryMethod === 'PICKUP'}
                            onChange={() => setDeliveryMethod('PICKUP')}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-xs md:text-sm text-slate-900 dark:text-white">
                              <Store className="w-4 h-4 text-emerald-600" />
                              <span>Ghé Tiệm Lấy (Free 0đ)</span>
                            </div>
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                              Chuẩn bị sẵn trong 15p • Không chờ đợi
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Conditional Delivery / Pickup Branch View */}
                    {deliveryMethod === 'PICKUP' ? (
                      <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            <Store className="w-4 h-4 text-emerald-600" />
                            <span>Chọn chi nhánh ghé lấy hàng:</span>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full">
                            Miễn phí ship 0đ
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div
                            onClick={() => setPickupStore('HOC_MON')}
                            className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                              pickupStore === 'HOC_MON'
                                ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white font-medium ring-1 ring-emerald-500'
                                : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <div className="font-bold flex items-center justify-between text-slate-900 dark:text-white mb-1">
                              <span>📍 CN1: Hóc Môn (Kho Tổng)</span>
                              {pickupStore === 'HOC_MON' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            </div>
                            <p className="text-[11px] text-slate-500">120/4 Lý Thường Kiệt, TT. Hóc Môn</p>
                            <p className="text-[10px] text-slate-400 mt-1">Mở cửa: 7h30 - 20h00 hàng ngày</p>
                          </div>

                          <div
                            onClick={() => setPickupStore('GO_VAP')}
                            className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                              pickupStore === 'GO_VAP'
                                ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white font-medium ring-1 ring-emerald-500'
                                : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <div className="font-bold flex items-center justify-between text-slate-900 dark:text-white mb-1">
                              <span>📍 CN2: Gò Vấp (Cửa Hàng)</span>
                              {pickupStore === 'GO_VAP' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            </div>
                            <p className="text-[11px] text-slate-500">45 Lê Đức Thọ, P.7, Q. Gò Vấp</p>
                            <p className="text-[10px] text-slate-400 mt-1">Mở cửa: 7h30 - 20h30 hàng ngày</p>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-emerald-100 dark:border-emerald-900/40">
                          ⚡ <strong>Tiện ích cho bà con:</strong> Nhân viên tiệm sẽ gom sẵn các món vào bọc. Quý khách chỉ cần ghé đọc Số Điện Thoại là nhận hàng ngay mà không phải xếp hàng chờ đợi!
                        </p>
                      </div>
                    ) : (
                      /* Customer Address for Delivery */
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Địa chỉ giao hàng tận nhà / Công trình <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={customerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                            placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện..."
                            className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-orange-500 rounded-xl text-xs md:text-sm text-slate-900 dark:text-white outline-none transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* Notes for Driver/Warehouse */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Ghi chú cho tài xế / kho hàng (Không bắt buộc)
                      </label>
                      <div className="relative">
                        <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <textarea
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Ví dụ: Giao giờ hành chính, gọi trước 30 phút, để tại bảo vệ công trình..."
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-orange-500 rounded-xl text-xs md:text-sm text-slate-900 dark:text-white outline-none transition-colors resize-none"
                        />
                      </div>
                    </div>

                    {/* Express 2H Option (Delivery Only) */}
                    {deliveryMethod === 'DELIVERY' && (
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Tùy chọn vận chuyển
                      </label>
                      <div
                        onClick={() => setIs2h(!is2h)}
                        className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          is2h
                            ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="is2h-option"
                            checked={is2h}
                            onChange={(e) => setIs2h(e.target.checked)}
                            className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
                          />
                          <div>
                            <label
                              htmlFor="is2h-option"
                              className="text-xs md:text-sm font-bold text-slate-900 dark:text-white cursor-pointer flex items-center gap-1.5"
                            >
                              <Truck className="w-4 h-4 text-amber-500" />
                              <span>Giao hàng siêu tốc 2 Giờ (Nội thành)</span>
                            </label>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Áp dụng cho các đơn hàng vật tư gấp trong phạm vi bán kính 15km
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 font-black uppercase rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 tracking-wider shrink-0">
                          Express 2H
                        </span>
                      </div>
                    </div>
                    )}

                    {/* Payment Method Selection */}
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Phương thức thanh toán <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Option 1: VietQR PayOS */}
                        <div
                          onClick={() => setPaymentMethod('BANK')}
                          className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                            paymentMethod === 'BANK'
                              ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-orange-950 dark:text-orange-100 ring-2 ring-orange-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === 'BANK'}
                            onChange={() => setPaymentMethod('BANK')}
                            className="w-4 h-4 mt-0.5 text-orange-600 focus:ring-orange-500 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 font-bold text-xs md:text-sm text-slate-900 dark:text-white">
                              <QrCode className="w-4 h-4 text-orange-500" />
                              <span>Chuyển khoản VietQR (PayOS)</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              Quét mã QR tự động xác nhận trong vài giây qua mọi ngân hàng
                            </p>
                          </div>
                        </div>

                        {/* Option 2: COD */}
                        <div
                          onClick={() => setPaymentMethod('COD')}
                          className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                            paymentMethod === 'COD'
                              ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-orange-950 dark:text-orange-100 ring-2 ring-orange-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === 'COD'}
                            onChange={() => setPaymentMethod('COD')}
                            className="w-4 h-4 mt-0.5 text-orange-600 focus:ring-orange-500 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 font-bold text-xs md:text-sm text-slate-900 dark:text-white">
                              <Banknote className="w-4 h-4 text-emerald-500" />
                              <span>Tiền mặt khi nhận hàng (COD)</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              Kiểm tra đủ hàng tại công trình rồi thanh toán cho tài xế
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm md:text-base rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Đang Xử Lý Đơn Hàng...</span>
                          </>
                        ) : paymentMethod === 'BANK' ? (
                          <>
                            <QrCode className="w-5 h-5" />
                            <span>Xác Nhận & Lấy Mã QR Thanh Toán</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Xác Nhận Đặt Hàng (COD)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* PayOS VietQR Container */
                <div className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
                  {/* Header */}
                  <div className="text-center space-y-1.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs">
                      <QrCode className="w-4 h-4" />
                      <span>Quét mã VietQR chuẩn Napas 247</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                      Thanh Toán Đơn Hàng #{paymentInfo.orderNumber || paymentInfo.orderId.slice(0, 8)}
                    </h2>
                    <p className="font-mono text-2xl md:text-3xl font-black text-orange-600 dark:text-orange-400">
                      {paymentInfo.amount.toLocaleString('vi-VN')} VND
                    </p>
                  </div>

                  {/* QR Image Box */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-800 flex flex-col items-center justify-center space-y-4 shadow-inner">
                    <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-100">
                      <img
                        src={
                          paymentInfo.qrCode.startsWith('http') || paymentInfo.qrCode.startsWith('data:')
                            ? paymentInfo.qrCode
                            : `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
                                paymentInfo.qrCode
                              )}`
                        }
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallback) {
                            target.dataset.fallback = 'true';
                            target.src = `https://quickchart.io/qr?size=280&text=${encodeURIComponent(
                              paymentInfo.qrCode
                            )}`;
                          }
                        }}
                        alt="PayOS VietQR Code"
                        className="w-64 h-64 md:w-72 md:h-72 object-contain rounded-xl"
                      />
                    </div>

                    {/* Countdown Timer */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span>
                        Mã QR hết hạn sau:{' '}
                        <strong className="font-mono text-orange-600 dark:text-orange-400">
                          {String(Math.floor(countdownSeconds / 60)).padStart(2, '0')}:
                          {String(countdownSeconds % 60).padStart(2, '0')}
                        </strong>
                      </span>
                    </div>

                    <p className="text-xs text-center font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900 max-w-md">
                      ⚠️ <strong>Lưu ý quan trọng:</strong> Vui lòng giữ nguyên số tiền và nội dung chuyển khoản để hệ thống tự động xác nhận đơn hàng sau 3–5 giây.
                    </p>
                  </div>

                  {/* Underpaid warning if any */}
                  {underpaidMessage && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                      <div>
                        <p className="font-bold text-sm">Chưa thanh toán đủ số tiền:</p>
                        <p className="mt-1">{underpaidMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Polling Status & Action Buttons */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
                    {!isPollTimedOut ? (
                      <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                        <span>Đang chờ chuyển khoản (tự động kiểm tra mỗi 5 giây)...</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          Đã hết thời gian chờ tự động kiểm tra
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Nếu bạn đã chuyển khoản xong, vui lòng bấm <strong>Kiểm tra ngay</strong> bên dưới.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <a
                        href={paymentInfo.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-colors"
                      >
                        <span>Mở app ngân hàng</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        disabled={isCheckingPayment}
                        onClick={() => checkPaymentStatus(paymentInfo.orderId, true)}
                        className="py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCheckingPayment ? 'animate-spin' : ''}`} />
                        <span>{isCheckingPayment ? 'Đang kiểm tra...' : 'Tôi đã chuyển khoản xong (Kiểm tra ngay)'}</span>
                      </button>
                    </div>

                    {isPollTimedOut && (
                      <button
                        type="button"
                        disabled={isRegeneratingQR}
                        onClick={handleRegenerateQR}
                        className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-amber-200 dark:border-amber-800 transition-colors disabled:opacity-50"
                      >
                        <QrCode className={`w-3.5 h-3.5 ${isRegeneratingQR ? 'animate-spin' : ''}`} />
                        <span>{isRegeneratingQR ? 'Đang tạo mới...' : 'Tạo lại mã QR mới'}</span>
                      </button>
                    )}

                    <div className="pt-2">
                      <Link
                        href={`/order-success/${paymentInfo.orderId}`}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold underline"
                      >
                        Thanh toán sau (Lưu đơn vào tài khoản và xem chi tiết đơn)
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Mini Order Summary (5 cols on desktop) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm sticky top-24 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Tóm Tắt Đơn Hàng
                  </h3>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    {displayItems.length} món
                  </span>
                </div>

                {/* Items Mini List */}
                <div className="max-h-72 overflow-y-auto space-y-3 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                  {displayItems.map((item) => (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                      <img
                        src={item.image || '/images/placeholder.png'}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 bg-white"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.src = 'https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?q=80&w=150&h=150';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                          <span className="font-mono">SL: {item.quantity}</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} VND
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculations */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Tạm tính:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {displayTotal.toLocaleString('vi-VN')} VND
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Hình thức nhận:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {deliveryMethod === 'PICKUP' ? '🏬 Ghé tiệm lấy' : '🚚 Giao tận nơi'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Phí vận chuyển:</span>
                    <span className="font-mono font-semibold text-emerald-600">
                      {deliveryMethod === 'PICKUP' ? '0 VND (Miễn phí)' : is2h ? 'Hỗ trợ 2H' : 'Miễn phí'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Giảm giá:</span>
                    <span className="font-mono font-semibold text-emerald-600">
                      0 VND
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      TỔNG THANH TOÁN:
                    </span>
                    <span className="font-mono font-black text-xl text-orange-600 dark:text-orange-400">
                      {displayTotal.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                </div>

                {/* Trust guarantee */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Cam kết chất lượng TDT M&E</span>
                  </div>
                  <p>Hàng chính hãng 100%, bảo hành tiêu chuẩn nhà sản xuất, hỗ trợ kỹ thuật tận công trình.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <MaterialFooter />
    </div>
  );
}