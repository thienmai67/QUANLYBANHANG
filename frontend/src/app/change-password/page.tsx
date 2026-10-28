"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import AuthField from "@/components/auth/AuthField";
import { getAccessToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

// GĐ1 shipper: màn hình đổi mật khẩu. Tài khoản mới được cấp sau duyệt
// (mustChangePassword = true) bị ép vào đây ngay lần đăng nhập đầu;
// đổi xong thì backend tự tắt cờ đó, user về đúng trang theo role.
export default function ChangePasswordPage() {
  const { user, token, setAuth } = useAuthStore();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forced, setForced] = useState(false);
  // Con mắt xem/che mật khẩu cho từng ô (mẫu giống form đăng ký).
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setForced(window.location.search.includes("force=1"));
      if (!getAccessToken()) {
        window.location.href = "/login";
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu mới nhập lại không khớp");
      return;
    }
    if (newPassword === oldPassword) {
      setErrorMsg("Mật khẩu mới không được trùng với mật khẩu cũ");
      return;
    }

    const accessToken = token || getAccessToken();
    if (!accessToken) {
      window.location.href = "/login";
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/me/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Không thể đổi mật khẩu, vui lòng thử lại");
      }

      // Backend đã tắt cờ mustChangePassword; đồng bộ lại store rồi về đúng trang.
      if (user) {
        setAuth(accessToken, { ...user, mustChangePassword: false });
      }
      if (user?.role === "SHIPPER") {
        window.location.href = "/shipper?welcome=1";
      } else if (user?.role === "MANAGER") {
        window.location.href = "/manager/dashboard";
      } else {
        window.location.href = "/profile";
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể đổi mật khẩu, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F1F4F9] flex items-center justify-center p-4 antialiased [color-scheme:light]">
      <div className="w-full max-w-[480px] rounded-[28px] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] border border-slate-100/80 p-6 sm:p-8">
        <h1 className="text-[24px] font-extrabold tracking-tight text-[#0F172A] mb-1.5">
          Đổi mật khẩu
        </h1>
        <p className="text-[13px] text-[#64748B] mb-5">
          {forced
            ? "Tài khoản của bạn dùng mật khẩu tạm. Hãy đặt mật khẩu mới trước khi tiếp tục."
            : "Đặt mật khẩu mới cho tài khoản của bạn."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <AuthField
            id="change-oldPassword"
            type={showOldPassword ? "text" : "password"}
            label="Mật khẩu hiện tại (mật khẩu tạm)"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            trailingIcon={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] transition-colors rounded-full focus:outline-none"
                aria-label={showOldPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showOldPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
          />

          <AuthField
            id="change-newPassword"
            type={showNewPassword ? "text" : "password"}
            label="Mật khẩu mới (tối thiểu 8 ký tự)"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            trailingIcon={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] transition-colors rounded-full focus:outline-none"
                aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
          />

          <AuthField
            id="change-confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            label="Nhập lại mật khẩu mới"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            trailingIcon={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] transition-colors rounded-full focus:outline-none"
                aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
          />

          {/* Lỗi hiện ngay trên nút Đổi mật khẩu, không dồn lên đầu trang */}
          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[48px] px-8 rounded-full bg-[#1E6BFF] hover:bg-[#0F56E8] active:scale-[0.98] text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(30,107,255,0.3)] transition-all select-none disabled:opacity-60 disabled:pointer-events-none"
            >
              {isLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>

        <p className="text-center text-[12px] text-[#94A3B8] pt-4">
          <Link href="/login" className="hover:text-[#1E6BFF] transition-colors">
            Về trang đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
