import React from "react";
import Link from "next/link";
import Image from "next/image";
import AuthHeroWave from "./AuthHeroWave";
import { AUTH_COPY } from "@/lib/auth/authCopy";

export interface AuthLayoutProps {
  variant: "login" | "register";
  children: React.ReactNode;
}

export default function AuthLayout({ variant, children }: AuthLayoutProps) {
  const copy = AUTH_COPY[variant];

  return (
    <div className="min-h-screen w-full bg-[#F1F4F9] flex items-center justify-center p-3 sm:p-5 lg:p-8 antialiased [color-scheme:light]">
      {/* Outer Floating Card Container */}
      <div className="w-full max-w-[1120px] min-h-[640px] lg:h-[88vh] lg:max-h-[730px] rounded-[28px] sm:rounded-[36px] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] border border-slate-100/80 overflow-hidden relative flex flex-col">
        
        {/* Full-height Right Hero Wave Panel (spans top to bottom on desktop) */}
        <aside
          className="hidden lg:block absolute top-0 right-0 bottom-0 w-[48%] xl:w-[50%] z-10 pointer-events-none"
          aria-label="Hình ảnh vật tư xây dựng"
        >
          <AuthHeroWave
            imageSrc="/images/auth/materials-hero.jpg"
            imageAlt={copy.imageAlt}
            className="h-full w-full"
          />
        </aside>

        {/* Top Bar Header inside the Card */}
        <header className="w-full px-6 sm:px-8 lg:px-10 py-5 sm:py-6 flex items-center justify-between shrink-0 z-30">
          {/* Brand Logo & Name */}
          <Link href="/" className="inline-flex items-center gap-3 group focus:outline-none">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#0B0F19] overflow-hidden flex items-center justify-center shadow-md p-1 group-hover:scale-105 transition-transform relative">
              <Image
                src="/images/auth/tdt-symbol.jpg"
                alt="Logo TDT"
                width={40}
                height={40}
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display font-extrabold text-[17px] sm:text-[19px] leading-tight text-[#0F172A] tracking-tight">
                TDT Platform<span className="text-[#1E6BFF]">.</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.18em] text-[#8C93A3] font-bold">
                Vật Liệu Xây Dựng & M&E
              </span>
            </div>
          </Link>

          {/* Quick Nav Links */}
          <nav className="flex items-center gap-4 text-[13px] font-medium">
            <Link
              href="/"
              className="text-[#475569] hover:text-[#0F172A] transition-colors hidden sm:inline-block bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-100/60 shadow-xs"
            >
              Trang chủ
            </Link>
            <Link
              href={copy.topLinkHref}
              className="text-[#1E6BFF] hover:text-[#0F56E8] font-semibold transition-colors px-3.5 py-1.5 rounded-full hover:bg-blue-50/80 bg-white/85 backdrop-blur-sm border border-slate-100/60 shadow-xs"
            >
              {copy.topLinkText}
            </Link>
          </nav>
        </header>

        {/* Card Main Body Grid: Left Form Panel */}
        <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden z-20">
          
          {/* Left Panel: Form area (Scrollable on small screens) */}
          <main className="w-full lg:w-[52%] xl:w-[50%] h-full flex flex-col justify-between px-6 sm:px-8 lg:px-12 pb-6 pt-1 overflow-y-auto custom-scrollbar">
            <div>
              {/* Eyebrow */}
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8C93A3] mb-2 select-none">
                {copy.eyebrow}
              </p>

              {/* Main Heading with Blue Dot */}
              <h1 className="text-[26px] sm:text-[30px] font-extrabold tracking-tight text-[#0F172A] mb-1.5 leading-snug">
                {copy.formTitle}
              </h1>

              {/* Member Switcher Link */}
              <p className="text-[13px] text-[#64748B] mb-5">
                {copy.formSubtitle}{" "}
                <Link
                  href={copy.footerActionHref}
                  className="text-[#1E6BFF] font-semibold hover:underline ml-1"
                >
                  {copy.footerActionText}
                </Link>
              </p>

              {/* Injected Form Body */}
              <div className="w-full">{children}</div>
            </div>

            {/* Bottom terms notice */}
            <footer className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#94A3B8] select-none">
              <span>© 2026 TDT Platform</span>
              <div className="flex items-center gap-3">
                <a href="mailto:support@tdt-platform.vn" className="hover:text-slate-600 transition-colors">
                  Hỗ trợ
                </a>
                <span>·</span>
                <span className="font-medium text-slate-500">Tiếng Việt</span>
              </div>
            </footer>
          </main>

        </div>

      </div>
    </div>
  );
}
