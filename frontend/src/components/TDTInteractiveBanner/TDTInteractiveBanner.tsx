'use client';

import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, useProgress } from '@react-three/drei';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Scene } from './Scene';
import type { BrandId } from './ProductModels';

// ─── Loading fallback ─────────────────────────────────────────────────────────

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[#0891B2] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500">{Math.round(progress)}%</span>
      </div>
    </Html>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TDTInteractiveBannerProps {
  onOpenRFQ?: (productName?: string) => void;
}

export default function TDTInteractiveBanner({ onOpenRFQ: _onOpenRFQ }: TDTInteractiveBannerProps) {
  const [selected, setSelected] = useState<BrandId | null>(null);

  // Guarantee strip items (inline SVG icons, no icon library needed)
  const guarantees = [
    {
      label: 'Chính hãng 100%',
      icon: (
        <svg className="h-4 w-4 text-[#0891B2]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      ),
      className: 'flex items-center gap-2 text-sm text-slate-700 whitespace-nowrap',
    },
    {
      label: 'Giao hàng nhanh',
      icon: (
        <svg className="h-4 w-4 text-[#0891B2]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
      className: 'flex items-center gap-2 text-sm text-slate-700 whitespace-nowrap',
    },
    {
      label: 'Hỗ trợ kỹ thuật',
      icon: (
        <svg className="h-4 w-4 text-[#0891B2]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
        </svg>
      ),
      className: 'hidden md:flex items-center gap-2 text-sm text-slate-700 whitespace-nowrap',
    },
    {
      label: 'Báo giá trong ngày',
      icon: (
        <svg className="h-4 w-4 text-[#0891B2]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      className: 'hidden md:flex items-center gap-2 text-sm text-slate-700 whitespace-nowrap',
    },
  ];

  return (
    <section className="relative w-full h-[560px] overflow-hidden bg-gradient-to-b from-[#F8FAFC] to-[#E2E8F0]">
      {/* Canvas — right side, transparent bg */}
      <div className="absolute top-0 right-0 bottom-14 w-full">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true, toneMapping: 4, toneMappingExposure: 1.2 }}
          style={{ background: 'transparent' }}
          onPointerMissed={() => setSelected(null)}
        >
          <Suspense fallback={<Loader />}>
            <Scene selected={selected} onSelect={setSelected} />
          </Suspense>
        </Canvas>
      </div>

      {/* Text overlay — left side */}
      <div className="absolute top-0 left-0 bottom-14 z-20 flex items-center">
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 ml-6 max-w-sm shadow-lg border border-white/80 max-lg:mx-3 max-lg:p-5">
          {/* Badge */}
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0 }}
            className="inline-block bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-full px-3 py-1 text-xs font-medium"
          >
            Nhà Phân Phối Chính Hãng
          </motion.span>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl font-bold text-slate-900 leading-tight mt-3"
          >
            Vật Liệu {'M&E'}<br />Chất Lượng Cao
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm text-slate-600 mt-2"
          >
            Cung cấp dây cáp điện, ống nhựa và thiết bị điện chính hãng cho công trình.
          </motion.p>

          {/* Subtitle brands */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-sm text-slate-500 mt-2"
          >
            Cadivi · Bình Minh · Schneider
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap gap-3 mt-6"
          >
            <Link
              href="/shop"
              className="bg-[#0891B2] hover:bg-[#0E7490] text-white rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
            >
              Xem Sản Phẩm
            </Link>
            <Link
              href="/cong-trinh"
              className="border-2 border-[#0891B2] text-[#0891B2] hover:bg-cyan-50 rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
            >
              Liên Hệ Báo Giá
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Guarantee strip */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-14 flex items-center justify-center gap-6 md:gap-10 px-4 bg-white/80 backdrop-blur-sm border-t border-slate-200">
        {guarantees.map((item) => (
          <div key={item.label} className={item.className}>
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
