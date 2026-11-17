'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getAccessToken } from '@/lib/auth';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  CreditCard,
  Lock,
  Truck,
  ShieldCheck,
  Sparkles,
  Check,
} from 'lucide-react';

const FREESHIP_THRESHOLD = 500000; // 500.000 VND

function inferBrand(name?: string, sku?: string): string {
  const text = `${name || ''} ${sku || ''}`.toUpperCase();
  if (text.includes('CADIVI') || text.startsWith('CAD-')) return 'Cadivi';
  if (text.includes('BÌNH MINH') || text.includes('BINH MINH') || text.startsWith('BM-')) return 'Bình Minh';
  if (text.includes('RẠNG ĐÔNG') || text.includes('RANG DONG') || text.startsWith('RD-')) return 'Rạng Đông';
  if (text.includes('PANASONIC') || text.startsWith('PANA-')) return 'Panasonic';
  if (text.includes('SCHNEIDER') || text.startsWith('SCH-')) return 'Schneider';
  if (text.includes('SINO') || text.startsWith('SINO-')) return 'Sino';
  return 'Chính hãng';
}

function inferUnit(name?: string, sku?: string): string {
  const text = `${name || ''} ${sku || ''}`.toLowerCase();
  if (text.includes('ống') || text.includes('pipe')) return 'Cây (4m)';
  if (text.includes('dây') || text.includes('cáp') || text.includes('cable')) {
    if (text.includes('cuộn')) return 'Cuộn';
    return 'Mét';
  }
  if (text.includes('keo') || text.includes('tuýp')) return 'Tuýp';
  if (text.includes('băng keo') || text.includes('băng tan')) return 'Cuộn (18m)';
  if (text.includes('co') || text.includes('nối') || text.includes('tê')) return 'Cái';
  return 'Cái';
}

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
    setQuantity,
    addItem,
    getTotalPrice,
    getTotalItems,
  } = useCartStore();

  const isAuthStore = useAuthStore((state) => state.isAuthenticated);
  const isAuth = isAuthStore || (typeof window !== 'undefined' && !!getAccessToken());

  // Input states for typing quantity from keyboard
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({});

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

  // Freeship calculation
  const freeshipProgress = Math.min(100, Math.round((totalPrice / FREESHIP_THRESHOLD) * 100));
  const freeshipRemaining = Math.max(0, FREESHIP_THRESHOLD - totalPrice);
  const isFreeship = totalPrice >= FREESHIP_THRESHOLD;

  // Keyboard quantity handlers
  const handleInputChange = (id: string, rawVal: string) => {
    setQtyInputs((prev) => ({ ...prev, [id]: rawVal }));
    const parsed = parseInt(rawVal, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 9999) {
      setQuantity(id, parsed);
    }
  };

  const handleInputBlur = (id: string, currentQty: number) => {
    const rawVal = qtyInputs[id];
    if (rawVal === undefined) return;
    const parsed = parseInt(rawVal, 10);
    if (isNaN(parsed) || parsed < 1) {
      setQuantity(id, 1);
      setQtyInputs((prev) => ({ ...prev, [id]: '1' }));
    } else {
      const clamped = Math.min(9999, parsed);
      setQuantity(id, clamped);
      setQtyInputs((prev) => ({ ...prev, [id]: String(clamped) }));
    }
  };

  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    id: string,
    currentQty: number
  ) => {
    if (e.key === 'Enter') {
      handleInputBlur(id, currentQty);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleDecrease = (id: string, currentQty: number) => {
    if (currentQty <= 1) {
      if (typeof window !== 'undefined' && window.confirm('Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?')) {
        removeItem(id);
        setQtyInputs((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
      return;
    }
    const nextQty = currentQty - 1;
    updateQuantity(id, -1);
    setQtyInputs((prev) => ({ ...prev, [id]: String(nextQty) }));
  };

  const handleIncrease = (id: string, currentQty: number) => {
    if (currentQty >= 9999) return;
    const nextQty = currentQty + 1;
    updateQuantity(id, 1);
    setQtyInputs((prev) => ({ ...prev, [id]: String(nextQty) }));
  };

  // Cross-sell helper
  const hasNanoTape = items.some(
    (i) => i.sku?.toUpperCase().includes('NANO') || i.name?.toLowerCase().includes('băng keo')
  );

  const handleAddNanoTape = () => {
    addItem(
      {
        id: 'cross-sell-nano-tape',
        sku: 'NANO-TAPE-18M',
        name: 'Băng keo cách điện Nano 18m chính hãng',
        price: '12.000 đ',
        unitPrice: 12000,
        image: 'https://tdtmaterial.id.vn/images/products/bang-keo-nano.jpg',
        quantity: 1,
      },
      false
    );
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={handleClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#0c1322] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 text-slate-900 dark:text-slate-100 text-xs">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                  Giỏ Hàng Mua Lẻ
                </h2>
                <p className="text-[11px] text-slate-400">
                  {items.length === 0 ? 'Chưa có sản phẩm' : `${totalItemsCount} món trong giỏ hàng`}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
              title="Đóng giỏ hàng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Freeship Progress Bar (Shopee / Tiki Standard) */}
          {isAuth && items.length > 0 && (
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/40 border-b border-blue-100/80 dark:border-blue-900/40 text-xs">
              <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
                <div className="flex items-center gap-1.5">
                  <Truck className={`w-3.5 h-3.5 ${isFreeship ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`} />
                  {isFreeship ? (
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                      🎉 Chúc mừng! Đơn hàng được FREESHIP TOÀN QUỐC
                    </span>
                  ) : (
                    <span className="text-blue-700 dark:text-blue-300">
                      Mua thêm <strong className="text-orange-600 dark:text-orange-400 font-mono font-bold">{freeshipRemaining.toLocaleString('vi-VN')} đ</strong> để được <strong>FREESHIP</strong>
                    </span>
                  )}
                </div>
                <span className={`font-mono font-bold text-[11px] ${isFreeship ? 'text-emerald-600' : 'text-blue-600 dark:text-blue-400'}`}>
                  {freeshipProgress}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-blue-200/50 dark:bg-blue-950 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFreeship
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                  }`}
                  style={{ width: `${freeshipProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Body: Scrollable Items Area */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3">
            {!isAuth ? (
              <div className="py-16 text-center text-slate-400 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center border border-amber-500/20">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    Vui Lòng Đăng Nhập Tài Khoản
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Bạn cần đăng nhập tài khoản để thêm và quản lý sản phẩm trong giỏ hàng.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-orange-500/25"
                  >
                    <span>Đăng nhập ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center mx-auto mb-2">
                  <ShoppingBag className="w-8 h-8 opacity-60" />
                </div>
                <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  Giỏ hàng của bạn đang trống
                </p>
                <p className="text-xs max-w-xs mx-auto">
                  Hãy chọn các sản phẩm vật tư điện nước chính hãng để thêm vào giỏ.
                </p>
                <div className="pt-2">
                  <Link
                    href="/shop"
                    onClick={handleClose}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-orange-500/20"
                  >
                    <span>Khám phá sản phẩm</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const brand = inferBrand(item.name, item.sku);
                  const unit = inferUnit(item.name, item.sku);
                  const displayQty = qtyInputs[item.id] !== undefined ? qtyInputs[item.id] : String(item.quantity);
                  const itemTotal = item.unitPrice * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-xs transition-all"
                    >
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 p-1 shrink-0 border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                          <img
                            src={item.image || '/images/placeholder.png'}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.src = 'https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?q=80&w=150&h=150';
                            }}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60 uppercase tracking-wider mb-0.5">
                                {brand}
                              </span>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate leading-snug">
                                {item.name}
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1 rounded-lg transition-colors"
                              title="Xóa món này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* SKU & Unit */}
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                            <span>SKU: {item.sku || 'N/A'}</span>
                            <span>•</span>
                            <span className="text-slate-500 dark:text-slate-300 font-sans font-medium">ĐVT: {unit}</span>
                          </div>

                          {/* Price & Keyboard Stepper */}
                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                            <div>
                              <span className="font-mono font-extrabold text-xs sm:text-sm text-orange-600 dark:text-orange-400">
                                {itemTotal.toLocaleString('vi-VN')} đ
                              </span>
                              <span className="text-[10px] text-slate-400 block -mt-0.5 font-mono">
                                ({item.unitPrice.toLocaleString('vi-VN')} đ/{unit})
                              </span>
                            </div>

                            {/* Stepper with Direct Keyboard Input */}
                            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleDecrease(item.id, item.quantity)}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors active:scale-95"
                                title="Giảm số lượng"
                              >
                                <Minus className="w-3 h-3" />
                              </button>

                              <input
                                type="number"
                                min={1}
                                max={9999}
                                value={displayQty}
                                onChange={(e) => handleInputChange(item.id, e.target.value)}
                                onBlur={() => handleInputBlur(item.id, item.quantity)}
                                onKeyDown={(e) => handleInputKeyDown(e, item.id, item.quantity)}
                                className="w-10 h-7 text-center font-bold text-xs font-mono bg-transparent border-0 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 rounded text-slate-800 dark:text-slate-100 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                title="Click vào để gõ số lượng từ bàn phím"
                              />

                              <button
                                type="button"
                                onClick={() => handleIncrease(item.id, item.quantity)}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors active:scale-95"
                                title="Tăng số lượng"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Cross-sell accessory recommendation */}
                {!hasNanoTape && (
                  <div className="p-3 rounded-2xl border border-dashed border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                            Băng keo cách điện Nano 18m
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">Vật tư phụ thường mua kèm dây cáp</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-orange-600 text-xs">+12.000 đ</span>
                        <button
                          type="button"
                          onClick={handleAddNanoTape}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-all shadow-xs active:scale-95 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Thêm</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer: Price Breakdown, Actions & Trust Badges */}
          {isAuth && items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80 space-y-3">
              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Tạm tính hàng ({totalItemsCount} món):</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {totalPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Vận chuyển tiêu chuẩn:</span>
                  <span className={`font-mono font-semibold ${isFreeship ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {isFreeship ? 'Miễn phí' : 'Tính khi thanh toán'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200/70 dark:border-slate-800">
                  <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                    Tổng Thanh Toán:
                  </span>
                  <div className="text-right">
                    <div className="font-mono text-base sm:text-lg font-black text-orange-600 dark:text-orange-400">
                      {totalPrice.toLocaleString('vi-VN')} VND
                    </div>
                    <span className="text-[10px] text-slate-400 block -mt-0.5">
                      (Đã gồm thuế VAT & Hóa đơn điện tử)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleGoToCart}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Xem giỏ hàng</span>
                </button>

                <button
                  type="button"
                  onClick={handleGoToCheckout}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/25 transition-all active:scale-[0.98]"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Thanh toán ngay</span>
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-3 pt-1 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> 100% Chính hãng CO/CQ
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3 text-blue-500" /> Giao 2H hỏa tốc
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
