"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Phone, Eye, EyeOff } from "lucide-react";
import AuthField from "@/components/auth/AuthField";
import { shipperApi, type PublicApplicationStatus } from "@/services/shipperApi";

const STATUS_TEXT: Record<
  PublicApplicationStatus["status"],
  { title: string; detail: string; badgeClass: string }
> = {
  PENDING: {
    title: "Hồ sơ đang chờ duyệt",
    detail: "Quản lý sẽ liên hệ với bạn qua số điện thoại này sau khi duyệt.",
    badgeClass: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  },
  APPROVED: {
    title: "Hồ sơ đã được duyệt",
    detail: "Bạn đã được cấp email đăng nhập bên dưới. Đặt mật khẩu để bắt đầu.",
    badgeClass: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  },
  REJECTED: {
    title: "Hồ sơ đã bị từ chối",
    detail: "Bạn có thể nộp lại hồ sơ mới sau khi khắc phục lý do bên dưới.",
    badgeClass: "bg-red-500/10 text-red-700 border-red-500/30",
  },
};

// Trang tra cứu công khai theo SĐT + mã tra cứu, không cần đăng nhập.
// Mã tra cứu chỉ người nộp mới biết nên với hồ sơ APPROVED mới được hiện
// email đã cấp và cho tự đặt mật khẩu. Mã sai hay SĐT lạ đều về cùng 1
// panel "không tìm thấy" chung chung.
export default function LookupApplicationPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Lỗi tách làm 2 để hiện gần nút gây ra nó, không dồn lên đầu trang:
  // lookupError nằm ngay trên nút Tra cứu, setPasswordError nằm ngay trên
  // nút Đặt mật khẩu.
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [setPasswordError, setSetPasswordError] = useState<string | null>(null);
  const [result, setResult] = useState<PublicApplicationStatus | null>(null);
  // SĐT tra cứu không có hồ sơ nào: hiện panel hướng dẫn đăng ký thay vì lỗi.
  const [notFoundPhone, setNotFoundPhone] = useState<string | null>(null);
  // Form đặt mật khẩu cho hồ sơ APPROVED.
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Con mắt xem/che mật khẩu cho từng ô (mẫu giống form đăng ký).
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordSetDone, setPasswordSetDone] = useState(false);

  // Mở từ link ở màn hình "Hồ sơ đang chờ duyệt" thì điền sẵn SĐT.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const prefilled = new URLSearchParams(window.location.search).get("phone");
      if (prefilled) setPhone(prefilled);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setSetPasswordError(null);
    setResult(null);
    setNotFoundPhone(null);
    setPasswordSetDone(false);

    const cleanPhone = phone.trim();
    const cleanCode = code.trim();
    if (!/^0\d{9}$/.test(cleanPhone)) {
      setLookupError("Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)");
      return;
    }
    if (cleanCode === "") {
      setLookupError("Vui lòng nhập mã tra cứu");
      return;
    }

    setIsLoading(true);
    try {
      const data = await shipperApi.lookupApplicationByPhone(cleanPhone, cleanCode);
      setResult(data);
    } catch (err: unknown) {
      if ((err as { notFound?: boolean } | null)?.notFound) {
        setNotFoundPhone(cleanPhone);
      } else {
        setLookupError(err instanceof Error ? err.message : "Không thể tra cứu hồ sơ");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetPasswordError(null);
    if (newPassword.length < 8) {
      setSetPasswordError("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSetPasswordError("Mật khẩu xác nhận chưa khớp");
      return;
    }
    setIsSettingPassword(true);
    try {
      await shipperApi.setShipperPassword(phone.trim(), code.trim(), newPassword);
      setPasswordSetDone(true);
      setResult((prev) => (prev ? { ...prev, passwordSet: true } : prev));
    } catch (err: unknown) {
      setSetPasswordError(err instanceof Error ? err.message : "Không thể đặt mật khẩu");
    } finally {
      setIsSettingPassword(false);
    }
  };

  const statusInfo = result ? STATUS_TEXT[result.status] : null;

  return (
    <div className="min-h-screen w-full bg-[#F1F4F9] flex items-center justify-center p-4 antialiased [color-scheme:light]">
      <div className="w-full max-w-[480px] rounded-[28px] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] border border-slate-100/80 p-6 sm:p-8">
        <h1 className="text-[24px] font-extrabold tracking-tight text-[#0F172A] mb-1.5">
          Tra cứu hồ sơ shipper
        </h1>
        <p className="text-[13px] text-[#64748B] mb-5">
          Nhập số điện thoại và mã tra cứu đã nhận lúc nộp hồ sơ, không cần đăng
          nhập.
        </p>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <AuthField
            id="lookup-phone"
            type="tel"
            label="Số điện thoại đăng ký"
            placeholder="0912 345 678"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            trailingIcon={<Phone className="w-4 h-4" />}
          />

          <AuthField
            id="lookup-code"
            type="text"
            label="Mã tra cứu"
            placeholder="Mã 8 ký tự nhận lúc nộp hồ sơ"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          {lookupError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{lookupError}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[48px] px-8 rounded-full bg-[#1E6BFF] hover:bg-[#0F56E8] active:scale-[0.98] text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(30,107,255,0.3)] transition-all select-none disabled:opacity-60 disabled:pointer-events-none"
            >
              {isLoading ? "Đang tra cứu..." : "Tra cứu"}
            </button>
          </div>
        </form>

        {notFoundPhone && (
          <div className="mt-5 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-2">
            <p className="text-[13px] font-semibold text-slate-900">
              Chưa tìm thấy hồ sơ nào khớp với số điện thoại {notFoundPhone} và mã
              tra cứu này.
            </p>
            <p className="text-[13px] text-slate-600">
              Kiểm tra lại mã tra cứu, hoặc nếu bạn chưa nộp hồ sơ làm shipper thì
              đăng ký trước rồi quay lại tra cứu.
            </p>
            <Link
              href="/register?role=shipper"
              className="block w-full py-2.5 rounded-full bg-[#1E6BFF] text-white font-semibold text-[13px] text-center"
            >
              Đăng ký hồ sơ shipper
            </Link>
          </div>
        )}

        {statusInfo && (
          <div className="mt-5 p-4 rounded-2xl bg-[#F3F5F9] space-y-2">
            <span
              className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.badgeClass}`}
            >
              {statusInfo.title}
            </span>
            <p className="text-[13px] text-slate-600">{statusInfo.detail}</p>
            {result?.status === "REJECTED" && result.rejectionReason && (
              <p className="text-[13px] text-red-600">
                Lý do từ chối: {result.rejectionReason}
              </p>
            )}
            {result?.status === "APPROVED" && result.issuedEmail && (
              <p className="text-[13px] text-slate-900">
                Email đăng nhập của bạn: <strong>{result.issuedEmail}</strong>
              </p>
            )}
            {result?.status === "APPROVED" &&
              (passwordSetDone || result.passwordSet ? (
                <div className="space-y-2 pt-1">
                  <p className="text-[13px] text-emerald-700 font-medium">
                    {passwordSetDone
                      ? "Đã đặt mật khẩu thành công! Đăng nhập bằng email bên trên."
                      : "Mật khẩu đã được đặt. Đăng nhập bằng email bên trên."}
                  </p>
                  <Link
                    href="/login"
                    className="block w-full py-2.5 rounded-full bg-[#1E6BFF] text-white font-semibold text-[13px] text-center"
                  >
                    Đăng nhập
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSetPassword} className="space-y-2.5 pt-1">
                  <AuthField
                    id="set-password"
                    type={showNewPassword ? "text" : "password"}
                    label="Mật khẩu mới"
                    placeholder="Ít nhất 8 ký tự"
                    required
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
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    label="Nhập lại mật khẩu mới"
                    placeholder="Nhập lại mật khẩu mới"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    trailingIcon={
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] transition-colors rounded-full focus:outline-none"
                        aria-label={
                          showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    }
                  />
                  {setPasswordError && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="font-medium">{setPasswordError}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isSettingPassword}
                    className="w-full py-2.5 rounded-full bg-[#1E6BFF] text-white font-semibold text-[13px] hover:bg-[#0F56E8] transition-colors disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {isSettingPassword ? "Đang lưu..." : "Đặt mật khẩu"}
                  </button>
                </form>
              ))}
          </div>
        )}

        <p className="text-center text-[12px] text-[#94A3B8] pt-4">
          <Link href="/register?role=shipper" className="hover:text-[#1E6BFF] transition-colors">
            Đăng ký hồ sơ shipper
          </Link>
          {" · "}
          <Link href="/login" className="hover:text-[#1E6BFF] transition-colors">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
