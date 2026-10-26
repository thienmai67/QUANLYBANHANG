'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, decodeToken, removeTokens } from '@/lib/auth';
import { useAuthStore, UserRole } from '@/store/useAuthStore';
import { ShieldAlert, Lock, Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackUrl?: string;
  forbiddenUrl?: string;
}

export default function RouteGuard({
  children,
  allowedRoles,
  fallbackUrl = '/login',
  forbiddenUrl = '/403',
}: RouteGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getToken();

    if (!token && !isAuthenticated && !user) {
      setIsAuthorized(false);
      router.replace(`${fallbackUrl}?reason=unauthenticated`);
      return;
    }

    const decoded = token ? decodeToken(token) : null;

    // Check expiration if token is decoded with exp
    const now = Math.floor(Date.now() / 1000);
    if (decoded?.exp && decoded.exp < now) {
      removeTokens();
      logout();
      setIsAuthorized(false);
      router.replace(`${fallbackUrl}?reason=token_expired`);
      return;
    }

    // Check Role permission: Prioritize token claim or auth store role
    const rawRole = decoded?.role || user?.role || '';
    const currentRole = rawRole.toUpperCase() as UserRole;

    if (!currentRole) {
      setIsAuthorized(false);
      router.replace(`${fallbackUrl}?reason=unauthenticated`);
      return;
    }

    const hasRole = allowedRoles.some(
      (r) => r.toUpperCase() === currentRole
    );

    if (!hasRole) {
      setIsAuthorized(false);
      router.replace(forbiddenUrl);
      return;
    }

    setIsAuthorized(true);
  }, [allowedRoles, fallbackUrl, forbiddenUrl, isAuthenticated, logout, router, user]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white space-y-4">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          Đang xác thực quyền truy cập bảo mật…
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white font-display">Truy Cập Bị Từ Chối (403 Unauthorized)</h2>
        <p className="text-xs text-slate-400 max-w-md">
          Tài khoản của bạn không đủ quyền truy cập vào khu vực quản trị này. Vui lòng đăng nhập với tài khoản hợp lệ.
        </p>
        <button
          onClick={() => router.replace('/login')}
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/30"
        >
          Đăng Nhập Lại
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

export { RouteGuard as RequireRole };
