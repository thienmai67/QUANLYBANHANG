"use client";
import dynamic from "next/dynamic";
const TDTInteractiveBanner = dynamic(
  () => import("@/components/TDTInteractiveBanner"),
  { ssr: false, loading: () => <div className="h-[500px] bg-slate-900 animate-pulse rounded-3xl" /> }
);
export default function Test3DPage() {
  return (
    <div className="min-h-screen bg-[#070b14] p-6">
      <h1 className="text-white text-2xl mb-6">TDT Interactive 3D Banner Test</h1>
      <div className="max-w-5xl mx-auto">
        <TDTInteractiveBanner onOpenRFQ={(product) => console.log("RFQ clicked:", product)} />
      </div>
    </div>
  );
}
