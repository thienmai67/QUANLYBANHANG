"use client";

import React, { useState } from "react";
import MaterialHeader from "@/components/MaterialHeader";
import MaterialFooter from "@/components/MaterialFooter";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import FacebookSignInButton from "@/components/FacebookSignInButton";
import { User, LogIn, Lock, PackageCheck, AlertCircle, FileText, Download, Building2, MapPin } from "lucide-react";
import * as motion from "motion/react-client";

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Fake logged in state for demo purposes of the Real-time order tracking
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Mock tracking logic
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b14]">
      <MaterialHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex justify-center">
        {!isLoggedIn ? (
          <div className="w-full max-w-md bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-2 flex bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setActiveTab("login")}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === 'login' ? 'bg-white dark:bg-[#0c1322] text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Login
              </button>
              <button 
                onClick={() => setActiveTab("register")}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === 'register' ? 'bg-white dark:bg-[#0c1322] text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Register
              </button>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase">
                  {activeTab === 'login' ? 'Contractor Login' : 'Create Account'}
                </h2>
                <p className="text-sm text-slate-500 mt-2">Manage your BOMs and track 2H SLA deliveries.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {activeTab === 'register' && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 block">Company Name</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input required type="text" placeholder="XYZ Construction JSC" className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 block">Email / Username</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input required type="email" placeholder="contractor@example.com" className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input required type="password" placeholder="••••••••" className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all">
                    {activeTab === 'login' ? <><LogIn className="w-4 h-4"/> Sign In & Track</> : 'Register Company'}
                  </button>
                </div>
              </form>

              {/* SSO Auth Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Or continue with</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>

              {/* SSO Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <GoogleSignInButton className="w-full justify-center !rounded-xl" />
                <FacebookSignInButton className="w-full justify-center !rounded-xl" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-5xl space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tight">Contractor Dashboard</h1>
                <p className="text-slate-500 text-sm mt-1">Welcome back, XYZ Construction JSC</p>
              </div>
              <button onClick={() => setIsLoggedIn(false)} className="px-5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-bold bg-white dark:bg-[#0c1322] hover:text-orange-500">
                Log Out
              </button>
            </div>

            {/* Sendungsverfolgung (Real-Time Tracker) */}
            <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-10 shadow-lg">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 text-xs font-bold uppercase">Active Delivery</span>
                    <span className="text-xs font-mono font-bold text-slate-400">#BOM-74892</span>
                  </div>
                  <h3 className="text-xl font-bold">Cadivi CV 2.5mm² (x50) & Panasonic RCBO (x20)</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase text-slate-500 mb-1">ETA</p>
                  <p className="text-2xl font-black text-orange-500">14:30 PM</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative mb-12">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 rounded-full" />
                <div className="absolute top-1/2 left-0 w-[60%] h-1 bg-blue-600 -translate-y-1/2 rounded-full" />
                
                <div className="relative flex justify-between w-full">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white ring-4 ring-white dark:ring-[#0c1322] z-10">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold mt-3 uppercase tracking-wider text-blue-600 text-center">Approved</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white ring-4 ring-white dark:ring-[#0c1322] z-10 animate-pulse shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                      <PackageCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold mt-3 uppercase tracking-wider text-blue-600 text-center">Shipping</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 ring-4 ring-white dark:ring-[#0c1322] z-10">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold mt-3 uppercase tracking-wider text-slate-400 text-center">Delivered</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p><strong>Note:</strong> Driver (Mr. Tuan - 0988.123.456) is 5km away from the site. Please prepare the receiving area for the crane truck.</p>
              </div>
            </div>

            {/* Saved Estimates */}
            <div>
              <h3 className="font-bold text-lg mb-4">Saved BOM Estimates</h3>
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#0c1322] overflow-hidden">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                     <tr>
                       <th className="p-4 font-bold uppercase tracking-wider text-xs text-slate-500">ID</th>
                       <th className="p-4 font-bold uppercase tracking-wider text-xs text-slate-500">Project</th>
                       <th className="p-4 font-bold uppercase tracking-wider text-xs text-slate-500 text-right">Items</th>
                       <th className="p-4 font-bold uppercase tracking-wider text-xs text-slate-500 text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                     <tr>
                       <td className="p-4 font-mono text-xs">#BOM-EST-001</td>
                       <td className="p-4">Luxury Villa M&E - D7</td>
                       <td className="p-4 text-right">45 items</td>
                       <td className="p-4 text-right">
                         <button className="text-blue-600 hover:underline flex items-center gap-1 justify-end w-full">
                           <Download className="w-3.5 h-3.5" /> PDF
                         </button>
                       </td>
                     </tr>
                     <tr>
                       <td className="p-4 font-mono text-xs">#BOM-EST-002</td>
                       <td className="p-4">Standard Apartment Water System</td>
                       <td className="p-4 text-right">12 items</td>
                       <td className="p-4 text-right">
                         <button className="text-blue-600 hover:underline flex items-center gap-1 justify-end w-full">
                           <Download className="w-3.5 h-3.5" /> PDF
                         </button>
                       </td>
                     </tr>
                   </tbody>
                 </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <MaterialFooter />
    </div>
  );
}
