'use client';

import React from 'react';
import RouteGuard from '@/components/auth/RouteGuard';
import { ManagerSidebar } from '@/components/manager/ManagerSidebar';
import { ManagerHeader } from '@/components/manager/ManagerHeader';
import { ToastContainer } from '@/components/common/ToastContainer';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useManagerShellStore } from '@/store/useManagerShellStore';

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useManagerShellStore();

  return (
    <RouteGuard
      allowedRoles={['MANAGER', 'ADMIN']}
      fallbackUrl="/login"
      forbiddenUrl="/403"
    >
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors">
        {/* Collapsible desktop sidebar & mobile drawer */}
        <ManagerSidebar />

        {/* Content wrapper adjusted for sidebar width */}
        <div
          className={`transition-all duration-300 flex flex-col min-h-screen ${
            sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
        >
          {/* Header with PENDING badge bell, quick actions & theme toggle */}
          <ManagerHeader />

          {/* Main page content wrapped in ErrorBoundary */}
          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>

        {/* Standalone Toast Notifications container */}
        <ToastContainer />
      </div>
    </RouteGuard>
  );
}
