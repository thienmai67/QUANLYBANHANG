"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Truck,
  Droplets,
  Zap,
  Gauge,
  Filter,
  Wrench,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  subTitle: string;
  count: string;
  badge?: string;
  highlights: string[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgLight: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: "storage",
    name: "Thiết Bị Lưu Trữ & Vận Chuyển",
    subTitle: "Bồn Bể, Xi Téc & Phụ Kiện Rót",
    count: "12 nhóm con",
    badge: "Chuẩn ASME / TCVN",
    highlights: ["Bồn ngầm 10m³ - 50m³", "Van thở chống cháy nổ", "Xi téc bồn téc xăng dầu"],
    icon: Truck,
    accentColor: "text-accent-blue border-accent-blue/30",
    bgLight: "bg-accent-blue/10",
  },
  {
    id: "piping",
    name: "Hệ Thống Đường Ống Truyền Dẫn",
    subTitle: "Ống Chịu Áp, Khớp Nối & Van Chuyên Dụng",
    count: "18 nhóm con",
    badge: "Áp lực PN16 - PN40",
    highlights: ["Ống thép đúc ASTM A106", "Khớp nối nhanh Camlock", "Van bi inox tay gạt"],
    icon: Droplets,
    accentColor: "text-accent-orange border-accent-orange/30",
    bgLight: "bg-accent-orange/10",
  },
  {
    id: "pumps",
    name: "Bơm Xăng Dầu & Thiết Bị Tra Nạp",
    subTitle: "Cột Bơm Điện Tử & Cò Bơm Tự Ngắt",
    count: "15 nhóm con",
    badge: "Công nghệ Tokheim/ZVA",
    highlights: ["Cột bơm điện tử Tatsuno", "Bơm chìm Red Jacket", "Cò bơm tự ngắt ZVA 3/4\""],
    icon: Zap,
    accentColor: "text-accent-blue border-accent-blue/30",
    bgLight: "bg-accent-blue/10",
  },
  {
    id: "measurement",
    name: "Thiết Bị Đo Lường & Tự Động Hóa",
    subTitle: "Đo Mức Tự Động ATG & Đồng Hồ Lưu Lượng",
    count: "9 nhóm con",
    badge: "Đo lường chính xác 99.9%",
    highlights: ["Hệ thống đo bồn tự động Veeder-Root", "Đồng hồ lưu lượng LC", "Thước thủy đo bồn"],
    icon: Gauge,
    accentColor: "text-accent-green border-accent-green/30",
    bgLight: "bg-accent-green/10",
  },
  {
    id: "filtration",
    name: "Hệ Thống Lọc & Tách Nước Xăng Dầu",
    subTitle: "Cốc Lọc Thô, Lõi Lọc Tinh & Tách Cặn",
    count: "8 nhóm con",
    badge: "Lọc tách hạt 5-10µm",
    highlights: ["Lọc tách nước Facet / Velcon", "Cốc lọc trong suốt quan sát", "Lõi lọc giấy thấm dầu"],
    icon: Filter,
    accentColor: "text-amber-500 border-amber-500/30",
    bgLight: "bg-amber-500/10",
  },
  {
    id: "cleaning",
    name: "Thiết Bị Vệ Sinh & Bảo Trì Bồn Bể",
    subTitle: "Máy Hút Cặn, Thổi Khí & Rửa Áp Lực",
    count: "7 nhóm con",
    badge: "Bảo dưỡng định kỳ",
    highlights: ["Bơm hút cặn phòng nổ", "Quạt thông gió chống tĩnh điện", "Dung dịch tẩy rửa bồn"],
    icon: Wrench,
    accentColor: "text-cyan-500 border-cyan-500/30",
    bgLight: "bg-cyan-500/10",
  },
  {
    id: "safety",
    name: "Thiết Bị An Toàn & Phòng Cháy (PCCC)",
    subTitle: "Ngăn Lửa Bùng Cháy, Báo Khí Gas & Tiếp Địa",
    count: "14 nhóm con",
    badge: "Chứng nhận PCCC / ATEX",
    highlights: ["Bộ ngăn tia lửa Flame Arrester", "Kẹp tiếp địa tĩnh điện kèm còi", "Bình bọt Foam AFFF"],
    icon: ShieldCheck,
    accentColor: "text-red-500 border-red-500/30",
    bgLight: "bg-red-500/10",
  },
];

export default function ProductCategoryGrid() {
  return (
    <section id="categories" className="space-y-8 scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent-blue/10 border border-accent-blue/30 text-accent-blue text-xs font-bold font-mono tracking-widest uppercase mb-3">
            <Sparkles className="w-4 h-4" /> HỆ THỐNG DANH MỤC TIÊU CHUẨN
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Danh Mục Thiết Bị &amp; Vật Tư Xăng Dầu Chuyên Dụng
          </h2>
          <p className="text-sm text-muted mt-2.5 max-w-3xl font-medium leading-relaxed">
            Hệ sinh thái thiết bị bồn bể, đường ống công nghệ, trạm cấp phát nhiên liệu và hệ thống kiểm soát an toàn đạt chuẩn kiểm định xuất xưởng.
          </p>
        </div>

        <a
          href="#catalog"
          className="inline-flex items-center gap-2 text-xs font-bold font-mono text-accent-blue hover:text-accent-blue/80 tracking-wider uppercase transition-colors shrink-0 pb-1"
        >
          <span>Xem Toàn Bộ 750+ Mặt Hàng</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* 7-Card Grid: 1-col mobile, 2-col tablet, 3-col desktop + 1 prominent card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {CATEGORIES.map((cat, idx) => {
          const Icon = cat.icon;
          const isFeatured = idx === 0;

          return (
            <motion.a
              key={cat.id}
              href="#catalog"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className={`group relative rounded-2xl border border-border bg-surface p-6 flex flex-col justify-between hover:border-accent-blue/40 hover:bg-background transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1 ${
                isFeatured ? "xl:col-span-2 bg-gradient-to-br from-surface via-surface to-accent-blue/5 border-accent-blue/30" : ""
              }`}
            >
              <div>
                {/* Top Badge & Icon */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div
                    className={`w-11 h-11 rounded-xl ${cat.bgLight} border border-border/60 flex items-center justify-center transition-transform group-hover:scale-105`}
                  >
                    <Icon className={`w-5 h-5 ${cat.accentColor.split(" ")[0]} stroke-[2]`} />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-background border border-border text-muted">
                    {cat.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-display text-lg font-bold text-foreground group-hover:text-accent-blue transition-colors leading-snug">
                  {cat.name}
                </h3>
                <p className="text-xs text-muted font-medium mt-1 mb-4">
                  {cat.subTitle}
                </p>

                {/* Highlight Specs */}
                <ul className="space-y-1.5 pt-3 border-t border-border/70 text-xs text-muted">
                  {cat.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-accent-blue" />
                      <span className="truncate">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom footer action */}
              <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold">
                <span className="font-mono text-[11px] text-muted font-bold">
                  {cat.count}
                </span>
                <span className="text-accent-blue flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Khám phá</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}
