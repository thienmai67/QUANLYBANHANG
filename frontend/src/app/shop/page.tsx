'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';
import { MaterialProduct } from '@/data/materialData';
import { useAdminStore } from '@/store/useAdminStore';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getAccessToken } from '@/lib/auth';
import { useToast } from '@/hooks/useToast';
import {
  Search,
  Filter,
  ShoppingBag,
  Check,
  Zap,
  Sparkles,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  RotateCcw,
} from 'lucide-react';

type DiyCategory = 'ALL' | 'PLUMBING' | 'AIR_COND' | 'LIGHTING' | 'PANEL';
type SortOption = 'DEFAULT' | 'PRICE_ASC' | 'PRICE_DESC' | 'NAME_ASC';

const DIY_CHIPS: Array<{
  id: DiyCategory;
  label: string;
  sub: string;
  icon: string;
}> = [
  { id: 'ALL', label: 'Tất Cả Sản Phẩm', sub: 'Toàn bộ vật tư M&E', icon: '🏷️' },
  { id: 'PLUMBING', label: 'Sửa Nước & Thoát Sàn', sub: 'Ống Bình Minh, Co, Lơ, Tê', icon: '🚿' },
  { id: 'AIR_COND', label: 'Máy Lạnh & Nóng Lạnh', sub: 'Dây Cadivi, CB Schneider', icon: '❄️' },
  { id: 'LIGHTING', label: 'Chiếu Sáng & Đèn LED', sub: 'Đèn LED, cáp nguồn, công tắc', icon: '💡' },
  { id: 'PANEL', label: 'Tủ Điện & CB An Toàn', sub: 'Aptomat MCCB/MCB tổng, tủ âm', icon: '⚡' },
];

function removeVietnameseTones(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

type PriceRange = 'ALL' | 'UNDER_50K' | '50K_200K' | '200K_1M' | 'OVER_1M';

function matchSearchTerm(pText: string, search: string): boolean {
  const qNorm = removeVietnameseTones(search);
  if (!qNorm) return true;
  const qTokens = qNorm.split(/\s+/).filter(Boolean);
  return qTokens.every((token) => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('(?:^|[\\s\\-_/(\\[,.])' + escaped + '(?:$|[\\s\\-_/)\\],.])', 'i');
    return re.test(pText);
  });
}

