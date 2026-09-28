"use client";

import React from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface FacebookSignInButtonProps {
  className?: string;
  label?: string;
}

export default function FacebookSignInButton({
  className = "",
  label = "Facebook",
}: FacebookSignInButtonProps) {
  return (
    <button
      id="facebook-signin-btn"
      type="button"
      onClick={() => {
        window.location.href = `${API_URL}/api/v1/auth/facebook/login`;
      }}
      className={`group flex items-center gap-3 px-5 py-2.5 rounded-lg border border-border bg-surface hover:bg-border/50 text-foreground text-sm font-medium transition-all duration-200 active:scale-95 ${className}`}
    >
      <FacebookLogo />
      <span>{label}</span>
    </button>
  );
}

function FacebookLogo() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.026 4.388 11.022 10.125 11.927v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.612 23.095 24 18.1 24 12.073z"
        fill="#1877F2"
      />
    </svg>
  );
}
