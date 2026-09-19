import React from "react";
import { Droplet, Zap, TrendingDown, ArrowUpRight, ShieldCheck, Box } from "lucide-react";

export default function HeroBento() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-8 relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0F172A] via-[#0B1120] to-[#080D1A] p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-40 -bottom-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono text-slate-300 mb-4 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Nền tảng Báo giá & Phân phối Cơ Điện M&E</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Số Hóa Báo Giá & Bóc Tách <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-400 bg-clip-text text-transparent">
              Vật Tư ĐIỆN - NƯỚC
            </span>
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
            Tự động quy đổi đơn vị công trình (Cuộn/Cây $\rightarrow$ Mét), tích hợp bảng chiết khấu chính hãng đại lý cấp 1 và quản lý vòng đời đơn hàng theo tiêu chuẩn Agile Scrum.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Hãng đối tác</span>
            <p className="text-sm font-bold text-slate-200 mt-0.5">Bình Minh • Cadivi</p>
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Chiết khấu sỉ</span>
            <p className="text-sm font-bold text-emerald-400 mt-0.5">Lên tới 22%</p>
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Quy cách kỹ thuật</span>
            <p className="text-sm font-bold text-cyan-400 mt-0.5">Φ21-114 • 1.5-10mm²</p>
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Kiến trúc hệ thống</span>
            <p className="text-sm font-bold text-amber-400 mt-0.5">Go + Postgres 16</p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0E1526] p-5 flex flex-col justify-between hover:border-cyan-500/30 transition">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Droplet className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
              PLUMBING
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-bold text-white">Ống & Phụ Kiện uPVC/PPR</h3>
            <p className="text-xs text-slate-400 mt-1">Bình Minh chiết khấu 18% catalog. Quy đổi cây 4m sang mét lẻ.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0E1526] p-5 flex flex-col justify-between hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
              ELECTRICAL
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-bold text-white">Dây Cáp Điện & Thiết Bị</h3>
            <p className="text-xs text-slate-400 mt-1">Cadivi chiết khấu 22% cuộn 100m. Panasonic bảo vệ MCB/RCBO.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
