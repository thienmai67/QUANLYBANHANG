"use client";

import React, { useState } from "react";
import { ChevronRight, Calendar, ArrowRight, BookOpen } from "lucide-react";
import { MATERIAL_NEWS } from "@/data/materialData";

export default function MaterialNews() {
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  return (
    <section id="news" className="w-full space-y-6 pt-4">
      {/* Header matching xangdauhanoi.com.vn */}
      <div className="flex items-center justify-between border-b-2 border-amber-600 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-6 bg-gradient-to-b from-amber-600 to-orange-600 rounded-sm" />
          <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-slate-900 dark:text-white">
            TIN TỨC SỰ KIỆN & TÀI NGUYÊN KỸ THUẬT
          </h2>
        </div>
        <a
          href="#news"
          className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 hover:text-orange-600 flex items-center gap-1 transition-colors"
        >
          <span>Xem tất cả</span>
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {/* News Grid (3 items) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MATERIAL_NEWS.map((item) => (
          <article
            key={item.id}
            className="group rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-500/60 dark:hover:border-amber-500/60 transition-all duration-300 flex flex-col justify-between"
          >
            {/* Image */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
              />
              <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-mono font-bold text-[10px] uppercase tracking-wider shadow-sm">
                {item.category}
              </span>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.date}</span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setSelectedArticle(item)}
                  className="w-full py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Xem thêm chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Reader Modal if article is clicked */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-sm font-bold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800"
            >
              Đóng ✕
            </button>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold">
              {selectedArticle.category} • {selectedArticle.date}
            </span>
            <h3 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white leading-snug">
              {selectedArticle.title}
            </h3>
            <img
              src={selectedArticle.image}
              alt={selectedArticle.title}
              className="w-full aspect-video rounded-2xl object-cover"
            />
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedArticle.desc}
            </p>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-200">
                Tài liệu & Tiêu chuẩn áp dụng:
              </p>
              <p>• Tiêu chuẩn TCVN 1651:2018 - Thép cốt bê tông - Thép thanh vằn và thép cuộn.</p>
              <p>• Tiêu chuẩn TCVN 6260:2020 - Xi măng poóc lăng hỗn hợp - Yêu cầu kỹ thuật.</p>
              <p>• Tiêu chuẩn TCVN 7570:2006 - Cốt liệu cho bê tông và vữa xây dựng.</p>
              <p>• Tiêu chuẩn TCVN 9035:2011 - Hướng dẫn lựa chọn và thi công màng chống thấm công trình.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
