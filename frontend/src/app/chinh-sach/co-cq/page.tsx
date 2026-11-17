import React from 'react';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, FileText, ArrowLeft } from 'lucide-react';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';

export default function PolicyCoCqPage() {
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
          <span className="text-blue-600 dark:text-blue-400">Cam kết CO/CQ</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                Chính Sách 100% Hàng Chính Hãng &amp; Chứng Chỉ CO/CQ
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Áp dụng cho toàn bộ vật tư M&amp;E phân phối tại TDT Material Platform
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1. Cam kết nguồn gốc xuất xứ chính hãng
            </h2>
            <p>
              Tất cả các sản phẩm dây cáp điện Cadivi, ống và phụ kiện nhựa Bình Minh, thiết bị đóng cắt Schneider Electric, Panasonic đều được nhập trực tiếp từ nhà máy sản xuất hoặc nhà phân phối ủy quyền cấp 1 tại Việt Nam.
            </p>

            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 2. Cung cấp chứng chỉ CO/CQ theo đơn hàng
            </h2>
            <p>
              Đối với các công trình dự án, nhà xưởng và công trình dân dụng yêu cầu nghiệm thu vật tư, TDT Material cung cấp đầy đủ:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li><strong>Chứng chỉ xuất xưởng (CQ - Certificate of Quality):</strong> Do phòng KCS của nhà sản xuất (Bình Minh, Cadivi, Schneider) cấp cho từng lô sản xuất.</li>
              <li><strong>Chứng nhận xuất xứ (CO - Certificate of Origin):</strong> Chứng minh nguồn gốc hàng hóa nội địa hoặc nhập khẩu chính ngạch.</li>
              <li><strong>Phiếu kiểm nghiệm chất lượng:</strong> Kết quả thử nghiệm tải, điện áp đánh thủng, áp suất nổ đường ống từ cơ quan kiểm định Quatest 3.</li>
            </ul>

            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 3. Đền bù gấp 10 lần nếu phát hiện hàng giả
            </h2>
            <p>
              TDT Material cam kết hoàn tiền 1000% giá trị đơn hàng nếu phát hiện sản phẩm giả mạo, hàng tái chế không đạt tiêu chuẩn kỹ thuật công bố.
            </p>
          </div>
        </div>
      </main>
      <MaterialFooter />
    </div>
  );
}
