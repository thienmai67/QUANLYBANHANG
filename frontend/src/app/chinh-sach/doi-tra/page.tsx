import React from 'react';
import Link from 'next/link';
import { RefreshCw, CheckCircle2, ArrowLeft } from 'lucide-react';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';

export default function PolicyReturnPage() {
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
          <span className="text-blue-600 dark:text-blue-400">Đổi trả hàng</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <RefreshCw className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                Chính Sách Đổi Trả Linh Hoạt Trong 7 Ngày
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Hỗ trợ công trình và nhà thầu xử lý vật tư dư thừa hoặc sai thông số
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-500" /> 1. Điều kiện áp dụng đổi trả
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>Sản phẩm còn nguyên tem, bao bì xuất xưởng của nhà sản xuất, chưa qua đấu nối hay sử dụng.</li>
              <li>Đối với dây điện cuộn: Còn nguyên seal, độ dài đủ chuẩn 100m.</li>
              <li>Thời gian yêu cầu đổi trả trong vòng 7 ngày làm việc kể từ thời điểm nhận hàng.</li>
            </ul>

            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-500" /> 2. Quy trình xử lý đổi trả &amp; hoàn tiền
            </h2>
            <p>
              Khách hàng thông báo với phòng Chăm sóc khách hàng hoặc Sale phụ trách. Đội xe TDT sẽ hỗ trợ thu hồi vật tư tại công trình hoặc kho khách hàng, kiểm đếm và hoàn tiền/cấn trừ công nợ trong vòng 24 giờ.
            </p>
          </div>
        </div>
      </main>
      <MaterialFooter />
    </div>
  );
}
