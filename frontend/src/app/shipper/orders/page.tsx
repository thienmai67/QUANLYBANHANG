'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RouteGuard from '@/components/auth/RouteGuard';

export default function ShipperOrdersIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/shipper');
  }, [router]);

  return (
    <RouteGuard allowedRoles={['SHIPPER', 'MANAGER']}>
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">Đang chuyển hướng về danh sách đơn hàng...</p>
      </div>
    </RouteGuard>
  );
}
