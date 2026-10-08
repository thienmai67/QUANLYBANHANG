'use client';

import React from 'react';
import { Order, OrderStatus } from '@/types/manager';
import { useNow } from '@/hooks/useNow';
import { getRemaining2HMinutes, isOrderOverdue2H } from '@/lib/orderRules';
import { Zap, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface OrderCountdownBadgeProps {
  order: {
    is2H: boolean;
    createdAt?: string;
    deadline2H?: string;
    status?: OrderStatus;
  };
  className?: string;
  size?: 'sm' | 'md';
}

export function OrderCountdownBadge({
  order,
  className = '',
  size = 'md',
}: OrderCountdownBadgeProps) {
  // useNow updates every minute
  const now = useNow();

  if (!order || !order.is2H) {
    return null;
  }

  // If order is completed or cancelled
  if (order.status === 'DELIVERED') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full border px-2 py-0.5 text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 ${className}`}
        title="Đơn hàng hỏa tốc 2H đã giao thành công"
      >
        <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Hỏa tốc 2H (Đã giao)</span>
      </span>
    );
  }

  if (order.status === 'CANCELLED') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full border px-2 py-0.5 text-[11px] bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 ${className}`}
        title="Đơn hàng hỏa tốc 2H đã hủy"
      >
        <Zap className="w-3 h-3 text-slate-400 shrink-0" />
        <span>Hỏa tốc 2H (Đã hủy)</span>
      </span>
    );
  }

  const remaining = getRemaining2HMinutes(order, now);
  const isOverdue = isOrderOverdue2H(order, now);

  if (remaining === null) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full border px-2 py-0.5 text-[11px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 ${className}`}
      >
        <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>Giao hỏa tốc 2H</span>
      </span>
    );
  }

  // Overdue state: turns red
  if (isOverdue || remaining < 0) {
    const overdueMinutes = Math.abs(remaining);
    const overdueText =
      overdueMinutes >= 60
        ? `Đã trễ ${Math.floor(overdueMinutes / 60)}h ${overdueMinutes % 60}p`
        : `Đã trễ ${overdueMinutes} phút`;

    return (
      <span
        className={`inline-flex items-center gap-1 font-bold rounded-full border px-2 py-0.5 text-[11px] bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800 shadow-sm animate-pulse ${className}`}
        title={`Đơn hỏa tốc 2H đã quá hạn giao ${overdueMinutes} phút!`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>{overdueText}</span>
      </span>
    );
  }

  // Remaining state: "Còn 1h 12p" or "Còn 45p"
  const hours = Math.floor(remaining / 60);
  const minutes = remaining % 60;
  const remainingText =
    hours > 0
      ? minutes > 0
        ? `Còn ${hours}h ${minutes}p`
        : `Còn ${hours}h`
      : `Còn ${minutes}p`;

  const isUrgent = remaining <= 30;

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
        isUrgent
          ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700'
          : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/60'
      } ${className}`}
      title={`Hạn giao hỏa tốc 2H: ${remainingText}`}
    >
      <Clock className="w-3 h-3 text-orange-600 dark:text-orange-400 shrink-0" />
      <span>{remainingText}</span>
    </span>
  );
}

export default OrderCountdownBadge;
