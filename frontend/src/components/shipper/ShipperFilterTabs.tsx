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
    <div className="border-b border-[#e6e6e6]">
      <nav
        aria-label="Lọc đơn hàng"
        className="flex items-center gap-6"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`min-h-[48px] py-3 text-[14px] flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5fbf] ${
                isActive
                  ? 'border-b-2 border-[#0a0a0a] text-[#0a0a0a] font-semibold'
                  : 'border-b-2 border-transparent text-[#6b6b6b] font-normal hover:text-[#0a0a0a]'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className="tabular-nums text-[#6b6b6b] font-normal">
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
