'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  ShoppingBag,
  MapPin,
  X,
  Truck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { Order, OrderStatus } from '../../types/admin';

export function OrdersManager() {
  const { orders, updateOrderStatus, addToast, searchQuery } = useAdminStore();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.contractorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportExcel = () => {
    addToast('Đã xuất thành công file Excel Đơn Hàng M&E (M&E_Orders_2026.xlsx)', 'success');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Completed':
        return <span className="px-3 py-1 text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">Đã hoàn tất</span>;
      case 'Shipping2H':
        return <span className="px-3 py-1 text-xs font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 rounded-full animate-pulse">Giao 2H</span>;
      case 'Preparing':
        return <span className="px-3 py-1 text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-full">Đang chuẩn bị hàng</span>;
      default:
        return <span className="px-3 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">Chờ xác nhận</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Quản Lý Đơn Hàng Công Trình
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi tiến độ giao vật tư 2H tận chân công trình & tình trạng thanh toán
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-sm shadow-md transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> Xuất Excel Đơn Hàng
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Filter className="w-4 h-4" /> Lọc trạng thái đơn:
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'Pending', label: 'Chờ xác nhận' },
            { id: 'Preparing', label: 'Đang chuẩn bị' },
            { id: 'Shipping2H', label: 'Đang giao 2H' },
            { id: 'Completed', label: 'Hoàn tất' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                statusFilter === st.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                <th className="py-3.5 px-4">Mã Đơn & Ngày tạo</th>
                <th className="py-3.5 px-4">Nhà thầu / Công trình</th>
                <th className="py-3.5 px-4 text-right">Tổng niêm yết</th>
                <th className="py-3.5 px-4 text-right">Chiết khấu</th>
                <th className="py-3.5 px-4 text-right">Thành tiền</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Không tìm thấy đơn hàng nào
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <p className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm">
                        {order.code}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{order.createdAt}</p>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {order.contractorName}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                        {order.contractorTier}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-medium text-slate-500">
                      {order.totalAmount.toLocaleString('vi-VN')}
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      -{order.discountAmount.toLocaleString('vi-VN')}
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {order.finalAmount.toLocaleString('vi-VN')}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {getStatusBadge(order.status)}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-1.5 ml-auto px-3 py-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 rounded-xl transition-colors"
                      >
                        <Eye className="w-4 h-4" /> Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg font-mono">
                    {selectedOrder.code}
                  </h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ngày đặt: {selectedOrder.createdAt}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
              {/* Delivery info */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                  <MapPin className="w-4 h-4 text-cyan-600" /> Địa điểm giao vật tư 2H:
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium pl-6">
                  {selectedOrder.deliveryAddress}
                </p>
                <div className="flex items-center gap-4 pl-6 text-[11px] text-slate-500">
                  <span>Nhà thầu: <strong className="text-slate-900 dark:text-slate-100">{selectedOrder.contractorName}</strong></span>
                  <span>Phân hạng: <strong>{selectedOrder.contractorTier}</strong></span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-3">
                  Chi tiết danh mục vật tư trong đơn
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500">
                      <tr>
                        <th className="p-3">Vật tư</th>
                        <th className="p-3 text-center">Số lượng</th>
                        <th className="p-3 text-right">Đơn giá (VND)</th>
                        <th className="p-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3">
                            <p className="font-bold text-slate-900 dark:text-slate-100">{item.productName}</p>
                            <span className="font-mono text-[10px] text-slate-400">SKU: {item.sku}</span>
                          </td>
                          <td className="p-3 text-center font-bold">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {item.unitPrice.toLocaleString('vi-VN')}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            {(item.quantity * item.unitPrice * (1 - item.discountRate / 100)).toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="flex flex-col items-end space-y-1 text-right pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-slate-500">Tổng giá trị niêm yết: <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedOrder.totalAmount.toLocaleString('vi-VN')} VND</span></p>
                <p className="text-emerald-600 font-bold">Tổng tiền chiết khấu: <span className="font-mono">-{selectedOrder.discountAmount.toLocaleString('vi-VN')} VND</span></p>
                <p className="text-base font-black text-cyan-600 dark:text-cyan-400 pt-2">Thanh toán cuối: <span className="font-mono">{selectedOrder.finalAmount.toLocaleString('vi-VN')} VND</span></p>
              </div>

              {/* Shipper Assignment */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="font-bold text-slate-700 dark:text-slate-300">Phân công Shipper giao 2H:</p>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={selectedOrder.assignedShipperId || ''}
                    onChange={(e) => {
                      const sId = e.target.value;
                      const sName = sId === 'u-ship-001' ? 'Tài Xế Hoàng Nam' : sId === 'u-ship-002' ? 'Tài Xế Quốc Bảo' : 'Tài Xế Minh Tuấn';
                      useAdminStore.getState().assignShipper(selectedOrder.id, sId, sName);
                      setSelectedOrder({ ...selectedOrder, assignedShipperId: sId, assignedShipperName: sName, status: selectedOrder.status === 'Pending' ? 'Preparing' : selectedOrder.status });
                      addToast(`Đã phân công đơn ${selectedOrder.code} cho ${sName}`, 'success');
                    }}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Chọn Shipper Giao Hàng --</option>
                    <option value="u-ship-001">Tài Xế Hoàng Nam (Đội Xe Cẩu 1)</option>
                    <option value="u-ship-002">Tài Xế Quốc Bảo (Giao Siêu Tốc 2H)</option>
                    <option value="u-ship-003">Tài Xế Minh Tuấn (Xe Tải 2 Tấn)</option>
                  </select>
                  {selectedOrder.assignedShipperName && (
                    <span className="text-emerald-500 font-bold text-xs">
                      ✓ Đã gán: {selectedOrder.assignedShipperName}
                    </span>
                  )}
                </div>
              </div>

              {/* Update Status Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="font-bold text-slate-700 dark:text-slate-300">Cập nhật trạng thái đơn hàng:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'Pending', label: 'Chờ xác nhận', icon: Clock },
                    { id: 'Preparing', label: 'Đang chuẩn bị', icon: ShoppingBag },
                    { id: 'Shipping2H', label: 'Đang giao 2H', icon: Truck },
                    { id: 'Completed', label: 'Hoàn tất', icon: CheckCircle2 },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, st.id as any);
                        setSelectedOrder({ ...selectedOrder, status: st.id as any });
                        addToast(`Đã cập nhật trạng thái đơn ${selectedOrder.code}`, 'success');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                        selectedOrder.status === st.id
                          ? 'bg-cyan-600 text-white shadow'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <st.icon className="w-3.5 h-3.5" /> {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
