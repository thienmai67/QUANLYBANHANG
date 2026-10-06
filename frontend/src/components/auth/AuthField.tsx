import React, { forwardRef, useState } from "react";
import { AlertCircle } from "lucide-react";

export interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  error?: string | null;
  errorMessage?: string | null;
  trailingIcon?: React.ReactNode;
  trailingLabel?: React.ReactNode;
  containerClassName?: string;
}

const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  (
    {
      id,
      label,
      type = "text",
      value,
      onChange,
      placeholder,
      required = false,
      disabled = false,
      error,
      errorMessage,
      trailingIcon,
      trailingLabel,
      containerClassName = "",
      className = "",
      ...rest
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const resolvedError = errorMessage || error;
    const hasError = Boolean(resolvedError);

    return (
      <div className={`w-full ${containerClassName}`}>
        <div
          className={`relative rounded-2xl transition-all duration-200 px-4 py-1.5 flex flex-col justify-center min-h-[54px] ${
            hasError
              ? "bg-red-50/50 border-2 border-red-500 ring-4 ring-red-500/10"
              : isFocused
              ? "bg-white border-2 border-[#1E6BFF] ring-4 ring-[#1E6BFF]/15 shadow-sm"
              : "bg-[#F3F5F9] border-2 border-transparent hover:bg-[#EDF1F7]"
          }`}
        >
          {/* Top subtle label */}
          {label && (
            <label
              htmlFor={id}
              className={`text-[10px] sm:text-[11px] font-semibold leading-none select-none transition-colors mb-0.5 ${
                hasError
                  ? "text-red-600"
                  : isFocused
                  ? "text-[#1E6BFF]"
                  : "text-[#7E889B]"
              }`}
            >
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}

          {/* Bottom input text */}
          <div className="flex items-center">
            <input
              ref={ref}
              id={id}
              type={type}
              value={value}
              onChange={onChange}
              placeholder={placeholder || label}
              required={required}
              disabled={disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${id}-error` : undefined}
              className={`w-full bg-transparent text-[13px] sm:text-[14px] font-semibold text-[#0F172A] placeholder-[#94A3B8] outline-none border-none p-0 leading-normal ${
                trailingIcon || trailingLabel ? "pr-8" : ""
              } ${className}`}
              {...rest}
            />

            {/* Right trailing icon / label */}
            {trailingIcon && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#94A3B8]">
                {trailingIcon}
              </div>
            )}
            {trailingLabel && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                {trailingLabel}
              </div>
            )}
          </div>
        </div>

        {/* Error message text */}
        {hasError && (
          <p
            id={`${id}-error`}
            role="alert"
            className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600 px-1 animate-fadeIn"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{resolvedError}</span>
          </p>
        )}
      </div>
    );
  }
);

AuthField.displayName = "AuthField";

export default AuthField;
