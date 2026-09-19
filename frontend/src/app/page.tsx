"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import RoleSwitcher from "@/components/RoleSwitcher";
import HeroBento from "@/components/HeroBento";
import BomEstimator from "@/components/BomEstimator";
import OrderPipeline from "@/components/OrderPipeline";
import ProductCatalog from "@/components/ProductCatalog";
import { fetchProducts } from "@/lib/api";
import { Product } from "@/types/api";
import { UserSession } from "@/types/auth";
import { ShieldCheck, Cpu, Database, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [session, setSession] = useState<UserSession>({
    id: "u-cust-001",
    name: "Trần Văn Thầu",
    phone: "0908123456",
    role: "CUSTOMER",
    company: "Công ty XD An Gia • Nhà thầu Q9",
  });

  useEffect(() => {
    fetchProducts().then((data) => setProducts(data));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#080B11] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans">
      <RoleSwitcher currentSession={session} onRoleChange={setSession} />
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <HeroBento />

        <OrderPipeline currentSession={session} />

        <BomEstimator products={products} />

        <ProductCatalog products={products} />
      </main>

      <footer className="border-t border-white/[0.08] bg-[#05080E] py-8 mt-16 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 px-2.5 py-1 rounded-lg font-mono font-black text-xs tracking-widest text-white">
              <span className="text-cyan-400">T</span>
              <span className="text-amber-400">D</span>
              <span className="text-emerald-400">T</span>
            </div>
            <div>
              <p className="font-bold text-slate-200">TDT M&E Engineering Platform © 2026</p>
              <p className="text-[11px] text-slate-500">Đồ án Công nghệ phần mềm nâng cao • Sprint 1 Foundation</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-slate-400">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" /> Go Chi 1.24
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Database className="h-3.5 w-3.5 text-blue-400" /> PostgreSQL 16 (UUID)
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> RBAC 5 Roles
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Sprint 1 DoD Complete
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
