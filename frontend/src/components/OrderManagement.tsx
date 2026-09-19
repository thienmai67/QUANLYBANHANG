"use client";

import React, { useState } from "react";
import { UserSession } from "@/types/auth";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  deliveryAddress: string;
  finalAmount: number;
  status: "PENDING" | "APPROVED" | "SHIPPING" | "DELIVERED" | "CANCELLED";
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
    itemsSummary: "50 Cây ống Bình Minh D42, 20 Cuộn Cadivi 2.5",
    createdAt: "2026-09-19",
  },
  {
    id: "ord-002",
    orderNumber: "RFQ-2026-002",
    customerName: "Cơ Điện Hoàng Gia",
    deliveryAddress: "Landmark 81, Bình Thạnh",
    finalAmount: 29796000,
    status: "APPROVED",
    assignedShipper: "Tài Xế Ba Gác",
    itemsSummary: "10 Hộp MCB Panasonic 2P, 100 Co Bình Minh",
    createdAt: "2026-09-18",
  },
  {
    id: "ord-003",
    orderNumber: "RFQ-2026-003",
    customerName: "Trần Văn Thầu",
    deliveryAddress: "KDC Nam Long, P. Phước Long B, Q9",
    finalAmount: 5084000,
    status: "SHIPPING",
    assignedShipper: "Tài Xế Ba Gác",
    itemsSummary: "15 Cây ống D42, 30 Co D42",
    createdAt: "2026-09-17",
  },
];

export default function OrderManagement({ currentSession }: { currentSession: UserSession }) {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [toast, setToast] = useState<string>("");

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const filteredOrders = orders.filter((o) => {
    if (currentSession.role === "CUSTOMER") return o.customerName.includes("Trần Văn Thầu");
    if (currentSession.role === "SHIPPER") return o.assignedShipper?.includes("Tài Xế Ba Gác") && o.status !== "CANCELLED";
    return true;
  });

  const handleApprove = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "APPROVED", assignedShipper: "Tài Xế Ba Gác" } : o))
    );
    notify("Đã duyệt đơn và chuyển giao vận.");
  };

  const handleStatus = (id: string, newStatus: "SHIPPING" | "DELIVERED") => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    notify(newStatus === "DELIVERED" ? "Đã giao hàng và tất toán." : "Đang giao hàng.");
  };

  const handleDelete = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    notify("Đã xóa đơn (Quyền Admin).");
  };

  return (
    <div id="orders" className="border border-[#E8E6E1] bg-white rounded-xl p-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#F4F3EF] mb-3">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-[#18181B]">
            Quản Lý Đơn Hàng & Vận Chuyển
          </h2>
          <p className="text-[11px] text-[#71717A]">
            Bộ lọc phân quyền theo vai trò: <strong className="text-[#18181B] font-mono">{currentSession.role}</strong>
          </p>
        </div>
        <span className="font-mono text-[10px] text-[#71717A] bg-[#F4F3EF] px-2 py-0.5 rounded">
          {filteredOrders.length} records
        </span>
      </div>

      {toast && (
        <div className="mb-3 px-3 py-1.5 rounded bg-[#FAF9F6] border border-[#E8E6E1] text-[#18181B] font-mono text-[11px] flex items-center justify-between">
          <span>{toast}</span>
          <span className="text-[#A1A1AA]">●</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E8E6E1] text-[10px] font-mono text-[#71717A] uppercase">
              <th className="py-2 px-3">Mã đơn</th>
              <th className="py-2 px-3">Khách hàng</th>
              <th className="py-2 px-3">Hạng mục</th>
              <th className="py-2 px-3">Giá trị</th>
              <th className="py-2 px-3">Trạng thái</th>
              <th className="py-2 px-3">Giao vận</th>
              <th className="py-2 px-3 text-right">Tác vụ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F3EF]">
            {filteredOrders.map((order) => {
              const formatted = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.finalAmount);
              return (
                <tr key={order.id} className="hover:bg-[#FAF9F6] transition duration-150">
                  <td className="py-2.5 px-3 font-mono font-semibold text-[#18181B]">{order.orderNumber}</td>
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-[#18181B]">{order.customerName}</p>
                    <p className="text-[10px] text-[#A1A1AA]">{order.deliveryAddress}</p>
                  </td>
                  <td className="py-2.5 px-3 text-[#52525B] text-[11px] max-w-xs">{order.itemsSummary}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-[#18181B]">{formatted}</td>
                  <td className="py-2.5 px-3">
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                      order.status === "PENDING"
                        ? "bg-[#FBF3DB] text-[#956400]"
                        : order.status === "APPROVED"
                        ? "bg-[#E1F3FE] text-[#1F6C9F]"
                        : order.status === "SHIPPING"
                        ? "bg-[#F4F3EF] text-[#52525B]"
                        : "bg-[#EDF3EC] text-[#346538]"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#71717A] text-[11px]">
                    {order.assignedShipper || <span className="text-[#D4D2CD] italic">Chờ phân</span>}
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-1">
                    {(currentSession.role === "ADMIN" || currentSession.role === "MANAGER") && order.status === "PENDING" && (
                      <button
                        onClick={() => handleApprove(order.id)}
                        className="px-2 py-0.5 bg-[#18181B] hover:bg-[#333333] active:scale-[0.98] text-white rounded text-[10px] font-mono transition"
                      >
                        Duyệt
                      </button>
                    )}
                    {currentSession.role === "SHIPPER" && order.status === "APPROVED" && (
                      <button
                        onClick={() => handleStatus(order.id, "SHIPPING")}
                        className="px-2 py-0.5 bg-[#18181B] hover:bg-[#333333] active:scale-[0.98] text-white rounded text-[10px] font-mono transition"
                      >
                        Giao
                      </button>
                    )}
                    {currentSession.role === "SHIPPER" && order.status === "SHIPPING" && (
                      <button
                        onClick={() => handleStatus(order.id, "DELIVERED")}
                        className="px-2 py-0.5 bg-[#EDF3EC] text-[#346538] hover:bg-[#E0ECE0] active:scale-[0.98] rounded text-[10px] font-mono font-semibold transition"
                      >
                        Xong
                      </button>
                    )}
                    {currentSession.role === "ADMIN" && (
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="px-2 py-0.5 bg-[#FDEBEC] text-[#9F2F2D] hover:bg-[#FADBDC] rounded text-[10px] font-mono transition"
                      >
                        Xóa
                      </button>
                    )}
                    {currentSession.role === "CUSTOMER" && order.status === "PENDING" && (
                      <span className="text-[#A1A1AA] text-[10px] font-mono">Đang đợi</span>
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
