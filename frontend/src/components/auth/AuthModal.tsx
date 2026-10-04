import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = "max-w-md",
}: AuthModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-fade-in [color-scheme:light]"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-[24px] border border-[#E8E8EA] p-6 sm:p-8 shadow-2xl space-y-5 text-[#111] z-10`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECECEE] pb-4">
          <div className="flex items-center gap-2.5 text-[#FF5A1F]">
            {icon}
            <h3 className="font-display font-bold text-lg text-[#0B0B0C] tracking-tight">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="text-[#9A9AA2] hover:text-[#111] p-1.5 rounded-full hover:bg-[#F7F7F8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
