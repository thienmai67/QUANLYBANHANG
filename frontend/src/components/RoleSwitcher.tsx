"use client";

import React from "react";
import { Role, UserSession } from "@/types/auth";
import { Shield, UserCheck, Briefcase, ShoppingCart, Truck, Sparkles } from "lucide-react";

interface RoleSwitcherProps {
  currentSession: UserSession;
  onRoleChange: (session: UserSession) => void;
}

const ROLES_PRESETS: Record<Role, UserSession> = {
  CUSTOMER: {
    id: "u-cust-001",
    name: "Trần Văn Thầu",
    phone: "0908123456",
    role: "CUSTOMER",
    company: "Công ty XD An Gia • Nhà thầu Q9",
  },
  SALE: {
    id: "u-sale-001",
    name: "Lê Bích Ngọc",
    phone: "0912345678",
    role: "SALE",
    company: "Trợ Lý Bán Hàng & Báo Giá BOM",
  },
  MANAGER: {
    id: "u-mgr-001",
    name: "Nguyễn Hải Đăng",
    phone: "0934567890",
    role: "MANAGER",
    company: "Quản Lý Vận Hành & Duyệt Chiết Khấu",
  },
  SHIPPER: {
    id: "u-ship-001",
    name: "Tài Xế Hoàng Nam",
    phone: "0977777777",
    role: "SHIPPER",
    company: "Đội Vận Chuyển Xe Tải 2.5T",
  },
  ADMIN: {
    id: "u-admin-001",
    name: "System Administrator",
    phone: "0988888888",
    role: "ADMIN",
    company: "Toàn Quyền Cấu Hình & Bảo Mật",
  },
};

export default function RoleSwitcher({ currentSession, onRoleChange }: RoleSwitcherProps) {
  return (
    <div className="border-b border-white/[0.08] bg-[#0B0F17]/90 backdrop-blur-md px-4 py-2 text-xs sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] font-bold">
            <Sparkles className="h-3 w-3" />
            <span>AGILE SCRUM SPRINT 1</span>
          </div>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Đang đóng vai:</span>
            <strong className="text-slate-100 font-semibold">{currentSession.name}</strong>
            <span className="text-slate-500 text-[10px]">({currentSession.company})</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-slate-500 text-[10px] font-mono mr-1">ROLE:</span>
          {(["CUSTOMER", "SALE", "MANAGER", "SHIPPER", "ADMIN"] as Role[]).map((roleKey) => {
            const isSelected = currentSession.role === roleKey;
            return (
              <button
                key={roleKey}
                onClick={() => onRoleChange(ROLES_PRESETS[roleKey])}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                    : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 border border-white/[0.05]"
                }`}
              >
                {roleKey === "CUSTOMER" && <ShoppingCart className="h-3 w-3" />}
                {roleKey === "SALE" && <Briefcase className="h-3 w-3" />}
                {roleKey === "MANAGER" && <UserCheck className="h-3 w-3" />}
                {roleKey === "SHIPPER" && <Truck className="h-3 w-3" />}
                {roleKey === "ADMIN" && <Shield className="h-3 w-3" />}
                <span>{roleKey}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
