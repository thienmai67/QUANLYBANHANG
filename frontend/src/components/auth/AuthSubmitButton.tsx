import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";

export interface AuthSubmitButtonProps {
  id?: string;
  type?: "submit" | "button";
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export default function AuthSubmitButton({
  id,
  type = "submit",
  isLoading = false,
  loadingText = "Đang xử lý...",
  children,
  icon = <ArrowRight className="w-4 h-4 ml-1" />,
  className = "",
  disabled = false,
  onClick,
}: AuthSubmitButtonProps) {
  return (
    <button
      id={id}
      type={type}
      disabled={isLoading || disabled}
      onClick={onClick}
      className={`h-[46px] w-full rounded-full bg-[linear-gradient(90deg,#FF6A00_0%,#FF3B30_100%)] text-white text-[14px] font-semibold shadow-[0_6px_18px_-6px_rgba(255,74,20,0.55)] hover:brightness-[1.03] active:scale-[0.995] disabled:opacity-70 disabled:pointer-events-none transition flex items-center justify-center gap-2 cursor-pointer ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          {icon}
        </>
      )}
    </button>
  );
}
