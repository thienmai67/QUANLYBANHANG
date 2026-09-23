"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ShieldCheck, Clock, Layers, Award, Activity } from "lucide-react";

interface TickerItem {
  id: string;
  symbol: string;
  name: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  detail: string;
}

const MARKET_DATA: TickerItem[] = [
  { id: "1", symbol: "LME-CU", name: "Đồng đỏ nguyên chất LME", value: "$9,840/tấn", change: "+1.2%", trend: "up", detail: "Ảnh hưởng giá cáp Cadivi" },
  { id: "2", symbol: "PVC-BM", name: "Ống uPVC Bình Minh D114", value: "142.500 đ/m", change: "-0.4%", trend: "down", detail: "Chiết khấu đại lý Cấp 1: 28%" },
  { id: "3", symbol: "CADIVI-CV", name: "Cáp đơn CV 2.5 Cadivi", value: "8.650 đ/m", change: "+0.8%", trend: "up", detail: "Sẵn hàng kho 120.000m" },
  { id: "4", symbol: "PPR-TP", name: "Ống chịu nhiệt PPR Tiền Phong D25", value: "48.200 đ/m", change: "0.0%", trend: "neutral", detail: "Đầy đủ phụ kiện" },
  { id: "5", symbol: "PANA-MCB", name: "Aptomat Panasonic 2P 32A", value: "128.000 đ/cái", change: "-1.1%", trend: "down", detail: "Bảo hành 24 tháng" },
  { id: "6", symbol: "STEEL-HS", name: "Thép hộp mạ kẽm Hòa Phát", value: "18.900 đ/kg", change: "+0.5%", trend: "up", detail: "Tiêu chuẩn ASTM" },
];

const METRICS = [
  {
    icon: Layers,
    value: "18.5k+",
    label: "SKU Vật Tư Cơ Điện",
    subtext: "Điện, Cấp Thoát Nước & PCCC",
    accent: "from-accent-blue/80 to-accent-blue",
    iconColor: "text-accent-blue",
    badge: "API Sync",
  },
  {
    icon: Clock,
    value: "< 5s",
    label: "Tốc Độ Tính Toán",
    subtext: "Tự động nội suy bảng khối lượng",
    accent: "from-accent-orange/80 to-accent-orange",
    iconColor: "text-accent-orange",
    badge: "Tối ưu",
  },
  {
    icon: ShieldCheck,
    value: "100%",
    label: "CO / CQ & Hóa Đơn",
    subtext: "Hàng dự án chuẩn nhà máy",
    accent: "from-accent-green/80 to-accent-green",
    iconColor: "text-accent-green",
    badge: "Chính hãng",
  },
  {
    icon: Award,
    value: "SLA",
    label: "Giao Đủ Giao Đúng",
    subtext: "Vận tải chuyên dụng 24/7",
    accent: "from-foreground/60 to-foreground",
    iconColor: "text-foreground",
    badge: "Cam kết",
  },
];

export default function LiveMarketTicker() {
  const [activeItem, setActiveItem] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveItem((prev) => (prev + 1) % MARKET_DATA.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Real-time Ticker Bar */}
      <div className="relative overflow-hidden rounded-md border border-border bg-background shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-l-md bg-surface border-r border-border shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-blue"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-foreground font-mono flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-accent-blue" />
              LIVE INDEX
            </span>
          </div>

          {/* Marquee Loop */}
          <div className="relative flex-1 overflow-hidden">
            <div className="animate-marquee flex items-center gap-8 py-1 whitespace-nowrap">
              {MARKET_DATA.concat(MARKET_DATA).map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="inline-flex items-center gap-2.5 text-xs text-muted font-sans transition-transform hover:scale-105 cursor-pointer"
                >
                  <span className="text-foreground tracking-widest font-mono font-medium">{item.symbol}</span>
                  <span className="text-muted font-medium">{item.name}:</span>
                  <span className="text-foreground font-bold">{item.value}</span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                      item.trend === "up"
                        ? "bg-accent-green/10 text-accent-green border border-accent-green/20"
                        : item.trend === "down"
                        ? "bg-accent-orange/10 text-accent-orange border border-accent-orange/20"
                        : "bg-surface text-muted border border-border"
                    }`}
                  >
                    {item.trend === "up" && <TrendingUp className="w-3 h-3" />}
                    {item.trend === "down" && <TrendingDown className="w-3 h-3" />}
                    {item.change}
                  </span>
                  <span className="text-border">|</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Interactive Animated Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
              className="relative overflow-hidden rounded-xl border border-border bg-background p-6 shadow-sm transition-all duration-300 hover:border-accent-blue/40 group"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-md bg-surface border border-border ${metric.iconColor}`}>
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[10px] tracking-widest font-bold uppercase px-2 py-0.5 rounded-md bg-surface border border-border text-muted font-mono">
                  {metric.badge}
                </span>
              </div>

              <div className="mt-6">
                <div className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
                  {metric.value}
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted mt-2">
                  {metric.label}
                </div>
                <p className="text-xs text-muted/80 mt-1.5 leading-snug">
                  {metric.subtext}
                </p>
              </div>

              {/* Bottom active highlight line */}
              <div className="absolute bottom-0 left-0 h-1 w-full bg-surface">
                <motion.div
                  className={`h-full bg-gradient-to-r ${metric.accent}`}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.2, delay: 0.2 + index * 0.15 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
