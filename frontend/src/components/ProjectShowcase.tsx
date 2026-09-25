"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Truck,
  CreditCard,
  RotateCcw,
  CheckCircle,
  MapPin,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  location: string;
  type: string;
  scale: string;
  suppliedItems: string[];
  status: string;
  statusCode: "supplying" | "completed";
  value: string;
}

const PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Kho Xăng Dầu Đầu Mối & Cảng Xuất Nhập",
    location: "Khu Kinh Tế Đình Vũ, Hải Phòng",
    type: "Công Trình Dầu Khí Cấp 1",
    scale: "8 Bồn Đứng 20.000m³ - 2 Cầu Cảng",
    suppliedItems: ["Ống thép đúc ASTM A106 Gr.B", "Hệ thống van ngăn lửa Flame Arrester", "Đo bồn tự động ATG"],
    status: "Đang Cung Ứng Đợt 4",
    statusCode: "supplying",
    value: "34.8 Tỷ VNĐ",
  },
  {
    id: "p2",
    name: "Chuỗi 15 Trạm Xăng Dầu Chuẩn Nhận Diện Mới",
    location: "Hà Nội - Bắc Ninh - Hải Dương",
    type: "Hệ Thống Trạm Bán Lẻ",
    scale: "15 Cửa Hàng - 60 Vòi Bơm Điện Tử",
    suppliedItems: ["Cột bơm điện tử đôi Tatsuno", "Ống composite ngầm chống ăn mòn", "Tiếp địa chống tĩnh điện"],
    status: "Đã Nghiệm Thu Hoàn Thành",
    statusCode: "completed",
    value: "18.6 Tỷ VNĐ",
  },
  {
    id: "p3",
    name: "Khu Phức Hợp Masterise Lumiere Riverside",
    location: "TP. Thủ Đức, TP. Hồ Chí Minh",
    type: "Chung Cư Cao Cấp & Shophouse",
    scale: "3 Tháp 42 Tầng - 2 Tầng Hầm",
    suppliedItems: ["Cáp điện chống cháy Cadivi", "Ống uPVC & PPR Bình Minh PN16", "Tủ điện phân phối Schneider"],
    status: "Đang Cung Ứng Đợt 2",
    statusCode: "supplying",
    value: "22.5 Tỷ VNĐ",
  },
];

const SLA_LIST = [
  {
    icon: Truck,
    title: "Giao Hàng Chân Công Trình 2 Giờ",
    desc: "Đội xe tải cẩu từ 2.5T đến 15T túc trực 4 tổng kho, giao hàng xuyên đêm kể cả chủ nhật.",
    color: "from-accent-blue/20 to-accent-blue/5 border-accent-blue/30 text-accent-blue",
    iconColor: "text-accent-blue",
    bgIcon: "bg-accent-blue/10",
  },
  {
    icon: CreditCard,
    title: "Bảo Lãnh Công Nợ 30 - 45 Ngày",
    desc: "Hỗ trợ dòng vốn thanh toán linh hoạt theo từng kỳ giải ngân khối lượng xây lắp của nhà thầu.",
    color: "from-accent-orange/20 to-accent-orange/5 border-accent-orange/30 text-accent-orange",
    iconColor: "text-accent-orange",
    bgIcon: "bg-accent-orange/10",
  },
  {
    icon: RotateCcw,
    title: "Thu Hồi & Đổi Trả Vật Tư Dư Thừa",
    desc: "Nhận lại 100% nguyên cuộn, nguyên cây còn tem mác khi công trình quyết toán hoàn công.",
    color: "from-accent-green/20 to-accent-green/5 border-accent-green/30 text-accent-green",
    iconColor: "text-accent-green",
    bgIcon: "bg-accent-green/10",
  },
];

