"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle, KeyRound, CheckCircle2 } from "lucide-react";
import AuthFormWrapper from "@/components/AuthFormWrapper";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import FacebookSignInButton from "@/components/FacebookSignInButton";
import { saveTokens } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            "Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản hoặc đăng nhập với Google."
        );
      }

      const data = await res.json();
      const accessToken = data.accessToken || data.access_token;
      const refreshToken = data.refreshToken || data.refresh_token || "";
      if (accessToken) {
        saveTokens(accessToken, refreshToken);
        const { decodeToken } = await import("@/lib/auth");
        const { useAuthStore } = await import("@/store/useAuthStore");
        const user = decodeToken(accessToken);

        if (user) {
          const isStaff = user.role.toUpperCase() === "ADMIN" || user.role.toUpperCase() === "MANAGER";
          const role = isStaff ? "ADMIN" : "CONTRACTOR";

          useAuthStore.getState().setAuth(accessToken, {
            id: user.userId,
            email: user.email,
            name: user.email.split("@")[0],
            role: role,
          });

          if (isStaff) {
            window.location.href = "/admin/dashboard";
            return;
          }
        }
        window.location.href = "/account";
      } else {
        throw new Error("Phản hồi xác thực không hợp lệ.");
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

  const handleSendResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes("@")) return;

    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSent(true);
    }, 1000);
  };

  return (
    <AuthFormWrapper
      title="Chào mừng bạn trở lại"
      subtitle="Đăng nhập để truy cập nền tảng bóc tách khối lượng BOM"
      footerContent={
        <p>
          Bạn chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="text-accent-blue hover:underline font-semibold"
          >
            Đăng ký ngay
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold text-foreground tracking-wide uppercase"
          >
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="login-email"
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

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-foreground tracking-wide uppercase"
            >
              Mật khẩu
            </label>
            <button
              type="button"
              onClick={() => {
                setForgotEmail(email);
                setForgotSent(false);
                setShowForgotModal(true);
              }}
              className="text-xs text-accent-blue hover:underline font-medium"
            >
              Quên mật khẩu?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

        {/* Submit Button */}
        <button
          id="login-submit-btn"
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-lg bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-70 text-white font-semibold text-sm transition-all shadow-md shadow-accent-blue/20 active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xác thực...</span>
            </>
          ) : (
            <span>ĐĂNG NHẬP</span>
          )}
        </button>
      </form>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-background dark:bg-surface border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-accent-blue">
                <KeyRound className="w-5 h-5" />
                <h3 className="font-bold text-base text-foreground">Đặt Lại Mật Khẩu</h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-muted hover:text-foreground p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {forgotSent ? (
              <div className="py-4 space-y-3 text-center">
                <div className="w-12 h-12 bg-emerald-500/15 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Đã Gửi Liên Kết Đặt Lại!</h4>
                <p className="text-xs text-muted leading-relaxed">
                  Hướng dẫn đặt lại mật khẩu đã được gửi đến <strong className="text-foreground">{forgotEmail}</strong>. Vui lòng kiểm tra hộp thư đến của bạn.
                </p>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="w-full mt-2 py-2 rounded-lg bg-accent-blue text-white font-semibold text-xs"
                >
                  ĐÓNG
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendResetLink} className="space-y-4">
                <p className="text-xs text-muted leading-relaxed">
                  Nhập địa chỉ email tài khoản của bạn để nhận liên kết khôi phục mật khẩu.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase mb-1">
                    Email tài khoản
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="ten@congty.com"
                    className="w-full py-2.5 px-3.5 rounded-lg bg-surface/50 border border-border focus:border-accent-blue text-foreground text-sm focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-1/2 py-2.5 rounded-lg border border-border text-xs font-semibold text-muted hover:text-foreground transition-colors"
                  >
                    HỦY
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-1/2 py-2.5 rounded-lg bg-accent-blue hover:bg-accent-blue/90 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    {forgotLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>GỬI YÊU CẦU</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="relative flex items-center justify-center my-3">
        <div className="border-t border-border/80 w-full" />
        <span className="bg-transparent px-3 text-[11px] font-medium text-muted uppercase tracking-wider whitespace-nowrap">
          hoặc tiếp tục với
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
