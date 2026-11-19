'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SaleQuotesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sale/orders');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-slate-500 font-medium">
      Đang chuyển hướng đến trang đơn hàng...
    </div>
  );
}
