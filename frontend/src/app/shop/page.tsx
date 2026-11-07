'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';
import { MaterialProduct } from '@/data/materialData';
import { useAdminStore } from '@/store/useAdminStore';
import { useCartStore } from '@/store/useCartStore';
import { useToast } from '@/hooks/useToast';
import { Search, Filter, ShoppingBag, Check, Zap, Sparkles } from 'lucide-react';

type DiyCategory = 'ALL' | 'PLUMBING' | 'AIR_COND' | 'LIGHTING' | 'PANEL';

const DIY_CHIPS: Array<{
  id: DiyCategory;
  label: string;
  sub: string;
  icon: string;
}> = [
  { id: 'ALL', label: 'Tất Cả Sản Phẩm', sub: 'Toàn bộ vật tư M&E', icon: '🏷️' },
  { id: 'PLUMBING', label: 'Sửa Nước & Thoát Sàn', sub: 'Ống Bình Minh, Co, Lơ, Tê', icon: '🚿' },
  { id: 'AIR_COND', label: 'Máy Lạnh & Nóng Lạnh', sub: 'Dây Cadivi, CB Schneider', icon: '❄️' },
  { id: 'LIGHTING', label: 'Chiếu Sáng & Ổ Cắm', sub: 'Ổ cắm đôi, công tắc Sino / Pana', icon: '💡' },
  { id: 'PANEL', label: 'Tủ Điện & CB An Toàn', sub: 'Aptomat tổng, Hộp tủ âm tường', icon: '⚡' },
];

