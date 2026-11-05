'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';
import { useCartStore } from '@/store/useCartStore';
import { useToast } from '@/hooks/useToast';
import {
  Home,
  Droplets,
  Zap,
  ShoppingBag,
  Check,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  ArrowRight,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import * as motion from 'motion/react-client';

interface ComboItem {
  id: string;
  sku: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  image: string;
}

interface ComboPackage {
  id: string;
  title: string;
  badge: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  image: string;
  items: ComboItem[];
}

const RETAIL_COMBOS: ComboPackage[] = [
  {
    id: 'combo-apartment-2pn',
    title: 'Combo Cơ Điện Căn Hộ Gia Đình (2 Phòng Ngủ)',
    badge: 'Phổ biến nhất',
    desc: 'Trọn bộ dây nguồn Cadivi, aptomat bảo vệ Schneider và ống thoát nước Bình Minh chuẩn quy cách cho căn hộ 2 phòng ngủ.',
    icon: Home,
    image: '/images/products/day-cap-don-1.jpg',
    items: [
      {
        id: '52b7957a-8a01-4b4a-b491-245495d8547a',
        sku: 'CADIVI-CV-2.5',
        name: 'Dây điện đơn ruột đồng Cadivi CV 2.5mm² (Cuộn 100m)',
        unit: 'Cuộn',
        unitPrice: 890000,
        quantity: 2,
        image: '/images/products/day-cap-don-1.jpg',
      },
      {
        id: '306187f4-2aae-4f13-ad48-2001f7b7eb6d',
        sku: 'SCHNEIDER-EZ9-16A',
        name: 'Aptomat Schneider Easy9 1P 16A chống quá tải',
        unit: 'Cái',
        unitPrice: 185000,
        quantity: 3,
        image: '/images/products/schneider-mcb-1.jpg',
      },
      {
        id: 'bm-upvc-d90',
        sku: 'BM-UPVC-D90',
        name: 'Ống uPVC Bình Minh Phi 90mm C1 (Cây 4m)',
        unit: 'Cây',
        unitPrice: 165000,
        quantity: 4,
        image: '/images/products/ong-binh-minh-1.jpg',
      },
      {
        id: '79fea879-9e20-4cd2-9afb-a70be5ce0347',
        sku: 'ZN-DN20',
        name: 'Đồng hồ nước Zenner DN20 ren 3/4" cấp B',
        unit: 'Cái',
        unitPrice: 450000,
        quantity: 1,
        image: '/images/products/schneider-mcb-1.jpg',
      },
    ],
  },
  {
    id: 'combo-water-bathroom',
    title: 'Combo Cấp Thoát Nước Nhà Tắm & Toilet Chống Rò Rỉ',
    badge: 'Đầy đủ phụ kiện',
    desc: 'Giải pháp thay mới và sửa chữa ống cấp thoát nước chống nghẹt, chống hôi cho phòng tắm gia đình, không lo quên keo và phụ kiện nối.',
    icon: Droplets,
    image: '/images/products/ong-binh-minh-1.jpg',
    items: [
      {
        id: 'bm-upvc-d90',
        sku: 'BM-UPVC-D90',
        name: 'Ống uPVC Bình Minh Phi 90mm C1 (Trục thoát bồn cầu)',
        unit: 'Cây',
        unitPrice: 165000,
        quantity: 2,
        image: '/images/products/ong-binh-minh-1.jpg',
      },
      {
        id: 'bm-upvc-d60',
        sku: 'BM-UPVC-D60',
        name: 'Ống uPVC Bình Minh Phi 60mm C1 (Thoát sàn phòng tắm)',
        unit: 'Cây',
        unitPrice: 115000,
        quantity: 3,
        image: '/images/products/ong-binh-minh-1.jpg',
      },
      {
        id: 'bm-keo-dan-200g',
        sku: 'BM-KEO-200G',
        name: 'Keo dán ống nhựa uPVC Bình Minh chuyên dụng (Tuýp 200g)',
        unit: 'Tuýp',
        unitPrice: 28000,
        quantity: 2,
        image: '/images/products/ong-binh-minh-1.jpg',
      },
      {
        id: '79fea879-9e20-4cd2-9afb-a70be5ce0347',
        sku: 'ZN-DN20',
        name: 'Đồng hồ nước Zenner DN20 chính hãng',
        unit: 'Cái',
        unitPrice: 450000,
        quantity: 1,
        image: '/images/products/schneider-mcb-1.jpg',
      },
    ],
  },
  {
    id: 'combo-ac-waterheater',
    title: 'Combo An Toàn Điện Máy Lạnh & Bình Nước Nóng Chống Giật',
    badge: 'An toàn gia đình',
    desc: 'Bảo vệ tối đa cho gia đình có trẻ nhỏ và người già: dây Cadivi chịu tải cao, CB chống giật tự ngắt khi có rò rỉ điện.',
    icon: Zap,
    image: '/images/products/schneider-mcb-1.jpg',
    items: [
      {
        id: '52b7957a-8a01-4b4a-b491-245495d8547a',
        sku: 'CADIVI-CV-2.5',
        name: 'Dây điện đơn ruột đồng Cadivi CV 2.5mm² (Cuộn 100m)',
        unit: 'Cuộn',
        unitPrice: 890000,
        quantity: 1,
        image: '/images/products/day-cap-don-1.jpg',
      },
      {
        id: '306187f4-2aae-4f13-ad48-2001f7b7eb6d',
        sku: 'SCHNEIDER-EZ9-16A',
        name: 'Aptomat Schneider Easy9 1P 16A bảo vệ máy lạnh',
        unit: 'Cái',
        unitPrice: 185000,
        quantity: 2,
        image: '/images/products/schneider-mcb-1.jpg',
      },
      {
        id: 'pana-rcbo-32a',
        sku: 'PANA-RCBO-32A',
        name: 'Aptomat chống giật Panasonic RCBO 2P 32A 30mA (Bình nóng lạnh)',
        unit: 'Cái',
        unitPrice: 380000,
        quantity: 1,
        image: '/images/products/schneider-mcb-1.jpg',
      },
    ],
  },
];

export default function CongTrinhPage() {
  const toast = useToast();
  const { addItem, setIsOpen } = useCartStore();
  const [expandedCombos, setExpandedCombos] = useState<Record<string, boolean>>({
    'combo-apartment-2pn': true,
  });
  const [addedCombos, setAddedCombos] = useState<Record<string, boolean>>({});

  const toggleExpand = (comboId: string) => {
    setExpandedCombos((prev) => ({ ...prev, [comboId]: !prev[comboId] }));
  };

  const handleAddComboToCart = (combo: ComboPackage) => {
    combo.items.forEach((item) => {
      addItem(
        {
          id: item.id,
          sku: item.sku,
          name: item.name,
          price: `${item.unitPrice.toLocaleString('vi-VN')} ₫`,
          unitPrice: item.unitPrice,
          image: item.image,
          quantity: item.quantity,
        },
        false
      );
    });

    setAddedCombos((prev) => ({ ...prev, [combo.id]: true }));
    setIsOpen(true);
    toast.success(`Đã thêm trọn bộ "${combo.title}" vào giỏ hàng!`);

    setTimeout(() => {
      setAddedCombos((prev) => ({ ...prev, [combo.id]: false }));
    }, 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors">
      <MaterialHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
        {/* Banner header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider border border-blue-500/20">
            Combo Bán Lẻ Cho Gia Đình &amp; Sửa Chữa Nhà
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Combo Vật Tư <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Đồng Bộ Chính Hãng</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Được kỹ sư M&amp;E tính toán sẵn quy cách cho từng nhu cầu sửa chữa nhà ở. Mua nguyên bộ tiện lợi, không lo quên phụ kiện, giao tận nơi trong 2 giờ.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> 100% Chính hãng Cadivi, Bình Minh, Schneider
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-blue-500" /> Giao hỏa tốc 2 giờ hoặc COD tận nhà
            </span>
          </div>
        </div>

        {/* Combos list */}
        <div className="space-y-8">
          {RETAIL_COMBOS.map((combo, idx) => {
            const totalComboPrice = combo.items.reduce(
              (acc, item) => acc + item.unitPrice * item.quantity,
              0
            );
            const totalItemsCount = combo.items.reduce(
              (acc, item) => acc + item.quantity,
              0
            );
            const isExpanded = !!expandedCombos[combo.id];
            const isAdded = !!addedCombos[combo.id];

            return (
              <motion.div
                key={combo.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all space-y-6"
              >
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start justify-between">
                  {/* Left: Image + Info */}
                  <div className="flex flex-col sm:flex-row gap-5 items-start flex-1">
                    <div className="w-full sm:w-44 aspect-video sm:aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                      <img
                        src={combo.image}
                        alt={combo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold font-mono">
                          {combo.badge}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          Gồm {combo.items.length} hạng mục ({totalItemsCount} sản phẩm lẻ)
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                        {combo.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {combo.desc}
                      </p>
                    </div>
                  </div>

                  {/* Right: Pricing & CTA */}
                  <div className="w-full lg:w-72 shrink-0 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Tổng Tiền Combo
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-orange-500 font-mono">
                        {totalComboPrice.toLocaleString('vi-VN')} ₫
                      </div>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Tiết kiệm thời gian, đủ phụ kiện lắp ngay
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddComboToCart(combo)}
                      className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4" /> Đã Thêm Combo Vào Giỏ!
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" /> Thêm Trọn Bộ Vào Giỏ
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible itemized list */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => toggleExpand(combo.id)}
                    className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>
                      {isExpanded
                        ? 'Thu gọn danh sách chi tiết'
                        : `Xem chi tiết ${combo.items.length} món trong combo này`}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                            <th className="py-2.5 px-3">Tên vật tư lẻ</th>
                            <th className="py-2.5 px-3">Đơn vị</th>
                            <th className="py-2.5 px-3 text-center">Số lượng</th>
                            <th className="py-2.5 px-3 text-right">Đơn giá bán lẻ</th>
                            <th className="py-2.5 px-3 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                          {combo.items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {item.name}
                                </div>
                                <span className="font-mono text-[10px] text-slate-400">
                                  Mã: {item.sku}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-500">{item.unit}</td>
                              <td className="py-3 px-3 text-center font-bold text-blue-600">
                                x {item.quantity}
                              </td>
                              <td className="py-3 px-3 text-right text-slate-500 font-mono">
                                {item.unitPrice.toLocaleString('vi-VN')} ₫
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                                {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} ₫
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Custom inquiry strip */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Cần tư vấn thêm theo bản vẽ hoặc nhà riêng?</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Bạn có thể chat trực tiếp với Trợ lý Kỹ thuật M&amp;E để tính toán chính xác số mét dây điện và ống nước cho căn nhà của mình.
            </p>
          </div>
          <Link
            href="/shop"
            className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 shrink-0 transition-transform active:scale-95"
          >
            <span>Xem Toàn Bộ Sản Phẩm Lẻ</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <MaterialFooter />
    </div>
  );
}
