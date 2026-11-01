'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SaleRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sale/dashboard');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
    </div>
  );
}
