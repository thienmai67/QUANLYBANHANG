"use client";

import React from "react";
import { Building2, ShieldCheck, Mail, MapPin } from "lucide-react";
import { MATERIAL_PARTNERS } from "@/data/materialData";

export default function MaterialFooter() {
  return (
    <footer className="w-full bg-white dark:bg-[#0c1322] border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors mt-auto">
      {/* 1. Continuous Marquee */}
      <div className="w-full overflow-hidden border-b border-slate-200 dark:border-slate-800 py-6 bg-slate-50 dark:bg-slate-900">
        <div className="animate-marquee flex gap-12 items-center">
          {[...MATERIAL_PARTNERS, ...MATERIAL_PARTNERS].map((partner, idx) => (
            <div key={`${partner.id}-${idx}`} className="flex items-center gap-3 shrink-0 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
              <h3 className="font-display font-black text-2xl uppercase tracking-tighter text-slate-400">
                {partner.name}
              </h3>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Col */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white dark:text-slate-900" />
              </div>
              <span className="font-display font-black text-xl tracking-tight uppercase">
                TDT M&E
              </span>
            </div>
            <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-xs">
              Chất Lượng Thật. Uy Tín Thật.<br />
              Nền tảng phân phối sỉ vật tư điện nước cơ điện M&amp;E chính hãng hàng đầu Việt Nam.
            </p>
          </div>

          {/* Links Col 1 */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Danh Mục Vật Tư</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
              <li><a href="#catalog" className="hover:text-blue-600 transition-colors">Tra Cứu Bảng Giá Vật Tư</a></li>
              <li><a href="/cong-trinh" className="hover:text-blue-600 transition-colors">Gói Vật Tư Công Trình</a></li>
              <li><a href="/cong-cu" className="hover:text-blue-600 transition-colors">Công Cụ Tính Dự Toán BOM</a></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Tiêu Chuẩn &amp; Pháp Lý</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
              <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Chứng Nhận CO/CQ Chính Hãng</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Hóa Đơn GTGT (VAT) Hợp Lệ</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Tiêu Chuẩn TCVN / IEC</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Chính Sách Công Nợ Nhà Thầu</a></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Liên Hệ Trực Tiếp</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
              <li className="flex items-center gap-3">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Tòa nhà Icon 4, Đống Đa, Hà Nội, Việt Nam</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 shrink-0" />
                <span>vtdt@me-materials.vn</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* 3. Bottom Bar */}
      <div className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 font-medium">
        <p>© 2026 Hệ Thống Vật Tư Điện Nước TDT M&amp;E. Bản quyền được bảo hộ.</p>
      </div>
    </footer>
  );
}
