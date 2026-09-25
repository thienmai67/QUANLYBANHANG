"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, AlertCircle, CheckCircle2 } from "lucide-react";
import AuthFormWrapper from "@/components/AuthFormWrapper";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import FacebookSignInButton from "@/components/FacebookSignInButton";
import { saveTokens } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Client validation
    if (password.length < 6) {
      setErrorMsg("Mật khẩu phải có độ dài ít nhất 6 ký tự.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            "Đăng ký không thành công. Email này có thể đã được sử dụng."
        );
      }

      const data = await res.json();
      if (data.access_token) {
        saveTokens(data.access_token, data.refresh_token || "");
        setSuccessMsg("Đăng ký thành công! Đang chuyển hướng...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      } else {
        setSuccessMsg("Tạo tài khoản thành công! Vui lòng đăng nhập.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormWrapper
      title="Tạo tài khoản mới"
      subtitle="Tham gia cộng đồng kỹ sư, nhà thầu & đối tác phân phối M&E"
      footerContent={
        <p>
          Bạn đã có tài khoản?{" "}
          <Link
            href="/login"
            className="text-accent-blue hover:underline font-semibold"
          >
            Đăng nhập
          </Link>
        </p>
      }
    >
      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs animate-shake"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Full Name */}
        <div className="space-y-1">
          <label
            htmlFor="register-fullname"
            className="block text-xs font-semibold text-foreground tracking-wide uppercase"
          >
            Họ và tên
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              <User className="w-4 h-4" />
            </div>
            <input
              id="register-fullname"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-surface/50 dark:bg-surface/20 border border-border focus:border-accent-blue text-foreground placeholder-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue/30 transition-colors"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label
            htmlFor="register-email"
            className="block text-xs font-semibold text-foreground tracking-wide uppercase"
          >
            Email liên hệ
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="register-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten@congty.com"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-surface/50 dark:bg-surface/20 border border-border focus:border-accent-blue text-foreground placeholder-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue/30 transition-colors"
            />
          </div>
        </div>

        {/* Phone (Optional) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="register-phone"
              className="block text-xs font-semibold text-foreground tracking-wide uppercase"
            >
              Số điện thoại
            </label>
            <span className="text-[10px] text-muted">Không bắt buộc</span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              <Phone className="w-4 h-4" />
            </div>
            <input
              id="register-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912 345 678"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-surface/50 dark:bg-surface/20 border border-border focus:border-accent-blue text-foreground placeholder-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue/30 transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label
            htmlFor="register-password"
            className="block text-xs font-semibold text-foreground tracking-wide uppercase"
          >
            Mật khẩu
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-surface/50 dark:bg-surface/20 border border-border focus:border-accent-blue text-foreground placeholder-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue/30 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground transition-colors"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label
            htmlFor="register-confirm-password"
            className="block text-xs font-semibold text-foreground tracking-wide uppercase"
          >
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="register-confirm-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-surface/50 dark:bg-surface/20 border border-border focus:border-accent-blue text-foreground placeholder-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue/30 transition-colors"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          id="register-submit-btn"
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-70 text-white font-semibold text-sm transition-all shadow-md shadow-accent-blue/20 active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang khởi tạo tài khoản...</span>
            </>
          ) : (
            <span>ĐĂNG KÝ TÀI KHOẢN</span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-3">
        <div className="border-t border-border/80 w-full" />
        <span className="bg-transparent px-3 text-[11px] font-medium text-muted uppercase tracking-wider whitespace-nowrap">
          hoặc đăng ký nhanh với
        </span>
        <div className="border-t border-border/80 w-full" />
      </div>

      {/* Social Logins */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <GoogleSignInButton className="border border-border/80 bg-surface/70 hover:bg-surface text-foreground w-full justify-center text-xs py-2.5" />
        <FacebookSignInButton className="border border-border/80 bg-surface/70 hover:bg-surface text-foreground w-full justify-center text-xs py-2.5" />
      </div>
    </AuthFormWrapper>
  );
}
