"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/types/api";
import { Calculator, TrendingDown, ArrowRight, Plus, CheckCircle2, ShoppingBag } from "lucide-react";
import { useScrollReveal } from "@/lib/useScrollReveal";

interface BomEstimatorProps {
  products: Product[];
}

export default function BomEstimator({ products }: BomEstimatorProps) {
  const containerRef = useScrollReveal<HTMLDivElement>();

  const productsWithConversions = products.filter(
    (p) => p.conversions && p.conversions.length > 0
  );

  const [selectedProductId, setSelectedProductId] = useState<string>(
    productsWithConversions[0]?.id || ""
  );
  const [quantity, setQuantity] = useState<number>(20);
  const [addedToast, setAddedToast] = useState(false);

  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const activeProduct = products.find((p) => p.id === selectedProductId);
  const activeConversion = activeProduct?.conversions?.[0];

  const convertedQuantity = activeConversion
    ? quantity * activeConversion.conversion_factor
    : quantity;

  const rawTotal = activeProduct
    ? convertedQuantity * activeProduct.base_price
    : 0;

  const discountAmount = activeProduct
    ? rawTotal * (activeProduct.discount_rate / 100)
    : 0;

  const finalTotal = rawTotal - discountAmount;

  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(n);

  const handleAddToBom = () => {
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleSendRfq = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRfqModalOpen(false);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const handleExportCSV = () => {
    if (!activeProduct) return;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Mã SKU,Tên Vật Tư,Hãng,Quy Cách Đặt,Số Lượng Đặt,Đơn Vị Cơ Sở,Số Lượng Cơ Sở,Đơn Giá Niêm Yết,Chiết Khấu (%),Thành Tiền (VND)\n" +
      `"${activeProduct.sku}","${activeProduct.name}","${activeProduct.brand_name}","${activeConversion?.from_unit_name}",${quantity},"${activeConversion?.to_unit_name}",${convertedQuantity},${activeProduct.base_price},${activeProduct.discount_rate},${finalTotal}\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BOM-BaoGia-${activeProduct.sku}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (productsWithConversions.length === 0) {
    return (
      <div
        id="bom-estimator"
        className="rounded-2xl border border-border bg-surface p-10 text-center"
      >
        <Calculator className="h-10 w-10 text-muted mx-auto mb-4 opacity-50" />
        <p className="text-sm font-medium text-muted">
          Chưa có dữ liệu vật tư có cấu hình quy đổi. Đang đồng bộ hệ thống...
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <div
        id="bom-estimator"
        className="reveal-on-scroll rounded-xl border border-border bg-background p-6 sm:p-10 relative overflow-hidden shadow-sm transition-colors duration-300"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-lg bg-surface text-accent-blue border border-border">
              <Calculator className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Bóc Tách Khối Lượng & Chiết Khấu BOM
                </h2>
                <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-accent-green/10 text-accent-green font-mono">
                  LIVE DATA
                </span>
              </div>
              <p className="text-sm text-muted mt-1 font-medium">
                Tính năng quy đổi tự động từ vật tư thô sang quy cách lẻ với mức chiết khấu Đại lý Cấp 1.
              </p>
            </div>
          </div>
        </div>

        {/* Calculator Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Product select & Quantity */}
          <div className="lg:col-span-6 space-y-5">
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-muted uppercase tracking-wider">
                Chọn Vật Tư Cần Bóc Tách:
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full text-sm font-bold bg-surface border border-border rounded-md p-3.5 text-foreground focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 transition-all cursor-pointer"
              >
                {productsWithConversions.map((p) => (
                  <option key={p.id} value={p.id} className="bg-background text-foreground">
                    [{p.brand_name}] {p.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted">Giá niêm yết nhà máy:</span>
                <span className="text-foreground font-bold font-mono bg-surface px-2 py-0.5 rounded border border-border">
                  {new Intl.NumberFormat("vi-VN").format(activeProduct?.base_price || 0)} ₫ / {activeProduct?.base_unit_name}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-muted uppercase tracking-wider">
                  Số Lượng Đặt Hàng ({activeConversion?.from_unit_name || "Đơn vị sỉ"}):
                </label>
                <span className="text-xs text-accent-orange font-bold font-mono">
                  Q = {quantity} {activeConversion?.from_unit_name}
                </span>
              </div>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full text-xl font-display font-bold bg-surface border border-border rounded-md p-3.5 text-foreground focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange/30 transition-all font-mono"
              />
            </div>

            {/* Conversion Visual Pill */}
            <div className="p-4 rounded-lg bg-surface border border-border flex items-center justify-between text-sm">
              <span className="text-muted font-medium">Tỷ lệ quy đổi tiêu chuẩn:</span>
              <span className="font-bold text-foreground flex items-center gap-2 font-mono">
                <span className="bg-background px-2 py-1 rounded border border-border">{quantity} {activeConversion?.from_unit_name}</span>
                <ArrowRight className="w-4 h-4 text-accent-blue" />
                <span className="text-accent-blue bg-accent-blue/10 px-2 py-1 rounded border border-accent-blue/20">{convertedQuantity.toLocaleString()} {activeConversion?.to_unit_name}</span>
              </span>
            </div>
          </div>

          {/* Results Card */}
          <motion.div
            key={`${selectedProductId}-${quantity}`}
            initial={{ opacity: 0.8, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="lg:col-span-6 rounded-xl border border-accent-blue/30 bg-accent-blue/5 p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm pb-4 border-b border-accent-blue/10">
                <span className="text-muted font-medium">Tổng Giá Niêm Yết:</span>
                <span className="line-through text-muted font-mono font-medium opacity-70">
                  {fmt(rawTotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground flex items-center gap-2 font-semibold">
                  <TrendingDown className="h-5 w-5 text-accent-green" />
                  Chiết Khấu Đại Lý {activeProduct?.brand_name} (-{activeProduct?.discount_rate}%):
                </span>
                <span className="text-accent-green font-bold text-base bg-accent-green/10 px-2 py-1 rounded-sm border border-accent-green/20 font-mono">
                  -{fmt(discountAmount)}
                </span>
              </div>

              {/* Progress bar saving */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted uppercase tracking-wider">Mức Tiết Kiệm:</span>
                  <span className="text-accent-green">{activeProduct?.discount_rate}% NGÂN SÁCH</span>
                </div>
                <div className="h-2 w-full bg-surface rounded-full overflow-hidden flex border border-border">
                  <div
                    className="h-full bg-accent-green rounded-r-full"
                    style={{ width: `${activeProduct?.discount_rate || 25}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Total payable + Action */}
            <div className="pt-6 border-t border-accent-blue/10 mt-6 flex flex-col gap-5">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground block uppercase tracking-wider">
                    Giá Thanh Toán Thực Tế:
                  </span>
                  <span className="text-[10px] text-muted font-medium mt-1 inline-block">
                    (Đã bao gồm VAT & chứng nhận CO/CQ)
                  </span>
                </div>
                <motion.span
                  key={finalTotal}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  className="text-3xl sm:text-4xl font-display font-bold text-accent-blue tracking-tight font-mono"
                >
                  {fmt(finalTotal)}
                </motion.span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleAddToBom}
                  className="flex-1 py-3.5 rounded-md bg-accent-blue hover:bg-accent-blue/90 text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-accent-blue/20 transition-all"
                >
                  <Plus className="w-4 h-4" /> Thêm Vào Giỏ Dự Toán
                </button>
                <button
                  type="button"
                  onClick={() => setIsRfqModalOpen(true)}
                  className="py-3.5 px-4 rounded-md bg-accent-orange hover:bg-accent-orange/90 text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-accent-orange/20 transition-all"
                >
                  <ShoppingBag className="w-4 h-4" /> Gửi Yêu Cầu Báo Giá (RFQ)
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-muted border-t border-border/50">
                <span>Xuất dữ liệu bóc tách:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-2.5 py-1 rounded bg-surface hover:bg-border text-foreground font-mono text-[11px] border border-border transition"
                  >
                    📥 Xuất Excel (.CSV)
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-2.5 py-1 rounded bg-surface hover:bg-border text-foreground font-mono text-[11px] border border-border transition"
                  >
                    🖨️ In Báo Giá (PDF)
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {addedToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="p-3.5 rounded-md bg-accent-green/10 border border-accent-green/20 text-accent-green text-sm font-bold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Đã thêm {quantity} {activeConversion?.from_unit_name} vào bảng danh sách BOM!</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Modal RFQ */}
        <AnimatePresence>
          {isRfqModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background border border-border rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative"
              >
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-accent-orange" />
                    Lập Yêu Cầu Báo Giá Công Trình (RFQ)
                  </h3>
                  <button
                    onClick={() => setIsRfqModalOpen(false)}
                    className="text-muted hover:text-foreground text-sm font-bold p-1"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSendRfq} className="space-y-4 mt-4 text-xs">
                  <div>
                    <label className="block font-bold text-muted uppercase tracking-wider mb-1">Tên Dự Án / Công Trình:</label>
                    <input
                      type="text"
                      required
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Vd: Dự án Biệt Thự An Gia Q9"
                      className="w-full bg-surface border border-border rounded p-2.5 text-foreground focus:outline-none focus:border-accent-blue"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-muted uppercase tracking-wider mb-1">Số Điện Thoại Liên Hệ:</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Vd: 0908123456"
                      className="w-full bg-surface border border-border rounded p-2.5 text-foreground focus:outline-none focus:border-accent-blue font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-muted uppercase tracking-wider mb-1">Địa Chỉ Giao Hàng Công Trình:</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Vd: KDC Nam Long, Phước Long B, TP. Thủ Đức"
                      className="w-full bg-surface border border-border rounded p-2.5 text-foreground focus:outline-none focus:border-accent-blue"
                    />
                  </div>

                  <div className="p-3 bg-surface rounded border border-border space-y-1">
                    <span className="font-bold text-foreground block">Tóm tắt đơn hàng BOM chọn:</span>
                    <p className="text-muted font-mono">
                      {quantity} {activeConversion?.from_unit_name} {activeProduct?.name} (~{convertedQuantity} {activeConversion?.to_unit_name})
                    </p>
                    <div className="flex justify-between pt-1 text-accent-blue font-bold font-mono">
                      <span>Tổng tiền ước tính:</span>
                      <span>{fmt(finalTotal)}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsRfqModalOpen(false)}
                      className="px-4 py-2 rounded bg-surface hover:bg-border text-foreground font-bold"
                    >
                      Hủy Bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded bg-accent-orange text-white font-bold hover:bg-accent-orange/90 shadow-md shadow-accent-orange/20"
                    >
                      Gửi Yêu Cầu Cho Sale Duyệt
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
