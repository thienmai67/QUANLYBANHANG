import React from "react";
import { Loader2 } from "lucide-react";

export interface AuthActionRowProps {
  submitText: string;
  isLoading?: boolean;
  onGoogleClick?: () => void;
  className?: string;
}

export default function AuthActionRow({
  submitText,
  isLoading = false,
  onGoogleClick,
  className = "",
}: AuthActionRowProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

  const handleGoogleRedirect = () => {
    if (onGoogleClick) {
      onGoogleClick();
    } else {
      window.location.href = `${API_URL}/api/v1/auth/google/login`;
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-3 pt-2 ${className}`}>
      {/* Secondary Button: Google OAuth Pill */}
      <button
        type="button"
        onClick={handleGoogleRedirect}
        disabled={isLoading}
        className="w-full sm:w-auto flex-1 h-[48px] px-5 rounded-full bg-[#F3F5F9] hover:bg-[#E8EDF5] active:scale-[0.98] text-[#475569] font-medium text-[13px] flex items-center justify-center gap-2.5 transition-all select-none border border-slate-200/60 shadow-sm disabled:opacity-50"
      >
        {/* Google 4-color SVG Icon */}
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Đăng nhập Google</span>
      </button>

      {/* Primary Submit Button: Blue Pill */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full sm:w-auto flex-1 h-[48px] px-8 rounded-full bg-[#1E6BFF] hover:bg-[#0F56E8] active:scale-[0.98] text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(30,107,255,0.3)] transition-all select-none disabled:opacity-60 disabled:pointer-events-none"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang xử lý...</span>
          </>
        ) : (
          <span>{submitText}</span>
        )}
      </button>
    </div>
  );
}
