"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck, KeyRound, Loader2 } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthField from "@/components/auth/AuthField";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import AuthSocialRow from "@/components/auth/AuthSocialRow";
import AuthModal from "@/components/auth/AuthModal";
import { saveTokens } from "@/lib/auth";
import { validateRegisterForm, type ValidationError } from "@/lib/auth/validators";

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

    // Generate random 6-digit OTP code for simulation
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
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            "Email này đã được sử dụng hoặc không thể đăng ký."
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
          className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs animate-shake mb-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs mb-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleStartRegister} className="space-y-2">
        {/* Full Name */}
        <AuthField
          id="register-fullname"
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          required
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (fieldErrors.fullName) {
              setFieldErrors((prev) => ({ ...prev, fullName: "" }));
            }
          }}
          error={fieldErrors.fullName}
        />

        {/* Email & Phone in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <AuthField
            id="register-email"
            type="email"
            label="Email liên hệ"
            placeholder="ten@congty.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: "" }));
              }
            }}
            error={fieldErrors.email}
          />

          <AuthField
            id="register-phone"
            type="tel"
            label="Số điện thoại"
            placeholder="0912 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            trailingLabel={
              <span className="text-[10px] text-[#A1A1AA] font-medium select-none">
                Tùy chọn
              </span>
            }
          />
        </div>

        {/* Password & Confirm Password in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <AuthField
            id="register-password"
            type={showPassword ? "text" : "password"}
            label="Mật khẩu"
            placeholder="Tối thiểu 6 ký tự"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: "" }));
              }
            }}
            error={fieldErrors.password}
            trailingIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="w-8 h-8 flex items-center justify-center text-[#9A9AA2] hover:text-[#111] transition-colors rounded-full focus:outline-none"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            }
          />

          <AuthField
            id="register-confirm-password"
            type={showPassword ? "text" : "password"}
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }
            }}
            error={fieldErrors.confirmPassword}
          />
        </div>

        {/* Submit CTA */}
        <div className="pt-0.5">
          <AuthSubmitButton
            id="register-submit-btn"
            isLoading={isLoading}
            loadingText="Đang xử lý..."
            icon={<ShieldCheck className="w-4 h-4 ml-1" />}
          >
            Tạo tài khoản
          </AuthSubmitButton>
        </div>

        {/* Terms notice */}
        <p className="text-[11px] text-[#8A8A92] text-center leading-tight px-1">
          Bằng việc tạo tài khoản, bạn đồng ý với{" "}
          <Link href="/terms" className="text-[#0B0B0C] underline hover:text-[#FF5A1F]">
            Điều khoản sử dụng
          </Link>{" "}
          và{" "}
          <Link href="/privacy" className="text-[#0B0B0C] underline hover:text-[#FF5A1F]">
            Chính sách bảo mật
          </Link>
          .
        </p>

        {/* Social Row */}
        <AuthSocialRow dividerText="hoặc đăng ký nhanh với" />

        {/* Form Footer Link */}
        <div className="text-center text-[12px] text-[#6E6E76] pt-0.5">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#D2430C] hover:underline ml-1"
          >
            Đăng nhập
          </Link>
        </div>
      </form>

      {/* OTP Verification Modal */}
      <AuthModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        title="Xác Thực Mã OTP Email"
        icon={<KeyRound className="w-5 h-5 text-[#FF5A1F]" />}
      >
        <p className="text-[13px] text-[#6E6E76] leading-relaxed">
          Mã xác thực 6 số đã được khởi tạo cho email{" "}
          <strong className="text-[#0B0B0C]">{email}</strong>.
        </p>

        {/* Simulated OTP Notice Box */}
        <div className="p-3.5 bg-[#FFF4EF] border border-[#FF5A1F]/20 rounded-2xl text-center space-y-1">
          <span className="text-[11px] text-[#8A8A92] uppercase font-mono tracking-wider block">
            Mã OTP thử nghiệm của bạn:
          </span>
          <span className="text-2xl font-mono font-extrabold text-[#FF5A1F] tracking-widest block">
            {generatedOtp}
          </span>
        </div>

        {otpError && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{otpError}</span>
          </div>
        )}

        <form onSubmit={handleVerifyOtpAndCreate} className="space-y-4 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-[#6E6E76] uppercase tracking-wider mb-2">
              Nhập mã OTP 6 số
            </label>
            <input
              type="text"
              maxLength={6}
              required
              value={userOtp}
              onChange={(e) => setUserOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="------"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono h-[52px] rounded-full border border-[#E8E8EA] bg-[#F7F7F8] focus:bg-white focus:border-[#FF5A1F] text-[#0B0B0C] focus:outline-none focus:ring-4 focus:ring-[#FF5A1F]/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              className="w-1/2 h-[46px] rounded-full border border-[#E8E8EA] text-[13px] font-semibold text-[#6E6E76] hover:text-[#111] hover:bg-[#F7F7F8] transition-colors"
            >
              HỦY
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-1/2 h-[46px] rounded-full bg-[#FF5A1F] hover:bg-[#E04B14] disabled:opacity-70 text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-[#FF5A1F]/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>XÁC NHẬN OTP</span>
              )}
            </button>
          </div>
        </form>
      </AuthModal>
    </AuthLayout>
  );
}
