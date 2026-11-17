import React from 'react';
import Link from 'next/link';
import { Receipt, CheckCircle2, ArrowLeft } from 'lucide-react';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';

export default function PolicyInvoicePage() {
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
          <span className="text-blue-600 dark:text-blue-400">Hóa đơn điện tử</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Receipt className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                Chính Sách Hóa Đơn Điện Tử Đầy Đủ (VAT)
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Xuất hóa đơn GTGT theo Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500" /> 1. Xuất hóa đơn cho 100% đơn hàng
            </h2>
            <p>
              Mọi đơn hàng mua sắm tại TDT Material (dù là khách hàng cá nhân hay doanh nghiệp thầu cơ điện) đều được phát hành hóa đơn điện tử hợp pháp có mã của Cơ quan Thuế.
            </p>

            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500" /> 2. Quy trình nhận hóa đơn VAT
            </h2>
            <p>
              Khách hàng cung cấp thông tin xuất hóa đơn (Tên công ty, Mã số thuế, Địa chỉ, Email nhận hóa đơn) trong bước Thanh toán (Checkout) hoặc liên hệ phòng Kế toán TDT. Hóa đơn điện tử (.xml và .pdf) sẽ được gửi tự động đến email khách hàng trong vòng 24 giờ sau khi đơn hàng hoàn tất giao nhận.
            </p>
          </div>
        </div>
      </main>
      <MaterialFooter />
    </div>
  );
}
