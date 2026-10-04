import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AuthShowcase from "./AuthShowcase";
import { AUTH_COPY } from "@/lib/auth/authCopy";

export interface AuthLayoutProps {
  variant: "login" | "register";
  children: React.ReactNode;
}

export default function AuthLayout({ variant, children }: AuthLayoutProps) {
  const copy = AUTH_COPY[variant];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F1F1F2] flex items-center justify-center p-3 sm:p-5 lg:p-6 [color-scheme:light] antialiased">
      {/* Outer Card Container - vertically & horizontally centered */}
      <div className="w-full max-w-[1100px] h-[94vh] max-h-[640px] rounded-2xl sm:rounded-[28px] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] flex flex-col lg:flex-row relative bg-white">
        
        {/* Left Panel: Dark Showcase (48% width on desktop) */}
        <div className="w-full lg:w-[48%] shrink-0 h-[140px] sm:h-[180px] lg:h-full relative">
          <AuthShowcase
            eyebrow={copy.eyebrow}
            headlineLine1={copy.headlineLine1}
            headlineLine2={copy.headlineLine2}
            badge={copy.badge}
            imageAlt={copy.imageAlt}
            className="rounded-none sm:rounded-t-[28px] lg:rounded-t-none lg:rounded-l-[28px]"
          />
        </div>

        {/* Right Panel: White Form (54% + overlapping 24px) */}
        <div className="w-full lg:w-[54%] bg-white rounded-none sm:rounded-b-2xl lg:rounded-b-none lg:rounded-[28px] lg:-ml-6 lg:z-10 shadow-[-12px_0_35px_-15px_rgba(0,0,0,0.08)] flex flex-col justify-between px-6 py-5 sm:px-8 sm:py-5 lg:px-10 lg:py-6 h-full overflow-hidden">
          
          {/* Top Bar & Form Header */}
          <div>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#F0F0F2]">
              <Link href="/" className="inline-flex items-center gap-2.5 group focus:outline-none">
                <div className="w-8 h-8 rounded-[8px] bg-[#111] text-white flex items-center justify-center font-display font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
                  T
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-display font-bold text-[16px] leading-tight text-[#0B0B0C] tracking-tight group-hover:text-[#FF5A1F] transition-colors">
                    TDT
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.16em] text-[#8A8A92] font-semibold">
                    M&E Platform
                  </span>
                </div>
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#111] hover:text-[#FF5A1F] transition-colors px-3 py-1.5 rounded-full hover:bg-[#F7F7F8] group"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#8A8A92] group-hover:text-[#FF5A1F] group-hover:-translate-x-0.5 transition-all" />
                <span>Trang chủ</span>
              </Link>
            </div>

            {/* Form Title & Subtitle */}
            <div className="mb-3">
              <h1 className="font-display text-[22px] sm:text-[25px] xl:text-[28px] leading-tight tracking-[-0.02em] text-[#0B0B0C] font-bold">
                {copy.formTitle}
              </h1>
              <p className="text-[13px] text-[#6E6E76] mt-0.5 leading-snug">
                {copy.formSubtitle}
              </p>
            </div>

            {/* Injected Form Body */}
            <div>{children}</div>
          </div>

          {/* Footer Bar: strictly on 1 line with whitespace-nowrap */}
          <div className="pt-3 mt-2 border-t border-[#ECECEE] flex items-center justify-between text-[11px] text-[#9A9AA2] whitespace-nowrap select-none">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="whitespace-nowrap">© 2026 TDT Platform</span>
              <span>·</span>
              <span className="whitespace-nowrap">Đăng nhập bảo mật</span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a href="mailto:support@tdt-platform.vn" className="hover:text-[#111] transition-colors whitespace-nowrap">
                Liên hệ
              </a>
              <span>·</span>
              <span className="text-[#6E6E76] cursor-default font-medium whitespace-nowrap">Tiếng Việt ▾</span>
            </div>
          </div>

        </div>

      </div>

      {/* Mascot Animation: Engineer character at the bottom right corner */}
      <div
        className="fixed bottom-0 right-2 sm:right-6 lg:right-10 z-30 pointer-events-none select-none transition-all duration-300"
        aria-hidden="true"
      >
        <picture>
          <source srcSet="/images/auth/character-engineer.webp" type="image/webp" />
          <img
            src="/images/auth/character-engineer.gif"
            alt="Kỹ sư TDT M&E Platform"
            className="w-[110px] sm:w-[140px] lg:w-[165px] h-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.12)]"
          />
        </picture>
      </div>
    </div>
  );
}
