'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, LogIn, Home } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { removeTokens } from '@/lib/auth';

export default function ForbiddenPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleSwitchAccount = () => {
    removeTokens();
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
        {/* Shield Icon */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>

        {/* Status Code & Title */}
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
            HTTP 403 FORBIDDEN
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight mt-2">
            Không Có Quyền Truy Cập
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            Khu vực này được bảo vệ nghiêm ngặt và chỉ dành riêng cho vai trò{' '}
            <strong className="text-amber-400 font-bold">MANAGER</strong>.
          </p>
        </div>

        {/* Current User Role Notice */}
        {user && (
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-left text-xs space-y-1">
            <div className="text-slate-400">Tài khoản hiện tại:</div>
            <div className="font-bold text-slate-200 truncate">{user.email}</div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-slate-400">Vai trò:</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-800 text-rose-300 border border-slate-700">
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSwitchAccount}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20"
          >
            <LogIn className="w-4 h-4" />
            Đổi Tài Khoản
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all border border-slate-700"
          >
            <Home className="w-4 h-4" />
            Về Trang Chủ
          </Link>
        </div>

        {/* Back Link */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại trang trước
          </button>
        </div>
      </div>
    </div>
  );
}
