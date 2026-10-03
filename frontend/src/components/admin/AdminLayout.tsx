'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAdminStore } from '../../store/useAdminStore';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { darkMode, sidebarCollapsed, toasts, removeToast } = useAdminStore();

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors">
        <Sidebar />

        {/* Main Content Wrapper */}
        <div
          className={`transition-all duration-300 flex flex-col min-h-screen ${
            sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
        >
          <Header />

          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Toast Notifications Container */}
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-right ${
                toast.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                  : toast.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                  : toast.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-800 dark:text-cyan-200'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-cyan-500 shrink-0" />}

              <span className="flex-1 text-xs font-semibold leading-relaxed">
                {toast.message}
              </span>

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
