'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveTokens, decodeToken } from '@/lib/auth';
import { useAuthStore } from '@/store/useAuthStore';

function CallbackProcessor() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    const refresh = params.get('refresh');

    if (token) {
      saveTokens(token, refresh ?? '');
      const user = decodeToken(token);

      if (user) {
        const isStaff = user.role.toUpperCase() === 'ADMIN' || user.role.toUpperCase() === 'MANAGER';
        const role = isStaff ? 'ADMIN' : 'CONTRACTOR';

        useAuthStore.getState().setAuth(token, {
          id: user.userId,
          email: user.email,
          name: user.email.split('@')[0],
          role: role,
        });

        if (isStaff) {
          router.replace('/admin/dashboard');
          return;
        }
      }
      router.replace('/account');
    } else {
      router.replace('/auth/error?reason=no_token');
    }
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="flex flex-col items-center gap-5">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium tracking-wide">
          Đang xác thực phân quyền tài khoản…
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackProcessor />
    </Suspense>
  );
}
