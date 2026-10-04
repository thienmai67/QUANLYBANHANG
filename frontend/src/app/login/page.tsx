"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, KeyRound, CheckCircle2, Loader2 } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthField from "@/components/auth/AuthField";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import AuthSocialRow from "@/components/auth/AuthSocialRow";
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
          const isStaff =
            user.role.toUpperCase() === "ADMIN" ||
            user.role.toUpperCase() === "MANAGER";
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
    <AuthLayout variant="login">
      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs animate-shake mb-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* Email Field */}
        <AuthField
          id="login-email"
          type="email"
          label="Email hoặc tên đăng nhập"
          placeholder="Email hoặc tên đăng nhập"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password Field */}
        <div className="space-y-0.5">
          <AuthField
            id="login-password"
            type={showPassword ? "text" : "password"}
            label="Mật khẩu"
            placeholder="Mật khẩu"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            trailingIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="w-8 h-8 flex items-center justify-center text-[#9A9AA2] hover:text-[#111] transition-colors rounded-full focus:outline-none"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
          />

          <div className="flex justify-end pt-0.5 px-1">
            <button
              type="button"
              onClick={() => {
                setForgotEmail(email);
                setForgotSent(false);
                setShowForgotModal(true);
              }}
              className="text-[12px] font-medium text-[#D2430C] hover:underline focus:outline-none"
            >
              Quên mật khẩu?
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <AuthSubmitButton
          id="login-submit-btn"
          isLoading={isLoading}
          loadingText="Đang xác thực..."
        >
          Đăng nhập
        </AuthSubmitButton>

        {/* Social Row */}
        <AuthSocialRow dividerText="hoặc tiếp tục với" />

        {/* Form Footer Link */}
        <div className="text-center text-[12px] text-[#6E6E76] pt-1">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#D2430C] hover:underline ml-1"
          >
            Đăng ký ngay
          </Link>
        </div>
      </form>

      {/* Forgot Password Modal */}
      <AuthModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Đặt Lại Mật Khẩu"
        icon={<KeyRound className="w-5 h-5 text-[#FF5A1F]" />}
      >
        {forgotSent ? (
          <div className="py-3 space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-500/15 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-[#0B0B0C]">
              Đã Gửi Liên Kết Đặt Lại!
            </h4>
            <p className="text-[13px] text-[#6E6E76] leading-relaxed">
              Hướng dẫn đặt lại mật khẩu đã được gửi đến{" "}
              <strong className="text-[#0B0B0C] font-semibold">
                {forgotEmail}
              </strong>
              . Vui lòng kiểm tra hộp thư đến của bạn.
            </p>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full mt-2 h-[46px] rounded-full bg-[#111] hover:bg-black text-white font-semibold text-[14px] transition-all"
            >
              ĐÓNG
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendResetLink} className="space-y-4">
            <p className="text-[13px] text-[#6E6E76] leading-relaxed">
              Nhập địa chỉ email tài khoản của bạn để nhận liên kết khôi phục mật khẩu.
            </p>
            <AuthField
              id="forgot-email"
              type="email"
              label="Email tài khoản"
              placeholder="ten@congty.com"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-1/2 h-[46px] rounded-full border border-[#E8E8EA] text-[13px] font-semibold text-[#6E6E76] hover:text-[#111] hover:bg-[#F7F7F8] transition-colors"
              >
                HỦY
              </button>
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-1/2 h-[46px] rounded-full bg-[#FF5A1F] hover:bg-[#E04B14] disabled:opacity-70 text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-[#FF5A1F]/20"
              >
                {forgotLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <span>GỬI YÊU CẦU</span>
                )}
              </button>
            </div>
          </form>
        )}
      </AuthModal>
    </AuthLayout>
  );
}
