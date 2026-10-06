"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, Mail, Phone, Lock, User, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthField from "@/components/auth/AuthField";
import AuthActionRow from "@/components/auth/AuthActionRow";
import AuthModal from "@/components/auth/AuthModal";
import { saveTokens } from "@/lib/auth";
import { validateRegisterForm, combineFullName, type ValidationError } from "@/lib/auth/validators";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function RegisterPage() {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // OTP Step states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [userOtp, setUserOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const handleStartRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setFieldErrors({});

    const fullName = combineFullName(lastName, firstName);

    const validationErrors: ValidationError[] = validateRegisterForm({
      fullName,
      email,
      phone,
      password,
      confirmPassword,
    });

    if (validationErrors.length > 0) {
      setErrorMsg(validationErrors[0].message);
      const errorsMap: Record<string, string> = {};
      for (const err of validationErrors) {
        errorsMap[err.field] = err.message;
      }
      setFieldErrors(errorsMap);
      return;
    }

    // Generate simulated 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setUserOtp("");
    setOtpError("");
    setShowOtpModal(true);
  };

  const handleVerifyOtpAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");

    if (userOtp.trim() !== generatedOtp) {
      setOtpError("Mã OTP không chính xác. Vui lòng kiểm tra lại.");
      return;
    }

    setIsLoading(true);
    const fullName = combineFullName(lastName, firstName);

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message || "Email này đã được sử dụng hoặc không thể đăng ký."
        );
      }

      const data = await res.json();
      setShowOtpModal(false);

      const accessToken = data.accessToken || data.access_token;
      const refreshToken = data.refreshToken || data.refresh_token || "";
      if (accessToken) {
        saveTokens(accessToken, refreshToken);
        setSuccessMsg("Xác thực OTP thành công! Đang chuyển hướng...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      } else {
        setSuccessMsg("Đăng ký thành công! Vui lòng đăng nhập.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
    } catch (err: unknown) {
      setShowOtpModal(false);
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
    <AuthLayout variant="register">
      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs mb-3 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs mb-3 animate-fadeIn"
        >
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleStartRegister} className="space-y-2.5">
        {/* Row 1: Split Name (First Name + Last Name) matching mockup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <AuthField
            id="register-lastName"
            label="Họ và tên đệm"
            placeholder="Michał"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            errorMessage={fieldErrors.fullName}
            trailingIcon={<User className="w-4 h-4" />}
          />
          <AuthField
            id="register-firstName"
            label="Tên"
            placeholder="Masiak"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            trailingIcon={<User className="w-4 h-4" />}
          />
        </div>

        {/* Row 2: Email Field */}
        <AuthField
          id="register-email"
          type="email"
          label="Email công ty hoặc cá nhân"
          placeholder="michal.masiak@anywhere.co"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          errorMessage={fieldErrors.email}
          trailingIcon={<Mail className="w-4 h-4" />}
        />

        {/* Row 3: Phone Field (Optional) */}
        <AuthField
          id="register-phone"
          type="tel"
          label="Số điện thoại (tùy chọn)"
          placeholder="0912 345 678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          errorMessage={fieldErrors.phone}
          trailingIcon={<Phone className="w-4 h-4" />}
        />

        {/* Row 4: Password Field */}
        <AuthField
          id="register-password"
          type={showPassword ? "text" : "password"}
          label="Mật khẩu (tối thiểu 6 ký tự)"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          errorMessage={fieldErrors.password}
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

        {/* Row 5: Confirm Password Field */}
        <AuthField
          id="register-confirmPassword"
          type={showConfirmPassword ? "text" : "password"}
          label="Xác nhận mật khẩu"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          errorMessage={fieldErrors.confirmPassword}
          trailingIcon={
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] transition-colors rounded-full focus:outline-none"
              aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        {/* Action Row: Google OAuth & Submit */}
        <AuthActionRow submitText="Tạo tài khoản" isLoading={isLoading} />
      </form>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <AuthModal
          isOpen={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          title="Xác thực đăng ký tài khoản"
        >
          <form onSubmit={handleVerifyOtpAndCreate} className="space-y-4 py-2">
            <p className="text-[13px] text-slate-600">
              Hệ thống đã tạo mã xác thực mô phỏng cho email <strong>{email}</strong>:
            </p>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
              <span className="text-[12px] text-blue-700 block mb-1">Mã OTP thử nghiệm của bạn:</span>
              <span className="font-mono text-2xl font-bold tracking-widest text-[#1E6BFF]">
                {generatedOtp}
              </span>
            </div>

            <AuthField
              id="otp-input"
              type="text"
              label="Nhập mã 6 chữ số"
              placeholder="123456"
              required
              value={userOtp}
              onChange={(e) => setUserOtp(e.target.value)}
              errorMessage={otpError}
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-2.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[13px]"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-full bg-[#1E6BFF] text-white font-semibold text-[13px] flex items-center justify-center gap-2"
              >
                {isLoading ? "Đang tạo..." : "Xác nhận & Tạo tài khoản"}
              </button>
            </div>
          </form>
        </AuthModal>
      )}
    </AuthLayout>
  );
}
