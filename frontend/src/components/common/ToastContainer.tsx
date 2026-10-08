'use client';

import React from 'react';
import { useToastStore, ToastItem } from '@/hooks/useToast';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const toastStyles: Record<
  ToastItem['type'],
  { border: string; bg: string; text: string; icon: React.ReactNode }
> = {
  success: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-100',
    text: 'text-emerald-800 dark:text-emerald-200',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
  },
  error: {
    border: 'border-rose-500/30',
    bg: 'bg-rose-50/95 dark:bg-rose-950/90 text-rose-900 dark:text-rose-100',
    text: 'text-rose-800 dark:text-rose-200',
    icon: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
  },
  warning: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-50/95 dark:bg-amber-950/90 text-amber-900 dark:text-amber-100',
    text: 'text-amber-800 dark:text-amber-200',
    icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
  },
  info: {
    border: 'border-sky-500/30',
    bg: 'bg-sky-50/95 dark:bg-sky-950/90 text-sky-900 dark:text-sky-100',
    text: 'text-sky-800 dark:text-sky-200',
    icon: <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />,
  },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none transition-all duration-300"
    >
      {toasts.map((toast) => {
        const style = toastStyles[toast.type];

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 animate-in slide-in-from-bottom-3 ${style.bg} ${style.border}`}
          >
            <div className="mt-0.5">{style.icon}</div>

            <div className="flex-1 min-w-0 pr-1">
              {toast.title && (
                <div className="text-xs font-bold mb-0.5 tracking-tight">{toast.title}</div>
              )}
              <div className="text-xs font-medium leading-relaxed break-words">
                {toast.message}
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
export default ToastContainer;
