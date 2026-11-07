'use client';

import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';

export default function FloatingContactDock() {
  return (
    <aside
      aria-label="Liên hệ kỹ thuật trực tiếp"
      className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-2.5 select-none print:hidden pointer-events-auto"
    >
      {/* Zalo Button */}
      <a
        href="https://zalo.me/0988248524"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat Zalo gửi ảnh thiết bị hỏng cho kỹ thuật viên"
        className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 hover:scale-105 transition-all duration-200 border border-blue-400/30"
      >
        <div className="w-6 h-6 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <MessageCircle className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:flex flex-col text-left pr-1">
          <span className="text-[10px] font-semibold text-blue-100 uppercase tracking-wider leading-none">
            Gửi ảnh bắt bệnh
          </span>
          <span className="text-xs font-bold font-sans mt-0.5 leading-tight">
            Chat Zalo Kỹ Thuật
          </span>
        </div>
        <span className="sm:hidden text-xs font-bold">Zalo</span>
      </a>

      {/* Hotline Call Button */}
      <a
        href="tel:0988248524"
        aria-label="Gọi điện thoại tư vấn kỹ thuật trực tiếp cho Anh Tuấn"
        className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 hover:scale-105 transition-all duration-200 border border-emerald-400/30"
      >
        <div className="relative w-6 h-6 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Phone className="w-4 h-4 text-white animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
        </div>
        <div className="hidden sm:flex flex-col text-left pr-1">
          <span className="text-[10px] font-semibold text-emerald-100 uppercase tracking-wider leading-none">
            Tư vấn tại quầy
          </span>
          <span className="text-xs font-bold font-mono mt-0.5 leading-tight">
            0988.248.524 <span className="text-[11px] font-sans font-normal text-emerald-100">(A. Tuấn)</span>
          </span>
        </div>
        <span className="sm:hidden text-xs font-bold">Gọi</span>
      </a>
    </aside>
  );
}
