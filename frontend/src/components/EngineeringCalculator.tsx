"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Zap, Droplets, ArrowRightLeft, Check, Sparkles, AlertCircle } from "lucide-react";

export default function EngineeringCalculator() {
  const [activeTab, setActiveTab] = useState<"cable" | "pipe" | "unit">("cable");

  // Cable state
  const [powerKw, setPowerKw] = useState<number>(15);
  const [voltagePhase, setVoltagePhase] = useState<"1p" | "3p">("3p");
  const [distanceM, setDistanceM] = useState<number>(35);
  const [copied, setCopied] = useState(false);

  // Pipe state
  const [fixtureCount, setFixtureCount] = useState<number>(12);
  const [pipeType, setPipeType] = useState<"cold" | "hot" | "drain">("cold");

  // Electrical math
  const currentAmp = voltagePhase === "1p"
    ? Math.round((powerKw * 1000) / 187)
    : Math.round((powerKw * 1000) / 559);

  let suggestedWire = "CV 1.5 mm²";
  let wireCode = "CADIVI-CV-1.5";
  let approxPrice = "5.200 đ/m";

  if (currentAmp <= 16) {
    suggestedWire = "CV 2.5 mm²";
    wireCode = "CADIVI-CV-2.5";
    approxPrice = "8.650 đ/m";
  } else if (currentAmp <= 25) {
    suggestedWire = "CV 4.0 mm²";
    wireCode = "CADIVI-CV-4.0";
    approxPrice = "13.800 đ/m";
  } else if (currentAmp <= 38) {
    suggestedWire = "CV 6.0 mm²";
    wireCode = "CADIVI-CV-6.0";
    approxPrice = "20.400 đ/m";
  } else if (currentAmp <= 55) {
    suggestedWire = "CXV 10.0 mm² (Cáp ngầm)";
    wireCode = "CADIVI-CXV-10";
    approxPrice = "34.900 đ/m";
  } else if (currentAmp <= 80) {
    suggestedWire = "CXV 16.0 mm² (Cáp lực)";
    wireCode = "CADIVI-CXV-16";
    approxPrice = "54.200 đ/m";
  } else {
    suggestedWire = "CXV 25.0 mm² (Cáp nguồn chính)";
    wireCode = "CADIVI-CXV-25";
    approxPrice = "82.500 đ/m";
  }

  // Pipe math
  let suggestedPipe = "uPVC Bình Minh Ø27";
  if (pipeType === "drain") {
    suggestedPipe = fixtureCount > 15 ? "uPVC Bình Minh Ø114 (Ống đứng)" : "uPVC Bình Minh Ø90 (Thoát sàn)";
  } else if (pipeType === "hot") {
    suggestedPipe = fixtureCount > 10 ? "PPR Tiền Phong PN20 Ø32" : "PPR Tiền Phong PN20 Ø25";
  } else {
    suggestedPipe = fixtureCount > 20 ? "uPVC Bình Minh C2 Ø42" : fixtureCount > 8 ? "uPVC Bình Minh C2 Ø34" : "uPVC Bình Minh C2 Ø27";
  }

  const handleCopySpec = () => {
    navigator.clipboard?.writeText(`${suggestedWire} - Tải: ${powerKw}kW (${currentAmp}A)`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-background p-6 sm:p-10 shadow-sm transition-colors duration-300">
      {/* Title + Tab Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-surface text-accent-blue text-xs font-bold font-mono tracking-widest uppercase mb-3 border border-border">
            <Calculator className="w-4 h-4" /> BỘ CÔNG CỤ KỸ THUẬT M&E
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-foreground font-bold tracking-tight">
            Công Cụ Tra Cứu & Tính Toán Nhanh Cho Kỹ Sư
          </h2>
          <p className="text-sm text-muted mt-2 font-medium">
            Tính toán công suất tải điện, lưu lượng ống nước và quy đổi quy cách vật tư chỉ trong vài giây.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-md bg-surface border border-border">
          <button
            onClick={() => setActiveTab("cable")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === "cable"
                ? "bg-accent-orange text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-background"
            }`}
          >
            <Zap className="w-4 h-4" /> Tính Cáp Điện Cadivi
          </button>

          <button
            onClick={() => setActiveTab("pipe")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === "pipe"
                ? "bg-accent-blue text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-background"
            }`}
          >
            <Droplets className="w-4 h-4" /> Cỡ Ống Cấp Thoát
          </button>

          <button
            onClick={() => setActiveTab("unit")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === "unit"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted hover:text-foreground hover:bg-background"
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" /> Quy Đổi Đơn Vị
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          {activeTab === "cable" && (
            <motion.div
              key="cable"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              {/* Inputs */}
              <div className="lg:col-span-7 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Power Input */}
                  <div className="space-y-3 p-5 rounded-xl bg-surface border border-border">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-foreground font-semibold">Công Suất Tổng (P):</span>
                      <span className="font-mono text-accent-orange font-bold text-sm bg-accent-orange/10 px-2 py-1 rounded">{powerKw} kW</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      value={powerKw}
                      onChange={(e) => setPowerKw(Number(e.target.value))}
                      className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent-orange"
                    />
                    <div className="flex justify-between text-[10px] text-muted font-sans font-medium">
                      <span>1 kW (Dân dụng)</span>
                      <span>50 kW (Nhà phố/Villa)</span>
                      <span>100 kW (Xưởng)</span>
                    </div>
                  </div>

                  {/* Distance Input */}
                  <div className="space-y-3 p-5 rounded-xl bg-surface border border-border">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-foreground font-semibold">Chiều Dài Dây Dẫn:</span>
                      <span className="font-mono text-accent-orange font-bold text-sm bg-accent-orange/10 px-2 py-1 rounded">{distanceM} Mét</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="150"
                      step="5"
                      value={distanceM}
                      onChange={(e) => setDistanceM(Number(e.target.value))}
                      className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent-orange"
                    />
                    <div className="flex justify-between text-[10px] text-muted font-sans font-medium">
                      <span>5m</span>
                      <span>75m</span>
                      <span>150m</span>
                    </div>
                  </div>
                </div>

                {/* Phase Selection */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-surface p-4 rounded-xl border border-border">
                  <span className="text-xs font-semibold text-muted w-32">Nguồn Cấp Điện:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setVoltagePhase("1p")}
                      className={`px-4 py-2 rounded-md text-xs font-bold transition-all border ${
                        voltagePhase === "1p"
                          ? "bg-accent-orange text-white border-accent-orange shadow-sm"
                          : "bg-background text-muted border-border hover:bg-border/50"
                      }`}
                    >
                      1 Pha (220V)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoltagePhase("3p")}
                      className={`px-4 py-2 rounded-md text-xs font-bold transition-all border ${
                        voltagePhase === "3p"
                          ? "bg-accent-orange text-white border-accent-orange shadow-sm"
                          : "bg-background text-muted border-border hover:bg-border/50"
                      }`}
                    >
                      3 Pha (380V)
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-border text-xs text-muted flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-accent-orange shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">
                    Công thức áp dụng hệ số cosφ = 0.85 và mật độ dòng kinh tế J = 4.5A/mm². Đã tính độ sụt áp an toàn cho khoảng cách {distanceM}m theo TCVN.
                  </span>
                </div>
              </div>

              {/* Output Recommendation Card */}
              <div className="lg:col-span-5 rounded-xl border border-accent-orange/30 bg-accent-orange/5 p-6 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-accent-orange mb-3 uppercase tracking-wider font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> ĐỀ XUẤT CÁP TỐI ƯU
                  </span>
                  <span className="font-mono bg-background px-2 py-1 rounded border border-accent-orange/20">I = {currentAmp} A</span>
                </div>

                <div className="text-3xl font-display font-bold text-foreground tracking-tight py-2">
                  {suggestedWire}
                </div>

                <div className="mt-5 space-y-3 text-sm border-t border-accent-orange/20 pt-5">
                  <div className="flex justify-between text-muted">
                    <span>Mã vật tư:</span>
                    <span className="text-foreground font-bold font-mono">{wireCode}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Đơn giá tham khảo:</span>
                    <span className="text-accent-orange font-bold font-mono">{approxPrice}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Độ sụt áp ước tính:</span>
                    <span className="text-accent-green font-bold">&lt; 2.5% (Đạt TCVN)</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleCopySpec}
                    className="w-full py-3.5 rounded-md bg-accent-orange text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-accent-orange/90 transition-all shadow-md"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    {copied ? "ĐÃ SAO CHÉP!" : "ĐƯA VÀO BÁO GIÁ BOM"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "pipe" && (
            <motion.div
              key="pipe"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              <div className="lg:col-span-7 space-y-5">
                <div className="space-y-3 p-5 rounded-xl bg-surface border border-border">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-foreground font-semibold">Tổng Số Điểm Dùng Nước:</span>
                    <span className="font-mono text-accent-blue font-bold text-sm bg-accent-blue/10 px-2 py-1 rounded">{fixtureCount} Đầu Thiết Bị</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="50"
                    step="1"
                    value={fixtureCount}
                    onChange={(e) => setFixtureCount(Number(e.target.value))}
                    className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent-blue"
                  />
                  <div className="flex justify-between text-[10px] text-muted font-sans font-medium">
                    <span>2 Điểm (Căn Hộ)</span>
                    <span>25 Điểm (Khách Sạn Mini)</span>
                    <span>50 Điểm (Tòa Nhà)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-surface p-4 rounded-xl border border-border">
                  <span className="text-xs font-semibold text-muted w-32">Hệ Thống Đường Ống:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPipeType("cold")}
                      className={`px-4 py-2 rounded-md text-xs font-bold transition-all border ${
                        pipeType === "cold"
                          ? "bg-accent-blue text-white border-accent-blue shadow-sm"
                          : "bg-background text-muted border-border hover:bg-border/50"
                      }`}
                    >
                      Ống Cấp Lạnh (uPVC)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPipeType("hot")}
                      className={`px-4 py-2 rounded-md text-xs font-bold transition-all border ${
                        pipeType === "hot"
                          ? "bg-accent-blue text-white border-accent-blue shadow-sm"
                          : "bg-background text-muted border-border hover:bg-border/50"
                      }`}
                    >
                      Ống Cấp Nóng (PPR)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPipeType("drain")}
                      className={`px-4 py-2 rounded-md text-xs font-bold transition-all border ${
                        pipeType === "drain"
                          ? "bg-accent-blue text-white border-accent-blue shadow-sm"
                          : "bg-background text-muted border-border hover:bg-border/50"
                      }`}
                    >
                      Ống Thoát Thải
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-xl border border-accent-blue/30 bg-accent-blue/5 p-6 shadow-sm relative overflow-hidden">
                <div className="text-xs text-accent-blue mb-3 flex items-center gap-1.5 uppercase tracking-wider font-bold">
                  <Sparkles className="w-4 h-4" /> QUY CÁCH ỐNG KHUYẾN NGHỊ
                </div>
                <div className="text-3xl font-display font-bold text-foreground tracking-tight py-2">
                  {suggestedPipe}
                </div>
                <div className="mt-5 space-y-2.5 text-sm border-t border-accent-blue/20 pt-5 text-muted font-medium">
                  <p>• Áp suất danh định: PN10 - PN16</p>
                  <p>• Chiết khấu đại lý Cấp 1: 28% Bình Minh / Tiền Phong</p>
                  <p>• Giao hàng nguyên cây 4m tiêu chuẩn kèm phụ kiện nối</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "unit" && (
            <motion.div
              key="unit"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6"
            >
              <div className="p-6 rounded-xl bg-surface border border-border group hover:border-foreground/30 transition-colors">
                <div className="text-xs text-muted mb-2 uppercase tracking-widest font-bold">Cáp Điện Cuộn 100m</div>
                <div className="text-xl font-display font-bold text-foreground">1 Cuộn = 100 Mét</div>
                <div className="text-sm text-muted mt-3 font-medium">Trọng lượng TB: ~3.2 kg / cuộn CV 2.5</div>
              </div>
              <div className="p-6 rounded-xl bg-surface border border-border group hover:border-foreground/30 transition-colors">
                <div className="text-xs text-muted mb-2 uppercase tracking-widest font-bold">Ống uPVC Cây 4m</div>
                <div className="text-xl font-display font-bold text-foreground">1 Cây = 4 Mét Tiêu Chuẩn</div>
                <div className="text-sm text-muted mt-3 font-medium">Bó tiêu chuẩn: 10 cây (40m) hoặc 5 cây</div>
              </div>
              <div className="p-6 rounded-xl bg-surface border border-border group hover:border-foreground/30 transition-colors">
                <div className="text-xs text-muted mb-2 uppercase tracking-widest font-bold">Ống Thép Luồn Dây G.I</div>
                <div className="text-xl font-display font-bold text-foreground">1 Cây = 3.03 - 3.05 Mét</div>
                <div className="text-sm text-muted mt-3 font-medium">Theo chuẩn ANSI C80.1 / JIS C 8305</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
