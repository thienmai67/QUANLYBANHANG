'use client';

import React from 'react';
import Link from 'next/link';
import { PackageX, Home, ShoppingBag, ArrowLeft } from 'lucide-react';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 font-sans">
      <MaterialHeader />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-20 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-24 h-24 rounded-3xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-500 shadow-xl shadow-orange-500/10 animate-bounce">
          <PackageX className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900">
            MÃ LỖI 404 • KHÔNG TÌM THẤY TRANG
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-white mt-3">
            Trang Bạn Tìm Kiếm Không Tồn Tại
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Đường dẫn có thể đã thay đổi, vật tư đã ngừng kinh doanh hoặc bạn đã nhập nhầm địa chỉ liên kết.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-all shadow-md"
          >
            <Home className="w-4 h-4" />
            Về Trang Chủ
          </Link>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all shadow-lg shadow-orange-500/25"
          >
            <ShoppingBag className="w-4 h-4" />
            Xem Cửa Hàng Vật Tư
          </Link>
        </div>
      </main>

      <MaterialFooter />
    </div>
  );
}
