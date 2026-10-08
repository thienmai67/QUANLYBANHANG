'use client';

import React, { useState, useMemo } from 'react';
import RouteGuard from '@/components/auth/RouteGuard';
import ShipperShell from '@/components/shipper/ShipperShell';
import ShipperWidgets from '@/components/shipper/ShipperWidgets';
import ShipperFilterTabs from '@/components/shipper/ShipperFilterTabs';
import ShipperOrderCard from '@/components/shipper/ShipperOrderCard';
import PodModal from '@/components/shipper/PodModal';
import IncidentModal from '@/components/shipper/IncidentModal';
import { useAuthStore } from '@/store/useAuthStore';
import { useManagerStore } from '@/store/useManagerStore';
import { useShipperUIStore } from '@/store/useShipperUIStore';
import { Order } from '@/types/manager';
import { get2HDeadline } from '@/lib/orderRules';
import {
  PackageOpen,
  CheckCircle2,
  Inbox,
  ArrowDown,
  Loader2,
} from 'lucide-react';

export default function ShipperDispatchFeedPage() {
  const { user } = useAuthStore();
  const { orders, shippers } = useManagerStore();
  const { activeTab, isHighContrast } = useShipperUIStore();

  const [selectedPodOrder, setSelectedPodOrder] = useState<Order | null>(null);
  const [selectedIncidentOrder, setSelectedIncidentOrder] = useState<Order | null>(null);
  const [completedPageSize, setCompletedPageSize] = useState<number>(5);

  const currentShipperId = user?.shipperId || 'ship-02';
  const currentShipperName =
    user?.name ||
    shippers.find((s) => s.id === currentShipperId)?.name ||
    'Trần Quốc Toản';

  // STRICT DATA ISOLATION: Shipper only sees orders assigned to their shipperId
  const myOrders = useMemo(() => {
    return orders.filter((o) => o.shipperId === currentShipperId);
  }, [orders, currentShipperId]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      shipping: myOrders.filter((o) => o.status === 'SHIPPING').length,
      packing: myOrders.filter((o) => o.status === 'PACKING').length,
      twoHours: myOrders.filter(
        (o) =>
          (o.is2H || o.deliveryType === '2H') &&
          (o.status === 'SHIPPING' || o.status === 'PACKING')
      ).length,
      completed: myOrders.filter(
        (o) => o.status === 'DELIVERED' || o.status === 'CANCELLED'
      ).length,
    };
  }, [myOrders]);

  // Filtered orders according to active tab
  const tabFilteredOrders = useMemo(() => {
    switch (activeTab) {
      case 'SHIPPING':
        return myOrders.filter((o) => o.status === 'SHIPPING');
      case 'PACKING':
        return myOrders.filter((o) => o.status === 'PACKING');
      case '2H':
        return myOrders.filter(
          (o) =>
            (o.is2H || o.deliveryType === '2H') &&
            (o.status === 'SHIPPING' || o.status === 'PACKING')
        );
      case 'COMPLETED':
        return myOrders.filter(
          (o) => o.status === 'DELIVERED' || o.status === 'CANCELLED'
        );
      default:
        return myOrders;
    }
  }, [myOrders, activeTab]);

  // Priority Sorting:
  // - Active orders: nearing 2H deadline or overdue first, then earliest createdAt
  // - Completed orders: newest delivered/cancelled first
  const sortedOrders = useMemo(() => {
    const list = [...tabFilteredOrders];

    if (activeTab === 'COMPLETED') {
      return list.sort((a, b) => {
        const timeA = new Date(
          a.deliveredAt || a.cancelledAt || a.createdAt
        ).getTime();
        const timeB = new Date(
          b.deliveredAt || b.cancelledAt || b.createdAt
        ).getTime();
        return timeB - timeA;
      });
    }

    const nowTime = Date.now();

    return list.sort((a, b) => {
      const is2HA = Boolean(a.is2H || a.deliveryType === '2H');
      const is2HB = Boolean(b.is2H || b.deliveryType === '2H');

      const deadlineA = is2HA
        ? get2HDeadline({
            is2H: true,
            deadline2H: a.deadline2H,
            createdAt: a.createdAt,
          })?.getTime() || Infinity
        : Infinity;

      const deadlineB = is2HB
        ? get2HDeadline({
            is2H: true,
            deadline2H: b.deadline2H,
            createdAt: b.createdAt,
          })?.getTime() || Infinity
        : Infinity;

      // 1. If both are 2H orders, sort by closest deadline (smallest timestamp)
      if (is2HA && is2HB) {
        return deadlineA - deadlineB;
      }

      // 2. 2H orders come before standard orders
      if (is2HA && !is2HB) return -1;
      if (!is2HA && is2HB) return 1;

      // 3. Otherwise sort by earliest created (FIFO queue discipline)
      return (
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  }, [tabFilteredOrders, activeTab]);

  // Pagination for completed orders
  const displayedOrders = useMemo(() => {
    if (activeTab === 'COMPLETED') {
      return sortedOrders.slice(0, completedPageSize);
    }
    return sortedOrders;
  }, [sortedOrders, activeTab, completedPageSize]);

  const hasMoreCompleted =
    activeTab === 'COMPLETED' && sortedOrders.length > completedPageSize;

  return (
    <RouteGuard
      allowedRoles={['SHIPPER', 'ADMIN']}
      fallbackUrl="/login"
      forbiddenUrl="/403"
    >
      <ShipperShell>
        {/* Top Summary Widgets */}
        <ShipperWidgets shipperId={currentShipperId} />

        {/* Filter Tabs with Live Badges */}
        <ShipperFilterTabs counts={tabCounts} />

        {/* Orders Feed */}
        <div className="px-4 py-3 space-y-3">
          {displayedOrders.length === 0 ? (
            <div
              className={`p-10 rounded-2xl text-center space-y-3 ${
                isHighContrast
                  ? 'bg-white text-black border-2 border-black'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Inbox className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Không có đơn hàng nào
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeTab === 'SHIPPING' && 'Hiện không có đơn nào đang trên đường giao'}
                  {activeTab === 'PACKING' && 'Không có đơn nào đang chờ nhận tại kho'}
                  {activeTab === '2H' && 'Không có đơn hỏa tốc 2H cần giao gấp'}
                  {activeTab === 'COMPLETED' && 'Chưa có đơn hàng nào hoàn tất trong ca'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedOrders.map((order) => (
                <ShipperOrderCard
                  key={order.id}
                  order={order}
                  shipperId={currentShipperId}
                  shipperName={currentShipperName}
                  onOpenPod={(ord) => setSelectedPodOrder(ord)}
                  onOpenIncident={(ord) => setSelectedIncidentOrder(ord)}
                />
              ))}

              {/* Load More Button for Completed tab */}
              {hasMoreCompleted && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setCompletedPageSize((prev) => prev + 5)}
                    className={`min-h-[48px] px-6 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all ${
                      isHighContrast
                        ? 'bg-yellow-400 text-black hover:bg-yellow-300 border-2 border-black font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <ArrowDown className="w-4 h-4" />
                    <span>Xem thêm đơn hoàn tất ({sortedOrders.length - completedPageSize} đơn còn lại)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* POD Modal */}
        <PodModal
          order={selectedPodOrder}
          shipperId={currentShipperId}
          shipperName={currentShipperName}
          isOpen={Boolean(selectedPodOrder)}
          onClose={() => setSelectedPodOrder(null)}
          onSuccess={() => setSelectedPodOrder(null)}
        />

        {/* Incident Reporting Modal */}
        <IncidentModal
          order={selectedIncidentOrder}
          shipperId={currentShipperId}
          shipperName={currentShipperName}
          isOpen={Boolean(selectedIncidentOrder)}
          onClose={() => setSelectedIncidentOrder(null)}
          onSuccess={() => setSelectedIncidentOrder(null)}
        />
      </ShipperShell>
    </RouteGuard>
  );
}
