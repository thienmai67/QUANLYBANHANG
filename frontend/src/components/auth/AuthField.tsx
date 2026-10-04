import React from "react";
import { AlertCircle } from "lucide-react";

export interface AuthFieldProps {
  id: string;
  name?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  label?: string;
  error?: string;
  trailingIcon?: React.ReactNode;
  trailingLabel?: React.ReactNode;
  className?: string;
}

export default function AuthField({
  id,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  disabled = false,
  maxLength,
  label,
  error,
  trailingIcon,
  trailingLabel,
  className = "",
}: AuthFieldProps) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name || id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-[46px] w-full rounded-full border bg-[#F7F7F8] px-4 text-[14px] text-[#0B0B0C] placeholder:text-[#A1A1AA] outline-none transition focus:bg-white disabled:opacity-60 ${
            trailingIcon ? "pr-11" : ""
          } ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
              : "border-[#E8E8EA] focus:border-[#FF5A1F] focus:ring-4 focus:ring-[#FF5A1F]/10"
          }`}
        />

        {trailingIcon && (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
            {trailingIcon}
          </div>
        )}

        {trailingLabel && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {trailingLabel}
          </div>
        )}
      </div>

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1 ml-3 flex items-center gap-1 text-[12px] text-red-500 animate-fade-in"
        >
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
