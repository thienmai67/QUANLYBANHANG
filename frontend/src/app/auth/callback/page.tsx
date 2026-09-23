"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveTokens } from "@/lib/auth";

function CallbackProcessor() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    const refresh = params.get("refresh");

    if (token) {
      saveTokens(token, refresh ?? "");
      router.replace("/");
    } else {
      router.replace("/auth/error?reason=no_token");
    }
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F12]">
      <div className="flex flex-col items-center gap-5">
        <div className="w-10 h-10 rounded-full border-2 border-[#C5A880]/30 border-t-[#C5A880] animate-spin" />
        <p className="text-[#8E887E] text-sm font-light tracking-[0.12em]">Đang xác thực tài khoản…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackProcessor />
    </Suspense>
  );
}
