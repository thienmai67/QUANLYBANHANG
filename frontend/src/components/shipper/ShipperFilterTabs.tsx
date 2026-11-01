'use client';

import React from 'react';
import { useShipperUIStore } from '@/store/useShipperUIStore';
import { Truck, Package, Clock, CheckCircle2, Flame } from 'lucide-react';

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
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'SHIPPING',
      label: 'Đang giao',
      count: counts.shipping,
      icon: Truck,
    },
    {
      id: 'PACKING',
      label: 'Chờ lấy kho',
      count: counts.packing,
      icon: Package,
    },
    {
      id: '2H',
      label: 'Hỏa tốc 2H',
      count: counts.twoHours,
      icon: Flame,
    },
    {
      id: 'COMPLETED',
      label: 'Đã hoàn tất',
      count: counts.completed,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="px-4 pt-3 pb-1">
      <div
        className={`flex items-center gap-1.5 p-1.5 rounded-2xl overflow-x-auto no-scrollbar border transition-all ${
          isHighContrast
            ? 'bg-white border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
            : 'bg-slate-900/95 border-slate-800/90 shadow-inner'
        }`}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[46px] px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 shrink-0 active:scale-95 ${
                isActive
                  ? isHighContrast
                    ? 'bg-black text-white border-2 border-black shadow-md'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/40 font-black'
                  : isHighContrast
                  ? 'text-black hover:bg-slate-100 font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  tab.id === '2H' && tab.count > 0 ? 'text-amber-400 animate-pulse' : ''
                }`}
              />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black ${
                  isActive
                    ? isHighContrast
                      ? 'bg-yellow-300 text-black font-black'
                      : 'bg-emerald-900/80 text-emerald-100 ring-1 ring-emerald-400/30'
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
