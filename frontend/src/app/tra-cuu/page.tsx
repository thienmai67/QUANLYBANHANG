'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TraCuuRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/tra-cuu-don-hang');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Đang chuyển tới trang Tra cứu đơn hàng...</p>
      </div>
    </div>
  );
}
