"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  ArrowRight,
  BookOpen,
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  date: string;
  readTime: string;
  image: string;
  summary: string;
}

const ARTICLES: Article[] = [
  {
    id: "news-1",
    title: "Top 7 Máy Bơm Xăng Dầu Phổ Biến & Tối Ưu Hiệu Suất Cho Trạm Xăng Dầu",
    category: "Tin Kỹ Thuật",
    categoryColor: "bg-accent-blue/10 text-accent-blue border-accent-blue/20",
    date: "24/09/2026",
    readTime: "5 phút đọc",
    image: "https://images.unsplash.com/photo-1545459720-aac8509eb02c?q=80&w=800&auto=format&fit=crop",
    summary: "Đánh giá chi tiết các dòng máy bơm chìm Red Jacket, Tatsuno và Tokheim về lưu lượng, độ bền và mức tiêu hao điện năng.",
  },
  {
    id: "news-2",
    title: "Bảo Trì Thiết Bị Bồn Bể Xăng Dầu Đúng Kỹ Thuật Định Kỳ Đạt Chuẩn ATEX",
    category: "Hướng Dẫn",
    categoryColor: "bg-accent-orange/10 text-accent-orange border-accent-orange/20",
    date: "18/09/2026",
    readTime: "7 phút đọc",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop",
    summary: "Quy trình hút cặn, thử áp lực thủy tĩnh và hiệu chuẩn hệ thống van thở chống cháy nổ để đảm bảo an toàn tuyệt đối.",
  },
  {
    id: "news-3",
    title: "Van An Toàn Xăng Dầu: Cấu Tạo, Nguyên Lý & Tiêu Chuẩn Lắp Đặt Ngăn Cháy",
    category: "Tiêu Chuẩn PCCC",
    categoryColor: "bg-red-500/10 text-red-500 border-red-500/20",
    date: "12/09/2026",
    readTime: "6 phút đọc",
    image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?q=80&w=800&auto=format&fit=crop",
    summary: "Tìm hiểu chi tiết các dòng van ngăn tia lửa Flame Arrester và van ngắt khẩn cấp tự động khi xảy ra quá nhiệt.",
  },
  {
    id: "news-4",
    title: "Quy Trình Thi Công Bồn Chứa Xăng Dầu Ngầm: Biện Pháp Chống Nổi & Tiếp Địa",
    category: "Thi Công Dự Án",
    categoryColor: "bg-accent-green/10 text-accent-green border-accent-green/20",
    date: "05/09/2026",
    readTime: "8 phút đọc",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop",
    summary: "Hướng dẫn đóng cọc giằng chống nổi bồn khi mực nước ngầm dâng cao và lắp đặt lưới tiếp địa chống phóng tĩnh điện.",
  },
  {
    id: "news-5",
    title: "Các Loại Van Công Nghiệp Trong Ngành Xăng Dầu: Van Cầu, Van Bi & Van Một Chiều",
    category: "Kiến Thức Ngành",
    categoryColor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    date: "28/08/2026",
    readTime: "4 phút đọc",
    image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800&auto=format&fit=crop",
    summary: "So sánh vật liệu chế tạo gang cầu, thép đúc và inox 316 phù hợp với từng môi chất xăng sinh học E5 và dầu DO.",
  },
  {
    id: "news-6",
    title: "Kinh Nghiệm Lựa Chọn Đồng Hồ Đo Lưu Lượng & Cột Bơm Điện Tử Sai Số Thấp",
    category: "Mua Sắm Vật Tư",
    categoryColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    date: "20/08/2026",
    readTime: "5 phút đọc",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
    summary: "Những tiêu chí quan trọng khi đầu tư cột bơm và thiết bị đo lưu lượng LC để hạn chế hao hụt và dễ kiểm định định kỳ.",
  },
];

export default function NewsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -380 : 380;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    setTimeout(checkScroll, 350);
  };

  return (
    <section id="news-events" className="space-y-8 scroll-mt-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent-blue/10 border border-accent-blue/30 text-accent-blue text-xs font-bold font-mono tracking-widest uppercase mb-3">
            <BookOpen className="w-4 h-4" /> TIN TỨC &amp; SỰ KIỆN KỸ THUẬT
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Kiến Thức Thiết Kế, Lắp Đặt &amp; Vận Hành
          </h2>
          <p className="text-sm text-muted mt-2.5 max-w-2xl font-medium leading-relaxed">
            Cập nhật thường xuyên quy chuẩn kỹ thuật xăng dầu, thông tư PCCC mới nhất và kinh nghiệm bóc tách khối lượng từ các chuyên gia.
          </p>
        </div>

        {/* Carousel controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Tin trước"
            className="p-2.5 rounded-xl border border-border bg-surface hover:bg-border/60 disabled:opacity-40 disabled:hover:bg-surface text-foreground transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Tin sau"
            className="p-2.5 rounded-xl border border-border bg-surface hover:bg-border/60 disabled:opacity-40 disabled:hover:bg-surface text-foreground transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-none snap-x snap-mandatory"
      >
        {ARTICLES.map((article, idx) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className="w-[320px] sm:w-[360px] shrink-0 snap-start rounded-2xl border border-border bg-surface overflow-hidden flex flex-col justify-between hover:border-accent-blue/40 hover:bg-background transition-all duration-300 shadow-sm hover:shadow-md group"
          >
            <div>
              {/* Thumbnail Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-muted/20">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter saturate-90"
                  loading="lazy"
                />
                <span
                  className={`absolute top-3 left-3 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border backdrop-blur-md ${article.categoryColor}`}
                >
                  {article.category}
                </span>
              </div>

              {/* Text Info */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-4 text-[11px] text-muted font-medium">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {article.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {article.readTime}
                  </span>
                </div>

                <h3 className="font-display text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-accent-blue transition-colors">
                  {article.title}
                </h3>

                <p className="text-xs text-muted leading-relaxed line-clamp-2 font-medium">
                  {article.summary}
                </p>
              </div>
            </div>

            {/* Read More Link */}
            <div className="p-5 pt-0 mt-2">
              <a
                href="#news-events"
                onClick={(e) => {
                  e.preventDefault();
                  alert(`Bài viết "${article.title}" sẽ được xuất bản đầy đủ trên cổng CMS Tin tức.`);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-blue hover:underline uppercase tracking-wider"
              >
                <span>Đọc bài viết</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
