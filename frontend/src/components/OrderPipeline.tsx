"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserSession } from "@/types/auth";
import { CheckCircle2, Clock, Truck, Trash2, ArrowRight, AlertCircle, Package, ShieldCheck, MapPin, Eye } from "lucide-react";
import { useScrollReveal } from "@/lib/useScrollReveal";

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
    deliveryAddress: "KDC Nam Long, P. Phước Long B, TP. Thủ Đức",
    finalAmount: 11890000,
    status: "PENDING",
    itemsSummary: "50 Cây ống uPVC Bình Minh Ø42, 20 Cuộn cáp Cadivi CV 2.5",
    createdAt: "Vừa xong",
  },
  {
    id: "ord-002",
    orderNumber: "RFQ-2026-002",
    customerName: "Cơ Điện Hoàng Gia",
    deliveryAddress: "Tòa Tháp Landmark 81, P.22, Bình Thạnh",
    finalAmount: 29796000,
    status: "APPROVED",
    assignedShipper: "Tài Xế Hoàng Nam",
    itemsSummary: "10 Hộp Aptomat Panasonic 2P 32A, 100 Co ống Bình Minh Ø34",
    createdAt: "Hôm qua",
  },
  {
    id: "ord-003",
    orderNumber: "RFQ-2026-003",
    customerName: "Trần Văn Thầu",
    deliveryAddress: "KDC Nam Long, P. Phước Long B, TP. Thủ Đức",
    finalAmount: 5084000,
    status: "SHIPPING",
    assignedShipper: "Tài Xế Hoàng Nam",
    itemsSummary: "15 Cây ống thoát sàn Ø90, 30 Co nối góc uPVC",
    createdAt: "17/09",
  },
  {
    id: "ord-004",
    orderNumber: "RFQ-2026-004",
    customerName: "Đại Lý Điện Nước Phát Đạt",
    deliveryAddress: "45 Lê Văn Việt, Tăng Nhơn Phú A, TP. Thủ Đức",
    finalAmount: 45200000,
    status: "DELIVERED",
    assignedShipper: "Tài Xế Hoàng Nam",
    itemsSummary: "100 Cây ống PPR Tiền Phong PN20 Ø32, 50 Cuộn Cadivi 4.0",
    createdAt: "15/09",
  },
];

const STATUS_CONFIG = {
  PENDING: {
    color: "bg-accent-orange/10 text-accent-orange border-accent-orange/30",
    dot: "bg-accent-orange",
    icon: Clock,
    label: "Chờ Duyệt Báo Giá",
  },
  APPROVED: {
    color: "bg-accent-blue/10 text-accent-blue border-accent-blue/30",
    dot: "bg-accent-blue",
    icon: CheckCircle2,
    label: "Đã Phê Duyệt",
  },
  SHIPPING: {
    color: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    dot: "bg-purple-500",
    icon: Truck,
    label: "Đang Vận Chuyển 2H",
  },
  DELIVERED: {
    color: "bg-accent-green/10 text-accent-green border-accent-green/30",
    dot: "bg-accent-green",
    icon: CheckCircle2,
    label: "Đã Nghiệm Thu",
  },
};

