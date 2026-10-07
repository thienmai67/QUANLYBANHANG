'use client';

import React, { useState, useMemo } from 'react';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';
import RFQModal from '@/components/RFQModal';
import { MATERIAL_PRODUCTS, MaterialProduct } from '@/data/materialData';
import { useAdminStore } from '@/store/useAdminStore';
import { useCartStore } from '@/store/useCartStore';
import { Search, Filter, ShieldCheck, Truck, Zap, ShoppingBag, Check } from 'lucide-react';

export default function ShopPage() {
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [isRFQOpen, setIsRFQOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | undefined>(undefined);
  const [addedItemMap, setAddedItemMap] = useState<Record<string, boolean>>({});

  const adminProducts = useAdminStore((state) => state.products);
  const { addItem } = useCartStore();

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
          brand: p.brand || 'Cadivi',
          category: (p.category as any) || 'cable_cadivi',
          categoryName: p.category || 'Vật tư M&E',
          origin: 'Việt Nam',
          price: priceStr,
          rawPrice: rawPrice,
          unit: p.unit || 'Bộ',
          conversion: '1 bộ',
          description: p.description || p.name,
          image: p.image || 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=500&auto=format&fit=crop&q=80',
          badge: (p.badge as any) || 'NEW',
          specs: specsArr,
          discount: p.discountRate ?? p.discount ?? 15,
        };
      });
    }
    return MATERIAL_PRODUCTS;
  }, [adminProducts]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesBrand = selectedBrand === 'ALL' || p.brand === selectedBrand;
      const matchesCat = selectedCat === 'ALL' || p.category === selectedCat;
      return matchesSearch && matchesBrand && matchesCat;
    });
  }, [allProducts, search, selectedBrand, selectedCat]);

  const handleOpenRFQ = (name?: string) => {
    setSelectedProduct(name);
    setIsRFQOpen(true);
  };

  const handleAddToCart = (prod: MaterialProduct) => {
    const rawPrice = parseInt(prod.price.replace(/[^\d]/g, ''), 10) || 100000;

    addItem({
      id: prod.id,
      sku: prod.sku,
      name: prod.name,
      price: prod.price,
      unitPrice: rawPrice,
      image: prod.image,
    });

    setAddedItemMap((prev) => ({ ...prev, [prod.id]: true }));
    setTimeout(() => {
      setAddedItemMap((prev) => ({ ...prev, [prod.id]: false }));
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors">
      <MaterialHeader onOpenRFQ={handleOpenRFQ} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner header */}
        <div className="p-8 bg-gradient-to-r from-blue-900 via-cyan-900 to-slate-900 text-white rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-cyan-800">
          <div>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-bold border border-cyan-500/30 uppercase tracking-wider">
              Cửa Hàng Vật Tư M&E — Mua Lẻ & Mua Công Trình
            </span>
            <h1 className="text-3xl font-black mt-3">Tất Cả Sản Phẩm &amp; Vật Tư M&E</h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Phục vụ mua hàng bán lẻ giao tận nơi (COD) và chiết khấu sỉ bóc tách BOM cho nhà thầu.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleOpenRFQ()}
              className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg transition-all shrink-0 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" /> Xin Báo Giá Sỉ / BOM
            </button>
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
              <Filter className="w-4 h-4" /> Thương hiệu:
            </div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-transparent rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:border-cyan-500 outline-none"
            >
              <option value="ALL">Tất cả thương hiệu</option>
              <option value="Cadivi">Cadivi</option>
              <option value="Bình Minh">Bình Minh</option>
              <option value="Schneider">Schneider</option>
              <option value="Minh Hòa">Minh Hòa</option>
              <option value="Panasonic">Panasonic</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-white font-bold text-[10px] rounded-lg">
                    {prod.brand}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                    SKU: {prod.sku}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{prod.specs}</p>
                </div>
              </div>

              {/* Pricing & Double CTAs: Retail Add to Cart vs Wholesale Quote */}
              <div className="p-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400">Giá bán lẻ</span>
                    <p className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {prod.price}
                    </p>
                  </div>

                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900">
                    Sẵn kho
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAddToCart(prod)}
                    className={`py-2 px-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all ${
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

                  <button
                    onClick={() => handleOpenRFQ(prod.name)}
                    className="py-2 px-2 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-center"
                  >
                    Báo Giá Sỉ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <MaterialFooter />

      <RFQModal
        isOpen={isRFQOpen}
        onClose={() => setIsRFQOpen(false)}
        initialProductName={selectedProduct}
      />
    </div>
  );
}
