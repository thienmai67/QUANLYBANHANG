'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';
import { api } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useToast } from '@/hooks/useToast';
import {
  ChevronRight,
  ShoppingBag,
  Zap,
  Check,
  ShieldCheck,
  Truck,
  Package,
  AlertCircle,
  ArrowLeft,
  Minus,
  Plus,
} from 'lucide-react';

interface ProductDetailData {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  basePrice: number;
  unit: string;
  stock: number;
  image: string;
  description: string;
  diameterMm?: number | null;
  crossSectionMm2?: number | null;
  ampRating?: number | null;
  discountRate: number;
}

function normalizeProductDetail(raw: any): ProductDetailData {
  const specs =
    raw && typeof raw.specifications === 'object' && raw.specifications !== null
      ? raw.specifications
      : {};

  const brandName =
    typeof raw.brand === 'object' && raw.brand !== null
      ? raw.brand.name || raw.brand.code || 'Chính hãng'
      : raw.brand || 'Chính hãng';

  const categoryName =
    typeof raw.category === 'object' && raw.category !== null
      ? raw.category.name || raw.category.code || 'Vật tư M&E'
      : raw.category || 'Vật tư M&E';

  const basePrice = Number(raw.basePrice ?? raw.base_price ?? raw.price ?? 0);
  const unit = String(specs.unit || raw.unit || 'Cái');
  const stock = Number(specs.stock ?? raw.stock ?? 150);
  const image = String(specs.image || raw.image || '/images/products/day-cap-don-1.jpg');
  const description = String(
    specs.description ||
      raw.description ||
      `${raw.name} chính hãng ${brandName}, đạt tiêu chuẩn kỹ thuật công trình M&E.`
  );
  const discountRate = Number(
    specs.discountRate ?? raw.brand?.discountRate ?? raw.discountRate ?? 15
  );

  return {
    id: String(raw.id),
    sku: String(raw.sku || 'SKU-STD'),
    name: String(raw.name || ''),
    brand: String(brandName),
    category: String(categoryName),
    basePrice,
    unit,
    stock,
    image,
    description,
    diameterMm: raw.diameterMm ?? raw.diameter_mm ?? null,
    crossSectionMm2: raw.crossSectionMm2 ?? raw.cross_section_mm2 ?? null,
    ampRating: raw.ampRating ?? raw.amp_rating ?? null,
    discountRate,
  };
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const productId = params?.id ? decodeURIComponent(String(params.id)) : '';

  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFoundError, setNotFoundError] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { addItem, setOpenToCheckout } = useCartStore();

  useEffect(() => {
    let cancelled = false;
    async function loadProduct() {
      if (!productId) {
        setNotFoundError(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      setNotFoundError(false);

      try {
        const data = await api.get<any>(`/products/${encodeURIComponent(productId)}`);
        if (!cancelled && data && data.id) {
          setProduct(normalizeProductDetail(data));
          setLoading(false);
          return;
        }
      } catch {
        // Only try SKU lookup if productId is not a UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(productId)) {
          try {
            const bySku = await api.get<any>(`/products/sku/${encodeURIComponent(productId)}`);
            if (!cancelled && bySku && bySku.id) {
              setProduct(normalizeProductDetail(bySku));
              setLoading(false);
              return;
            }
          } catch {
            // fall through to 404
          }
        }
      }

      if (!cancelled) {
        setProduct(null);
        setNotFoundError(true);
        setLoading(false);
      }
    }

    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    const priceFormatted = `${product.basePrice.toLocaleString('vi-VN')} ₫`;
    addItem(
      {
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: priceFormatted,
        unitPrice: product.basePrice,
        image: product.image,
        quantity,
      },
      true
    );
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    const priceFormatted = `${product.basePrice.toLocaleString('vi-VN')} ₫`;
    const token = getAccessToken();

    addItem(
      {
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: priceFormatted,
        unitPrice: product.basePrice,
        image: product.image,
        quantity,
      },
      false
    );

    if (!token && !isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để đặt hàng');
      router.push(`/login?redirect=/product/${encodeURIComponent(product.id)}`);
      return;
    }

    setOpenToCheckout(true);
    useCartStore.getState().setIsOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors">
      <MaterialHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6 flex-wrap">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/shop" className="hover:text-blue-600 transition-colors">
            Cửa hàng vật tư
          </Link>
          {product && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                {product.name}
              </span>
            </>
          )}
        </nav>

        {loading ? (
          <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3 shadow-sm">
            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-500">
              Đang tải thông tin chi tiết sản phẩm...
            </p>
          </div>
        ) : notFoundError || !product ? (
          <div
            data-testid="product-not-found"
            className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto my-8 space-y-5 shadow-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold">
                404 NOT FOUND
              </span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                Không Tìm Thấy Sản Phẩm
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Mã sản phẩm <span className="font-mono font-bold">{productId}</span> không tồn tại hoặc đã ngừng kinh doanh.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại cửa hàng</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Left: Large Product Image (5 cols) */}
              <div className="lg:col-span-5">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-4 left-4 px-3 py-1 bg-slate-900/85 backdrop-blur-md text-white font-bold text-xs rounded-xl shadow">
                    {product.brand}
                  </span>
                </div>
              </div>

              {/* Right: Product Info & Actions (7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                <div className="space-y-5">
                  {/* Brand, Category, SKU badges */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-200 dark:border-blue-900">
                      Hãng: {product.brand}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                      SKU: {product.sku}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 text-xs font-semibold">
                      {product.category}
                    </span>
                  </div>

                  {/* Product Title */}
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug">
                    {product.name}
                  </h1>

                  {/* Price & Stock Box */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Giá bán niêm yết
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
                          {product.basePrice.toLocaleString('vi-VN')} ₫
                        </span>
                        <span className="text-sm font-semibold text-slate-500">
                          / {product.unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Tình trạng kho
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Package className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {product.stock > 0
                            ? `Còn hàng (${product.stock} ${product.unit})`
                            : 'Hết hàng'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                      Mô tả sản phẩm
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Technical Specs Table */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Đơn vị tính</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {product.unit}
                      </span>
                    </div>
                    {product.diameterMm ? (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[11px] text-slate-400 block">Đường kính ống</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Ø {product.diameterMm} mm
                        </span>
                      </div>
                    ) : null}
                    {product.crossSectionMm2 ? (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[11px] text-slate-400 block">Tiết diện dây</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {product.crossSectionMm2} mm²
                        </span>
                      </div>
                    ) : null}
                    {product.ampRating ? (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[11px] text-slate-400 block">Dòng định mức</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {product.ampRating} A
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Quantity + Action Buttons */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-5">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Số lượng:
                    </span>
                    <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                        aria-label="Giảm số lượng"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                        aria-label="Tăng số lượng"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={product.stock <= 0}
                      className={`py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all ${
                        addedFeedback
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      {addedFeedback ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Đã Thêm Vào Giỏ!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>Thêm Vào Giỏ</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleBuyNow}
                      disabled={product.stock <= 0}
                      className="py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Mua Ngay</span>
                    </button>
                  </div>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Cam kết chính hãng 100% — Đầy đủ chứng chỉ CO/CQ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Giao nhanh 2H chân công trình — Hỗ trợ thanh toán COD</span>
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
