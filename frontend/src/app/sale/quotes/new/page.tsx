'use client';

import React, { Suspense } from 'react';
import QuoteForm from '@/components/sale/QuoteForm';

export default function SaleQuoteCreatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải biểu mẫu...</div>}>
      <QuoteForm />
    </Suspense>
  );
}
