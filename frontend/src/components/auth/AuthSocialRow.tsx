import React from "react";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import FacebookSignInButton from "@/components/FacebookSignInButton";

export interface AuthSocialRowProps {
  dividerText?: string;
  className?: string;
}

export default function AuthSocialRow({
  dividerText = "hoặc tiếp tục với",
  className = "",
}: AuthSocialRowProps) {
  const pillBtnClass =
    "h-[40px] rounded-full border border-[#E8E8EA] bg-white text-[#111] text-[13px] font-semibold hover:bg-[#F7F7F8] hover:border-[#D8D8DA] shadow-sm transition-all";

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {/* Divider */}
      <div className="relative flex items-center justify-center my-1.5">
        <div className="border-t border-[#ECECEE] w-full" />
        <span className="bg-white px-2.5 text-[11px] uppercase tracking-[0.12em] text-[#9A9AA2] font-medium whitespace-nowrap">
          {dividerText}
        </span>
        <div className="border-t border-[#ECECEE] w-full" />
      </div>

      {/* Social Button Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <GoogleSignInButton
          className={`${pillBtnClass} !w-full !justify-center !px-4`}
          label="Google"
        />
        <FacebookSignInButton
          className={`${pillBtnClass} !w-full !justify-center !px-4`}
          label="Facebook"
        />
      </div>
    </div>
  );
}
