'use client';

import React, { Suspense } from 'react';
import OrderCreateForm from '@/components/sale/OrderCreateForm';

export default function SaleOrderCreatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải biểu mẫu...</div>}>
      <OrderCreateForm />
    </Suspense>
  );
}
