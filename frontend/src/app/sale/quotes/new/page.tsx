'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SaleQuoteCreatePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sale/orders/new');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-slate-500">
      Đang chuyển hướng đến trang tạo đơn hàng...
    </div>
  );
}