export default function ProjectShowcase() {
  const [statusFilter, setStatusFilter] = useState<"all" | "supplying" | "completed">("all");

  const filteredProjects =
    statusFilter === "all"
      ? PROJECTS
      : PROJECTS.filter((p) => p.statusCode === statusFilter);

  return (
    <section id="project-showcase" className="space-y-8 scroll-mt-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent-green/10 border border-accent-green/30 text-accent-green text-xs font-bold uppercase tracking-widest mb-3 font-mono">
            <Building2 className="w-4 h-4" /> NĂNG LỰC CUNG ỨNG THỰC TẾ
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
            Dự Án Trọng Điểm &amp; Cam Kết Dịch Vụ Nhà Thầu
          </h2>
          <p className="text-sm text-muted mt-2 max-w-2xl font-medium leading-relaxed">
            Đồng hành cùng hơn 1.200 nhà thầu Cơ Điện &amp; Xăng Dầu trên toàn quốc, cam kết bàn giao vật tư chuẩn quy cách và chuẩn tiến độ.
          </p>
        </div>

        {/* Project Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all border ${
              statusFilter === "all"
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-surface text-muted hover:text-foreground hover:bg-border/50 border-border"
            }`}
          >
            Tất Cả Dự Án
          </button>
          <button
            onClick={() => setStatusFilter("supplying")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all border ${
              statusFilter === "supplying"
                ? "bg-accent-blue text-white border-accent-blue shadow-sm"
                : "bg-surface text-muted hover:text-foreground hover:bg-border/50 border-border"
            }`}
          >
            Đang Cung Ứng
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all border ${
              statusFilter === "completed"
                ? "bg-accent-green text-white border-accent-green shadow-sm"
                : "bg-surface text-muted hover:text-foreground hover:bg-border/50 border-border"
            }`}
          >
            Đã Nghiệm Thu
          </button>
        </div>
      </div>

      {/* SLA Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SLA_LIST.map((sla, idx) => {
          const Icon = sla.icon;
          return (
            <motion.div
              key={sla.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
              className={`rounded-2xl border bg-gradient-to-b p-7 backdrop-blur-xl ${sla.color} transition-all duration-300 shadow-sm`}
            >
              <div
                className={`w-12 h-12 rounded-xl ${sla.bgIcon} flex items-center justify-center mb-5 border border-border/50`}
              >
                <Icon className={`w-6 h-6 ${sla.iconColor} stroke-[2]`} />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">
                {sla.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted font-medium leading-relaxed">
                {sla.desc}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Featured Projects Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((proj, index) => (
            <motion.div
              key={proj.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-border bg-surface p-7 flex flex-col justify-between hover:border-accent-blue/40 transition-all duration-300 group shadow-sm hover:shadow-md hover:bg-background"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs font-mono mb-4">
                  <span className="px-2.5 py-1 rounded bg-accent-blue/10 text-accent-blue border border-accent-blue/20 font-bold tracking-widest uppercase">
                    {proj.type}
                  </span>
                  <span className="text-accent-orange font-bold font-mono">
                    {proj.value}
                  </span>
                </div>

                <h4 className="text-lg sm:text-xl font-display font-bold text-foreground group-hover:text-accent-blue transition-colors tracking-tight">
                  {proj.name}
                </h4>

                <div className="flex items-center gap-2 text-xs text-muted mt-2 mb-5 font-medium">
                  <MapPin className="w-4 h-4 text-accent-orange shrink-0" />
                  <span>{proj.location}</span>
                </div>

                <div className="space-y-3 pt-4 border-t border-border text-xs sm:text-sm font-medium">
                  <span className="text-muted block font-semibold uppercase tracking-wider text-[11px]">
                    Hạng mục đã cấp:
                  </span>
                  <div className="space-y-2">
                    {proj.suppliedItems.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 text-foreground text-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-accent-green shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted font-mono font-medium">
                  Quy mô: <span className="font-bold text-foreground">{proj.scale}</span>
                </span>
                <span
                  className={`font-bold font-mono px-2 py-0.5 rounded border text-[11px] ${
                    proj.statusCode === "completed"
                      ? "text-accent-green bg-accent-green/10 border-accent-green/20"
                      : "text-accent-blue bg-accent-blue/10 border-accent-blue/20"
                  }`}
                >
                  {proj.status}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* View All Projects Bottom Link */}
      <div className="text-center pt-2">
        <a
          href="#catalog"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border bg-surface hover:bg-border/40 text-foreground font-semibold text-xs tracking-wider uppercase transition-all shadow-sm"
        >
          <span>Xem Toàn Bộ Danh Mục Cung Ứng Dự Án</span>
          <ArrowRight className="w-4 h-4 text-accent-blue" />
        </a>
      </div>
    </section>
  );
}
