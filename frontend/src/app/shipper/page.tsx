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

export default function ShipperDispatchFeedPage() {
  const { user } = useAuthStore();
  const { orders, shippers, fetchOrders, fetchShippers } = useManagerStore();

  const [filterTab, setFilterTab] = useState<ShipperFilterTabType>('ALL');
  const [selectedPodOrder, setSelectedPodOrder] = useState<Order | null>(null);
  const [selectedIncidentOrder, setSelectedIncidentOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchShippers();
  }, [fetchOrders, fetchShippers]);

  const handleManualRefresh = useCallback(async () => {
    await Promise.all([fetchOrders(), fetchShippers()]);
  }, [fetchOrders, fetchShippers]);

  const currentShipperId = user?.shipperId || user?.id || '';
  const currentShipperName =
    shippers.find((s) => s.id === currentShipperId)?.name ||
    user?.name ||
    user?.fullName ||
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

  // Next order:
  // 1. Highest priority is an active SHIPPING order
  // 2. Otherwise next PACKING order
  const nextOrder = useMemo(() => {
    const shipping = activeOrders.find((o) => o.status === 'SHIPPING');
    if (shipping) return shipping;
    return activeOrders[0] || null;
  }, [activeOrders]);

  // Dynamic calculations for finding text according to §3 and §5:
  // - next order code
  // - next order COD amount
  // - remaining active orders count
  // - total remaining COD of unfinished orders (next order + waiting orders)
  const nextOrderCod = useMemo(() => {
    if (!nextOrder) return 0;
    return nextOrder.paymentMethod === 'COD'
      ? (nextOrder.total ?? nextOrder.totalAmount ?? 0)
      : 0;
  }, [nextOrder]);

  const totalRemainingCod = useMemo(() => {
    return activeOrders.reduce((sum, o) => {
      if (o.paymentMethod === 'COD') {
        return sum + (o.total ?? o.totalAmount ?? 0);
      }
      return sum;
    }, 0);
  }, [activeOrders]);

  const findingSentence = useMemo(() => {
    if (!nextOrder) {
      return 'Hôm nay đã hoàn thành tất cả đơn hàng. Còn 0 đơn cần giao, tổng thu hộ còn lại 0 ₫.';
    }
    const codText =
      nextOrderCod > 0
        ? `thu hộ ${formatCurrencyVND(nextOrderCod)}`
        : 'đã thanh toán (0 ₫)';
    const remainingCount = activeOrders.length - 1;
    const remainingCountText =
      remainingCount > 0
        ? `còn ${remainingCount} đơn nữa trong ngày`
        : 'đơn cuối cùng trong ngày';
    return `Tiếp theo: ${nextOrder.code} (${codText}), ${remainingCountText}, tổng thu hộ còn lại ${formatCurrencyVND(totalRemainingCod)}.`;
  }, [nextOrder, nextOrderCod, activeOrders.length, totalRemainingCod]);

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
        <div className="px-4 py-3 space-y-3">
          {/* 2. Tiêu đề màn hình 24px + 1 câu finding 14px */}
          <div>
            <h1 className="text-[24px] font-bold leading-tight text-[#0a0a0a]">
              Đơn giao hôm nay
            </h1>
            <p className="text-[14px] text-[#6b6b6b] mt-1 leading-[1.5]">
              {findingSentence}
            </p>
          </div>

          {/* 3. "Lộ trình hôm nay" (signature element, bắt buộc có) */}
          <ShipperWidgets
            shipperId={currentShipperId}
            orders={myOrders}
            nextOrderId={nextOrder?.id}
          />

          {/* 4. "Đơn tiếp theo" */}
          <div className="space-y-2">
            <h2 className="text-[16px] font-semibold text-[#0a0a0a]">
              Đơn tiếp theo
            </h2>
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
              <div className="bg-white border border-[#e6e6e6] rounded-[8px] p-4 text-[14px] text-[#6b6b6b]">
                Không có đơn tiếp theo cần giao.
              </div>
            )}
          </div>

          {/* 5. "Đơn chờ nhận" + Tab lọc: Tất cả / Chờ nhận / Đang giao */}
          <div className="space-y-3 pt-2">
            <h2 className="text-[16px] font-semibold text-[#0a0a0a]">
              Đơn chờ nhận
            </h2>

            <ShipperFilterTabs
              activeTab={filterTab}
              onChange={setFilterTab}
              counts={tabCounts}
            />

            {/* Danh sách 2 dòng mỗi đơn */}
            <div className="space-y-2 pt-1">
              {displayedListOrders.length === 0 ? (
                <div className="bg-white border border-[#e6e6e6] rounded-[8px] p-4 text-center text-[14px] text-[#6b6b6b]">
                  Không có đơn hàng nào trong danh sách này.
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
