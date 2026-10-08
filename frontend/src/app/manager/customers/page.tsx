'use client';

import React, { useState, useMemo } from 'react';
import { useManagerStore } from '@/store/useManagerStore';
import { Customer, CustomerTier } from '@/types/manager';
import { formatCurrencyVND, formatDate } from '@/lib/formatters';
import { CustomerDetailModal } from '@/components/manager/CustomerDetailModal';
import {
  Users,
  Search,
  Award,
  TrendingUp,
  ShoppingBag,
  Eye,
  ShieldCheck,
  Phone,
  MapPin,
  Mail,
  UserCheck,
} from 'lucide-react';

type TierTab = 'ALL' | 'Retail' | 'Bronze' | 'Silver' | 'Gold';

const TIER_TABS: Array<{ id: TierTab; label: string }> = [
  { id: 'ALL', label: 'Tất cả khách hàng' },
  { id: 'Retail', label: 'Khách lẻ / Retail' },
  { id: 'Bronze', label: 'Hạng Đồng (Bronze)' },
  { id: 'Silver', label: 'Hạng Bạc (Silver)' },
  { id: 'Gold', label: 'Hạng Vàng (Gold)' },
];

function isCustomerInTier(tier: CustomerTier, filter: TierTab): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'Retail') {
    return tier === 'Retail' || tier === 'Khách mua lẻ' || tier === 'Hộ gia đình';
  }
  if (filter === 'Bronze') {
    return tier === 'Bronze' || tier === 'Thợ điện nước';
  }
  if (filter === 'Silver') {
    return tier === 'Silver';
  }
  if (filter === 'Gold') {
    return tier === 'Gold' || tier === 'Khách công trình';
  }
  return tier === filter;
}

const tierBadgeStyles: Record<string, string> = {
  Gold: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
  Silver: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  Bronze: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800',
  Retail: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
  'Khách mua lẻ': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
  'Thợ điện nước': 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800',
  'Hộ gia đình': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800',
  'Khách công trình': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800',
};

