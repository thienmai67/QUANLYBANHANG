"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, Mail, Lock } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthField from "@/components/auth/AuthField";
import AuthActionRow from "@/components/auth/AuthActionRow";
import AuthModal from "@/components/auth/AuthModal";
import { saveTokens, decodeToken } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { API_BASE_URL } from "@/lib/api";

const MOCK_ACCOUNTS: Record<
  string,
  {
    role: 'ADMIN' | 'MANAGER' | 'SHIPPER' | 'CUSTOMER';
    pass: string;
    name: string;
    userId: string;
  }
> = {
  'customer@tdt.vn': {
    role: 'CUSTOMER',
    pass: 'Customer@123',
    name: 'Khách Hàng Bán Lẻ',
    userId: 'mock-customer-001',
  },
  'manager@tdt.vn': {
    role: 'MANAGER',
    pass: 'Manager@123',
    name: 'Quản Lý Hải Đăng',
    userId: 'mock-manager-001',
  },
  'shipper@tdt.vn': {
    role: 'SHIPPER',
    pass: 'Shipper@123',
    name: 'Trần Quốc Toản',
    userId: 'mock-shipper-001',
  },
  'admin@tdt.vn': {
    role: 'ADMIN',
    pass: 'Admin@123',
    name: 'Quản Trị Hệ Thống',
    userId: 'mock-admin-001',
  },
};

function createMockJwtToken(userId: string, email: string, role: string) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      userId,
      email,
      role,
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
      iat: Math.floor(Date.now() / 1000),
    })
  );
  return `${header}.${payload}.mock-signature`;
}

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

  const performLoginSuccess = (
    accessToken: string,
    refreshToken: string,
    userName?: string
  ) => {
    saveTokens(accessToken, refreshToken);
    const user = decodeToken(accessToken);
    if (!user) return;

    const rawRole = (user.role || '').toUpperCase();
    let role: any = 'CUSTOMER';
    if (rawRole === 'ADMIN') role = 'ADMIN';
    else if (rawRole === 'MANAGER') role = 'MANAGER';
    else if (rawRole === 'SHIPPER') role = 'SHIPPER';

    useAuthStore.getState().setAuth(
      accessToken,
      {
        id: user.userId,
        email: user.email,
        name: userName || user.email.split('@')[0],
        role: role,
        ...(role === 'SHIPPER' ? { shipperId: user.userId } : {}),
      },
      refreshToken
    );

    const redirectParam =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('redirect')
        : null;

    if (redirectParam && redirectParam.startsWith('/')) {
      window.location.href = redirectParam;
      return;
    }

    if (role === 'ADMIN') {
      window.location.href = '/admin/dashboard';
      return;
    } else if (role === 'MANAGER') {
      window.location.href = '/manager/dashboard';
      return;
    } else if (role === 'SHIPPER') {
      window.location.href = '/shipper';
      return;
    }
    window.location.href = '/profile';
  };

  const handleQuickMockLogin = (role: 'ADMIN' | 'MANAGER' | 'CUSTOMER' | 'SHIPPER') => {
    setErrorMsg(null);
    if (role === 'ADMIN') {
      setEmail('admin@tdt.vn');
      setPassword('Admin@123');
    } else if (role === 'MANAGER') {
      setEmail('manager@tdt.vn');
      setPassword('Manager@123');
    } else if (role === 'SHIPPER') {
      setEmail('shipper@tdt.vn');
      setPassword('Shipper@123');
    } else {
      setEmail('customer@tdt.vn');
      setPassword('Customer@123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const mockMatch = MOCK_ACCOUNTS[cleanEmail];
    const isMockMatch = !!(mockMatch && password === mockMatch.pass);

    try {
      let res: Response | null = null;
      try {
        res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password }),
        });
      } catch {
        // Backend offline or network error
      }

      if (res && res.ok) {
        const data = await res.json();
        const accessToken = data.accessToken || data.access_token;
        const refreshToken = data.refreshToken || data.refresh_token || "";
        if (accessToken) {
          performLoginSuccess(accessToken, refreshToken, mockMatch?.name);
          return;
        }
      }

      // If backend failed/offline but credentials match mock accounts:
      if (isMockMatch && mockMatch) {
        const mockToken = createMockJwtToken(mockMatch.userId, cleanEmail, mockMatch.role);
        performLoginSuccess(mockToken, 'mock-refresh-token', mockMatch.name);
        return;
      }

      if (res && !res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            "Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản hoặc đăng nhập với Google."
        );
      }

      throw new Error(
        "Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản hoặc đăng nhập với Google."
      );
    } catch (err: unknown) {
      if (isMockMatch && mockMatch) {
        const mockToken = createMockJwtToken(mockMatch.userId, cleanEmail, mockMatch.role);
        performLoginSuccess(mockToken, 'mock-refresh-token', mockMatch.name);
        return;
      }

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

        {/* Quick Mock Credentials Selection */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 mb-2 text-center">
            Tài khoản thử nghiệm nhanh (Mock Login):
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickMockLogin('MANAGER')}
              className="py-1.5 px-2 rounded-xl text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-all text-center truncate"
            >
              👔 Manager
            </button>
            <button
              type="button"
              onClick={() => handleQuickMockLogin('SHIPPER')}
              className="py-1.5 px-2 rounded-xl text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-all text-center truncate"
            >
              🚚 Shipper
            </button>
            <button
              type="button"
              onClick={() => handleQuickMockLogin('CUSTOMER')}
              className="py-1.5 px-2 rounded-xl text-[11px] font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 transition-all text-center truncate"
            >
              👤 Customer
            </button>
          </div>
        </div>
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
