'use client';

import React from 'react';
import Link from 'next/link';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';
import { Phone, Mail, MapPin, Clock, MessageCircle, ShieldCheck, ChevronRight } from 'lucide-react';
import { CONTACT_INFO } from '@/config/contact';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors">
      <MaterialHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-bold text-slate-800 dark:text-slate-200">Liên hệ & Hỗ trợ</span>
        </nav>

        {/* Header Title */}
        <div className="mb-8">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            Thông tin liên hệ
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            Trung Tâm Hỗ Trợ &amp; Dịch Vụ Khách Hàng TDT M&amp;E
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cung cấp vật tư cơ điện chính hãng, giải pháp báo giá công trình và tư vấn kỹ thuật trực tiếp.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1: Hotline */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-4 shadow-sm">
                <Phone className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Hotline Tổng Đài 24/7</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tư vấn mua lẻ, phản ánh sự cố giao hàng và hỗ trợ đặt đơn khẩn cấp.
              </p>
              <div className="mt-4 text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                {CONTACT_INFO.hotline}
              </div>
            </div>
            <a
              href={CONTACT_INFO.hotlineTel}
              className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Phone className="w-4 h-4" />
              <span>Gọi Ngay ({CONTACT_INFO.hotline})</span>
            </a>
          </div>

          {/* Card 2: Zalo Kỹ thuật */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center mb-4 shadow-sm">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Zalo Kỹ Thuật &amp; Báo Giá</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Gửi hình ảnh mẫu vật tư hỏng, bản vẽ bóc tách khối lượng và nhận báo giá dự án.
              </p>
              <div className="mt-4 text-xl font-mono font-black text-blue-600 dark:text-blue-400">
                {CONTACT_INFO.zalo}
              </div>
            </div>
            <a
              href={CONTACT_INFO.zaloLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat Zalo Trực Tiếp</span>
            </a>
          </div>

          {/* Card 3: Email Hỗ trợ */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center mb-4 shadow-sm">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Hòm Thư Điện Tử</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tiếp nhận hồ sơ năng lực, yêu cầu chứng từ CO/CQ và hóa đơn điện tử VAT.
              </p>
              <div className="mt-4 text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                {CONTACT_INFO.email}
              </div>
            </div>
            <a
              href={CONTACT_INFO.emailMailto}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Mail className="w-4 h-4" />
              <span>Gửi Email Hỗ Trợ</span>
            </a>
          </div>
        </div>

        {/* Office & Warehouse Details */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                <span>Trụ Sở Kho &amp; Trung Tâm Phân Phối</span>
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  <strong>Địa chỉ kho tổng:</strong> {CONTACT_INFO.address}
                </p>
                <p>
                  <strong>Chi nhánh Gò Vấp:</strong> Số 45 Lê Đức Thọ, Phường 7, Quận Gò Vấp, TP. Hồ Chí Minh
                </p>
                <div className="flex items-center gap-2 pt-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Thời gian làm việc: {CONTACT_INFO.workingHours}</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-center">
              <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-sm mb-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Cam Kết Chất Lượng Vật Tư</span>
              </div>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
                <li>• 100% vật tư chính hãng chuẩn TCVN từ Bình Minh, Cadivi, Schneider, Panasonic.</li>
                <li>• Hỗ trợ giao hỏa tốc nội thành 2 giờ cho công trình đang thi công gấp.</li>
                <li>• Đầy đủ chứng chỉ xuất xưởng, biên bản thử nghiệm CO/CQ và hóa đơn VAT.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <MaterialFooter />
    </div>
  );
}
