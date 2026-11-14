'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';
import { api, getFriendlyErrorMessage } from '@/lib/api';
import { useAdminStore } from '@/store/useAdminStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getAccessToken } from '@/lib/auth';
import {
  CheckCircle2,
  Package,
  Clock,
  MapPin,
  Phone,
  User,
  CreditCard,
  Banknote,
  Truck,
  ArrowRight,
  Home,
  ShoppingBag,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface OrderDetail {
  id: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: string;
  deliveryAddress?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
  totalAmount?: number;
  finalAmount?: number;
  is2h?: boolean;
  createdAt?: string;
  items?: Array<{
    id?: string;
    productId?: string;
    productName?: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    totalAmount?: number;
  }>;
}

export default function OrderSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.id as string) || '';
  const { isAuthenticated } = useAuthStore();
  const isAuth = isAuthenticated || !!getAccessToken();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('Mã đơn hàng không hợp lệ');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<OrderDetail>(`/orders/${orderId}`);
        if (res && (res.id || (res as any).orderNumber)) {
          setOrder(res);
          return;
        }
      } catch (err: any) {
        // Fallback: check useAdminStore for mock or newly created order
        const adminOrders = useAdminStore.getState().orders;
        const matched = adminOrders.find((o) => o.id === orderId);
        if (matched) {
          setOrder({
            id: matched.id,
            orderNumber: matched.id.slice(0, 8).toUpperCase(),
            customerName: matched.contractorName,
            customerPhone: undefined,
            shippingAddress: matched.deliveryAddress,
            status: matched.status,
            totalAmount: matched.finalAmount || matched.totalAmount,
            items: matched.items.map((it) => ({
              productId: it.productId,
              productName: it.productName,
              sku: it.sku,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
            })),
          });
          return;
        }
        setError(getFriendlyErrorMessage(err) || 'Không thể tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] flex flex-col font-sans">
      <MaterialHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Stepper Header (3 Steps: 1 Done, 2 Done, 3 Active) */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-xl mx-auto px-4">
            {/* Step 1 */}
            <div className="flex items-center gap-2 opacity-70">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                ✓
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">
                1. Giỏ hàng
              </span>
            </div>

            <div className="flex-1 h-0.5 mx-3 bg-emerald-400 dark:bg-emerald-600" />

            {/* Step 2 */}
            <div className="flex items-center gap-2 opacity-70">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                ✓
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">
                2. Thanh toán
              </span>
            </div>

            <div className="flex-1 h-0.5 mx-3 bg-emerald-400 dark:bg-emerald-600" />

            {/* Step 3 */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md ring-4 ring-emerald-100 dark:ring-emerald-950/60">
                ✓
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hidden sm:inline">
                3. Hoàn tất
              </span>
            </div>
          </div>
        </div>

        {/* Content Box */}
        {loading ? (
          <div className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
            <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Đang xác nhận dữ liệu đơn hàng...
            </p>
          </div>
        ) : error && !order ? (
          <div className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 text-center shadow-sm max-w-lg mx-auto">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Không tìm thấy thông tin đơn hàng
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{error}</p>
            <div className="flex justify-center gap-3">
              <Link
                href="/shop"
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow transition-colors"
              >
                Về cửa hàng
              </Link>
              <Link
                href="/"
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Trang chủ
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Banner Card */}
            <div className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Đặt Hàng Thành Công!
                </h1>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Cảm ơn bạn đã tin tưởng lựa chọn vật tư cơ điện chính hãng tại{' '}
                  <strong className="text-slate-900 dark:text-white">TDT M&E</strong>. Đơn hàng của bạn đã được ghi nhận vào hệ thống.
                </p>
              </div>

              {/* Order Meta Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700">
                  Mã đơn: #{order?.orderNumber || order?.id.slice(0, 8).toUpperCase()}
                </div>

                <div
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                    order?.paymentStatus === 'PAID'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {order?.paymentStatus === 'PAID'
                    ? '● Đã thanh toán (PayOS)'
                    : '○ Chưa thanh toán (COD / Chờ thanh toán)'}
                </div>

                {order?.is2h && (
                  <div className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-xs font-bold border border-amber-300 dark:border-amber-700 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Giao hỏa tốc 2 giờ</span>
                  </div>
                )}
              </div>
            </div>

            {/* Live Delivery Progress Stepper */}
            <div className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Tiến Độ Xử Lý &amp; Giao Hàng Trực Tiếp
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  <span>Dự kiến giao: <strong className="text-slate-900 dark:text-white">{order?.is2h ? 'Trong 2 Giờ' : 'Trong Ngày'}</strong></span>
                </div>
              </div>

              {/* 4 Steps Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 relative">
                {/* Step 1 */}
                <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-600/20 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">1. Tiếp Nhận Đơn</h3>
                    <p className="text-[11px] text-slate-400">Đã vào hệ thống TDT</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/20 shrink-0 animate-pulse">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-blue-600 dark:text-blue-400">2. Xuất Kho Đóng Gói</h3>
                    <p className="text-[11px] text-slate-400">Thủ kho đang kiểm đếm</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 opacity-60">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200 dark:border-slate-700">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300">3. Shipper Di Chuyển</h3>
                    <p className="text-[11px] text-slate-400">Tài xế giao tận nhà</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 opacity-60">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200 dark:border-slate-700">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300">4. Nhận Hàng &amp; COD</h3>
                    <p className="text-[11px] text-slate-400">Kiểm tra trước khi trả</p>
                  </div>
                </div>
              </div>

              {/* Emergency Hotline Strip */}
              <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Phone className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                  <span>Cần điều chỉnh địa chỉ hoặc giao gấp sự cố?</span>
                </div>
                <a
                  href="tel:19006868"
                  className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Hotline Hỗ Trợ 24/7 (1900 6868)</span>
                </a>
              </div>
            </div>

            {/* Delivery & Payment Details Card */}
            <div className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                <span>Thông Tin Nhận Hàng</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-400">
                  <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-500">Người nhận:</span>{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {order?.customerName || 'Khách Mua Lẻ'}
                    </strong>
                  </div>
                </div>

                {order?.customerPhone && (
                  <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-400">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-500">Số điện thoại:</span>{' '}
                      <strong className="font-mono text-slate-900 dark:text-white">
                        {order.customerPhone}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-400 md:col-span-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-500">Địa chỉ giao hàng:</span>{' '}
                    <span className="text-slate-900 dark:text-white">
                      {order?.shippingAddress || order?.deliveryAddress || 'Chưa cung cấp'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-400 md:col-span-2">
                  {order?.paymentMethod === 'BANK_TRANSFER' ? (
                    <CreditCard className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  ) : (
                    <Banknote className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-500">Hình thức thanh toán:</span>{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {order?.paymentMethod === 'BANK_TRANSFER'
                        ? 'Chuyển khoản VietQR qua PayOS'
                        : 'Thanh toán tiền mặt khi nhận hàng (COD)'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchased Items Card */}
            {order?.items && order.items.length > 0 && (
              <div className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <h2 className="font-bold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  <span>Danh Mục Sản Phẩm Đã Đặt ({order.items.length} món)</span>
                </h2>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items.map((item, idx) => {
                    const lineTotal = (item.totalAmount || item.unitPrice * item.quantity);
                    return (
                      <div key={item.id || idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {item.productName || `Vật tư mã ${item.sku || item.productId}`}
                          </p>
                          <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                            SKU: {item.sku || 'N/A'} • Đơn giá: {item.unitPrice.toLocaleString('vi-VN')} VND
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-slate-500">x{item.quantity}</p>
                          <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                            {lineTotal.toLocaleString('vi-VN')} VND
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    TỔNG TIỀN ĐƠN HÀNG:
                  </span>
                  <span className="font-mono font-black text-xl text-orange-600 dark:text-orange-400">
                    {(order.totalAmount || order.finalAmount || 0).toLocaleString('vi-VN')} VND
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              {isAuth ? (
                <Link
                  href="/profile"
                  className="w-full sm:w-auto px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all text-xs flex items-center justify-center gap-2"
                >
                  <span>Theo dõi tiến độ đơn hàng tại Hồ Sơ</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href={`/tra-cuu-don-hang?phone=${encodeURIComponent(order?.customerPhone || '')}&orderNumber=${encodeURIComponent(order?.orderNumber || orderId)}`}
                  className="w-full sm:w-auto px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all text-xs flex items-center justify-center gap-2"
                >
                  <span>Tra cứu tiến độ đơn hàng</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Về trang chủ</span>
              </Link>
              <Link
                href="/shop"
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Tiếp tục mua hàng</span>
              </Link>
            </div>
          </div>
        )}
      </main>

      <MaterialFooter />
    </div>
  );
}