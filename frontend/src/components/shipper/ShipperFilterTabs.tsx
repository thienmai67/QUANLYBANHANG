'use client';

import React from 'react';

export type ShipperFilterTabType = 'ALL' | 'PACKING' | 'SHIPPING';

interface ShipperFilterTabsProps {
  activeTab: ShipperFilterTabType;
  onChange: (tab: ShipperFilterTabType) => void;
  counts?: {
    all: number;
    packing: number;
    shipping: number;
  };
}

export default function ShipperFilterTabs({
  activeTab,
  onChange,
  counts,
}: ShipperFilterTabsProps) {
  const tabs: Array<{ id: ShipperFilterTabType; label: string; count?: number }> = [
    { id: 'ALL', label: 'Tất cả', count: counts?.all },
    { id: 'PACKING', label: 'Chờ nhận', count: counts?.packing },
    { id: 'SHIPPING', label: 'Đang giao', count: counts?.shipping },
  ];

  return (
    <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
              isActive
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm shadow-slate-900/5 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