export default function ShopPage() {
  const router = useRouter();
  const toast = useToast();
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [selectedDiy, setSelectedDiy] = useState<DiyCategory>('ALL');
  const [search, setSearch] = useState<string>('');
  const [addedItemMap, setAddedItemMap] = useState<Record<string, boolean>>({});

  const adminProducts = useAdminStore((state) => state.products);
  const fetchProducts = useAdminStore((state) => state.fetchProducts);
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchProducts();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('cat');
      const brandParam = params.get('brand');
      const diyParam = params.get('diy');
      if (catParam) setSelectedCat(catParam);
      if (brandParam) setSelectedBrand(brandParam);
      if (diyParam && ['ALL', 'PLUMBING', 'AIR_COND', 'LIGHTING', 'PANEL'].includes(diyParam)) {
        setSelectedDiy(diyParam as DiyCategory);
      }
    }
  }, [fetchProducts]);

  const allProducts: MaterialProduct[] = useMemo(() => {
    if (adminProducts && adminProducts.length > 0) {
      return adminProducts.map((p) => {
        const rawPrice = p.basePrice ?? (typeof p.price === 'number' ? p.price : 0);
        const priceStr = typeof p.price === 'string'
          ? p.price
          : `${rawPrice.toLocaleString('vi-VN')} ₫`;

        const specsArr = Array.isArray(p.specs)
          ? p.specs
          : typeof p.specs === 'string'
            ? [p.specs]
            : [`Thương hiệu: ${p.brand || 'Chính hãng'}`, `Đơn vị: ${p.unit || 'Chuẩn'}`];

        return {
          id: p.id,
          sku: p.sku || 'SKU-STD',
          name: p.name,
          brand: p.brand || '—',
          category: (p.category as any) || 'cable_cadivi',
          categoryName: p.category || '—',
          origin: 'Việt Nam',
          price: priceStr,
          rawPrice: rawPrice,
          unit: p.unit || '—',
          conversion: p.unit ? `1 ${p.unit}` : '—',
          description: p.description || p.name,
          image: p.image || '',
          badge: (p.badge as any) || 'NEW',
          specs: specsArr,
          discount: p.discountRate ?? p.discount ?? 0,
        };
      });
    }
    return [];
  }, [adminProducts]);

  const availableCategories = useMemo(() => {
    const cats = Array.from(
      new Set(allProducts.map((p) => p.categoryName || String(p.category)).filter(Boolean))
    );
    return cats.length > 0
      ? cats
      : ['Dây & Cáp Điện', 'Ống & Phụ Kiện Nhựa', 'Tủ & Thiết Bị Đóng Cắt'];
  }, [allProducts]);

  const availableBrands = useMemo(() => {
    const brands = Array.from(new Set(allProducts.map((p) => p.brand).filter(Boolean)));
    return brands.length > 0
      ? brands
      : ['Cadivi', 'Bình Minh', 'Schneider Electric', 'Panasonic'];
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const pNameLower = p.name.toLowerCase();
      const pSkuLower = p.sku.toLowerCase();
      const pCatLower = (p.categoryName || String(p.category) || '').toLowerCase();
      const pDescLower = (p.description || '').toLowerCase();
      const fullText = `${pNameLower} ${pSkuLower} ${pCatLower} ${pDescLower}`;

      const matchesSearch =
        pNameLower.includes(search.toLowerCase()) ||
        pSkuLower.includes(search.toLowerCase());
      const matchesBrand = selectedBrand === 'ALL' || p.brand === selectedBrand;
      const matchesCat =
        selectedCat === 'ALL' ||
        p.category === selectedCat ||
        p.categoryName === selectedCat;

      let matchesDiy = true;
      if (selectedDiy === 'PLUMBING') {
        matchesDiy =
          fullText.includes('ống') ||
          fullText.includes('ong') ||
          fullText.includes('nước') ||
          fullText.includes('nuoc') ||
          fullText.includes('bình minh') ||
          fullText.includes('binh minh') ||
          fullText.includes('pvc') ||
          fullText.includes('ppr') ||
          fullText.includes('co ') ||
          fullText.includes('tê') ||
          fullText.includes('lơ') ||
          fullText.includes('fittings') ||
          fullText.includes('phụ kiện ống');
      } else if (selectedDiy === 'AIR_COND') {
        matchesDiy =
          fullText.includes('cadivi') ||
          fullText.includes('dây') ||
          fullText.includes('cáp') ||
          fullText.includes('2.5') ||
          fullText.includes('4.0') ||
          fullText.includes('rcbo') ||
          fullText.includes('mcb') ||
          fullText.includes('16a') ||
          fullText.includes('20a') ||
          fullText.includes('32a') ||
          fullText.includes('chống giật');
      } else if (selectedDiy === 'LIGHTING') {
        matchesDiy =
          fullText.includes('ổ cắm') ||
          fullText.includes('o cam') ||
          fullText.includes('công tắc') ||
          fullText.includes('cong tac') ||
          fullText.includes('đèn') ||
          fullText.includes('led') ||
          fullText.includes('sino') ||
          fullText.includes('panasonic') ||
          fullText.includes('đế âm');
      } else if (selectedDiy === 'PANEL') {
        matchesDiy =
          fullText.includes('mccb') ||
          fullText.includes('tủ điện') ||
          fullText.includes('tu dien') ||
          fullText.includes('schneider') ||
          fullText.includes('easypact') ||
          fullText.includes('đóng cắt') ||
          fullText.includes('tổng');
      }

      return matchesSearch && matchesBrand && matchesCat && matchesDiy;
    });
  }, [allProducts, search, selectedBrand, selectedCat, selectedDiy]);

  const handleAddToCart = (prod: MaterialProduct) => {
    const rawPrice = prod.rawPrice || parseInt(prod.price.replace(/[^\d]/g, ''), 10) || 100000;

    addItem({
      id: prod.id,
      sku: prod.sku,
      name: prod.name,
      price: prod.price,
      unitPrice: rawPrice,
      image: prod.image,
    });

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
              Giá bán lẻ minh bạch từng mét/cái, sẵn kho giao nhanh trong ngày tận nhà (COD toàn quốc).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              Sẵn Kho Giao Nhanh • Có Hỏa Tốc Grab
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
            {selectedDiy !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedDiy('ALL')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Xóa lọc ({filteredProducts.length} sản phẩm)
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {DIY_CHIPS.map((chip) => {
              const active = selectedDiy === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedDiy(chip.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20 scale-[1.02]'
                      : 'bg-white dark:bg-[#0c1322] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-700 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{chip.icon}</span>
                    <span
                      className={`text-xs font-black ${
                        active ? 'text-white' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {chip.label}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-medium line-clamp-1 ${
                      active ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {chip.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filter bar */}
        <div className="p-4 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên sản phẩm, mã SKU..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-cyan-500 rounded-xl text-slate-900 dark:text-slate-100 font-medium outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-500">
              <Filter className="w-4 h-4" /> Danh mục:
            </div>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-transparent rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:border-cyan-500 outline-none"
            >
              <option value="ALL">Tất cả danh mục</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 font-semibold text-slate-500 ml-1">
              Thương hiệu:
            </div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-transparent rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:border-cyan-500 outline-none"
            >
              <option value="ALL">Tất cả thương hiệu</option>
              {availableBrands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => (
            <Link
              key={prod.id}
              href={`/product/${prod.id}`}
              className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                    <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-white font-bold text-[10px] rounded-lg">
                      {prod.brand}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-500/90 text-white font-bold text-[9px] rounded-md shadow-sm flex items-center gap-1">
                      🚚 Giao Nhanh
                    </span>
                  </div>
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-600/90 text-white font-bold text-[9px] rounded-md shadow-sm">
                    Chính hãng
                  </span>
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

                  {((prod as any).stockQuantity ?? (prod as any).stock) ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900">
                      Sẵn kho
                    </span>
                  ) : null}
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
      </main>

      <MaterialFooter />
    </div>
  );
}