export default function ManagerCustomersPage() {
  const { customers, getCustomerMetrics } = useManagerStore();

  const [selectedTier, setSelectedTier] = useState<TierTab>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Summary counts
  const totalCustomers = customers.length;

  const tierCounts = useMemo(() => {
    const counts: Record<TierTab, number> = {
      ALL: customers.length,
      Retail: 0,
      Bronze: 0,
      Silver: 0,
      Gold: 0,
    };
    for (const c of customers) {
      if (isCustomerInTier(c.tier, 'Retail')) counts.Retail += 1;
      else if (isCustomerInTier(c.tier, 'Bronze')) counts.Bronze += 1;
      else if (isCustomerInTier(c.tier, 'Silver')) counts.Silver += 1;
      else if (isCustomerInTier(c.tier, 'Gold')) counts.Gold += 1;
    }
    return counts;
  }, [customers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Tier filter
      if (!isCustomerInTier(c.tier, selectedTier)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = c.code.toLowerCase().includes(q);
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q);
        const matchAddr = c.address.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchPhone && !matchEmail && !matchAddr) {
          return false;
        }
      }

      return true;
    });
  }, [customers, selectedTier, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Khách Hàng Bán Lẻ & Công Trình
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Danh bạ đại lý, thợ thi công điện nước và khách hàng tiêu dùng thân thiết
          </p>
        </div>

        {/* RBAC Notice Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>Quyền Quản lý: Chế độ tra cứu (View-Only)</span>
        </div>
      </div>

      {/* Tier Summary Mini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Tổng số khách hàng
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {totalCustomers}{' '}
              <span className="text-xs font-normal text-slate-400">hồ sơ</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Khách hàng Vàng
            </span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
              {tierCounts.Gold}{' '}
              <span className="text-xs font-normal text-slate-400">đối tác VIP</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Khách hàng Bạc
            </span>
            <span className="text-xl font-black text-slate-700 dark:text-slate-300 mt-1 block">
              {tierCounts.Silver}{' '}
              <span className="text-xs font-normal text-slate-400">thân thiết</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Khách mua lẻ / thợ
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {tierCounts.Retail + tierCounts.Bronze}{' '}
              <span className="text-xs font-normal text-slate-400">khách hàng</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tier Filter Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 pb-px min-w-max">
          {TIER_TABS.map((tab) => {
            const isActive = selectedTier === tab.id;
            const count = tierCounts[tab.id];

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTier(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  isActive
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm khách hàng theo mã, họ tên, số điện thoại, email, địa chỉ..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Customers Table / Cards */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Không tìm thấy khách hàng nào phù hợp
          </p>
          <p className="text-xs text-slate-400">
            Thử thay đổi hạng thành viên hoặc từ khóa tìm kiếm
          </p>
        </div>
      ) : (
        <>
          {/* ===================== DESKTOP TABLE VIEW ===================== */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Mã KH</th>
                    <th className="px-4 py-3">Tên khách hàng</th>
                    <th className="px-4 py-3">Số điện thoại</th>
                    <th className="px-4 py-3">Địa chỉ công trình</th>
                    <th className="px-4 py-3">Hạng thành viên</th>
                    <th className="px-4 py-3 text-center">Số đơn</th>
                    <th className="px-4 py-3 text-right">Tổng chi tiêu (VND)</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredCustomers.map((cust) => {
                    const metrics = getCustomerMetrics(cust.id);
                    const tierStyle =
                      tierBadgeStyles[cust.tier] ||
                      'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300';

                    return (
                      <tr
                        key={cust.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Code */}
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                          {cust.code}
                        </td>

                        {/* Name & Email */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">
                            {cust.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                            {cust.email}
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          {cust.phone}
                        </td>

                        {/* Address */}
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                          {cust.address}
                        </td>

                        {/* Tier */}
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierStyle}`}
                          >
                            {cust.tier}
                          </span>
                        </td>

                        {/* Total Orders */}
                        <td className="px-4 py-3 text-center font-bold">
                          {metrics.orderCount}{' '}
                          <span className="text-[10px] font-normal text-slate-400">
                            ({metrics.deliveredOrderCount} đã giao)
                          </span>
                        </td>

                        {/* Total Spending */}
                        <td className="px-4 py-3 text-right font-extrabold text-amber-600 dark:text-amber-400">
                          {formatCurrencyVND(metrics.totalSpent)}
                        </td>

                        {/* Action: STRICT RBAC (View-only! NO edit or delete) */}
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setIsDetailOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Xem chi tiết và lịch sử đơn hàng"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===================== MOBILE CARD VIEW (< 768px, NO HORIZONTAL OVERFLOW) ===================== */}
          <div className="md:hidden space-y-3">
            {filteredCustomers.map((cust) => {
              const metrics = getCustomerMetrics(cust.id);
              const tierStyle =
                tierBadgeStyles[cust.tier] ||
                'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300';

              return (
                <div
                  key={cust.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  {/* Top: Name & Tier */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {cust.name}
                      </h3>
                      <span className="font-mono text-[11px] text-slate-400">
                        {cust.code}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierStyle}`}
                    >
                      {cust.tier}
                    </span>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <strong className="text-slate-800 dark:text-slate-200">{cust.phone}</strong>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{cust.address}</span>
                    </div>
                  </div>

                  {/* Spending & Orders */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Đơn hàng:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {metrics.orderCount} đơn{' '}
                        <span className="text-[10px] font-normal text-slate-400">
                          ({metrics.deliveredOrderCount} đã giao)
                        </span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Tổng chi tiêu:</span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                        {formatCurrencyVND(metrics.totalSpent)}
                      </span>
                    </div>
                  </div>

                  {/* Action: STRICT RBAC (View-only! NO edit or delete) */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setIsDetailOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem lịch sử đơn</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Customer Detail Modal (View-Only) */}
      <CustomerDetailModal
        customer={selectedCustomer}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
