"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, Mail, Lock } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthField from "@/components/auth/AuthField";
import AuthActionRow from "@/components/auth/AuthActionRow";
import AuthModal from "@/components/auth/AuthModal";
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
          const rawRole = (user.role || "").toUpperCase();
          let role: any = "CUSTOMER";
          if (rawRole === "ADMIN") role = "ADMIN";
          else if (rawRole === "MANAGER") role = "MANAGER";
          else if (rawRole === "SHIPPER") role = "SHIPPER";

          useAuthStore.getState().setAuth(accessToken, {
            id: user.userId,
            email: user.email,
            name: user.email.split("@")[0],
            role: role,
          });

          if (role === "ADMIN") {
            window.location.href = "/admin/dashboard";
            return;
          } else if (role === "MANAGER") {
            window.location.href = "/manager";
            return;
          } else if (role === "SHIPPER") {
            window.location.href = "/shipper";
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
    <AuthLayout variant="login">
      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs mb-3 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Email Field */}
        <AuthField
          id="login-email"
          type="email"
          label="Email hoặc tên đăng nhập"
          placeholder="michal.masiak@anywhere.co"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          trailingIcon={<Mail className="w-4 h-4" />}
        />

        {/* Password Field */}
        <div>
          <AuthField
            id="login-password"
            type={showPassword ? "text" : "password"}
            label="Mật khẩu"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            trailingIcon={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] transition-colors rounded-full focus:outline-none"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <div className="flex justify-end mt-1.5 px-1">
            <button
              type="button"
              onClick={() => {
                setForgotEmail(email);
                setForgotSent(false);
                setShowForgotModal(true);
              }}
              className="text-[12px] font-medium text-[#64748B] hover:text-[#1E6BFF] transition-colors"
            >
              Quên mật khẩu?
            </button>
          </div>
        </div>

        {/* Action Buttons: Google OAuth & Submit */}
        <AuthActionRow submitText="Đăng nhập" isLoading={isLoading} />
      </form>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <AuthModal
          isOpen={showForgotModal}
          onClose={() => setShowForgotModal(false)}
          title="Khôi phục mật khẩu"
        >
          {forgotSent ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <h3 className="font-bold text-[16px] text-slate-800">Đã gửi liên kết khôi phục</h3>
              <p className="text-[13px] text-slate-500">
                Vui lòng kiểm tra hộp thư đến của <strong>{forgotEmail}</strong> để đặt lại mật khẩu.
              </p>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full mt-4 py-2.5 rounded-full bg-slate-900 text-white font-medium text-[13px]"
              >
                Đóng
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendResetLink} className="space-y-3 py-2">
              <p className="text-[13px] text-slate-600">
                Nhập địa chỉ email tài khoản của bạn để nhận liên kết đặt lại mật khẩu.
              </p>
              <AuthField
                id="forgot-email"
                type="email"
                label="Email đăng ký"
                placeholder="ten@congty.com"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[13px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-2.5 rounded-full bg-[#1E6BFF] text-white font-semibold text-[13px]"
                >
                  {forgotLoading ? "Đang gửi..." : "Gửi liên kết"}
                </button>
              </div>
            </form>
          )}
        </AuthModal>
      )}
    </AuthLayout>
  );
}
