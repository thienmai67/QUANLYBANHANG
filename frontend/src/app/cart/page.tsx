'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';
import { useCartStore } from '@/store/useCartStore';
import { useAdminStore } from '@/store/useAdminStore';
import { MATERIAL_PRODUCTS } from '@/data/materialData';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  Package,
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const {
    items,
    removeItem,
    updateQuantity,
    setQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  } = useCartStore();

  const adminProducts = useAdminStore((state) => state.products);
  const fetchProducts = useAdminStore((state) => state.fetchProducts);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, [fetchProducts]);

  // Lookup product metadata helper
  const getProductMeta = (id: string, sku: string) => {
    // 1. Try adminProducts
    const adminProd = adminProducts.find(
      (p) => p.id === id || (p.sku && sku && p.sku.toLowerCase() === sku.toLowerCase())
    );
    if (adminProd) {
      const brandStr =
        typeof adminProd.brand === 'object' && adminProd.brand !== null
          ? (adminProd.brand as any).name
          : adminProd.brand || 'Chính hãng';
      const specsArr = Array.isArray(adminProd.specs)
        ? adminProd.specs.join(', ')
        : typeof adminProd.specs === 'string'
        ? adminProd.specs
        : '';
      const unitStr = (adminProd as any).unit || 'Bộ';
      return { brand: brandStr, specs: specsArr, unit: unitStr };
    }

    // 2. Try static MATERIAL_PRODUCTS
    const matProd = MATERIAL_PRODUCTS.find(
      (p) => p.id === id || (p.sku && sku && p.sku.toLowerCase() === sku.toLowerCase())
    );
    if (matProd) {
      return {
        brand: matProd.brand || 'Chính hãng',
        specs: Array.isArray(matProd.specs) ? matProd.specs.join(', ') : '',
        unit: matProd.unit || 'Bộ',
      };
    }

    // 3. Fallback heuristic from SKU / name
    let fallbackUnit = 'Bộ';
    const lowerName = sku.toLowerCase();
    if (lowerName.includes('upvc') || lowerName.includes('ppr') || lowerName.includes('cay')) {
      fallbackUnit = 'Cây';
    } else if (lowerName.includes('cad') || lowerName.includes('cv') || lowerName.includes('cuon')) {
      fallbackUnit = 'Cuộn';
    } else if (lowerName.includes('mcb') || lowerName.includes('pana') || lowerName.includes('van')) {
      fallbackUnit = 'Cái';
    }

    return {
      brand: 'Chính hãng',
      specs: 'Tiêu chuẩn TCVN',
      unit: fallbackUnit,
    };
  };

  const totalPrice = getTotalPrice();
  const totalItemsCount = getTotalItems();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] flex flex-col font-sans">
      <MaterialHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb / Stepper */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-blue-600 transition-colors">
            Cửa hàng
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-900 dark:text-white">Giỏ hàng</span>
        </div>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-orange-500" />
              <span>Giỏ Hàng Mua Lẻ</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Quản lý các sản phẩm vật tư điện nước bạn đã chọn trước khi thanh toán
            </p>
          </div>

          {mounted && items.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 font-medium">
                Tổng cộng: <strong className="text-slate-900 dark:text-white font-mono">{totalItemsCount}</strong> món
              </span>
              <button
                onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ sản phẩm khỏi giỏ hàng?')) {
                    clearCart();
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa tất cả</span>
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {!mounted ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Đang tải giỏ hàng...</p>
          </div>
        ) : items.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-16 text-center shadow-sm max-w-xl mx-auto my-8">
            <div className="w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 opacity-70" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Giỏ hàng của bạn đang trống
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              Chưa có sản phẩm vật tư nào trong giỏ. Hãy dạo quanh kho hàng chính hãng và chọn món bạn cần.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all text-sm"
            >
              <Package className="w-4 h-4" />
              <span>Khám phá sản phẩm ngay</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Free Shipping Progress Indicator */}
            {(() => {
              const freeShipThreshold = 500000;
              const isEligible = totalPrice >= freeShipThreshold;
              const remaining = Math.max(0, freeShipThreshold - totalPrice);
              const progressPercent = Math.min(100, Math.round((totalPrice / freeShipThreshold) * 100));

              return (
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                      <Truck className={`w-4 h-4 ${isEligible ? 'text-emerald-500' : 'text-orange-500'}`} />
                      {isEligible ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                          🎉 Đơn hàng của bạn đã đủ điều kiện MIỄN PHÍ VẬN CHUYỂN!
                        </span>
                      ) : (
                        <span>
                          Mua thêm <strong className="text-orange-500 font-mono font-black">{remaining.toLocaleString('vi-VN')} ₫</strong> để nhận <strong className="text-emerald-600 dark:text-emerald-400">Miễn Phí Giao Hàng</strong>!
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-400 hidden sm:inline">
                      {progressPercent}%
                    </span>
                  </div>

                  {/* Progress track */}
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isEligible
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Two Column Layout on Desktop, 1 Column on Mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Product Table (8 cols on desktop) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Product List Card */}
              <div className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Table Header on Desktop */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <div className="col-span-6">Sản phẩm & Quy cách</div>
                  <div className="col-span-2 text-right">Đơn giá</div>
                  <div className="col-span-2 text-center">Số lượng</div>
                  <div className="col-span-2 text-right">Thành tiền</div>
                </div>

                {/* Items */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item) => {
                    const meta = getProductMeta(item.id, item.sku);
                    const itemSubtotal = item.unitPrice * item.quantity;

                    return (
                      <div
                        key={item.id}
                        className="p-4 md:px-6 md:py-4 flex flex-col md:grid md:grid-cols-12 gap-4 items-center hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                      >
                        {/* Col 1: Product info (col-span-6 on desktop) */}
                        <div className="w-full md:col-span-6 flex items-center gap-3.5">
                          <img
                            src={item.image || '/images/placeholder.png'}
                            alt={item.name}
                            className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 bg-white"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.src = 'https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?q=80&w=200&h=200';
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                                {meta.brand}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                SKU: {item.sku || 'N/A'}
                              </span>
                            </div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                              {item.name}
                            </h3>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                              {meta.specs && <span className="truncate max-w-[200px]">{meta.specs}</span>}
                              <span className="font-medium text-slate-600 dark:text-slate-300">
                                • ĐVT: <strong className="text-slate-900 dark:text-white">{meta.unit}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Col 2: Unit Price (col-span-2 on desktop) */}
                        <div className="w-full md:col-span-2 flex md:flex-col justify-between items-center md:items-end text-xs md:text-right">
                          <span className="md:hidden text-slate-500 font-medium">Đơn giá:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {item.unitPrice.toLocaleString('vi-VN')} VND
                          </span>
                        </div>

                        {/* Col 3: Quantity Controls (col-span-2 on desktop) */}
                        <div className="w-full md:col-span-2 flex justify-between md:justify-center items-center">
                          <span className="md:hidden text-slate-500 font-medium text-xs">Số lượng:</span>
                          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-xl transition-colors active:scale-95"
                              title="Giảm số lượng"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                  setQuantity(item.id, val);
                                }
                              }}
                              className="w-12 h-8 text-center font-mono font-bold text-xs bg-transparent border-x border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-950/40"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-xl transition-colors active:scale-95"
                              title="Tăng số lượng"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Col 4: Subtotal & Delete (col-span-2 on desktop) */}
                        <div className="w-full md:col-span-2 flex justify-between md:justify-end items-center gap-3">
                          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center flex-1 md:flex-initial">
                            <span className="md:hidden text-slate-500 font-medium text-xs">Thành tiền:</span>
                            <span className="font-mono font-black text-sm text-orange-600 dark:text-orange-400">
                              {itemSubtotal.toLocaleString('vi-VN')} VND
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                            title="Xóa sản phẩm này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons below table */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <Link
                  href="/shop"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-white dark:hover:bg-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Tiếp tục mua thêm sản phẩm</span>
                </Link>
                <button
                  type="button"
                  onClick={() => router.push('/checkout')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all text-sm active:scale-98"
                >
                  <span>Tiến hành đặt hàng</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Column: Order Summary Card (4 cols on desktop) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm sticky top-24 space-y-5">
                <h2 className="font-bold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                  Tóm Tắt Đơn Hàng
                </h2>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Số lượng sản phẩm:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {totalItemsCount} món
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Tạm tính:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {totalPrice.toLocaleString('vi-VN')} VND
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
                      TỔNG THÀNH TIỀN:
                    </span>
                    <span className="font-mono font-black text-lg text-orange-600 dark:text-orange-400">
                      {totalPrice.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 italic text-right">
                    (Đã bao gồm thuế GTGT nếu có)
                  </p>
                </div>

                {/* Primary CTA */}
                <button
                  type="button"
                  onClick={() => router.push('/checkout')}
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all text-sm flex items-center justify-center gap-2 active:scale-98"
                >
                  <span>Tiến hành đặt hàng</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Trust Badges */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>100% Vật tư chính hãng chuẩn TCVN</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Hỗ trợ giao hàng hỏa tốc 2 giờ nội thành</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Đổi trả linh hoạt trong 7 ngày theo quy định</span>
                  </div>
                </div>
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