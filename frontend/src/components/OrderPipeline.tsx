"use client";

import React, { useState } from "react";
import { UserSession } from "@/types/auth";
import { CheckCircle2, Clock, Truck, Trash2, Check, ArrowRight, Shield, UserCheck, AlertCircle } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  deliveryAddress: string;
  finalAmount: number;
  status: "PENDING" | "APPROVED" | "SHIPPING" | "DELIVERED";
  assignedShipper?: string;
  itemsSummary: string;
  createdAt: string;
}

const INITIAL_ORDERS: Order[] = [
  {
    id: "ord-001",
    orderNumber: "RFQ-2026-001",
    customerName: "Trần Văn Thầu",
    deliveryAddress: "KDC Nam Long, P. Phước Long B, Q9",
    finalAmount: 11890000,
    status: "PENDING",
    itemsSummary: "50 Cây ống Bình Minh D42, 20 Cuộn Cadivi 2.5mm²",
    createdAt: "Vừa xong",
  },
  {
    id: "ord-002",
    orderNumber: "RFQ-2026-002",
    customerName: "Cơ Điện Hoàng Gia",
    deliveryAddress: "Landmark 81, Bình Thạnh",
    finalAmount: 29796000,
    status: "APPROVED",
    assignedShipper: "Tài Xế Hoàng Nam",
    itemsSummary: "10 Hộp MCB Panasonic 2P 32A, 100 Co Bình Minh",
    createdAt: "Hôm qua",
  },
  {
    id: "ord-003",
    orderNumber: "RFQ-2026-003",
    customerName: "Trần Văn Thầu",
    deliveryAddress: "KDC Nam Long, P. Phước Long B, Q9",
    finalAmount: 5084000,
    status: "SHIPPING",
    assignedShipper: "Tài Xế Hoàng Nam",
    itemsSummary: "15 Cây ống D42, 30 Co D42",
    createdAt: "17/09",
  },
  {
    id: "ord-004",
    orderNumber: "RFQ-2026-004",
    customerName: "Đại Lý Điện Nước Phát Đạt",
    deliveryAddress: "45 Lê Văn Việt, Tăng Nhơn Phú A, Q9",
    finalAmount: 45200000,
    status: "DELIVERED",
    assignedShipper: "Tài Xế Hoàng Nam",
    itemsSummary: "100 Cây ống PPR D32, 50 Cuộn Cadivi 4.0mm²",
    createdAt: "15/09",
  },
];

export default function OrderPipeline({ currentSession }: { currentSession: UserSession }) {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [toast, setToast] = useState<string>("");

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const filteredOrders = orders.filter((o) => {
    if (currentSession.role === "CUSTOMER") return o.customerName.includes("Trần Văn Thầu");
    if (currentSession.role === "SHIPPER") return o.assignedShipper?.includes("Tài Xế Hoàng Nam");
    return true;
  });

  const handleApprove = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "APPROVED", assignedShipper: "Tài Xế Hoàng Nam" } : o))
    );
    notify("Quản lý: Đã duyệt đơn và điều phối cho Shipper!");
  };

  const handleStatus = (id: string, newStatus: "SHIPPING" | "DELIVERED") => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    notify(newStatus === "DELIVERED" ? "Shipper: Đã giao hàng & Xác nhận thu tiền thành công!" : "Shipper: Bắt đầu giao hàng!");
  };

  const handleDelete = (id: string) => {
    if (currentSession.role !== "ADMIN") {
      notify("Chỉ Admin mới có quyền xóa đơn!");
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== id));
    notify("Admin: Đã xóa đơn vĩnh viễn khỏi hệ thống!");
  };

  return (
    <div id="orders-pipeline" className="rounded-2xl border border-white/[0.08] bg-[#0E1526] p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Pipeline Đơn Hàng & Điều Phối Giao Vận (RBAC Agile Matrix)
          </h2>
          <p className="text-xs text-slate-400">
            Hiển thị quyền hạn thực tế cho vai trò đang active: <strong className="text-cyan-400 font-mono">{currentSession.role}</strong> ({currentSession.name})
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/[0.06] text-slate-300 border border-white/10 self-start">
          {filteredOrders.length} đơn hiển thị
        </span>
      </div>

      {toast && (
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center justify-between animate-fade-in">
          <span>{toast}</span>
          <span className="text-cyan-500 font-normal text-[10px]">● System Logged</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.08] text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-3">Mã đơn</th>
              <th className="py-3 px-3">Khách hàng & Địa chỉ</th>
              <th className="py-3 px-3">Chi tiết bóc tách</th>
              <th className="py-3 px-3">Thành tiền sau CK</th>
              <th className="py-3 px-3">Trạng thái</th>
              <th className="py-3 px-3">Tài xế</th>
              <th className="py-3 px-3 text-right">Quyền thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filteredOrders.map((order) => {
              const formatted = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.finalAmount);
              return (
                <tr key={order.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3.5 px-3 font-mono font-bold text-cyan-400">{order.orderNumber}</td>
                  <td className="py-3.5 px-3">
                    <p className="font-semibold text-white">{order.customerName}</p>
                    <p className="text-[10px] text-slate-400">{order.deliveryAddress}</p>
                  </td>
                  <td className="py-3.5 px-3 text-slate-300 text-xs max-w-xs">{order.itemsSummary}</td>
                  <td className="py-3.5 px-3 font-mono font-bold text-amber-400">{formatted}</td>
                  <td className="py-3.5 px-3">
                    <span className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      order.status === "PENDING"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : order.status === "APPROVED"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        : order.status === "SHIPPING"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-300 font-mono text-[11px]">
                    {order.assignedShipper || <span className="text-slate-600 italic">Chờ phân công</span>}
                  </td>
                  <td className="py-3.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                    {(currentSession.role === "ADMIN" || currentSession.role === "MANAGER") && order.status === "PENDING" && (
                      <button
                        onClick={() => handleApprove(order.id)}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-bold text-[10px] font-mono shadow transition"
                      >
                        ✓ Duyệt đơn
                      </button>
                    )}
                    {currentSession.role === "SHIPPER" && order.status === "APPROVED" && (
                      <button
                        onClick={() => handleStatus(order.id, "SHIPPING")}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg font-bold text-[10px] font-mono shadow transition"
                      >
                        🚚 Nhận giao
                      </button>
                    )}
                    {currentSession.role === "SHIPPER" && order.status === "SHIPPING" && (
                      <button
                        onClick={() => handleStatus(order.id, "DELIVERED")}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg font-bold text-[10px] font-mono shadow transition"
                      >
                        ✓ Đã giao xong
                      </button>
                    )}
                    {currentSession.role === "ADMIN" && (
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-bold text-[10px] font-mono transition"
                      >
                        ✕ Xóa
                      </button>
                    )}
                    {currentSession.role === "CUSTOMER" && order.status === "PENDING" && (
                      <span className="text-slate-500 text-[10px] font-mono italic">Đang chờ duyệt</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
