"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, Mail, Phone, Lock, User, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthField from "@/components/auth/AuthField";
import AuthActionRow from "@/components/auth/AuthActionRow";
import AuthModal from "@/components/auth/AuthModal";
import { saveTokens } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api";
import { shipperApi } from "@/services/shipperApi";
import { validateRegisterForm, combineFullName, type ValidationError } from "@/lib/auth/validators";

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

  // Shipper application states (GĐ1: nộp hồ sơ, chờ quản lý duyệt mới thành shipper)
  const [accountType, setAccountType] = useState<"CUSTOMER" | "SHIPPER">("CUSTOMER");
  const [shipperFullName, setShipperFullName] = useState("");
  const [shipperPhone, setShipperPhone] = useState("");
  const [shipperDob, setShipperDob] = useState("");
  const [shipperDocType, setShipperDocType] = useState("CCCD");
  const [shipperDocNumber, setShipperDocNumber] = useState("");
  const [shipperPlate, setShipperPlate] = useState("");
  const [shipperLicense, setShipperLicense] = useState("");
  const [shipperTerms, setShipperTerms] = useState(false);
  const [shipperTraining, setShipperTraining] = useState(false);
  const [shipperLoading, setShipperLoading] = useState(false);
  const [shipperSubmitted, setShipperSubmitted] = useState(false);
  // Mã tra cứu trả về đúng 1 lần lúc nộp xong — hiện ngay ở màn hình thành công.
  const [lookupCode, setLookupCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Mở bằng link /register?role=shipper thì chọn sẵn tab Shipper.
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("role=shipper")) {
      setAccountType("SHIPPER");
    }
  }, []);

  const handleSubmitShipper = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    const name = shipperFullName.trim();
    if (name.length < 2 || name.length > 200) {
      errors.fullName = "Họ và tên phải có độ dài từ 2 đến 200 ký tự";
    }
    const phone = shipperPhone.trim();
    if (!/^0\d{9}$/.test(phone)) {
      errors.phone = "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)";
    }
    const dob = new Date(`${shipperDob}T00:00:00`);
    if (!shipperDob || Number.isNaN(dob.getTime())) {
      errors.dateOfBirth = "Ngày sinh không hợp lệ (định dạng YYYY-MM-DD)";
    } else if ((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000) < 18) {
      errors.dateOfBirth = "Shipper phải đủ 18 tuổi";
    }
    const docNumber = shipperDocNumber.trim();
    if (shipperDocType === "CCCD") {
      if (!/^\d{12}$/.test(docNumber)) {
        errors.documentNumber = "Số CCCD phải đúng 12 chữ số";
      }
    } else if (docNumber.length < 4) {
      errors.documentNumber = "Số giấy tờ phải có ít nhất 4 ký tự";
    }
    if (Object.keys(errors).length > 0) {
      setErrorMsg(errors[Object.keys(errors)[0]]);
      setFieldErrors(errors);
      return;
    }
    if (!shipperTerms || !shipperTraining) {
      setErrorMsg("Cần đồng ý điều khoản hợp tác và xác nhận đã học quy trình");
      return;
    }

    setShipperLoading(true);
    try {
      const result = await shipperApi.submitApplication({
        fullName: name,
        phone,
        dateOfBirth: shipperDob,
        documentType: shipperDocType,
        documentNumber: shipperDocNumber.trim(),
        licensePlate: shipperPlate.trim() || undefined,
        driverLicense: shipperLicense.trim() || undefined,
        termsAccepted: true,
        trainingConfirmed: true,
      });
      setLookupCode(result.lookupCode);
      setShipperSubmitted(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể gửi hồ sơ đăng ký, vui lòng thử lại");
    } finally {
      setShipperLoading(false);
    }
  };

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
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
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

      let accessToken = data.accessToken || data.access_token;
      let refreshToken = data.refreshToken || data.refresh_token || "";

      if (!accessToken) {
        try {
          const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              password,
            }),
          });
          if (loginRes.ok) {
            const loginData = await loginRes.json();
            accessToken = loginData.accessToken || loginData.access_token;
            refreshToken = loginData.refreshToken || loginData.refresh_token || "";
          }
        } catch {
          // fallback to manual login redirect below
        }
      }

      if (accessToken) {
        saveTokens(accessToken, refreshToken);
        const { decodeToken } = await import("@/lib/auth");
        const { useAuthStore } = await import("@/store/useAuthStore");
        const decoded = decodeToken(accessToken);
        if (decoded) {
          useAuthStore.getState().setAuth(
            accessToken,
            {
              id: decoded.userId,
              email: decoded.email,
              name: fullName || decoded.email.split("@")[0],
              role: "CUSTOMER",
            },
            refreshToken
          );
        }
        setSuccessMsg("Đăng ký thành công! Đang chuyển hướng...");
        setTimeout(() => {
          window.location.href = "/profile";
        }, 1000);
      } else {
        const { clearTokens } = await import("@/lib/auth");
        const { useAuthStore } = await import("@/store/useAuthStore");
        clearTokens();
        useAuthStore.getState().logout();
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
      {successMsg && (
        <div
          role="status"
          className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs mb-3 animate-fadeIn"
        >
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Customer / Shipper toggle */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#F3F5F9] mb-3">
        <button
          type="button"
          onClick={() => setAccountType("CUSTOMER")}
          className={`py-2.5 rounded-xl text-[13px] transition-colors ${
            accountType === "CUSTOMER"
              ? "bg-white shadow font-semibold text-[#0F172A]"
              : "text-[#64748B] font-medium hover:text-[#0F172A]"
          }`}
        >
          Khách hàng
        </button>
        <button
          type="button"
          onClick={() => setAccountType("SHIPPER")}
          className={`py-2.5 rounded-xl text-[13px] transition-colors ${
            accountType === "SHIPPER"
              ? "bg-white shadow font-semibold text-[#0F172A]"
              : "text-[#64748B] font-medium hover:text-[#0F172A]"
          }`}
        >
          Shipper
        </button>
      </div>

      {accountType === "CUSTOMER" ? (
      <>
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

        {/* Lỗi hiện ngay trên nút Tạo tài khoản, không dồn lên đầu trang */}
        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs animate-fadeIn"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

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
      </>
      ) : shipperSubmitted ? (
      <div className="space-y-4 py-2">
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <h3 className="font-bold text-[16px] text-slate-800">Hồ sơ đang chờ duyệt!</h3>
          <p className="text-[13px] text-slate-600">
            Hồ sơ của bạn đã được gửi tới quản lý. Sau khi được duyệt, bạn dùng số
            điện thoại cộng mã tra cứu bên dưới để xem email được cấp và tự đặt mật
            khẩu đăng nhập.
          </p>
        </div>
        {lookupCode && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
            <p className="text-[13px] font-semibold text-slate-900">
              Mã tra cứu của bạn — chỉ hiện một lần, lưu lại ngay:
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="px-4 py-2 rounded-xl bg-white border border-slate-200 font-mono font-bold text-[18px] tracking-[0.2em] text-slate-900">
                {lookupCode}
              </span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(lookupCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  } catch {
                    // Bỏ qua lỗi copy (trình duyệt chặn clipboard)
                  }
                }}
                className="px-3 py-2 rounded-full bg-white border border-slate-200 text-[12px] font-semibold text-slate-700"
              >
                {copiedCode ? "Đã copy" : "Copy"}
              </button>
            </div>
            <p className="text-[12px] text-amber-700">
              Mất mã thì liên hệ quản lý cấp lại mã mới. Đừng chia sẻ mã này cho
              người khác.
            </p>
          </div>
        )}
        <p className="text-center text-[13px] text-slate-600">
          Bạn cũng có thể tự tra cứu trạng thái hồ sơ bất cứ lúc nào bằng số điện
          thoại và mã tra cứu.
        </p>
        <Link
          href={`/tra-cuu-ho-so?phone=${encodeURIComponent(shipperPhone)}`}
          className="block w-full py-2.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[13px] text-center"
        >
          Tra cứu trạng thái hồ sơ
        </Link>
        <div className="flex gap-2">
          <Link
            href="/"
            className="flex-1 py-2.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[13px] text-center"
          >
            Về trang chủ
          </Link>
          <Link
            href="/login"
            className="flex-1 py-2.5 rounded-full bg-[#1E6BFF] text-white font-semibold text-[13px] text-center"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
      ) : (
      <form onSubmit={handleSubmitShipper} className="space-y-2.5">
        <p className="text-[13px] text-slate-600">
          Đăng ký hồ sơ làm shipper. Hồ sơ ở trạng thái chờ duyệt — bạn chưa có tài
          khoản cho tới khi quản lý duyệt.
        </p>

        {/* Đã nộp hồ sơ rồi thì khỏi điền lại form, bấm sang tra cứu luôn.
            Nếu đã gõ SĐT thì mang theo sang trang tra cứu cho khỏi gõ lại. */}
        <p className="text-[13px] text-slate-600">
          Đã nộp hồ sơ rồi?{" "}
          <Link
            href={
              shipperPhone.trim()
                ? `/tra-cuu-ho-so?phone=${encodeURIComponent(shipperPhone.trim())}`
                : "/tra-cuu-ho-so"
            }
            className="text-[#1E6BFF] font-semibold hover:underline"
          >
            Tra cứu trạng thái hồ sơ
          </Link>
        </p>

        <AuthField
          id="shipper-fullName"
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          required
          value={shipperFullName}
          onChange={(e) => setShipperFullName(e.target.value)}
          errorMessage={fieldErrors.fullName}
          trailingIcon={<User className="w-4 h-4" />}
        />

        <AuthField
          id="shipper-phone"
          type="tel"
          label="Số điện thoại"
          placeholder="0912 345 678"
          required
          value={shipperPhone}
          onChange={(e) => setShipperPhone(e.target.value)}
          errorMessage={fieldErrors.phone}
          trailingIcon={<Phone className="w-4 h-4" />}
        />

        <AuthField
          id="shipper-dob"
          type="date"
          label="Ngày sinh (đủ 18 tuổi)"
          required
          value={shipperDob}
          onChange={(e) => setShipperDob(e.target.value)}
          errorMessage={fieldErrors.dateOfBirth}
        />

        <div className="w-full">
          <div className="relative rounded-2xl transition-all px-4 py-1.5 flex flex-col justify-center min-h-[54px] bg-[#F3F5F9] border-2 border-transparent">
            <label
              htmlFor="shipper-docType"
              className="text-[10px] sm:text-[11px] font-semibold leading-none select-none text-[#7E889B] mb-0.5"
            >
              Loại giấy tờ <span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              id="shipper-docType"
              value={shipperDocType}
              onChange={(e) => setShipperDocType(e.target.value)}
              className="w-full bg-transparent text-[13px] sm:text-[14px] font-semibold text-[#0F172A] outline-none border-none p-0 leading-normal"
            >
              <option value="CCCD">Căn cước công dân (CCCD)</option>
              <option value="CMND">Chứng minh nhân dân (CMND)</option>
              <option value="Hộ chiếu">Hộ chiếu</option>
            </select>
          </div>
        </div>

        <AuthField
          id="shipper-docNumber"
          label="Số giấy tờ"
          placeholder="Nhập số giấy tờ"
          required
          value={shipperDocNumber}
          onChange={(e) => setShipperDocNumber(e.target.value)}
          errorMessage={fieldErrors.documentNumber}
          trailingIcon={<ShieldCheck className="w-4 h-4" />}
        />
        <p className="-mt-1 text-[11px] text-slate-500 px-1">
          Hệ thống chỉ lưu 4 số cuối để đối chiếu, không lưu toàn bộ số giấy tờ.
        </p>

        <AuthField
          id="shipper-plate"
          label="Biển số xe (nếu có)"
          placeholder="VD: 59A-12345"
          value={shipperPlate}
          onChange={(e) => setShipperPlate(e.target.value)}
        />

        <AuthField
          id="shipper-license"
          label="Giấy phép lái xe (nếu luật yêu cầu)"
          placeholder="Nhập số GPLX"
          value={shipperLicense}
          onChange={(e) => setShipperLicense(e.target.value)}
        />

        <label className="flex items-start gap-2.5 px-1 pt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={shipperTerms}
            onChange={(e) => setShipperTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#1E6BFF]"
          />
          <span className="text-[13px] text-slate-600">
            Tôi đồng ý điều khoản hợp tác và chính sách giao hàng của TDT Platform.
          </span>
        </label>

        <label className="flex items-start gap-2.5 px-1 cursor-pointer">
          <input
            type="checkbox"
            checked={shipperTraining}
            onChange={(e) => setShipperTraining(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#1E6BFF]"
          />
          <span className="text-[13px] text-slate-600">
            Tôi xác nhận đã học quy trình nhận và bàn giao đơn hàng.
          </span>
        </label>

        {/* Lỗi hiện ngay trên nút Gửi hồ sơ, không dồn lên đầu trang */}
        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs animate-fadeIn"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={shipperLoading}
            className="w-full h-[48px] px-8 rounded-full bg-[#1E6BFF] hover:bg-[#0F56E8] active:scale-[0.98] text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(30,107,255,0.3)] transition-all select-none disabled:opacity-60 disabled:pointer-events-none"
          >
            {shipperLoading ? "Đang gửi..." : "Gửi hồ sơ đăng ký"}
          </button>
        </div>
      </form>
      )}
    </AuthLayout>
  );
}