export default function OrderPipeline({ currentSession }: { currentSession: UserSession }) {
  const containerRef = useScrollReveal<HTMLDivElement>();
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [toast, setToast] = useState<string>("");

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
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
    notify("Đã phê duyệt đơn hàng & điều phối xe tải cẩu giao hàng");
  };

  const handleStatus = (id: string, newStatus: "SHIPPING" | "DELIVERED") => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    notify(newStatus === "DELIVERED" ? "Xác nhận đã bàn giao & ký biên bản nghiệm thu vật tư" : "Bắt đầu xuất kho vận chuyển ra công trình");
  };

  const handleDelete = (id: string) => {
    if (currentSession.role !== "ADMIN") {
      notify("Chỉ tài khoản Admin toàn quyền mới có thể xóa đơn");
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== id));
    notify("Đã xóa đơn hàng khỏi hệ thống");
  };

  return (
    <div ref={containerRef}>
      <div
        id="orders-pipeline"
        className="reveal-on-scroll rounded-xl border border-border bg-background p-6 sm:p-10 space-y-6 shadow-sm relative overflow-hidden transition-colors duration-300"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-lg bg-surface border border-border text-foreground">
              <Truck className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Tiến Độ Đơn Hàng & Điều Phối Tuyến
                </h2>
                <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-accent-blue/10 text-accent-blue font-mono">
                  SLA 2H
                </span>
              </div>
              <p className="text-sm text-muted mt-1 font-medium">
                Phân quyền theo vai trò hiện tại:{" "}
                <span className="text-accent-blue font-bold font-mono">
                  {currentSession.role}
                </span>{" "}
                ({currentSession.name} - {currentSession.company})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-4 py-2 rounded-md bg-surface border border-border text-foreground font-mono">
              {filteredOrders.length} Đơn Phụ Trách
            </span>
          </div>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="p-3.5 rounded-md bg-accent-blue/10 border border-accent-blue/30 text-accent-blue text-sm font-bold flex items-center gap-3 shadow-lg backdrop-blur-md"
            >
              <AlertCircle className="h-5 w-5 text-accent-blue flex-shrink-0" />
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-border rounded-xl">
            <Package className="h-12 w-12 text-muted mx-auto mb-4 opacity-50" />
            <p className="text-base font-bold text-foreground">Không có đơn hàng nào thuộc phạm vi tài khoản này</p>
            <p className="text-sm text-muted mt-1 font-medium">Đổi vai trò ở thanh trên cùng để kiểm tra quyền hạn khác</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border bg-surface text-xs text-muted font-bold uppercase tracking-wider">
                    <th className="py-4 px-5">Mã Đơn / RFQ</th>
                    <th className="py-4 px-5">Nhà Thầu & Địa Chỉ Giao</th>
                    <th className="py-4 px-5">Chi Tiết Vật Tư</th>
                    <th className="py-4 px-5">Giá Trị Đơn</th>
                    <th className="py-4 px-5">Trạng Thái</th>
                    <th className="py-4 px-5">Tài Xế</th>
                    <th className="py-4 px-5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  <AnimatePresence>
                    {filteredOrders.map((order) => {
                      const formatted = new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(order.finalAmount);
                      const statusCfg = STATUS_CONFIG[order.status];
                      const StatusIcon = statusCfg.icon;

                      return (
                        <motion.tr
                          key={order.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="group hover:bg-surface/50 transition-colors"
                        >
                          <td className="py-4 px-5 font-mono font-bold text-accent-blue">
                            {order.orderNumber}
                          </td>
                          <td className="py-4 px-5">
                            <p className="font-bold text-foreground">{order.customerName}</p>
                            <p className="text-xs text-muted mt-1 flex items-center gap-1.5 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-accent-orange shrink-0" />
                              <span className="truncate max-w-[220px]">{order.deliveryAddress}</span>
                            </p>
                          </td>
                          <td className="py-4 px-5 text-muted max-w-[220px] truncate font-medium">
                            {order.itemsSummary}
                          </td>
                          <td className="py-4 px-5 font-mono font-bold text-foreground text-sm">
                            {formatted}
                          </td>
                          <td className="py-4 px-5">
                            <span
                              className={`inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${statusCfg.color}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} animate-pulse`} />
                              <StatusIcon className="h-3.5 w-3.5" />
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-muted text-xs font-medium">
                            {order.assignedShipper || (
                              <span className="text-muted/60 tracking-wider">Chờ điều phối</span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {(currentSession.role === "ADMIN" || currentSession.role === "MANAGER") &&
                                order.status === "PENDING" && (
                                  <button
                                    onClick={() => handleApprove(order.id)}
                                    className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-md font-bold text-xs uppercase tracking-wider shadow-md active:scale-[0.98] transition-all"
                                  >
                                    Duyệt Đơn
                                  </button>
                                )}
                              {currentSession.role === "SHIPPER" && order.status === "APPROVED" && (
                                <button
                                  onClick={() => handleStatus(order.id, "SHIPPING")}
                                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md font-bold text-xs uppercase tracking-wider shadow-md active:scale-[0.98] transition-all"
                                >
                                  Nhận Giao
                                </button>
                              )}
                              {currentSession.role === "SHIPPER" && order.status === "SHIPPING" && (
                                <button
                                  onClick={() => handleStatus(order.id, "DELIVERED")}
                                  className="px-4 py-2 bg-accent-green hover:bg-accent-green/90 text-background rounded-md font-bold text-xs uppercase tracking-wider shadow-md active:scale-[0.98] transition-all"
                                >
                                  Hoàn Tất
                                </button>
                              )}
                              {currentSession.role === "ADMIN" && (
                                <button
                                  onClick={() => handleDelete(order.id)}
                                  className="p-2 rounded-md bg-accent-orange/10 hover:bg-accent-orange/20 text-accent-orange border border-accent-orange/30 active:scale-[0.98] transition-all"
                                  title="Hủy đơn hàng"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                              {currentSession.role === "CUSTOMER" && order.status === "PENDING" && (
                                <span className="text-accent-orange text-xs font-bold uppercase tracking-wider">
                                  Đang Chờ
                                </span>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              <AnimatePresence>
                {filteredOrders.map((order) => {
                  const formatted = new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(order.finalAmount);
                  const statusCfg = STATUS_CONFIG[order.status];
                  const StatusIcon = statusCfg.icon;

                  return (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="rounded-xl border border-border bg-surface p-5 space-y-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-accent-blue">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] px-2.5 py-1 rounded border ${statusCfg.color}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusCfg.label}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-foreground">{order.customerName}</p>
                        <p className="text-[11px] text-muted font-medium mt-1">{order.deliveryAddress}</p>
                      </div>

                      <p className="text-xs text-muted font-medium">{order.itemsSummary}</p>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <span className="font-mono font-bold text-foreground text-sm">{formatted}</span>

                        <div className="flex gap-2">
                          {(currentSession.role === "ADMIN" || currentSession.role === "MANAGER") &&
                            order.status === "PENDING" && (
                              <button
                                onClick={() => handleApprove(order.id)}
                                className="px-3 py-1.5 bg-accent-blue text-white rounded-md font-bold uppercase tracking-wider text-[10px]"
                              >
                                Duyệt Đơn
                              </button>
                            )}
                          {currentSession.role === "SHIPPER" && order.status === "APPROVED" && (
                            <button
                              onClick={() => handleStatus(order.id, "SHIPPING")}
                              className="px-3 py-1.5 bg-purple-600 text-white rounded-md font-bold uppercase tracking-wider text-[10px]"
                            >
                              Nhận Giao
                            </button>
                          )}
                          {currentSession.role === "SHIPPER" && order.status === "SHIPPING" && (
                            <button
                              onClick={() => handleStatus(order.id, "DELIVERED")}
                              className="px-3 py-1.5 bg-accent-green text-background rounded-md font-bold uppercase tracking-wider text-[10px]"
                            >
                              Hoàn Tất
                            </button>
                          )}
                          {currentSession.role === "ADMIN" && (
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="p-1.5 rounded-md bg-accent-orange/10 text-accent-orange border border-accent-orange/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
