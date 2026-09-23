"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Truck, CreditCard, RotateCcw, ShieldCheck, CheckCircle, MapPin, ArrowRight } from "lucide-react";

interface Project {
  id: string;
  name: string;
  location: string;
  type: string;
  scale: string;
  suppliedItems: string[];
  status: string;
  value: string;
}

const PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Khu Phức Hợp Masterise Lumiere",
    location: "TP. Thủ Đức, TP. Hồ Chí Minh",
    type: "Chung Cư Cao Cấp & Shophouse",
    scale: "3 Tháp 42 Tầng",
    suppliedItems: ["Cáp điện chống cháy Cadivi", "Ống uPVC & PPR Bình Minh PN16", "Tủ điện Schneider"],
    status: "Đang Cung Ứng Đợt 4",
    value: "14.8 Tỷ VNĐ",
  },
  {
    id: "p2",
    name: "Bệnh Viện Đa Khoa Quốc Tế Nam Sài Gòn",
    location: "Khu Đô Thị Phú Mỹ Hưng, Q.7",
    type: "Công Trình Y Tế Cấp 1",
    scale: "500 Giường Bệnh - 10 Phòng Mổ",
    suppliedItems: ["Cáp đồng bọc hạ thế Cadivi", "Ống kháng khuẩn Dekko", "Thiết bị đóng cắt Panasonic"],
    status: "Đã Nghiệm Thu Hoàn Thành",
    value: "8.6 Tỷ VNĐ",
  },
  {
    id: "p3",
    name: "Nhà Máy Công Nghệ Cao VSIP II",
    location: "Bến Cát, Tỉnh Bình Dương",
    type: "Khu Công Nghiệp Hiện Đại",
    scale: "Diện Tích Sàn 45.000 m²",
    suppliedItems: ["Ống luồn dây thép mạ kẽm G.I", "Cáp điện lực ngầm CXV", "Máng cáp Trunking"],
    status: "Đang Cung Ứng Đợt 2",
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
    bgIcon: "bg-accent-blue/10"
  },
  {
    icon: CreditCard,
    title: "Bảo Lãnh Công Nợ 30 - 45 Ngày",
    desc: "Hỗ trợ dòng vốn thanh toán linh hoạt theo từng kỳ giải ngân khối lượng xây lắp của nhà thầu.",
    color: "from-accent-orange/20 to-accent-orange/5 border-accent-orange/30 text-accent-orange",
    iconColor: "text-accent-orange",
    bgIcon: "bg-accent-orange/10"
  },
  {
    icon: RotateCcw,
    title: "Thu Hồi & Đổi Trả Vật Tư Dư Thừa",
    desc: "Nhận lại 100% nguyên cuộn, nguyên cây còn tem mác khi công trình quyết toán hoàn công.",
    color: "from-accent-green/20 to-accent-green/5 border-accent-green/30 text-accent-green",
    iconColor: "text-accent-green",
    bgIcon: "bg-accent-green/10"
  },
];

export default function ProjectShowcase() {
  const [activeProject, setActiveProject] = useState(0);

  return (
    <section className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent-green/10 border border-accent-green/30 text-accent-green text-xs font-bold uppercase tracking-widest mb-3 font-mono">
          <Building2 className="w-4 h-4" /> Năng Lực Cung Ứng Thực Tế
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
          Dự Án Trọng Điểm & Cam Kết Dịch Vụ Nhà Thầu
        </h2>
        <p className="text-sm text-muted mt-3 max-w-2xl font-medium leading-relaxed">
          Đồng hành cùng hơn 1.200 nhà thầu Cơ Điện M&E trên toàn quốc, cấp vật tư đúng chuẩn tiến độ cam kết trong hợp đồng.
        </p>
      </div>

      {/* SLA Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SLA_LIST.map((sla, idx) => {
          const Icon = sla.icon;
          return (
            <motion.div
              key={sla.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
              className={`rounded-xl border bg-gradient-to-b p-7 backdrop-blur-xl ${sla.color} transition-all duration-300 shadow-sm`}
            >
              <div className={`w-12 h-12 rounded-lg ${sla.bgIcon} flex items-center justify-center mb-5 border border-border/50`}>
                <Icon className={`w-6 h-6 ${sla.iconColor} stroke-[2]`} />
              </div>
              <h3 className="text-base font-bold text-foreground mb-3">
                {sla.title}
              </h3>
              <p className="text-sm text-muted font-medium leading-relaxed">
                {sla.desc}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Featured Projects Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PROJECTS.map((proj, index) => (
          <motion.div
            key={proj.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            className="rounded-xl border border-border bg-surface p-7 flex flex-col justify-between hover:border-accent-blue/40 transition-all duration-300 group shadow-sm hover:shadow-md"
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

              <h4 className="text-xl font-display font-bold text-foreground group-hover:text-accent-blue transition-colors tracking-tight">
                {proj.name}
              </h4>

              <div className="flex items-center gap-2 text-xs text-muted mt-2 mb-5 font-medium">
                <MapPin className="w-4 h-4 text-accent-orange shrink-0" />
                <span>{proj.location}</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-border text-sm font-medium">
                <span className="text-muted block font-semibold uppercase tracking-wider text-xs">Hạng mục đã cấp:</span>
                <div className="space-y-2">
                  {proj.suppliedItems.map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-foreground">
                      <CheckCircle className="w-4 h-4 text-accent-green shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted font-mono font-medium">Quy mô: <span className="font-bold text-foreground">{proj.scale}</span></span>
              <span className="font-bold text-accent-green font-mono bg-accent-green/10 px-2 py-0.5 rounded border border-accent-green/20">
                {proj.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
