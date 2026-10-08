'use client';

import React from 'react';
import { useShipperUIStore } from '@/store/useShipperUIStore';

interface TabCounts {
  shipping: number;
  packing: number;
  twoHours: number;
  completed: number;
}

interface ShipperFilterTabsProps {
  counts: TabCounts;
}

export default function ShipperFilterTabs({ counts }: ShipperFilterTabsProps) {
  const { activeTab, setActiveTab, isHighContrast } = useShipperUIStore();

  const tabs: Array<{
    id: 'SHIPPING' | 'PACKING' | '2H' | 'COMPLETED';
    label: string;
    count: number;
  }> = [
    { id: 'SHIPPING', label: 'Đang vận chuyển', count: counts.shipping },
    { id: 'PACKING', label: 'Chờ lấy hàng', count: counts.packing },
    { id: '2H', label: 'Hỏa tốc 2H', count: counts.twoHours },
    { id: 'COMPLETED', label: 'Đã hoàn tất', count: counts.completed },
  ];

  return (
    <div className="px-4 pt-3 pb-1">
      <div
        className={`flex items-center gap-1.5 p-1 rounded-2xl overflow-x-auto no-scrollbar border ${
          isHighContrast
            ? 'bg-white border-2 border-black'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? isHighContrast
                    ? 'bg-black text-white border-2 border-black font-black'
                    : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : isHighContrast
                  ? 'text-black hover:bg-slate-100 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive
                    ? isHighContrast
                      ? 'bg-white text-black'
                      : 'bg-emerald-700 text-emerald-100'
                    : isHighContrast
                    ? 'bg-slate-200 text-black'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
