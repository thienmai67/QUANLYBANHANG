import React from "react";
import { Droplet, Zap, Activity, FileSpreadsheet, Package, Layers } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-white/[0.08] bg-[#080B11]/90 backdrop-blur-md sticky top-[41px] z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-1 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 px-3 py-1.5 rounded-xl font-mono font-black text-sm tracking-widest shadow-inner">
            <span className="text-cyan-400">T</span>
            <span className="text-amber-400">D</span>
            <span className="text-emerald-400">T</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white uppercase">
                Vật Tư Cơ Điện M&E
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/10">
                v1.0-scrum
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tighter">
              Bình Minh • Cadivi • Panasonic Platform
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-6 text-xs font-medium text-slate-400">
          <a href="#bom-estimator" className="hover:text-cyan-400 transition flex items-center gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5 text-cyan-400" />
            <span>Bóc Tách BOM</span>
          </a>
          <a href="#orders-pipeline" className="hover:text-amber-400 transition flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-amber-400" />
            <span>Pipeline Đơn Hàng</span>
          </a>
          <a href="#catalog" className="hover:text-white transition flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-slate-300" />
            <span>Vật Tư Chuẩn</span>
          </a>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
            <Activity className="h-3 w-3 animate-pulse text-emerald-400" />
            <span>Postgres & API Ready</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
