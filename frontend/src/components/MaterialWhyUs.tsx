"use client";

import React from "react";
import {
  ShieldCheck,
  Award,
  BadgeDollarSign,
  Truck,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

interface MaterialWhyUsProps {
  onOpenRFQ: (note?: string) => void;
}

export default function MaterialWhyUs({ onOpenRFQ }: MaterialWhyUsProps) {
  const pillars = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-white" />,
      title: "100% Chính Hãng Chuẩn TCVN",
      desc: "Sản phẩm có nguồn gốc rõ ràng, đầy đủ CO/CQ xuất xưởng từ Hòa Phát, Vicem, Viglacera, kiểm định cơ lý mẫu tại phòng LAS-XD.",
    },
    {
      icon: <Award className="w-6 h-6 text-white" />,
      title: "Kỹ Sư Bóc Tách Dự Toán",
      desc: "Đội ngũ kỹ sư xây dựng hỗ trợ đọc bản vẽ kết cấu, tính toán bảng khối lượng thép, xi măng, gạch cát chính xác, tránh lãng phí vật tư.",
    },
    {
      icon: <BadgeDollarSign className="w-6 h-6 text-white" />,
      title: "Giá Gốc Nhà Máy & Chiết Khấu",
      desc: "Hợp đồng phân phối cấp 1 từ các nhà máy lớn, chính sách chiết khấu tối đa cho nhà thầu xây dựng, chủ đầu tư và đại lý bán lẻ.",
    },
    {
      icon: <Truck className="w-6 h-6 text-white" />,
      title: "Giao Hàng Tận Chân Công Trình",
      desc: "Đội xe tải ben, xe cẩu tự hành, xe bồn bê tông tươi sẵn sàng giao hàng ngay trong ngày 24/7 tại Hà Nội và các tỉnh phía Bắc.",
    },
  ];

  return (
    <section id="why-us" className="w-full py-6">
      <div className="rounded-3xl bg-gradient-to-br from-white via-slate-50 to-amber-50/30 dark:from-[#0c1322] dark:via-[#090d16] dark:to-amber-950/20 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 lg:p-12 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Heading, Pitch, CTA */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Cam Kết Từ Tổng Kho VLXD
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-slate-900 dark:text-white tracking-tight leading-tight">
                Vì sao nên chọn <br className="hidden sm:inline" />
                <span className="text-amber-600 dark:text-amber-400">Vật Liệu Xây Dựng TDT</span>
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-amber-600 to-orange-500 rounded-full" />
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed text-justify">
              <strong>Chất lượng tạo nên uy tín – Đồng hành cùng các công trình bằng giải pháp cung ứng vật tư chuẩn xác và hiệu quả.</strong> Chúng tôi tập trung cung cấp sắt thép, xi măng, gạch ốp lát, cát đá và phụ gia chống thấm chính hãng, tư vấn đúng mác vật liệu và giao hàng tận chân công trình 24/7. VLXD TDT luôn hướng đến sự an tâm, trở thành đối tác tin cậy của các nhà thầu xây dựng tại Việt Nam.
            </p>

            <div className="space-y-2 pt-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>100% sắt thép, xi măng có chứng chỉ xuất xưởng và hóa đơn VAT</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Hỗ trợ đúc mẫu nén bê tông thí nghiệm 7 ngày & 28 ngày</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Chính sách công nợ linh hoạt cho các dự án và nhà thầu uy tín</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onOpenRFQ("Yêu cầu tư vấn & báo giá vật tư công trình")}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 transition-all flex items-center gap-2 group"
              >
                <span>Đề nghị báo giá dự toán</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column: 4 Icon Boxes Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pillars.map((item, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all duration-300 space-y-3 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-md shadow-orange-600/20 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
