"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  ChevronUp,
  MessageCircle,
  ExternalLink,
  Building2,
} from "lucide-react";

export default function MaterialFooter() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer id="footer" className="w-full bg-[#c67234] dark:bg-[#070b14] text-white border-t border-amber-600/30 transition-colors">
      {/* 4-Column Primary Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Col 1: Company Profile */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-white text-amber-700 flex items-center justify-center font-black shadow-sm">
                <Building2 className="w-5 h-5 text-amber-600" />
              </div>
              <h4 className="font-display font-black text-sm sm:text-base uppercase tracking-tight text-white leading-snug">
                CÔNG TY CỔ PHẦN VẬT LIỆU XÂY DỰNG TDT
              </h4>
            </div>
            <div className="w-12 h-0.5 bg-white/60" />
            <div className="space-y-3 text-xs text-white/90 leading-relaxed font-sans">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-white/80" />
                <span>
                  <strong>Địa chỉ:</strong> Tầng 6, Toà nhà Icon4, Số 243A Đê La Thành, Phường Láng, Hà Nội, Việt Nam.
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0 text-white/80" />
                <span>
                  <strong>Hotline:</strong>{" "}
                  <a href="tel:0961089292" className="underline font-bold text-white hover:text-amber-200">
                    096 108 9292
                  </a>
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-white/80" />
                <span>
                  <strong>Email:</strong> vlxdtdt.vn@gmail.com
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-white/80" />
                <span>
                  <strong>Cung ứng công trình:</strong> 24/7 toàn miền Bắc
                </span>
              </p>
            </div>
          </div>

          {/* Col 2: Sales & Supply Policies */}
          <div className="space-y-4">
            <h4 className="font-display font-black text-sm sm:text-base uppercase tracking-tight text-white">
              CHÍNH SÁCH BÁN HÀNG
            </h4>
            <div className="w-12 h-0.5 bg-white/60" />
            <ul className="space-y-2.5 text-xs text-white/90">
              <li>
                <a href="#footer" className="hover:text-amber-200 transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-white/80" />
                  Chính sách chiết khấu nhà thầu & đại lý B2B
                </a>
              </li>
              <li>
                <a href="#footer" className="hover:text-amber-200 transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-white/80" />
                  Quy định chứng chỉ CO/CQ chuẩn TCVN
                </a>
              </li>
              <li>
                <a href="#footer" className="hover:text-amber-200 transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-white/80" />
                  Vận chuyển xe cẩu tự hành tận chân công trình
                </a>
              </li>
              <li>
                <a href="#footer" className="hover:text-amber-200 transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-white/80" />
                  Chính sách đổi trả & nghiệm thu khối lượng
                </a>
              </li>
              <li>
                <a href="#footer" className="hover:text-amber-200 transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-white/80" />
                  Chính sách bảo mật & Hợp đồng nguyên tắc
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Support Hotlines */}
          <div className="space-y-4">
            <h4 className="font-display font-black text-sm sm:text-base uppercase tracking-tight text-white">
              TỔNG ĐÀI HỖ TRỢ
            </h4>
            <div className="w-12 h-0.5 bg-white/60" />
            <div className="space-y-3 text-xs text-white/90">
              <div>
                <p className="text-white/80">Tư vấn báo giá & Hợp đồng thầu:</p>
                <a href="tel:0961089292" className="text-base font-black text-white hover:text-amber-200 font-mono">
                  096 108 9292
                </a>
              </div>
              <div>
                <p className="text-white/80">Kỹ sư bóc tách dự toán vật tư:</p>
                <a href="tel:0961089292" className="text-base font-black text-white hover:text-amber-200 font-mono">
                  096 108 9292
                </a>
              </div>
            </div>

            <h5 className="font-bold text-xs uppercase tracking-wider text-white pt-2">
              KẾT NỐI VỚI CHÚNG TÔI
            </h5>
            <div className="flex items-center gap-3">
              <a
                href="https://zalo.me/0961089292"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Zalo Tư Vấn</span>
              </a>
              <a
                href="mailto:vlxdtdt.vn@gmail.com"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Gửi Email</span>
              </a>
            </div>
          </div>

          {/* Col 4: Map Embed */}
          <div className="space-y-4">
            <h4 className="font-display font-black text-sm sm:text-base uppercase tracking-tight text-white">
              BẢN ĐỒ TRỤ SỞ
            </h4>
            <div className="w-12 h-0.5 bg-white/60" />
            <div className="rounded-xl overflow-hidden border border-white/20 shadow-inner h-48 bg-slate-900">
              <iframe
                title="Bản đồ Icon 4 Building"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.1172459845075!2d105.79963819678954!3d21.027994200000016!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab42139e9c5f%3A0x6eca1d6b8b7323a4!2sIcon%204%20Building!5e0!3m2!1svi!2s!4v1786091960416!5m2!1svi!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="text-[11px] text-white/80">
              Icon 4 Building • 243A Đê La Thành, Láng, Hà Nội
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Footer Bottom Bar */}
      <div className="border-t border-black/10 dark:border-slate-800 bg-black/10 dark:bg-black/30 py-4 text-xs text-white/80 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p>© Copyright VLXD TDT - Hệ Thống Phân Phối Vật Liệu Xây Dựng Miền Bắc. Bảo lưu mọi quyền.</p>
          <p className="text-[11px] text-white/60">
            Tổng đại lý phân phối thép Hòa Phát, xi măng Vicem, gạch ốp lát Prime, chống thấm Sika chính hãng
          </p>
        </div>
      </div>

      {/* Floating Interactive Hotline & Zalo & Back-to-Top Widgets (matching reference) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3">
        {/* Zalo Button */}
        <a
          href="https://zalo.me/0961089292"
          target="_blank"
          rel="noreferrer"
          title="Chat Zalo ngay"
          className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
        >
          <span className="font-black text-xs">Zalo</span>
        </a>

        {/* Ringing Phone Button */}
        <a
          href="tel:0961089292"
          title="Gọi ngay 096 108 9292"
          className="relative w-13 h-13 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform animate-bounce p-3"
        >
          <Phone className="w-6 h-6 fill-white" />
        </a>

        {/* Back to top button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            title="Lên đầu trang"
            className="w-10 h-10 rounded-full bg-slate-900/90 dark:bg-slate-800 text-white flex items-center justify-center shadow-lg hover:bg-amber-600 transition-colors"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}
      </div>
    </footer>
  );
}
