'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  CreditCard,
} from 'lucide-react';

export default function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isOpen,
    openToCheckout,
    setIsOpen,
    setOpenToCheckout,
    removeItem,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
  } = useCartStore();

  // If triggered with openToCheckout flag, directly navigate to /checkout
  React.useEffect(() => {
    if (isOpen && openToCheckout) {
      setOpenToCheckout(false);
      setIsOpen(false);
      router.push('/checkout');
    }
  }, [isOpen, openToCheckout, router, setIsOpen, setOpenToCheckout]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleGoToCart = () => {
    setIsOpen(false);
    router.push('/cart');
  };

  const handleGoToCheckout = () => {
    setIsOpen(false);
    router.push('/checkout');
  };

  const totalItemsCount = getTotalItems();
  const totalPrice = getTotalPrice();

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={handleClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#0c1322] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 text-slate-900 dark:text-slate-100 text-xs">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Giỏ Hàng Mua Lẻ
                </h2>
                <p className="text-[11px] text-slate-400">
                  {items.length === 0 ? 'Chưa có sản phẩm' : `${totalItemsCount} món trong giỏ`}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Đóng giỏ hàng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: Items Mini List */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3">
            {items.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <ShoppingBag className="w-12 h-12 mx-auto opacity-30 text-slate-400" />
                <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  Giỏ hàng của bạn đang trống
                </p>
                <p className="text-xs max-w-xs mx-auto">
                  Hãy chọn các sản phẩm vật tư điện nước cần mua để thêm vào giỏ.
                </p>
                <div className="pt-2">
                  <Link
                    href="/shop"
                    onClick={handleClose}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                  >
                    <span>Khám phá sản phẩm</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                  >
                    <img
                      src={item.image || '/images/placeholder.png'}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 bg-white"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.src = 'https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?q=80&w=150&h=150';
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {item.name}
                      </h4>
                      <span className="font-mono text-[10px] text-slate-400">
                        SKU: {item.sku || 'N/A'}
                      </span>
                      <p className="font-mono font-bold text-orange-600 dark:text-orange-400 mt-1">
                        {item.unitPrice.toLocaleString('vi-VN')} VND
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-xl text-slate-500 hover:text-slate-700 transition-colors"
                          title="Giảm"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-bold font-mono text-xs">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-xl text-slate-500 hover:text-slate-700 transition-colors"
                          title="Tăng"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer: Totals and Two Main Action Buttons */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  TỔNG THÀNH TIỀN:
                </span>
                <span className="font-mono font-black text-base sm:text-lg text-orange-600 dark:text-orange-400">
                  {totalPrice.toLocaleString('vi-VN')} VND
                </span>
              </div>

              {/* 2 Buttons: Xem giỏ hàng (/cart) & Thanh toán ngay (/checkout) */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleGoToCart}
                  className="w-full py-3 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Xem giỏ hàng</span>
                </button>

                <button
                  type="button"
                  onClick={handleGoToCheckout}
                  className="w-full py-3 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all active:scale-98"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Thanh toán ngay</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}