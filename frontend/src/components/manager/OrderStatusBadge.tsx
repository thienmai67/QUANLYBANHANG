'use client';

import React from 'react';
import { OrderStatus } from '@/types/manager';
import { Clock, Package, Truck, CheckCircle2, XCircle } from 'lucide-react';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  classes: string;
}

const statusConfigs: Record<OrderStatus, StatusConfig> = {
  PENDING: {
    label: 'Chờ duyệt',
    icon: Clock,
    classes:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
  },
  PACKING: {
    label: 'Đang đóng gói',
    icon: Package,
    classes:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60',
  },
  SHIPPING: {
    label: 'Đang giao hàng',
    icon: Truck,
    classes:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/60',
  },
  DELIVERED: {
    label: 'Đã giao thành công',
    icon: CheckCircle2,
    classes:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
  },
  CANCELLED: {
    label: 'Đã hủy',
    icon: XCircle,
    classes:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[11px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

export function OrderStatusBadge({
  status,
  className = '',
  size = 'md',
  showIcon = true,
}: OrderStatusBadgeProps) {
  const config = statusConfigs[status] || {
    label: status,
    icon: Clock,
    classes: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shrink-0 transition-colors ${config.classes} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} shrink-0`} />}
      <span>{config.label}</span>
    </span>
  );
}

export default OrderStatusBadge;
