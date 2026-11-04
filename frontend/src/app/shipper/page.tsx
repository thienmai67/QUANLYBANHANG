'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import RouteGuard from '@/components/auth/RouteGuard';
import ShipperShell from '@/components/shipper/ShipperShell';
import ShipperWidgets from '@/components/shipper/ShipperWidgets';
import ShipperFilterTabs, { ShipperFilterTabType } from '@/components/shipper/ShipperFilterTabs';
import ShipperOrderCard from '@/components/shipper/ShipperOrderCard';
import PodModal from '@/components/shipper/PodModal';
import IncidentModal from '@/components/shipper/IncidentModal';
import { useAuthStore } from '@/store/useAuthStore';
import { useManagerStore } from '@/store/useManagerStore';
import { Order } from '@/types/manager';
import { formatCurrencyVND } from '@/lib/formatters';
import { Package, Banknote, CheckCircle2, RotateCw } from 'lucide-react';

export default function ShipperDispatchFeedPage() {
  const { user } = useAuthStore();
  const { orders, fetchOrders } = useManagerStore();

  const [filterTab, setFilterTab] = useState<ShipperFilterTabType>('ALL');
  const [selectedPodOrder, setSelectedPodOrder] = useState<Order | null>(null);
  const [selectedIncidentOrder, setSelectedIncidentOrder] = useState<Order | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto background sync every 20s when tab is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchOrders();
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchOrders();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchOrders]);

  const currentShipperId = user?.shipperId || user?.id || '';
  const currentShipperName =
    user?.fullName ||
    user?.name ||
    'Nhân viên giao hàng';

  // Strict isolation: shipper only sees their assigned orders
  const myOrders = useMemo(() => {
    if (!currentShipperId) return [];
    return orders.filter((o) => o.shipperId === currentShipperId);
  }, [orders, currentShipperId]);

  // Active orders (not delivered, not cancelled)
  const activeOrders = useMemo(() => {
    return myOrders.filter(
      (o) => o.status === 'SHIPPING' || o.status === 'PACKING'
    );
  }, [myOrders]);

  const deliveredOrders = useMemo(() => {
    return myOrders.filter((o) => o.status === 'DELIVERED');
  }, [myOrders]);

  // Next order:
  // 1. Highest priority is an active SHIPPING order
  // 2. Otherwise next PACKING order
  const nextOrder = useMemo(() => {
    const shipping = activeOrders.find((o) => o.status === 'SHIPPING');
    if (shipping) return shipping;
    return activeOrders[0] || null;
  }, [activeOrders]);

  const totalRemainingCod = useMemo(() => {
    return activeOrders.reduce((sum, o) => {
      if (o.paymentMethod === 'COD') {
        return sum + (o.total ?? o.totalAmount ?? 0);
      }
      return sum;
    }, 0);
  }, [activeOrders]);

  // Remaining queued orders (excluding nextOrder so it doesn't duplicate)
  const listOrdersPool = useMemo(() => {
    if (!nextOrder) return activeOrders;
    return activeOrders.filter((o) => o.id !== nextOrder.id);
  }, [activeOrders, nextOrder]);

  const tabCounts = useMemo(() => {
    return {
      all: listOrdersPool.length,
      packing: listOrdersPool.filter((o) => o.status === 'PACKING').length,
      shipping: listOrdersPool.filter((o) => o.status === 'SHIPPING').length,
    };
  }, [listOrdersPool]);

  const displayedListOrders = useMemo(() => {
    switch (filterTab) {
      case 'PACKING':
        return listOrdersPool.filter((o) => o.status === 'PACKING');
      case 'SHIPPING':
        return listOrdersPool.filter((o) => o.status === 'SHIPPING');
      case 'ALL':
      default:
        return listOrdersPool;
    }
  }, [listOrdersPool, filterTab]);

  return (
    <RouteGuard allowedRoles={['SHIPPER']} fallbackUrl="/login" forbiddenUrl="/403">
      <ShipperShell>
        <div className="px-4 py-3.5 space-y-4">
          {/* 1. Daily Summary Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  Lịch trình hôm nay
                </span>
                <h1 className="text-lg font-black tracking-tight text-white mt-0.5">
                  Đơn Giao Hôm Nay
                </h1>
              </div>

              <button
                type="button"
                onClick={handleManualRefresh}
                title="Làm mới danh sách đơn"
                className={`w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all ${
                  isRefreshing ? 'animate-spin text-blue-400' : ''
                }`}
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics Row: 2 Quick Stats */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                  <Package className="w-3.5 h-3.5 text-blue-400" />
                  <span>Đơn cần giao</span>
                </div>
                <div className="text-lg font-black text-white tabular-nums mt-0.5">
                  {activeOrders.length}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    / {myOrders.length} đơn
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                  <Banknote className="w-3.5 h-3.5 text-amber-400" />
                  <span>COD cần thu</span>
                </div>
                <div className="text-base font-black text-amber-300 tabular-nums mt-0.5">
                  {formatCurrencyVND(totalRemainingCod)}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Lộ trình hôm nay (Route Stepper Widget) */}
          <ShipperWidgets
            shipperId={currentShipperId}
            orders={myOrders}
            nextOrderId={nextOrder?.id}
          />

          {/* 3. Hero Card: "Đơn tiếp theo" */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Đơn tiếp theo cần xử lý
              </h2>
              {nextOrder && (
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Ưu tiên số 1
                </span>
              )}
            </div>

            {nextOrder ? (
              <ShipperOrderCard
                order={nextOrder}
                shipperId={currentShipperId}
                shipperName={currentShipperName}
                variant="featured"
                onOpenPod={(ord) => setSelectedPodOrder(ord)}
                onOpenIncident={(ord) => setSelectedIncidentOrder(ord)}
                onPickupSuccess={handleManualRefresh}
              />
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Đã hoàn thành hết đơn!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hiện không còn đơn hàng nào đang chờ giao. Nghỉ ngơi hoặc nộp tiền COD vào sổ quỹ nhé.
                </p>
              </div>
            )}
          </div>

          {/* 4. Tab lọc & Danh sách các đơn chờ nhận tiếp theo */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Hàng chờ nhận &amp; giao ({listOrdersPool.length})
              </h2>
            </div>

            <ShipperFilterTabs
              activeTab={filterTab}
              onChange={setFilterTab}
              counts={tabCounts}
            />

            {/* List items */}
            <div className="space-y-2 pt-1">
              {displayedListOrders.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Không có đơn hàng nào trong bộ lọc này.
                </div>
              ) : (
                displayedListOrders.map((order) => (
                  <ShipperOrderCard
                    key={order.id}
                    order={order}
                    shipperId={currentShipperId}
                    shipperName={currentShipperName}
                    variant="list"
                    onOpenPod={(ord) => setSelectedPodOrder(ord)}
                    onOpenIncident={(ord) => setSelectedIncidentOrder(ord)}
                    onPickupSuccess={handleManualRefresh}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Existing POD and Incident modals */}
        <PodModal
          order={selectedPodOrder}
          shipperId={currentShipperId}
          shipperName={currentShipperName}
          isOpen={Boolean(selectedPodOrder)}
          onClose={() => setSelectedPodOrder(null)}
          onSuccess={() => {
            setSelectedPodOrder(null);
            handleManualRefresh();
          }}
        />

        <IncidentModal
          order={selectedIncidentOrder}
          shipperId={currentShipperId}
          shipperName={currentShipperName}
          isOpen={Boolean(selectedIncidentOrder)}
          onClose={() => setSelectedIncidentOrder(null)}
          onSuccess={() => {
            setSelectedIncidentOrder(null);
            handleManualRefresh();
          }}
        />
      </ShipperShell>
    </RouteGuard>
  );
}
