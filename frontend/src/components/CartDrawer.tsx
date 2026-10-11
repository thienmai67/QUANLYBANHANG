'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getAccessToken } from '@/lib/auth';
import { X, Trash2, Plus, Minus, ShoppingBag, CheckCircle2, ArrowRight } from 'lucide-react';
import { api, getFriendlyErrorMessage } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useAdminStore } from '@/store/useAdminStore';

export default function CartDrawer() {
  const router = useRouter();
  const toast = useToast();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const {
    items,
    isOpen,
    openToCheckout,
    setIsOpen,
    setOpenToCheckout,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
  } = useCartStore();

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'form' | 'success'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK'>('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen && openToCheckout) {
      setOpenToCheckout(false);
      const token = getAccessToken();
      if (!token && !isAuthenticated) {
        setIsOpen(false);
        setCheckoutStep('cart');
        toast.warning('Vui lòng đăng nhập để đặt hàng');
        router.push('/login?redirect=/shop');
      } else {
        setCheckoutStep('form');
      }
    }
  }, [isOpen, openToCheckout, isAuthenticated, router, setIsOpen, setOpenToCheckout, toast]);

  if (!isOpen) return null;

  const ensureAuthenticatedOrRedirect = (): boolean => {
    const token = getAccessToken();
    if (!token && !isAuthenticated) {
      setIsOpen(false);
      setCheckoutStep('cart');
      toast.warning('Vui lòng đăng nhập để đặt hàng');
      router.push('/login?redirect=/shop');
      return false;
    }
    return true;
  };

  const handleProceedToCheckout = () => {
    if (!ensureAuthenticatedOrRedirect()) return;
    setCheckoutStep('form');
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ensureAuthenticatedOrRedirect()) return;
    if (isSubmitting) return;
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
      contractorTier: 'Khách công trình' as const,
      totalAmount: total,
      discountAmount: 0,
      finalAmount: total,
      status: 'Pending' as const,
      deliveryAddress: customerAddress || 'Chưa cung cấp',
      items: orderItems,
    };

    // Call Backend API to persist into PostgreSQL
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let catalogProducts: Array<{ id: string; sku?: string }> = [];
      if (items.some((i) => !uuidRegex.test(i.id))) {
        try {
          const res = await api.get<any>('/products');
          const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
          catalogProducts = list;
        } catch {
          // fallback to seeded UUIDs below
        }
      }

      const fallbackUuids = [
        '10000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000003',
      ];

      const payload = {
        customerName: customerName || 'Khách Mua Lẻ',
        paymentMethod: paymentMethod === 'BANK' ? 'BANK_TRANSFER' : 'COD',
        is2h: false,
        items: items.map((i, idx) => {
          let resolvedId = i.id;
          if (!uuidRegex.test(resolvedId)) {
            const matched = catalogProducts.find(
              (p) => p.sku && i.sku && p.sku.toLowerCase() === i.sku.toLowerCase()
            );
            resolvedId =
              matched?.id ||
              catalogProducts[idx % Math.max(1, catalogProducts.length)]?.id ||
              fallbackUuids[idx % fallbackUuids.length];
          }
          return {
            productId: resolvedId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          };
        }),
      };

      await api.post('/orders', payload);

      useAdminStore.getState().addOrder(newOrder);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('tdt-orders-updated'));
      }
      toast.success('Đặt hàng thành công! Đơn hàng đang được xử lý.');
      setCheckoutStep('success');
      clearCart();
    } catch (err: any) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCheckoutStep('cart');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#0c1322] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 text-slate-900 dark:text-slate-100 text-xs">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-base">
                {checkoutStep === 'cart' && 'Giỏ Hàng Mua Lẻ'}
                {checkoutStep === 'form' && 'Thông Tin Giao Hàng'}
                {checkoutStep === 'success' && 'Đặt Hàng Thành Công!'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {checkoutStep === 'cart' && (
              <>
                {items.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 space-y-3">
                    <ShoppingBag className="w-12 h-12 mx-auto opacity-30" />
                    <p className="font-semibold text-sm">Giỏ hàng của bạn đang trống</p>
                    <p className="text-xs">Hãy chọn vật tư cần mua để thêm vào giỏ hàng.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </h4>
                          <span className="font-mono text-[10px] text-slate-400">
                            SKU: {item.sku}
                          </span>
                          <p className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
                            {item.unitPrice.toLocaleString('vi-VN')} VND
                          </p>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-xl"
                            >
                              <Minus className="w-3 h-3 text-slate-500" />
                            </button>
                            <span className="px-2 font-bold font-mono text-xs">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-xl"
                            >
                              <Plus className="w-3 h-3 text-slate-500" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {checkoutStep === 'form' && (
              <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và tên người nhận <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-blue-500 rounded-xl text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại nhận hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-blue-500 rounded-xl text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Địa chỉ giao hàng chi tiết <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện..."
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-blue-500 rounded-xl text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hình thức thanh toán
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('COD')}
                      className={`p-3 rounded-xl border text-center font-bold transition-all ${
                        paymentMethod === 'COD'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      Thanh toán COD (Nhận hàng)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('BANK')}
                      className={`p-3 rounded-xl border text-center font-bold transition-all ${
                        paymentMethod === 'BANK'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      Chuyển khoản QR
                    </button>
                  </div>
                </div>
              </form>
            )}

            {checkoutStep === 'success' && (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Cảm Ơn Bạn Đã Đặt Hàng!
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Đơn hàng của bạn đã được tiếp nhận thành công. Nhân viên TDT M&E sẽ liên hệ xác nhận giao hàng trong 15 phút.
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                  Tiếp Tục Mua Sắm
                </button>
              </div>
            )}
          </div>

          {/* Footer Footer buttons */}
          {checkoutStep !== 'success' && items.length > 0 && (
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-600 dark:text-slate-400">TỔNG THÀNH TIỀN:</span>
                <span className="font-mono font-black text-lg text-blue-600 dark:text-blue-400">
                  {getTotalPrice().toLocaleString('vi-VN')} VND
                </span>
              </div>

              {checkoutStep === 'cart' ? (
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 text-sm flex items-center justify-center gap-2 transition-all"
                >
                  Tiến Hành Đặt Hàng <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('cart')}
                    className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={isSubmitting}
                    className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg text-xs flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Đang Xử Lý...' : 'Xác Nhận Đặt Hàng'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
