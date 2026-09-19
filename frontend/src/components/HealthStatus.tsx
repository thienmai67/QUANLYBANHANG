"use client";

import React, { useEffect, useState } from "react";
import { fetchHealth } from "@/lib/api";
import { HealthStatus as HealthStatusType } from "@/types/api";
import { Activity, Database, Server } from "lucide-react";

export default function HealthStatus() {
  const [health, setHealth] = useState<HealthStatusType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth().then((data) => {
      setHealth(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-amber-600" />
          <h2 className="text-sm font-semibold text-slate-900">Trạng Thái Kết Nối (Walking Skeleton)</h2>
        </div>
        <span className="text-xs text-slate-400">Next.js ⇄ Go Core API ⇄ PostgreSQL</span>
      </div>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <Server className="h-4 w-4 text-slate-500" />
          <div className="text-xs">
            <p className="text-slate-500 font-medium">Frontend BFF</p>
            <p className="font-semibold text-emerald-600">ONLINE (Port 3000)</p>
          </div>
        </div>
        <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <Server className="h-4 w-4 text-slate-500" />
          <div className="text-xs">
            <p className="text-slate-500 font-medium">Golang Core API</p>
            <p className={loading ? "text-amber-500" : health ? "font-semibold text-emerald-600" : "font-semibold text-rose-500"}>
              {loading ? "CHECKING..." : health?.status === "UP" ? "ONLINE (Port 8080)" : "MOCK MODE"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <Database className="h-4 w-4 text-slate-500" />
          <div className="text-xs">
            <p className="text-slate-500 font-medium">PostgreSQL 16</p>
            <p className={loading ? "text-amber-500" : health?.database === "CONNECTED" ? "font-semibold text-emerald-600" : "font-semibold text-slate-600"}>
              {loading ? "CHECKING..." : health?.database || "READY FOR DOCKER"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
