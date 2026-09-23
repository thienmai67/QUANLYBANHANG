"use client";

import React from "react";
import { motion } from "framer-motion";
import { Role, UserSession } from "@/types/auth";
import { Shield, UserCheck, Briefcase, ShoppingCart, Truck, Sparkles } from "lucide-react";

interface RoleSwitcherProps {
  currentSession: UserSession;
  onRoleChange: (session: UserSession) => void;
}

export const ROLES_PRESETS: Record<Role, UserSession> = {
  CUSTOMER: {
    id: "u-cust-001",
    name: "Trần Văn Thầu",
    phone: "0908.123.456",
    role: "CUSTOMER",
    company: "Cty XD & Cơ Điện An Gia",
  },
  SALE: {
    id: "u-sale-001",
    name: "Lê Bích Ngọc",
    phone: "0912.345.678",
    role: "SALE",
    company: "Trợ Lý Báo Giá M&E",
  },
  MANAGER: {
    id: "u-mgr-001",
    name: "Nguyễn Hải Đăng",
    phone: "0934.567.890",
    role: "MANAGER",
    company: "Trưởng Phòng Vận Hành Dự Án",
  },
  SHIPPER: {
    id: "u-ship-001",
    name: "Tài Xế Hoàng Nam",
    phone: "0977.777.777",
    role: "SHIPPER",
    company: "Đội Xe Cẩu Chân Công Trình",
  },
  ADMIN: {
    id: "u-admin-001",
    name: "Nguyễn Trung Dũng",
    phone: "0988.888.888",
    role: "ADMIN",
    company: "Quản Trị Viên Hệ Thống TDT",
  },
};

const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: "Nhà Thầu Cơ Điện",
  SALE: "Kinh Doanh M&E",
  MANAGER: "Quản Lý Dự Án",
  SHIPPER: "Vận Tải Xe Cẩu",
  ADMIN: "Quản Trị",
};

const ROLE_ICONS: Record<Role, React.ComponentType<{ className?: string }>> = {
  CUSTOMER: ShoppingCart,
  SALE: Briefcase,
  MANAGER: UserCheck,
  SHIPPER: Truck,
  ADMIN: Shield,
};

const ROLE_COLORS: Record<Role, { gradient: string; glow: string; text: string; bg: string }> = {
  CUSTOMER: {
    gradient: "from-cyan-500 to-blue-600",
    glow: "shadow-cyan-500/25",
    text: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/30",
  },
  SALE: {
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/25",
    text: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/30",
  },
  MANAGER: {
    gradient: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/25",
    text: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
  },
  SHIPPER: {
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/25",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
  },
  ADMIN: {
    gradient: "from-rose-500 to-pink-600",
    glow: "shadow-rose-500/25",
    text: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/30",
  },
};

export default function RoleSwitcher({ currentSession, onRoleChange }: RoleSwitcherProps) {
  const currentRoleConfig = ROLE_COLORS[currentSession.role];

  return (
    <div className="border-b border-white/[0.08] bg-[#060911]/90 backdrop-blur-2xl px-4 py-2 text-xs sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Current user pill */}
        <div className="flex items-center gap-3 min-w-0">
          <motion.div
            key={currentSession.role}
            initial={{ scale: 0.8, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            className={`p-2 rounded-xl bg-gradient-to-br ${currentRoleConfig.gradient} shadow-lg ${currentRoleConfig.glow} text-white`}
          >
            {React.createElement(ROLE_ICONS[currentSession.role], { className: "h-3.5 w-3.5" })}
          </motion.div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-bold text-xs truncate">
                {currentSession.name}
              </p>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${currentRoleConfig.bg} ${currentRoleConfig.text}`}>
                {ROLE_LABELS[currentSession.role]}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {currentSession.company} • SĐT: {currentSession.phone}
            </p>
          </div>
        </div>

        {/* Role buttons with spring animation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none">
          <span className="text-[11px] text-slate-500 uppercase font-mono mr-1 hidden md:inline">
            Giả Lập Vai Trò:
          </span>
          {(["CUSTOMER", "SALE", "MANAGER", "SHIPPER", "ADMIN"] as Role[]).map((roleKey) => {
            const isSelected = currentSession.role === roleKey;
            const Icon = ROLE_ICONS[roleKey];
            const roleConfig = ROLE_COLORS[roleKey];

            return (
              <motion.button
                key={roleKey}
                whileTap={{ scale: 0.95 }}
                onClick={() => onRoleChange(ROLES_PRESETS[roleKey])}
                className={`
                  relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200
                  flex items-center gap-1.5 whitespace-nowrap
                  ${isSelected
                    ? `bg-gradient-to-r ${roleConfig.gradient} text-white shadow-md ${roleConfig.glow}`
                    : "bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-white/[0.06]"
                  }
                `}
              >
                <Icon className={`h-3 w-3 ${isSelected ? "text-white" : "text-slate-400"}`} />
                <span>{ROLE_LABELS[roleKey]}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
