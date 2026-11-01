'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  RotateCw,
  Sparkles,
  Truck,
  Flame,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function ShipperDispatchFeedPage() {
  const toast = useToast();
  const { user } = useAuthStore();
  const { orders, shippers, fetchOrders, fetchShippers, setOrders } = useManagerStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchShippers();
  }, [fetchOrders, fetchShippers]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchOrders(), fetchShippers()]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const { activeTab, setActiveTab, isHighContrast } = useShipperUIStore();

  const [selectedPodOrder, setSelectedPodOrder] = useState<Order | null>(null);
  const [selectedIncidentOrder, setSelectedIncidentOrder] = useState<Order | null>(null);
  const [completedPageSize, setCompletedPageSize] = useState<number>(5);

  // GĐ1 shipper: hướng dẫn một lần sau khi đổi mật khẩu lần đầu (?welcome=1).
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('welcome=1')) {
      setShowWelcome(true);
    }
  }, []);
  const dismissWelcome = () => {
    setShowWelcome(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/shipper');
    }
  };

  const currentShipperId = user?.shipperId || user?.id || '';
  const currentShipperName =
    shippers.find((s) => s.id === currentShipperId)?.name ||
    user?.name ||
    user?.fullName ||
    'Nhân viên giao hàng';

  // Demo order helper for field testing
  const handleLoadDemoOrders = () => {
    const demoOrders: Order[] = [
      {
        id: 'ord-demo-shipping',
        code: 'ORD-261101-86B876',
        orderNumber: 'ORD-261101-86B876',
        customerId: 'cust-demo-1',
        customerName: 'Kỹ sư Tuấn (C/t Masterise Lumiere Riverside Q2)',
        customerPhone: '0918234567',
        shippingAddress: 'Tháp B2, Căn 18.04, Dự án Masterise Lumiere, 259 Xa Lộ Hà Nội, An Phú, TP. Thủ Đức',
        items: [
          {
            productId: 'prod-cad-02',
            productName: 'Dây cáp điện Cadivi CV 2.5 mm²',
            brand: 'Cadivi',
            unitPrice: 720000,
            quantity: 2,
            unit: 'Cuộn 100m',
            total: 1440000,
          },
          {
            productId: 'prod-bm-01',
            productName: 'Ống luồn dây PVC Bình Minh D20',
            brand: 'Bình Minh',
            unitPrice: 41000,
            quantity: 10,
            unit: 'Cây 2.92m',
            total: 410000,
          },
        ],
        totalAmount: 1850000,
        status: 'SHIPPING',
        paymentMethod: 'COD',
        paymentStatus: 'UNPAID',
        shipperId: currentShipperId,
        shipperName: currentShipperName,
        is2H: true,
        deliveryType: '2H',
        deadline2H: new Date(Date.now() + 42 * 60 * 1000).toISOString(),
        version: 1,
        statusHistory: [{ status: 'SHIPPING', timestamp: new Date().toISOString(), changedBy: 'System' }],
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-demo-packing-paid',
        code: 'ORD-261101-A40D82',
        orderNumber: 'ORD-261101-A40D82',
        customerId: 'cust-demo-2',
        customerName: 'Nhà thầu Minh Phát (Biệt thự Thảo Điền)',
        customerPhone: '0903888777',
        shippingAddress: '12 Đường 49B, Phường Thảo Điền, TP. Thủ Đức, TP.HCM',
        items: [
          {
            productId: 'prod-sch-01',
            productName: 'Aptomat MCB Schneider Easy9 2P 32A',
            brand: 'Schneider',
            unitPrice: 165000,
            quantity: 10,
            unit: 'Cái',
            total: 1650000,
          },
          {
            productId: 'prod-pan-01',
            productName: 'Ổ cắm đôi có màng che Panasonic Wide',
            brand: 'Panasonic',
            unitPrice: 88000,
            quantity: 20,
            unit: 'Cái',
            total: 1760000,
          },
        ],
        totalAmount: 3410000,
        status: 'PACKING',
        paymentMethod: 'VIETQR',
        paymentStatus: 'PAID',
        shipperId: currentShipperId,
        shipperName: currentShipperName,
        is2H: false,
        version: 1,
        statusHistory: [{ status: 'PACKING', timestamp: new Date().toISOString(), changedBy: 'System' }],
        createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-demo-packing-cod',
        code: 'ORD-261101-7FF85A',
        orderNumber: 'ORD-261101-7FF85A',
        customerId: 'cust-demo-3',
        customerName: 'A. Long Thợ Điện (84 Chu Văn An Bình Thạnh)',
        customerPhone: '0987112233',
        shippingAddress: 'Số 84/3 Chu Văn An, Phường 26, Quận Bình Thạnh, TP.HCM',
        items: [
          {
            productId: 'prod-cad-01',
            productName: 'Dây cáp điện Cadivi CV 1.5 mm²',
            brand: 'Cadivi',
            unitPrice: 380000,
            quantity: 2,
            unit: 'Cuộn 100m',
            total: 760000,
          },
        ],
        totalAmount: 760000,
        status: 'PACKING',
        paymentMethod: 'COD',
        paymentStatus: 'UNPAID',
        shipperId: currentShipperId,
        shipperName: currentShipperName,
        is2H: true,
        deliveryType: '2H',
        deadline2H: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
        version: 1,
        statusHistory: [{ status: 'PACKING', timestamp: new Date().toISOString(), changedBy: 'System' }],
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
    ];

    setOrders([...orders.filter((o) => o.shipperId !== currentShipperId), ...demoOrders]);
    toast.success('Đã nạp 3 đơn hàng thực tế vào ca làm việc!');
    setActiveTab('SHIPPING');
  };

  // STRICT DATA ISOLATION: Shipper only sees orders assigned to their shipperId
  const myOrders = useMemo(() => {
    if (!currentShipperId) return [];
    return orders.filter((o) => o.shipperId === currentShipperId);
  }, [orders, currentShipperId]);

  // Auto-seed if logged in with 0 orders assigned
  useEffect(() => {
    if (currentShipperId && myOrders.length === 0) {
      handleLoadDemoOrders();
    }
  }, [currentShipperId, myOrders.length]);

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

  // Active Focus Delivery: check if there's any order currently in SHIPPING
  const activeShippingOrders = useMemo(() => {
    return myOrders.filter((o) => o.status === 'SHIPPING');
  }, [myOrders]);

  return (
    <RouteGuard
      allowedRoles={['SHIPPER']}
      fallbackUrl="/login"
      forbiddenUrl="/403"
    >
      <ShipperShell>
        {/* Welcome Onboarding Card for First-Time Shippers (GĐ1) */}
        {showWelcome && (
          <div
            className={`mx-4 mt-3 rounded-3xl p-4.5 space-y-2.5 border transition-all ${
              isHighContrast
                ? 'bg-amber-100 border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent border-emerald-500/30 text-white shadow-lg'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-sm font-black tracking-tight">
                Chào mừng bạn gia nhập đội xe TDT M&E Supplies!
              </p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Tài khoản của bạn đã kích hoạt thành công. Đơn hàng điều phối từ kho sẽ
              xuất hiện tự động bên dưới. Khi giao hàng, chụp ảnh ký nhận (POD)
              và theo dõi sổ quỹ thu hộ COD ngay trong app nhé!
            </p>
            <button
              type="button"
              onClick={dismissWelcome}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border ${
                isHighContrast
                  ? 'bg-black text-white border-2 border-black'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md'
              }`}
            >
              Tôi đã hiểu, bắt đầu nhận đơn!
            </button>
          </div>
        )}

        {/* Top Summary Widgets */}
        <ShipperWidgets shipperId={currentShipperId} />

        {/* Filter Tabs with Live Badges */}
        <div className="flex items-center justify-between px-4 pt-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Danh sách đơn
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-500">
              ({tabFilteredOrders.length} đơn)
            </span>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all active:scale-95 ${
              isHighContrast
                ? 'bg-white text-black border-2 border-black hover:bg-slate-100'
                : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        <ShipperFilterTabs counts={tabCounts} />

        {/* Active Delivery Focus Banner (If on road with active SHIPPING orders and tab is not SHIPPING) */}
        {activeShippingOrders.length > 0 && activeTab !== 'SHIPPING' && (
          <div className="px-4 pt-2">
            <div
              onClick={() => setActiveTab('SHIPPING')}
              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-95 ${
                isHighContrast
                  ? 'bg-amber-300 border-4 border-black text-black font-black'
                  : 'bg-blue-600/20 border-blue-500/40 text-blue-200 hover:bg-blue-600/30'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Truck className="w-5 h-5 text-blue-400 shrink-0 animate-bounce" />
                <div className="truncate">
                  <p className="text-xs font-extrabold truncate">
                    Bạn đang có {activeShippingOrders.length} đơn đang giao trên đường!
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    Nhấn vào đây để xem và hoàn tất giao hàng (POD)
                  </p>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-blue-600 text-white shrink-0">
                Xem ngay
              </span>
            </div>
          </div>
        )}

        {/* Orders Feed */}
        <div className="px-4 py-3 space-y-3.5">
          {displayedOrders.length === 0 ? (
            <div
              className={`p-10 rounded-3xl text-center space-y-3 border transition-all ${
                isHighContrast
                  ? 'bg-white text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-slate-900/60 border-slate-800/90 text-slate-400 backdrop-blur-md'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${
                  isHighContrast
                    ? 'bg-slate-100 text-black border-2 border-black'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700'
                }`}
              >
                <Inbox className="w-7 h-7" />
              </div>
              <div>
                <p
                  className={`text-sm font-black ${
                    isHighContrast ? 'text-black' : 'text-white'
                  }`}
                >
                  Không có đơn hàng nào
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  {activeTab === 'SHIPPING' &&
                    'Hiện tại bạn không có đơn hàng nào đang trên đường giao. Hãy kiểm tra tab Chờ lấy kho!'}
                  {activeTab === 'PACKING' &&
                    'Tất cả đơn hàng đã được nhận xong hoặc kho đang chuẩn bị vật tư.'}
                  {activeTab === '2H' &&
                    'Hiện không có đơn hỏa tốc 2H nào cần giao gấp trong ca này.'}
                  {activeTab === 'COMPLETED' &&
                    'Chưa có đơn hàng nào hoàn tất trong ca làm việc hôm nay.'}
                </p>
              </div>

              {activeTab !== 'PACKING' && tabCounts.packing > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('PACKING')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isHighContrast
                      ? 'bg-black text-white border-2 border-black'
                      : 'bg-amber-600 text-white border-amber-500 hover:bg-amber-500 shadow-sm'
                  }`}
                >
                  Có {tabCounts.packing} đơn đang chờ lấy tại kho ➔
                </button>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLoadDemoOrders}
                  className="w-full min-h-[50px] px-4 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>NẠP ĐƠN HÀNG MẪU (ĐANG GIAO + CHỜ LẤY) ĐỂ TRẢI NGHIỆM</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {displayedOrders.map((order) => (
                <ShipperOrderCard
                  key={order.id}
                  order={order}
                  shipperId={currentShipperId}
                  shipperName={currentShipperName}
                  onOpenPod={(ord) => setSelectedPodOrder(ord)}
                  onOpenIncident={(ord) => setSelectedIncidentOrder(ord)}
                  onPickupSuccess={handleManualRefresh}
                />
              ))}

              {/* Load More Button for Completed tab */}
              {hasMoreCompleted && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setCompletedPageSize((prev) => prev + 5)}
                    className={`min-h-[48px] px-6 py-2.5 rounded-2xl text-xs font-black inline-flex items-center gap-2 transition-all active:scale-95 border ${
                      isHighContrast
                        ? 'bg-amber-300 text-black hover:bg-amber-400 border-2 border-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 shadow-md'
                    }`}
                  >
                    <ArrowDown className="w-4 h-4" />
                    <span>
                      Xem thêm đơn hoàn tất ({sortedOrders.length - completedPageSize} đơn còn lại)
                    </span>
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
          onSuccess={() => {
            setSelectedPodOrder(null);
            handleManualRefresh();
          }}
        />

        {/* Incident Reporting Modal */}
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
