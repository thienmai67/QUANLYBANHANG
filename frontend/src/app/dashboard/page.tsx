'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { getAccessToken } from '@/lib/auth';

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const token = getAccessToken();
    if (!token && !isAuthenticated) {
      router.replace('/login?redirect=/dashboard');
      return;
    }

    const role = user?.role?.toUpperCase();
    switch (role) {
      case 'MANAGER':
        router.replace('/manager/dashboard');
        break;
      case 'SHIPPER':
        router.replace('/shipper');
        break;
      case 'CUSTOMER':
      default:
        router.replace('/profile');
        break;
    }
  }, [user, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Đang điều hướng đến trang quản trị...</span>
      </div>
    </div>
  );
}
