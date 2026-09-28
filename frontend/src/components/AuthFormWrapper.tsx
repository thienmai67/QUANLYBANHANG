"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AuthFormWrapperProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerContent?: ReactNode;
}

export default function AuthFormWrapper({
  title,
  subtitle,
  children,
  footerContent,
}: AuthFormWrapperProps) {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-[#F8F5EE] via-[#FFFFFF] to-[#E8DFD1] dark:from-[#060810] dark:via-[#0D1117] dark:to-[#16171B] transition-colors duration-500 overflow-hidden">
      {/* Decorative ambient background glows */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-accent-blue/10 dark:bg-accent-blue/5 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent-orange/10 dark:bg-accent-orange/5 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top action controls: Back home & Theme Toggle */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-surface/80 border border-transparent hover:border-border transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </Link>
      </div>

      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <div className="p-0.5 rounded-lg border border-border/60 bg-surface/50 backdrop-blur-md">
          <ThemeToggle />
        </div>
      </div>

      {/* Main Glassmorphism Card */}
      <div className="w-full max-w-[440px] z-10 my-8">
        <div className="glass-panel w-full bg-background/85 dark:bg-surface/65 backdrop-blur-xl border border-border/80 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-accent-blue/5 transition-all">
          {/* Logo & Brand Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 group mb-4 focus:outline-none"
            >
              <div className="w-10 h-10 bg-accent-blue rounded-xl flex items-center justify-center text-white font-bold font-display text-xl shadow-md shadow-accent-blue/25 group-hover:scale-105 transition-transform">
                T
              </div>
              <div className="flex flex-col text-left">
                <span className="font-display font-bold text-lg leading-tight text-foreground tracking-tight group-hover:text-accent-blue transition-colors">
                  TDT Platform
                </span>
                <span className="text-[10px] text-muted font-sans font-medium uppercase tracking-wider">
                  M&E Intelligence
                </span>
              </div>
            </Link>

            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1 max-w-xs">
              {subtitle}
            </p>
          </div>

          {/* Form Content */}
          <div className="space-y-4">{children}</div>

          {/* Card Footer Link */}
          {footerContent && (
            <div className="mt-6 pt-4 border-t border-border/60 text-center text-xs text-muted">
              {footerContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
