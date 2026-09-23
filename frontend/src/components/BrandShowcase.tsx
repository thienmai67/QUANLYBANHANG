"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Award, ExternalLink, Download, FileText, ChevronRight } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  category: "all" | "cable" | "pipe" | "device" | "light";
  categoryLabel: string;
  discount: string;
  coCq: string;
  origin: string;
  highlight: string;
  logoBg: string;
  colorBorder: string;
}

const BRANDS: Brand[] = [
  {
    id: "cadivi",
    name: "CADIVI",
    category: "cable",
    categoryLabel: "Dây & Cáp Điện",
    discount: "32% - 38%",
    coCq: "TCVN 6610 / IEC 60227",
    origin: "Việt Nam (Chính Hãng)",
    highlight: "Cáp đơn CV, cáp ngầm CXV, cáp chống cháy",
    logoBg: "from-accent-orange/20 to-accent-orange/5",
    colorBorder: "hover:border-accent-orange/50",
  },
  {
    id: "binhminh",
    name: "BÌNH MINH",
    category: "pipe",
    categoryLabel: "Ống Nhựa & Phụ Kiện",
    discount: "26% - 31%",
    coCq: "ISO 1452 / ISO 4422",
    origin: "Nhà máy Bình Dương",
    highlight: "uPVC, HDPE chịu lực, PPR hàn nhiệt cao cấp",
    logoBg: "from-accent-blue/20 to-accent-blue/5",
    colorBorder: "hover:border-accent-blue/50",
  },
  {
    id: "tienphong",
    name: "TIỀN PHONG",
    category: "pipe",
    categoryLabel: "Ống Nước Dự Án",
    discount: "28% - 34%",
    coCq: "TCVN 8491 / DIN 8077",
    origin: "Hải Phòng / Bình Dương",
    highlight: "Ống luồn dây tròn, ống gân xoắn thoát nước",
    logoBg: "from-accent-blue/20 to-accent-blue/5",
    colorBorder: "hover:border-accent-blue/50",
  },
  {
    id: "panasonic",
    name: "PANASONIC",
    category: "device",
    categoryLabel: "Thiết Bị Đóng Cắt",
    discount: "35% - 42%",
    coCq: "JIS C 8201 / IEC 60898",
    origin: "Nhật Bản / Việt Nam",
    highlight: "Aptomat MCB/MCCB, công tắc Halumie, quạt hút",
    logoBg: "from-purple-500/20 to-indigo-500/5",
    colorBorder: "hover:border-purple-500/50",
  },
  {
    id: "schneider",
    name: "SCHNEIDER",
    category: "device",
    categoryLabel: "Tự Động Hóa Tòa Nhà",
    discount: "30% - 36%",
    coCq: "IEC 60947-2 (Châu Âu)",
    origin: "Pháp / Indonesia",
    highlight: "Khởi động từ, Contactor, Tủ điện phân phối Acti9",
    logoBg: "from-accent-green/20 to-teal-500/5",
    colorBorder: "hover:border-accent-green/50",
  },
  {
    id: "philips",
    name: "PHILIPS OEM",
    category: "light",
    categoryLabel: "Đèn Chiếu Sáng Dự Án",
    discount: "40% - 46%",
    coCq: "CE / RoHS / ISO 9001",
    origin: "Châu Âu / Hà Lan",
    highlight: "Đèn Led Panel 600x600, Downlight, Pha xưởng HighBay",
    logoBg: "from-purple-500/20 to-indigo-500/5",
    colorBorder: "hover:border-purple-500/50",
  },
];

const CATEGORIES = [
  { id: "all", label: "Tất Cả Hãng" },
  { id: "cable", label: "Dây & Cáp Điện" },
  { id: "pipe", label: "Ống Cấp Thoát Nước" },
  { id: "device", label: "Thiết Bị Đóng Cắt" },
  { id: "light", label: "Chiếu Sáng Công Trình" },
];

export default function BrandShowcase() {
  const [selectedCat, setSelectedCat] = useState<string>("all");

  const filtered = selectedCat === "all" ? BRANDS : BRANDS.filter((b) => b.category === selectedCat);

  return (
    <section className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent-blue/10 border border-accent-blue/30 text-accent-blue text-xs font-bold font-mono tracking-widest uppercase mb-3">
            <Award className="w-4 h-4" /> ĐỐI TÁC CẤP 1 ỦY QUYỀN
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-foreground font-bold tracking-tight">
            Hệ Sinh Thái Thương Hiệu Hàng Đầu
          </h2>
          <p className="text-sm text-muted mt-3 max-w-2xl font-medium leading-relaxed">
            Vật tư nhập trực tiếp từ tổng kho nhà máy, đầy đủ chứng nhận CO/CQ xuất xưởng và bảo hành chính hãng từ các thương hiệu hàng đầu thế giới & Việt Nam.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`relative px-4 py-2.5 rounded-md text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap border ${
                  isActive
                    ? "bg-foreground text-background border-foreground shadow-[0_4px_15px_rgba(var(--foreground),0.2)]"
                    : "text-muted bg-surface hover:text-foreground hover:bg-border/50 border-border"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((brand, index) => (
            <motion.div
              layout
              key={brand.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className={`relative overflow-hidden rounded-xl border border-border bg-surface p-6 sm:p-7 shadow-sm transition-all duration-300 hover:shadow-md group flex flex-col justify-between hover:bg-background ${brand.colorBorder}`}
            >
              <div>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent-blue px-2.5 py-1 rounded bg-accent-blue/10 border border-accent-blue/20">
                      {brand.categoryLabel}
                    </span>
                    <h3 className="text-2xl font-display font-bold tracking-tight text-foreground mt-4 group-hover:text-accent-blue transition-colors">
                      {brand.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-muted block uppercase tracking-widest font-bold">Chiết Khấu Cấp 1</span>
                    <span className="text-sm font-bold font-mono text-accent-orange bg-accent-orange/10 px-2.5 py-1 rounded border border-accent-orange/20 inline-block mt-1">
                      {brand.discount}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted mb-5 line-clamp-2 leading-relaxed font-medium">
                  {brand.highlight}
                </p>

                <div className="space-y-3 pt-4 border-t border-border text-xs font-medium">
                  <div className="flex items-center justify-between text-muted">
                    <span>Tiêu Chuẩn:</span>
                    <span className="text-foreground font-bold font-mono bg-background px-2 py-0.5 rounded border border-border">{brand.coCq}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Xuất Xứ:</span>
                    <span className="text-accent-green flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> {brand.origin}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between group-hover:border-accent-blue/20 transition-colors">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-xs text-accent-blue hover:text-accent-blue/80 font-bold tracking-widest uppercase transition-colors"
                >
                  <FileText className="w-4 h-4" /> BẢNG GIÁ & CATALOGUE
                </button>
                <div className="w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue group-hover:bg-accent-blue group-hover:text-white transition-all transform group-hover:translate-x-1">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
