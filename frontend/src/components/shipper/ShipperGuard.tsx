'use client';

import React from 'react';
import RouteGuard from '@/components/auth/RouteGuard';

export function ShipperGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard
      allowedRoles={['SHIPPER']}
      fallbackUrl="/login"
      forbiddenUrl="/403"
    >
      {children}
    </RouteGuard>
  );
}