function getProductCategoryName(p: any): string {
  const catObj = typeof p.category === 'object' && p.category !== null ? p.category : null;
  const catCode = (catObj?.code || p.categoryCode || '').toUpperCase();
  const catName = catObj?.name || p.categoryName || (typeof p.category === 'string' ? p.category : '');
  const brand = (typeof p.brand === 'object' && p.brand !== null ? p.brand.name : p.brand || '').toLowerCase();
  const name = (p.name || '').toLowerCase();
  const sku = (p.sku || '').toLowerCase();

  if (
    brand.includes('bình minh') ||
    brand.includes('binh minh') ||
    sku.startsWith('bm') ||
    catCode === 'PIPE' ||
    catCode === 'WATER_PIPE' ||
    catCode === 'FITTING' ||
    name.includes('ống')
  ) {
    return 'Ống & Phụ Kiện Nhựa';
  }
  if (
    brand.includes('cadivi') ||
    sku.startsWith('cad') ||
    sku.startsWith('cv') ||
    catCode === 'CABLE' ||
    name.includes('dây') ||
    name.includes('cáp')
  ) {
    return 'Dây & Cáp Điện';
  }
  if (
    brand.includes('schneider') ||
    brand.includes('panasonic') ||
    sku.startsWith('sch') ||
    sku.startsWith('pan') ||
    name.includes('mcb') ||
    name.includes('mccb') ||
    name.includes('aptomat') ||
    name.includes('công tắc') ||
    name.includes('ổ cắm') ||
    name.includes('máy bơm')
  ) {
    return 'Tủ & Thiết Bị Đóng Cắt';
  }
  if (
    sku.startsWith('led-') ||
    sku.startsWith('zn-') ||
    catCode.includes('LED') ||
    name.includes('đèn') ||
    name.includes('led') ||
    name.includes('sip') ||
    name.includes('đồng hồ') ||
    brand.includes('other')
  ) {
    return 'Thiết Bị Chiếu Sáng & Khác';
  }

  if (catName.includes('Ống') || catName.includes('Nhựa')) return 'Ống & Phụ Kiện Nhựa';
  if (catName.includes('Dây') || catName.includes('Cáp')) return 'Dây & Cáp Điện';
  if (catName.includes('Thiết bị') || catName.includes('Đóng cắt')) return 'Tủ & Thiết Bị Đóng Cắt';

  return 'Thiết Bị Chiếu Sáng & Khác';
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [selectedDiy, setSelectedDiy] = useState<DiyCategory>('ALL');
  const [selectedPrice, setSelectedPrice] = useState<PriceRange>('ALL');
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('DEFAULT');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  const [addedItemMap, setAddedItemMap] = useState<Record<string, boolean>>({});

  const adminProducts = useAdminStore((state) => state.products);
  const fetchProducts = useAdminStore((state) => state.fetchProducts);
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const productsLoading = useAdminStore((state) => state.productsLoading);

  const updateUrlParam = (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (value && value !== 'ALL') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const newQuery = params.toString();
    const newUrl = newQuery ? `/shop?${newQuery}` : '/shop';
    router.replace(newUrl, { scroll: false });
  };

  // Read URL query params
  useEffect(() => {
    const catParam = searchParams.get('cat');
    const brandParam = searchParams.get('brand');
    const diyParam = searchParams.get('diy');
    const searchParam = searchParams.get('search');
    const priceParam = searchParams.get('price');

    if (catParam) setSelectedCat(catParam);
    if (brandParam) setSelectedBrand(brandParam);
    if (searchParam) setSearch(searchParam);
    if (priceParam && ['ALL', 'UNDER_50K', '50K_200K', '200K_1M', 'OVER_1M'].includes(priceParam)) {
      setSelectedPrice(priceParam as PriceRange);
    }
    if (diyParam && ['ALL', 'PLUMBING', 'AIR_COND', 'LIGHTING', 'PANEL'].includes(diyParam)) {
      setSelectedDiy(diyParam as DiyCategory);
    }
  }, [searchParams]);

  // Standardize products
  const allProducts: MaterialProduct[] = useMemo(() => {
    if (adminProducts && adminProducts.length > 0) {
      const list = adminProducts.map((p) => {
        const base = p.basePrice ?? (typeof p.price === 'number' ? p.price : 0);
        const disc = p.discountRate ?? p.discount ?? 0;
        const rate = disc > 1 ? disc / 100 : disc;
        const rawPrice = rate > 0 ? Math.round(base * (1 - rate)) : base;
        const priceStr = `${rawPrice.toLocaleString('vi-VN')} ₫`;

        const specsArr = Array.isArray(p.specs)
          ? p.specs
          : typeof p.specs === 'string'
          ? [p.specs]
          : [`Thương hiệu: ${p.brand || 'Chính hãng'}`, `Đơn vị: ${p.unit || 'Chuẩn'}`];

        const canonicalCat = getProductCategoryName(p);

        return {
          id: p.id,
          sku: p.sku || 'SKU-STD',
          name: p.name,
          brand: p.brand || 'Chính hãng',
          category: canonicalCat as any,
          categoryName: canonicalCat,
          origin: 'Việt Nam',
          price: priceStr,
          rawPrice: rawPrice,
          unit: p.unit || 'Bộ',
          conversion: p.unit ? `1 ${p.unit}` : '1 Bộ',
          description: p.description || p.name,
          image: p.image || '',
          badge: (p.badge as any) || 'NEW',
          specs: specsArr,
          discount: p.discountRate ?? p.discount ?? 0,
        };
      });
      return list.sort((a, b) => a.name.localeCompare(b.name, 'vi') || (a.sku || '').localeCompare(b.sku || '') || a.id.localeCompare(b.id));
    }
    return [];
  }, [adminProducts]);

  const availableCategories = useMemo(() => {
    return [
      'Dây & Cáp Điện',
      'Ống & Phụ Kiện Nhựa',
      'Tủ & Thiết Bị Đóng Cắt',
      'Thiết Bị Chiếu Sáng & Khác',
    ];
  }, []);

  const availableBrands = useMemo(() => {
    const brands = Array.from(new Set(allProducts.map((p) => p.brand).filter(Boolean)));
    return brands.length > 0
      ? brands
      : ['Cadivi', 'Bình Minh', 'Schneider Electric', 'Panasonic'];
  }, [allProducts]);

  // Filtering + Sorting
  const filteredProducts = useMemo(() => {
    const qNorm = removeVietnameseTones(search);

    const filtered = allProducts.filter((p) => {
      const pNameNorm = removeVietnameseTones(p.name);
      const pSkuNorm = removeVietnameseTones(p.sku);
      const pBrandNorm = removeVietnameseTones(p.brand);
      const pCatNorm = removeVietnameseTones(p.categoryName || (p.category as any) || '');
      const pSearchTarget = `${pNameNorm} ${pSkuNorm} ${pBrandNorm} ${pCatNorm}`;

      const matchesSearch = matchSearchTerm(pSearchTarget, search);

      const matchesBrand = selectedBrand === 'ALL' || p.brand === selectedBrand;
      const matchesCat =
        selectedCat === 'ALL' ||
        p.categoryName === selectedCat ||
        (p.category as any) === selectedCat;

      let matchesDiy = true;
      const fullText = `${pNameNorm} ${pSkuNorm} ${pBrandNorm}`;
      if (selectedDiy === 'PLUMBING') {
        matchesDiy = p.categoryName === 'Ống & Phụ Kiện Nhựa';
      } else if (selectedDiy === 'AIR_COND') {
        matchesDiy =
          (p.categoryName === 'Dây & Cáp Điện' && (fullText.includes('2.5') || fullText.includes('4.0'))) ||
          (p.categoryName === 'Tủ & Thiết Bị Đóng Cắt' && (fullText.includes('16a') || fullText.includes('20a') || fullText.includes('32a')));
      } else if (selectedDiy === 'LIGHTING') {
        matchesDiy =
          fullText.includes('den') ||
          fullText.includes('led') ||
          fullText.includes('cong tac') ||
          fullText.includes('o cam') ||
          fullText.includes('1.5');
      } else if (selectedDiy === 'PANEL') {
        matchesDiy =
          p.categoryName === 'Tủ & Thiết Bị Đóng Cắt' ||
          fullText.includes('mccb') ||
          fullText.includes('tu dien') ||
          fullText.includes('tong');
      }

      let matchesPrice = true;
      const price = p.rawPrice || 0;
      if (selectedPrice === 'UNDER_50K') {
        matchesPrice = price < 50000;
      } else if (selectedPrice === '50K_200K') {
        matchesPrice = price >= 50000 && price <= 200000;
      } else if (selectedPrice === '200K_1M') {
        matchesPrice = price >= 200000 && price <= 1000000;
      } else if (selectedPrice === 'OVER_1M') {
        matchesPrice = price > 1000000;
      }

      return matchesSearch && matchesBrand && matchesCat && matchesDiy && matchesPrice;
    });

    // Apply Sorting
    const sorted = [...filtered];
    if (sortBy === 'PRICE_ASC') {
      sorted.sort((a, b) => (a.rawPrice || 0) - (b.rawPrice || 0));
    } else if (sortBy === 'PRICE_DESC') {
      sorted.sort((a, b) => (b.rawPrice || 0) - (a.rawPrice || 0));
    } else if (sortBy === 'NAME_ASC') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }

    return sorted;
  }, [allProducts, search, selectedBrand, selectedCat, selectedDiy, sortBy]);

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const currentSafePage = Math.min(currentPage, totalPages);
  const startIndex = (currentSafePage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedBrand('ALL');
    setSelectedCat('ALL');
    setSelectedDiy('ALL');
    setSortBy('DEFAULT');
    setCurrentPage(1);
    router.replace('/shop');
  };

  const handleAddToCart = (prod: MaterialProduct) => {
    const isAuth = useAuthStore.getState().isAuthenticated || !!getAccessToken();
    if (!isAuth) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    const rawPrice = prod.rawPrice || parseInt(prod.price.replace(/[^\d]/g, ''), 10) || 100000;

    addItem(
      {
        id: prod.id,
        sku: prod.sku,
        name: prod.name,
        price: prod.price,
        unitPrice: rawPrice,
        image: prod.image,
      },
      false
    );

    toast.success(`Đã thêm "${prod.name}" vào giỏ hàng`);

    setAddedItemMap((prev) => ({ ...prev, [prod.id]: true }));
    setTimeout(() => {
      setAddedItemMap((prev) => ({ ...prev, [prod.id]: false }));
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors">
      <MaterialHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner header */}
        <div className="p-8 bg-gradient-to-r from-blue-900 via-cyan-900 to-slate-900 text-white rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-cyan-800">
          <div>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-bold border border-cyan-500/30 uppercase tracking-wider">
              Cửa Hàng Vật Tư M&E — Bán Lẻ Cho Gia Đình &amp; Thợ Sửa Chữa
            </span>
            <h1 className="text-3xl font-black mt-3">Tất Cả Sản Phẩm &amp; Vật Tư M&E</h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Giá bán lẻ minh bạch từng mét/cái, sẵn kho giao nhanh trong ngày tận nhà (Miễn phí COD toàn quốc).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              Sẵn Kho Giao Nhanh • Miễn Phí Vận Chuyển
            </span>
          </div>
        </div>

        {/* DIY Need-Based Quick Filter Chips */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Chọn Nhanh Theo Nhu Cầu Sửa Chữa Gia Đình:
              </span>
            </div>
            {(selectedDiy !== 'ALL' || selectedCat !== 'ALL' || selectedBrand !== 'ALL' || search.trim() !== '') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-bold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xóa toàn bộ bộ lọc</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {DIY_CHIPS.map((chip) => {
              const isActive = selectedDiy === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    setSelectedDiy(chip.id);
                    setCurrentPage(1);
                  }}
                  className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                    isActive
                      ? 'bg-gradient-to-br from-cyan-900 to-blue-900 text-white border-cyan-400 shadow-lg shadow-cyan-900/30'
                      : 'bg-white dark:bg-[#0c1322] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xl">{chip.icon}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </div>
                  <div className="mt-2">
                    <h4 className="font-bold text-xs">{chip.label}</h4>
                    <p className={`text-[10px] mt-0.5 line-clamp-1 ${isActive ? 'text-cyan-200' : 'text-slate-400'}`}>
                      {chip.sub}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search, Category, Brand and Sort Controls */}
        <div className="p-4 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                const val = e.target.value;
                setSearch(val);
                updateUrlParam('search', val);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên sản phẩm, mã SKU, hãng..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-cyan-500 rounded-xl text-slate-900 dark:text-slate-100 font-medium outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-500">
              <Filter className="w-3.5 h-3.5" /> Danh mục:
            </div>
            <select
              value={selectedCat}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCat(val);
                updateUrlParam('cat', val);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-transparent rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:border-cyan-500 outline-none"
            >
              <option value="ALL">Tất cả danh mục ({allProducts.length})</option>
              {availableCategories.map((cat) => {
                const count = allProducts.filter((p) => p.categoryName === cat).length;
                return (
                  <option key={cat} value={cat}>
                    {cat} ({count})
                  </option>
                );
              })}
            </select>

            <div className="flex items-center gap-1.5 font-semibold text-slate-500 ml-1">
              Thương hiệu:
            </div>
            <select
              value={selectedBrand}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedBrand(val);
                updateUrlParam('brand', val);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-transparent rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:border-cyan-500 outline-none"
            >
              <option value="ALL">Tất cả hãng</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 font-semibold text-slate-500 ml-1">
              Khoảng giá:
            </div>
            <select
              value={selectedPrice}
              onChange={(e) => {
                const val = e.target.value as PriceRange;
                setSelectedPrice(val);
                updateUrlParam('price', val);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-transparent rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:border-cyan-500 outline-none"
            >
              <option value="ALL">Tất cả mức giá</option>
              <option value="UNDER_50K">Dưới 50.000₫</option>
              <option value="50K_200K">50.000₫ - 200.000₫</option>
              <option value="200K_1M">200.000₫ - 1.000.000₫</option>
              <option value="OVER_1M">Trên 1.000.000₫</option>
            </select>

            <div className="flex items-center gap-1.5 font-semibold text-slate-500 ml-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sắp xếp:
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-transparent rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:border-cyan-500 outline-none"
            >
              <option value="DEFAULT">Nổi bật / Mặc định</option>
              <option value="PRICE_ASC">Giá tăng dần (Thấp &rarr; Cao)</option>
              <option value="PRICE_DESC">Giá giảm dần (Cao &rarr; Thấp)</option>
              <option value="NAME_ASC">Tên sản phẩm (A &rarr; Z)</option>
            </select>
          </div>
        </div>

        {/* Results summary bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Hiển thị <strong>{totalItems > 0 ? startIndex + 1 : 0}</strong> -{' '}
            <strong>{Math.min(startIndex + itemsPerPage, totalItems)}</strong> trên tổng số{' '}
            <strong className="text-slate-900 dark:text-white font-mono">{totalItems}</strong> sản phẩm
          </span>
          {totalItems !== allProducts.length && (
            <button
              onClick={handleResetFilters}
              className="text-orange-500 font-bold hover:underline"
            >
              Xem lại toàn bộ {allProducts.length} sản phẩm
            </button>
          )}
        </div>

        {/* Shimmer loading when products are being fetched */}
        {productsLoading || (allProducts.length === 0 && (!adminProducts || adminProducts.length === 0)) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="aspect-square w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : totalItems === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-200 dark:border-amber-900 mx-auto flex items-center justify-center">
              <PackageSearch className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Không tìm thấy sản phẩm phù hợp
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Không có vật tư nào khớp với từ khóa &quot;{search}&quot; hoặc tiêu chí bộ lọc đã chọn.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-orange-500/20"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xóa bộ lọc để xem tất cả</span>
              </button>
            </div>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedProducts.map((prod) => (
              <Link
                key={prod.id}
                href={`/product/${prod.id}`}
                className="group flex flex-col justify-between bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:border-cyan-500 transition-all"
              >
                <div>
                  <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-900 overflow-hidden border-b border-slate-100 dark:border-slate-800">
                    <img
                      src={prod.image || '/images/placeholder.png'}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (prod.brand.includes('Bình Minh')) {
                          target.src = '/images/products/ong-binh-minh-1.jpg';
                        } else if (prod.brand.includes('Cadivi')) {
                          target.src = '/images/products/day-cap-don-1.jpg';
                        } else {
                          target.src = '/images/products/schneider-mcb-1.jpg';
                        }
                      }}
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-900/80 backdrop-blur-md text-white border border-white/20">
                        {prod.brand}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                      SKU: {prod.sku}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{prod.description || prod.specs}</p>
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="p-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400">Giá bán lẻ ({prod.unit})</span>
                      <p className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                        {prod.price}
                      </p>
                    </div>

                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900">
                      Sẵn kho
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddToCart(prod);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all ${
                      addedItemMap[prod.id]
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {addedItemMap[prod.id] ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Đã Thêm!
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" /> Thêm Vào Giỏ
                      </>
                    )}
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination Navigation Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button
              type="button"
              disabled={currentSafePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isActive = pageNum === currentSafePage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-xl font-mono font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentSafePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Trang kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      <MaterialFooter />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Đang tải cửa hàng vật tư...</div>}>
      <ShopContent />
    </Suspense>
  );
}
