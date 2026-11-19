'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthField from '@/components/auth/AuthField';
import AuthActionRow from '@/components/auth/AuthActionRow';
import { CONTACT_INFO } from '@/config/contact';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    setIsSubmitted(true);
  };

  return (
    <AuthLayout
      variant="login"
      titleOverride="Khôi Phục Mật Khẩu."
      subtitleOverride={
        <div className="flex items-center gap-1">
          <span>Nhớ mật khẩu?</span>
          <Link href="/login" className="text-[#1E6BFF] font-semibold hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      }
    >
      {isSubmitted ? (
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 border border-emerald-200 dark:border-emerald-800 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Đã Ghi Nhận Yêu Cầu!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              Hệ thống đã tiếp nhận yêu cầu hỗ trợ tài khoản{' '}
              <strong className="text-orange-600 dark:text-orange-400 font-mono font-bold">{email}</strong>.
            </p>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-left space-y-1.5">
              <p>
                💡 <strong>Lưu ý:</strong> Để bảo mật dữ liệu đơn hàng và công trình, hệ thống không tự động gửi mật khẩu thô qua email.
              </p>
              <p>
                Quý khách vui lòng liên hệ Hotline{' '}
                <a href={CONTACT_INFO.hotlineTel} className="text-orange-600 font-mono font-bold hover:underline">
                  {CONTACT_INFO.hotline}
                </a>{' '}
                hoặc email{' '}
                <a href={CONTACT_INFO.emailMailto} className="text-blue-500 font-bold hover:underline">
                  {CONTACT_INFO.email}
                </a>{' '}
                để kỹ thuật viên hỗ trợ xác thực và cấp lại mật khẩu ngay lập tức.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-600 font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại trang Đăng nhập</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <AuthField
            id="forgot-email"
            label="Email tài khoản"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vd: khachhang@gmail.com"
            trailingIcon={<Mail className="w-4 h-4 text-slate-400" />}
            required
          />

          <button
            type="submit"
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all text-sm flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Gửi Yêu Cầu Khôi Phục</span>
          </button>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại đăng nhập</span>
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
