'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';
import { useCartStore } from '@/store/useCartStore';
import { ThermalReceiptModal, ThermalOrderData } from '@/components/ThermalReceiptModal';
import { useToast } from '@/hooks/useToast';
import { api, getFriendlyErrorMessage } from '@/lib/api';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ShoppingCart,
  Phone,
  FileText,
  Zap,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Check,
  XCircle,
  Printer,
} from 'lucide-react';

interface LookupOrderItem {
  id?: string;
  productId?: string;
  productName?: string;
  name?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
}

interface LookupOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  paymentMethod?: string;
  is2h: boolean;
  deadline2h?: string;
  deliveredAt?: string;
  cancellationReason?: string;
  totalAmount: number;
  status: 'PENDING' | 'PACKING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  podPhotoUrl?: string;
  podRecipientName?: string;
  podConfirmedAt?: string;
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  paidAt?: string;
  items?: LookupOrderItem[];
  createdAt: string;
  updatedAt: string;
}

function OrderLookupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { addItem } = useCartStore();

  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [orderNumber, setOrderNumber] = useState(searchParams.get('orderNumber') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [orders, setOrders] = useState<LookupOrder[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Thermal Receipt Print State
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<ThermalOrderData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Auto search on mount if url query params present
  useEffect(() => {
    const qPhone = searchParams.get('phone');
    const qOrder = searchParams.get('orderNumber');
    if (qPhone || qOrder) {
      handleSearch(qPhone || undefined, qOrder || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (overridePhone?: string, overrideOrder?: string) => {
    const p = (overridePhone !== undefined ? overridePhone : phone).trim();
    const o = (overrideOrder !== undefined ? overrideOrder : orderNumber).trim();

    if (!p && !o) {
      toast.warning('Vui lòng nhập số điện thoại hoặc mã đơn hàng để tra cứu');
      return;
    }

    if (p && p.length < 8) {
      toast.warning('Số điện thoại phải có ít nhất 8 chữ số');
      return;
    }

    if (o && o.length < 4) {
      toast.warning('Mã đơn hàng phải có ít nhất 4 ký tự');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (p) params.set('phone', p);
      if (o) params.set('orderNumber', o);

      const res = await api.get<{ data: LookupOrder[]; total: number }>(
        `/public/orders/lookup?${params.toString()}`
      );

      const list = Array.isArray(res?.data) ? res.data : [];
      setOrders(list);

      if (list.length === 0) {
        toast.info('Không tìm thấy đơn hàng nào khớp với thông tin cung cấp');
      } else {
        toast.success(`Đã tìm thấy ${list.length} đơn hàng!`);
      }
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      setErrorMessage(msg);
      toast.error(msg);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = (order: LookupOrder) => {
    const itemsList = Array.isArray(order.items) ? order.items : [];
    if (itemsList.length === 0) {
      toast.warning('Đơn hàng này không có danh sách sản phẩm để mua lại');
      return;
    }

    let count = 0;
    itemsList.forEach((item) => {
      const rawPrice = Number(item.unitPrice) || 0;
      const prodName = item.productName || item.name || `Vật tư ${item.sku || ''}`;
      const prodSku = item.sku || 'SKU-STD';
      const qty = Number(item.quantity) || 1;
      addItem(
        {
          id: item.productId || item.id || `reorder-${item.sku}`,
          sku: prodSku,
          name: prodName,
          price: `${rawPrice.toLocaleString('vi-VN')} ₫`,
          unitPrice: rawPrice,
          image: '/images/products/day-cap-don-1.jpg',
          quantity: qty,
        },
        false
      );
      count += qty;
    });

    toast.success(`Đã thêm ${count} sản phẩm từ đơn ${order.orderNumber} vào giỏ hàng!`);
    router.push('/cart');
  };

  const getStatusStep = (status: LookupOrder['status']) => {
    switch (status) {
      case 'PENDING':
        return 1;
      case 'PACKING':
        return 2;
      case 'SHIPPING':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 0; // CANCELLED
    }
  };

  const renderStatusBadge = (status: LookupOrder['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 animate-spin" /> Chờ Xác Nhận
          </span>
        );
      case 'PACKING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Package className="w-3.5 h-3.5 animate-pulse" /> Đang Soạn Hàng
          </span>
        );
      case 'SHIPPING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Truck className="w-3.5 h-3.5 animate-bounce" /> Đang Giao Hàng
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Giao Thành Công
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Đã Hủy
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <MaterialHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-bold mb-3 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Tra Cứu Trực Tuyến 24/7 Không Cần Đăng Nhập</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Tra Cứu Tiến Độ Đơn Hàng
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Khách mua lẻ có thể kiểm tra trực tiếp trạng thái soạn hàng, tài xế vận chuyển và tiến độ giao 2H chỉ với số điện thoại hoặc mã đơn.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Số điện thoại người nhận <span className="text-blue-600 font-normal">(Khuyên dùng)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0901234567"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mã đơn hàng <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="Ví dụ: ORD-261107-123456"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>💡 Gợi ý:</span>
                <span>Chỉ cần nhập 1 trong 2 thông tin là có thể tra cứu đơn hàng ngay.</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang Tra Cứu...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Tra Cứu Ngay</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Results Section */}
        {hasSearched && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Kết Quả Tra Cứu</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {orders.length} đơn
                </span>
              </h2>
            </div>

            {orders.length === 0 && !isLoading && !errorMessage && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-sm">
                <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Chưa tìm thấy đơn hàng nào
                </h3>
                <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Bác kiểm tra lại số điện thoại hoặc mã đơn hàng xem có gõ nhầm số nào không nhé. Nếu vừa mới đặt hàng, hệ thống có thể cần vài phút để đồng bộ.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setPhone('');
                      setOrderNumber('');
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Xóa Tìm Kiếm
                  </button>
                  <Link
                    href="/shop"
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Xem Cửa Hàng Vật Tư
                  </Link>
                </div>
              </div>
            )}

            {orders.map((order) => {
              const currentStep = getStatusStep(order.status);
              const isCancelled = order.status === 'CANCELLED';

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden"
                >
                  {/* Order Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-extrabold text-blue-600 dark:text-blue-400">
                          {order.orderNumber}
                        </span>
                        {order.is2h && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Zap className="w-3 h-3 fill-amber-500" /> Giao 2H
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {renderStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Progress Stepper (if not cancelled) */}
                  {!isCancelled ? (
                    <div className="py-6 px-2">
                      <div className="relative">
                        {/* Connecting Line */}
                        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0">
                          <div
                            className="h-full bg-blue-600 transition-all duration-500"
                            style={{
                              width: `${((Math.max(1, currentStep) - 1) / 3) * 100}%`,
                            }}
                          />
                        </div>

                        {/* Steps */}
                        <div className="grid grid-cols-4 relative z-10 text-center">
                          {/* Step 1 */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                currentStep >= 1
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                              }`}
                            >
                              {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                            </div>
                            <span className="mt-2 text-[11px] md:text-xs font-bold text-slate-800 dark:text-slate-200">
                              Tiếp Nhận
                            </span>
                            <span className="text-[10px] text-slate-400 hidden sm:block">Đã vào hệ thống</span>
                          </div>

                          {/* Step 2 */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                currentStep >= 2
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                              }`}
                            >
                              {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
                            </div>
                            <span className="mt-2 text-[11px] md:text-xs font-bold text-slate-800 dark:text-slate-200">
                              Đóng Gói
                            </span>
                            <span className="text-[10px] text-slate-400 hidden sm:block">Soạn vật tư kho</span>
                          </div>

                          {/* Step 3 */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                currentStep >= 3
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                              }`}
                            >
                              {currentStep > 3 ? <Check className="w-4 h-4" /> : '3'}
                            </div>
                            <span className="mt-2 text-[11px] md:text-xs font-bold text-slate-800 dark:text-slate-200">
                              Đang Giao
                            </span>
                            <span className="text-[10px] text-slate-400 hidden sm:block">Shipper trên đường</span>
                          </div>

                          {/* Step 4 */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                currentStep >= 4
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                              }`}
                            >
                              <Check className="w-4 h-4" />
                            </div>
                            <span className="mt-2 text-[11px] md:text-xs font-bold text-slate-800 dark:text-slate-200">
                              Hoàn Tất
                            </span>
                            <span className="text-[10px] text-slate-400 hidden sm:block">Đã nhận hàng</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="my-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                      <div className="font-bold flex items-center gap-1.5 mb-1">
                        <AlertCircle className="w-4 h-4" /> Đơn hàng đã bị hủy
                      </div>
                      <p>Lý do: {order.cancellationReason || 'Không có lý do cụ thể hoặc khách yêu cầu hủy'}</p>
                    </div>
                  )}

                  {/* Customer & Payment Meta Strip */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs mb-4">
                    <div>
                      <span className="text-slate-400">Người nhận hàng:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {order.customerName || 'Khách Mua Lẻ'}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400">Thanh toán:</span>
                      <p className="font-bold mt-0.5">
                        {order.paymentStatus === 'PAID' ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ✅ Đã thanh toán ({order.paymentMethod || 'Chuyển khoản'})
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">
                            💵 Thu tiền COD khi giao ({Number(order.totalAmount || 0).toLocaleString('vi-VN')} đ)
                          </span>
                        )}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400">Dịch vụ giao vận:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {order.is2h ? '⚡ Giao Hỏa Tốc Trong 2H' : '🚚 Giao Tiêu Chuẩn Trong Ngày'}
                      </p>
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Danh sách vật tư đặt mua ({order.items?.length || 0} món)
                    </h4>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-b border-slate-100 dark:border-slate-800">
                      {(order.items || []).map((item, idx) => {
                        const lineTotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1);
                        return (
                          <div key={idx} className="py-2.5 flex items-center justify-between text-xs gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {item.productName || item.name || `Vật tư ${item.sku || ''}`}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                SKU: {item.sku || 'N/A'} • Đơn giá: {Number(item.unitPrice || 0).toLocaleString('vi-VN')} đ
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                x{item.quantity} {item.unit || 'cái'}
                              </span>
                              <p className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                                {lineTotal.toLocaleString('vi-VN')} đ
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs">
                      <span className="text-slate-400">Tổng thanh toán: </span>
                      <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                        {Number(order.totalAmount || 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrderForReceipt({
                            orderNumber: order.orderNumber,
                            createdAt: order.createdAt,
                            customerName: order.customerName,
                            customerPhone: phone || undefined,
                            shippingAddress: order.is2h ? 'Giao hỏa tốc 2H tận nơi' : 'Giao tiêu chuẩn / Nhận tại tiệm',
                            paymentMethod: order.paymentMethod,
                            paymentStatus: order.paymentStatus,
                            totalAmount: order.totalAmount,
                            items: (order.items || []).map((it) => ({
                              productName: it.productName || it.name,
                              sku: it.sku,
                              quantity: it.quantity,
                              unitPrice: it.unitPrice,
                              unit: it.unit,
                            })),
                          });
                          setShowReceiptModal(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>In Phiếu K80</span>
                      </button>

                      <button
                        onClick={() => handleReorder(order)}
                        className="px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Mua Lại Đơn Này</span>
                      </button>

                      <a
                        href="tel:19006789"
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Cần Hỗ Trợ</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Retail Trust Notice */}
        <div className="mt-12 p-6 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-center">
          <div className="max-w-xl mx-auto">
            <h3 className="text-sm font-bold text-blue-950 dark:text-blue-200 flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Chính Sách Giao Hàng Bán Lẻ M&E</span>
            </h3>
            <p className="mt-2 text-xs text-blue-900/70 dark:text-blue-300/70 leading-relaxed">
              Tổng kho TDT cam kết giao hàng trong 2H cho các sự cố điện nước khẩn cấp nội thành. Khách mua lẻ được kiểm tra hàng trước khi thanh toán COD, đổi trả trong vòng 7 ngày nếu không vừa quy cách.
            </p>
          </div>
        </div>
      </main>

      {/* Thermal Receipt Modal */}
      <ThermalReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        order={selectedOrderForReceipt}
      />

      <MaterialFooter />
    </div>
  );
}

export default function OrderLookupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <OrderLookupContent />
    </Suspense>
  );
}
