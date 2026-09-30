"use client";

import React from "react";
import MaterialHeader from "@/components/MaterialHeader";
import MaterialFooter from "@/components/MaterialFooter";
import { Building2, Home, Landmark, Calculator } from "lucide-react";
import * as motion from "motion/react-client";

export default function CongTrinhPage() {
  const packages = [
    {
      id: "apt-1",
      title: "Gói Cơ Điện Căn Hộ (2PN)",
      desc: "Bộ vật tư tính sẵn gồm dây điện Cadivi, ống thoát nước uPVC Bình Minh & aptomat chống giật Panasonic cho căn hộ 2 phòng ngủ.",
      icon: Home,
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop",
      estCost: "45,000,000 VND"
    },
    {
      id: "villa-1",
      title: "Gói Cấp Nước Biệt Thự Cao Cấp",
      desc: "Hệ thống ống nước uPVC C2 áp lực cao + ống nước nóng PPR Tiền Phong chịu nhiệt cho biệt thự sang trọng.",
      icon: Landmark,
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop",
      estCost: "120,000,000 VND"
    },
    {
      id: "ind-1",
      title: "Gói Điện Xưởng Sản Xuất Công Nghiệp",
      desc: "Ống luồn dây điện Nano chống cháy + cáp ngầm CXV Cadivi đảm bảo an toàn tuyệt đối cho nhà xưởng sản xuất.",
      icon: Building2,
      image: "https://images.unsplash.com/photo-1541888081198-500bdf19c016?q=80&w=800&auto=format&fit=crop",
      estCost: "Liên Hệ Báo Giá"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b14]">
      <MaterialHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-blue-600 font-bold tracking-widest uppercase text-xs">BẢNG TÍNH BOM CHUẨN KỸ THUẬT</span>
          <h1 className="text-4xl sm:text-5xl font-display font-black text-slate-900 dark:text-white mt-4 mb-6 uppercase">
            Gói Vật Tư <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Theo Mô Hình Công Trình</span>
          </h1>
          <p className="text-slate-500">Không còn ước tính cảm tính. Chúng tôi cung cấp các gói dự toán BOM bóc tách chính xác theo chuẩn kỹ thuật xây dựng.</p>
        </div>

        <div className="space-y-12">
          {packages.map((pkg, idx) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className={`flex flex-col ${idx % 2 !== 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-16 items-center`}
            >
              <div className="w-full lg:w-1/2 aspect-video rounded-3xl overflow-hidden shadow-2xl bg-slate-200">
                <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="w-full lg:w-1/2 space-y-6 px-4 lg:px-0">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <pkg.icon className="w-7 h-7" />
                </div>
                <h2 className="text-3xl font-display font-black uppercase text-slate-900 dark:text-white">{pkg.title}</h2>
                <p className="text-slate-500 leading-relaxed text-lg">{pkg.desc}</p>
                
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Chi Phí Dự Kiến</p>
                    <span className="text-2xl font-bold text-orange-500">{pkg.estCost}</span>
                  </div>
                  <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:scale-105 transition-transform">
                    <Calculator className="w-4 h-4" /> Tải Dự Toán BOM
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <MaterialFooter />
    </div>
  );
}
