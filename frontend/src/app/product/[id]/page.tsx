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
  PackageCheck,
  Store,
  Phone,
  MessageCircle,
  Wrench,
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
      ? raw.brand.name || raw.brand.code || '—'
      : raw.brand || '—';

  const categoryName =
    typeof raw.category === 'object' && raw.category !== null
      ? raw.category.name || raw.category.code || '—'
      : raw.category || '—';

  const basePrice = Number(raw.basePrice ?? raw.base_price ?? raw.price ?? 0);
  const unit = String(specs.unit || raw.unit || '—');
  const stock = Number(specs.stock ?? raw.stock ?? raw.stock_quantity ?? 0);
  const image = String(specs.image || raw.image || '');
  const description = String(
    specs.description ||
      raw.description ||
      `${raw.name}`
  );
  const discountRate = Number(
    specs.discountRate ?? raw.brand?.discountRate ?? raw.discountRate ?? 0
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

interface AccessoryItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  image: string;
}

function getRecommendedAccessories(product: ProductDetailData): AccessoryItem[] {
  const text = `${product.name} ${product.category} ${product.sku}`.toLowerCase();
  if (text.includes('ống') || text.includes('upvc') || text.includes('ppr') || text.includes('bình minh') || text.includes('tiền phong')) {
    return [
      {
        id: 'acc-keo-upvc-200g',
        name: 'Keo dán ống nhựa uPVC Bình Minh (Tuýp 200g)',
        price: 28000,
        unit: 'Tuýp',
        image: '/images/products/ong-binh-minh-1.jpg',
      },
      {
        id: 'acc-bang-tan-cao-su',
        name: 'Băng tan cao su non quấn ren chống xì nước',
        price: 6000,
        unit: 'Cuộn',
        image: '/images/products/ong-binh-minh-1.jpg',
      },
    ];
  }
  if (text.includes('dây') || text.includes('cáp') || text.includes('cadivi') || text.includes('điện')) {
    return [
      {
        id: 'acc-bang-keo-nano',
        name: 'Băng keo cách điện Nano chống cháy 10m',
        price: 8000,
        unit: 'Cuộn',
        image: '/images/products/day-cap-don-1.jpg',
      },
      {
        id: 'acc-ong-ruot-ga-phi16',
        name: 'Ống gen ruột gà chống cháy luồn dây Φ16 (10m)',
        price: 35000,
        unit: 'Cuộn',
        image: '/images/products/day-cap-don-1.jpg',
      },
    ];
  }
  if (text.includes('mcb') || text.includes('aptomat') || text.includes('công tắc') || text.includes('ổ cắm') || text.includes('schneider') || text.includes('panasonic')) {
    return [
      {
        id: 'acc-de-am-chu-nhat',
        name: 'Hộp đế âm tường chữ nhật chống cháy Sino',
        price: 5000,
        unit: 'Cái',
        image: '/images/products/schneider-mcb-1.jpg',
      },
      {
        id: 'acc-but-thu-dien',
        name: 'Bút thử điện thông minh có đèn báo an toàn',
        price: 32000,
        unit: 'Cái',
        image: '/images/products/schneider-mcb-1.jpg',
      },
    ];
  }
  return [
    {
      id: 'acc-bang-keo-nano',
      name: 'Băng keo cách điện Nano chuyên dụng',
      price: 8000,
      unit: 'Cuộn',
      image: '/images/products/day-cap-don-1.jpg',
    },
    {
      id: 'acc-gang-tay-bao-ho',
      name: 'Găng tay sợi bảo hộ thi công cơ điện',
      price: 12000,
      unit: 'Đôi',
      image: '/images/products/schneider-mcb-1.jpg',
    },
  ];
}


