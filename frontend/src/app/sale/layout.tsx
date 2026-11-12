'use client';

import React from 'react';
import RouteGuard from '@/components/auth/RouteGuard';
import { SaleSidebar } from '@/components/sale/SaleSidebar';
import { SaleHeader } from '@/components/sale/SaleHeader';
import { SaleBottomNav } from '@/components/sale/SaleBottomNav';
import { ToastContainer } from '@/components/common/ToastContainer';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useSaleShellStore } from '@/store/useSaleShellStore';

export default function SaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useSaleShellStore();

  return (
    <RouteGuard
      allowedRoles={['SALE', 'MANAGER']}
      fallbackUrl="/login"
      forbiddenUrl="/403"
    >
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors">
        {/* Collapsible desktop sidebar & mobile drawer */}
        <SaleSidebar />

        {/* Content wrapper adjusted for sidebar width */}
        <div
          className={`transition-all duration-300 flex flex-col min-h-screen ${
            sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
        >
          {/* Header */}
          <SaleHeader />

          {/* Main page content wrapped in ErrorBoundary */}
          <main className="flex-1 p-3 sm:p-4 lg:p-8 pb-28 lg:pb-8 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>

        {/* Mobile bottom navigation bar */}
        <SaleBottomNav />

        {/* Standalone Toast Notifications container */}
        <ToastContainer />
      </div>
    </RouteGuard>
  );
}
