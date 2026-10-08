import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (item: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const MAX_TOASTS = 4;
const DEFAULT_DURATION = 4000; // 4s auto-dismiss

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (item) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const duration = item.duration ?? DEFAULT_DURATION;

    set((state) => {
      // Keep maximum 4 toasts; drop oldest if limit exceeded
      const existing = state.toasts.length >= MAX_TOASTS ? state.toasts.slice(1) : state.toasts;
      return {
        toasts: [...existing, { ...item, id, duration }],
      };
    });

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }

    return id;
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

/**
 * useToast hook for triggering toast notifications from any component
 */
export function useToast() {
  const { toasts, addToast, removeToast, clearToasts } = useToastStore();

  const success = (message: string, title?: string, duration?: number) =>
    addToast({ type: 'success', message, title, duration });

  const error = (message: string, title?: string, duration?: number) =>
    addToast({ type: 'error', message, title, duration });

  const warning = (message: string, title?: string, duration?: number) =>
    addToast({ type: 'warning', message, title, duration });

  const info = (message: string, title?: string, duration?: number) =>
    addToast({ type: 'info', message, title, duration });

  return {
    toasts,
    success,
    error,
    warning,
    info,
    remove: removeToast,
    clear: clearToasts,
  };
}