function getInstallationAdvice(product: ProductDetailData): { title: string; tips: string[] } {
  const text = `${product.name} ${product.category} ${product.sku}`.toLowerCase();
  if (text.includes('ống') || text.includes('upvc') || text.includes('ppr') || text.includes('bình minh') || text.includes('tiền phong')) {
    return {
      title: '💡 Mẹo Dán Ống Nước & Thi Công Tại Nhà',
      tips: [
        'Cắt vuông góc miệng ống, mài vát nhẹ đầu ống và lau khô tuyệt đối bụi bẩn trước khi quét keo.',
        'Quét đều keo dán PVC lên cả đầu ống và mặt trong phụ kiện, ấn sâu dứt khoát và giữ chặt 15 giây (không xoay).',
        'Với mối nối ren đồng / nhựa: Quấn băng tan xuôi theo chiều kim đồng hồ 12 - 15 vòng để chống rò rỉ nước ngầm.',
      ],
    };
  }
  if (text.includes('dây') || text.includes('cáp') || text.includes('cadivi') || text.includes('điện')) {
    return {
      title: '💡 Mẹo Đấu Nối Cáp Điện An Toàn',
      tips: [
        'Luôn dập cầu dao / ngắt aptomat tổng và dùng bút thử điện kiểm tra trước khi tiến hành đấu nối.',
        'Tuốt vỏ vừa vặn khoảng 10 - 12mm, tránh cắt cứa vào lõi đồng làm giảm tiết diện dẫn điện sinh nhiệt.',
        'Băng keo cách điện nano cần quấn chồng nửa lớp tối thiểu 3 vòng để đảm bảo chống ẩm và chập cháy.',
      ],
    };
  }
  if (text.includes('mcb') || text.includes('aptomat') || text.includes('công tắc') || text.includes('ổ cắm') || text.includes('schneider') || text.includes('panasonic')) {
    return {
      title: '💡 Hướng Dẫn Lắp Đặt Aptomat / Ổ Cắm Gia Đình',
      tips: [
        'Nguồn điện vào bắt buộc đấu ở cực trên (LINE / TOP), tải ra thiết bị đấu ở cực dưới (LOAD / BOTTOM).',
        'Dùng tua-vít đúng cỡ siết chặt chân ốc để tránh bị đánh tia lửa điện và sinh nhiệt move tiếp điểm.',
        'Với bình nóng lạnh hoặc khu vực ẩm ướt phòng tắm, ưu tiên dùng Aptomat chống giật (RCBO độ nhạy 30mA).',
      ],
    };
  }
  return {
    title: '💡 Hướng Dẫn Thi Công & Lưu Ý Kỹ Thuật',
    tips: [
      'Kiểm tra kỹ quy cách ren và kích cỡ thiết bị trước khi tháo lắp để tránh mua nhầm quy chuẩn.',
      'Trang bị găng tay bảo hộ và dụng cụ chuyên dụng khi lắp đặt để đảm bảo an toàn tuyệt đối.',
      'Cần hỗ trợ gấp? Bấm nút Chat Zalo hoặc gọi ngay Kỹ thuật viên tại quầy để được hướng dẫn trực tiếp.',
    ],
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
  const [qtyInput, setQtyInput] = useState<string>('1');
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);
  const [selectedAccs, setSelectedAccs] = useState<Record<string, boolean>>({});

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
    const maxStock = product.stock > 0 ? product.stock : 9999;
    const parsed = parseInt(qtyInput, 10);
    const effectiveQty = Number.isNaN(parsed) ? quantity : Math.max(1, Math.min(maxStock, parsed));
    setQuantity(effectiveQty);
    setQtyInput(String(effectiveQty));

    const priceFormatted = `${product.basePrice.toLocaleString('vi-VN')} ₫`;
    addItem(
      {
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: priceFormatted,
        unitPrice: product.basePrice,
        image: product.image,
        quantity: effectiveQty,
      },
      true
    );

    const accessories = getRecommendedAccessories(product);
    accessories.forEach((acc) => {
      if (selectedAccs[acc.id]) {
        addItem(
          {
            id: acc.id,
            sku: acc.id.toUpperCase(),
            name: acc.name,
            price: `${acc.price.toLocaleString('vi-VN')} ₫`,
            unitPrice: acc.price,
            image: acc.image,
            quantity: 1,
          },
          false
        );
      }
    });

    toast.success(`Đã thêm ${effectiveQty}x "${product.name}" vào giỏ hàng`);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    const maxStock = product.stock > 0 ? product.stock : 9999;
    const parsed = parseInt(qtyInput, 10);
    const effectiveQty = Number.isNaN(parsed) ? quantity : Math.max(1, Math.min(maxStock, parsed));
    setQuantity(effectiveQty);
    setQtyInput(String(effectiveQty));

    const priceFormatted = `${product.basePrice.toLocaleString('vi-VN')} ₫`;
    addItem(
      {
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: priceFormatted,
        unitPrice: product.basePrice,
        image: product.image,
        quantity: effectiveQty,
      },
      false
    );

    const accessories = getRecommendedAccessories(product);
    accessories.forEach((acc) => {
      if (selectedAccs[acc.id]) {
        addItem(
          {
            id: acc.id,
            sku: acc.id.toUpperCase(),
            name: acc.name,
            price: `${acc.price.toLocaleString('vi-VN')} ₫`,
            unitPrice: acc.price,
            image: acc.image,
            quantity: 1,
          },
          false
        );
      }
    });

    router.push('/checkout');
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

                  {/* Installation Advice Box (Minh Lý pattern) */}
                  {(() => {
                    const advice = getInstallationAdvice(product);
                    return (
                      <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 space-y-2.5">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs uppercase tracking-wider">
                          <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>{advice.title}</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                          {advice.tips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-blue-500 font-bold shrink-0">•</span>
                              <span className="leading-relaxed">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}


                {/* Frequently Bought Together Accessories */}
                {(() => {
                  const accessories = getRecommendedAccessories(product);
                  const selectedAccCount = accessories.filter((a) => selectedAccs[a.id]).length;
                  const accAddonTotal = accessories
                    .filter((a) => selectedAccs[a.id])
                    .reduce((sum, a) => sum + a.price, 0);
                  const totalWithAccessories = product.basePrice * quantity + accAddonTotal;

                  return (
                    <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <PackageCheck className="w-4 h-4" /> Đừng quên mua kèm phụ kiện
                        </span>
                        <span className="text-[11px] text-slate-500">Tránh thiếu đồ khi thợ đến lắp</span>
                      </div>

                      <div className="space-y-2">
                        {accessories.map((acc) => {
                          const isChecked = !!selectedAccs[acc.id];
                          return (
                            <label
                              key={acc.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                isChecked
                                  ? 'bg-white dark:bg-slate-900 border-amber-500 shadow-sm'
                                  : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    setSelectedAccs((prev) => ({
                                      ...prev,
                                      [acc.id]: e.target.checked,
                                    }));
                                  }}
                                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                                />
                                <div>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                    {acc.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Quy cách: 1 {acc.unit}
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                                +{acc.price.toLocaleString('vi-VN')} ₫
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      {accAddonTotal > 0 && (
                        <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <span>Tổng tiền gồm {selectedAccCount} phụ kiện:</span>
                          <span className="text-sm font-black font-mono text-orange-500">
                            {totalWithAccessories.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Quantity + Action Buttons */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-5">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Số lượng:
                    </span>
                    <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => {
                          const maxStock = product && product.stock > 0 ? product.stock : 9999;
                          setQuantity((q) => {
                            const next = Math.max(1, q - 1);
                            setQtyInput(String(next));
                            return next;
                          });
                        }}
                        className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                        aria-label="Giảm số lượng"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={product && product.stock > 0 ? product.stock : 9999}
                        value={qtyInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQtyInput(val);
                          if (val === '') {
                            return;
                          }
                          const parsed = parseInt(val, 10);
                          if (!isNaN(parsed)) {
                            const maxStock = product && product.stock > 0 ? product.stock : 9999;
                            const clamped = Math.max(1, Math.min(maxStock, parsed));
                            setQuantity(clamped);
                          }
                        }}
                        onBlur={() => {
                          const maxStock = product && product.stock > 0 ? product.stock : 9999;
                          const parsed = parseInt(qtyInput, 10);
                          const finalQty = Number.isNaN(parsed) ? 1 : Math.max(1, Math.min(maxStock, parsed));
                          setQuantity(finalQty);
                          setQtyInput(String(finalQty));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const maxStock = product && product.stock > 0 ? product.stock : 9999;
                            const parsed = parseInt(qtyInput, 10);
                            const finalQty = Number.isNaN(parsed) ? 1 : Math.max(1, Math.min(maxStock, parsed));
                            setQuantity(finalQty);
                            setQtyInput(String(finalQty));
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        className="w-14 h-9 text-center font-mono font-bold text-sm bg-transparent border-x border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-950/40"
                        aria-label="Nhập số lượng sản phẩm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const maxStock = product && product.stock > 0 ? product.stock : 9999;
                          setQuantity((q) => {
                            const next = Math.min(maxStock, q + 1);
                            setQtyInput(String(next));
                            return next;
                          });
                        }}
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
                      <span>Giao nhanh trong ngày tận nhà — Hỗ trợ ship hỏa tốc Grab/Ahamove khi cần gấp</span>
                    </div>
                  </div>

                  {/* Physical Store & Technician Support Box (Minh Lý pattern) */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-blue-600" /> Cửa Hàng Vật Tư M&E TDT (Có sẵn hàng tại chỗ)
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Mở cửa: 7h30 - 20h00
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      📍 <strong>CN1:</strong> 80/3A Đường Thới Tam Thôn, Hóc Môn • <strong>CN2:</strong> 315 Nguyễn Oanh, Gò Vấp, TP.HCM
                    </p>
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        <span>Kỹ thuật viên tại quầy: </span>
                        <a href="tel:0937292769" className="font-mono font-bold text-blue-600 hover:underline">0937.292.769</a>
                      </div>
                      <a
                        href="https://zalo.me/0937292769"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat Zalo Gửi Ảnh</span>
                      </a>
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
