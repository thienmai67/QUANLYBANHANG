import React from 'react';
import Link from 'next/link';
import { Award, CheckCircle2, ArrowLeft } from 'lucide-react';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';

export default function PolicyStandardsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <MaterialHeader />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 space-y-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Trang chủ
          </Link>
          <span>/</span>
          <span>Chính sách</span>
          <span>/</span>
          <span className="text-blue-600 dark:text-blue-400">Quy chuẩn TCVN / IEC</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                Quy Chuẩn An Toàn Kỹ Thuật TCVN / IEC
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Tiêu chuẩn quốc gia và quốc tế áp dụng cho danh mục vật tư M&amp;E
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-500" /> 1. Dây và cáp điện (Cadivi)
            </h2>
            <p>
              Tuân thủ nghiêm ngặt tiêu chuẩn TCVN 6610-3 (tương đương IEC 60227-3), TCVN 5935-1 (IEC 60502-1), đảm bảo ruột đồng tinh chất 99.99%, cách điện PVC/XLPE chịu nhiệt, chống cháy lan theo IEC 60332.
            </p>

            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-500" /> 2. Ống nước và phụ kiện (Bình Minh)
            </h2>
            <p>
              Ống uPVC đạt tiêu chuẩn ISO 1452:2009 (TCVN 8491:2011). Ống chịu nhiệt PPR đạt tiêu chuẩn DIN 8077/8078 và ISO 15874, đảm bảo an toàn vệ sinh nước uống trực tiếp và áp suất làm việc lên đến PN20.
            </p>

            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-500" /> 3. Thiết bị đóng cắt (Schneider &amp; Panasonic)
            </h2>
            <p>
              Aptomat MCB/MCCB đạt tiêu chuẩn IEC 60898-1 và IEC 60947-2, khả năng cắt ngắn mạch danh định đạt chuẩn từ 4.5kA đến 50kA, bảo vệ an toàn cháy nổ và chạm chập điện cho mọi công trình.
            </p>
          </div>
        </div>
      </main>
      <MaterialFooter />
    </div>
  );
}
