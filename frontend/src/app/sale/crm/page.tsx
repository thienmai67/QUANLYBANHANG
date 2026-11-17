'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SaleCRMPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sale/activities');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-sm text-slate-500 animate-pulse">
        Đang chuyển hướng đến trang Chăm sóc khách hàng &amp; CRM...
      </p>
    </div>
  );
}
