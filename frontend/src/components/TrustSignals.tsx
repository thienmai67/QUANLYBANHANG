"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Truck,
  ShieldCheck,
  CreditCard,
  RotateCcw,
  Award,
  Sparkles,
} from "lucide-react";

interface TrustItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge: string;
  accent: string;
  bgLight: string;
}

const TRUST_POINTS: TrustItem[] = [
  {
    icon: CheckCircle2,
    title: "Chất Lượng 100% Chính Hãng",
    description: "Đầy đủ chứng chỉ xuất xưởng CO/CQ, tem kiểm định PCCC và hồ sơ kỹ thuật đồng bộ từ nhà sản xuất.",
    badge: "Chuẩn CO/CQ",
    accent: "text-accent-blue border-accent-blue/30",
    bgLight: "bg-accent-blue/10",
  },
  {
    icon: Truck,
    title: "Giao Hàng Chân Công Trình 2 Giờ",
    description: "Đội ngũ xe tải cẩu từ 2.5T đến 15T túc trực 4 kho đầu mối, phục vụ xuyên đêm đáp ứng tiến độ đổ sàn.",
    badge: "Tốc độ 2H",
    accent: "text-accent-orange border-accent-orange/30",
    bgLight: "bg-accent-orange/10",
  },
  {
    icon: ShieldCheck,
    title: "Chiết Khấu Đại Lý Cấp 1 Trực Tiếp",
    description: "Hưởng trọn mức khấu trừ phân phối cấp 1 từ Cadivi, Bình Minh, Tatsuno, giúp tối ưu biên lợi nhuận thầu.",
    badge: "CK Cấp 1",
    accent: "text-accent-green border-accent-green/30",
    bgLight: "bg-accent-green/10",
  },
  {
    icon: CreditCard,
    title: "Bảo Lãnh Thanh Toán Linh Hoạt",
    description: "Cấp hạn mức công nợ 30 - 45 ngày theo kỳ nghiệm thu giai đoạn xây lắp, tháo gỡ áp lực dòng tiền dự án.",
    badge: "Công nợ 45 ngày",
    accent: "text-accent-blue border-accent-blue/30",
    bgLight: "bg-accent-blue/10",
  },
  {
    icon: RotateCcw,
    title: "Thu Hồi & Đổi Trả Trong 15 Ngày",
    description: "Nhận lại 100% cuộn cáp, cây ống nguyên seal còn thừa sau khi công trình hoàn công quyết toán.",
    badge: "Đổi trả 100%",
    accent: "text-amber-500 border-amber-500/30",
    bgLight: "bg-amber-500/10",
  },
  {
    icon: Award,
    title: "Đồng Hành 1.200+ Nhà Thầu M&E",
    description: "Kinh nghiệm 12 năm cung ứng bồn bể, đường ống công nghệ cho các công trình trọng điểm toàn quốc.",
    badge: "12 năm uy tín",
    accent: "text-purple-500 border-purple-500/30",
    bgLight: "bg-purple-500/10",
  },
];

export default function TrustSignals() {
  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent-green/10 border border-accent-green/30 text-accent-green text-xs font-bold font-mono tracking-widest uppercase mb-1">
          <Sparkles className="w-3.5 h-3.5" /> CAM KẾT VẬN HÀNH &amp; DỊCH VỤ
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          Vì Sao Các Tổng Thầu &amp; Đơn Vị Thi Công Tin Chọn TDT?
        </h2>
        <p className="text-sm text-muted font-medium leading-relaxed">
          Chúng tôi xóa bỏ rủi ro trễ tiến độ, sai lệch quy cách và áp lực dòng vốn bằng cam kết SLA dịch vụ bằng văn bản.
        </p>
      </div>

      {/* Grid: 2 rows x 3 cols on desktop, stack on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {TRUST_POINTS.map((item, idx) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              className="rounded-2xl border border-border bg-surface p-6 flex flex-col justify-between hover:border-accent-blue/30 hover:bg-background transition-all duration-300 shadow-sm hover:shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl ${item.bgLight} border border-border/60 flex items-center justify-center transition-transform group-hover:scale-105`}
                  >
                    <Icon className={`w-6 h-6 ${item.accent.split(" ")[0]} stroke-[2]`} />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted bg-background px-2.5 py-1 rounded-md border border-border">
                    {item.badge}
                  </span>
                </div>

                <h3 className="font-display text-base sm:text-lg font-bold text-foreground group-hover:text-accent-blue transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted mt-2 leading-relaxed font-medium">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border/50 flex items-center gap-2 text-xs font-semibold text-accent-green">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Cam kết hợp đồng minh bạch</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
