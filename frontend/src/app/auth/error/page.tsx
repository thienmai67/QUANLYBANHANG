"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";

const ERROR_MAP: Record<string, string> = {
  invalid_state:           "Phiên xác thực không hợp lệ (CSRF mismatch). Vui lòng thử lại.",
  access_denied:           "Bạn đã huỷ đăng nhập qua Google.",
  token_exchange_failed:   "Không thể lấy token từ Google. Vui lòng thử lại.",
  userinfo_failed:         "Không thể lấy thông tin tài khoản Google.",
  email_not_verified:      "Email Google của bạn chưa được xác minh.",
  db_error:                "Lỗi hệ thống khi lưu tài khoản. Vui lòng liên hệ hỗ trợ.",
  token_generation_failed: "Lỗi tạo phiên đăng nhập. Vui lòng thử lại.",
  no_token:                "Không nhận được token xác thực.",
};

function ErrorContent() {
  const params = useSearchParams();
  const reason = params.get("reason") ?? "unknown";
  const message = ERROR_MAP[reason] ?? "Đã xảy ra lỗi không xác định trong quá trình đăng nhập.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F12] px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="flex items-center justify-center">
          <XCircle className="w-14 h-14 text-red-400/70 stroke-[1]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-medium text-[#EDE8D5] tracking-wide">
            Đăng nhập thất bại
          </h1>
          <p className="text-sm text-[#8E887E] leading-relaxed">{message}</p>
          <p className="text-[11px] text-[#5A5852] font-mono">code: {reason}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-lg bg-[#C5A880]/10 hover:bg-[#C5A880]/20 text-[#C5A880] text-sm transition-colors"
          >
            Về trang chủ
          </Link>
          <button
            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/v1/auth/google/login`}
            className="px-6 py-2.5 rounded-lg bg-white/8 hover:bg-white/15 text-white text-sm border border-white/10 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={null}>
      <ErrorContent />
    </Suspense>
  );
}
