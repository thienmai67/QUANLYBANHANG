import React from "react";
import Image from "next/image";

export interface AuthShowcaseProps {
  eyebrow: string;
  headlineLine1: string;
  headlineLine2: string;
  badge: string;
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
}

export default function AuthShowcase({
  eyebrow,
  headlineLine1,
  headlineLine2,
  badge,
  imageSrc = "/images/auth/materials-hero.jpg",
  imageAlt = "Tổng kho vật tư điện nước M&E",
  className = "",
}: AuthShowcaseProps) {
  return (
    <div
      className={`relative w-full h-full bg-[#0B0B0C] overflow-hidden flex flex-col justify-between ${className}`}
    >
      {/* Radial glow background */}
      <div
        className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_0%,rgba(255,90,31,0.12),transparent_55%)] pointer-events-none"
        aria-hidden="true"
      />

      {/* Blueprint grid accent lines */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none"
        aria-hidden="true"
      />

      {/* 3 Concentric decorative circles */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full border border-white/[0.07] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full border border-white/[0.05] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border border-white/[0.03] pointer-events-none"
        aria-hidden="true"
      />

      {/* Content Header: Eyebrow + Headline on single line */}
      <div className="relative z-20 p-6 sm:p-8 lg:p-10">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[#A1A1AA] font-semibold mb-2 whitespace-nowrap">
          {eyebrow}
        </p>
        <h2 className="font-display text-[20px] sm:text-[24px] xl:text-[28px] leading-snug tracking-[-0.02em] text-white whitespace-nowrap">
          <span className="text-white">{headlineLine1}</span>{" "}
          <span className="text-[#D4D4D8]">{headlineLine2}</span>
        </h2>
      </div>

      {/* Image / Showcase Area with gradient fade */}
      <div className="absolute inset-x-0 bottom-0 h-[60%] z-10 pointer-events-none [mask-image:linear-gradient(to_top,#000_35%,transparent_100%)]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 1023px) 100vw, 56vw"
            priority
            className="object-cover object-bottom opacity-75"
          />
        ) : null}
      </div>

      {/* Stat Badge (Bottom Right) */}
      <div className="relative z-20 p-6 sm:p-8 lg:p-10 flex justify-end">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#FF5A1F] px-3.5 py-1.5 text-white text-[12px] font-semibold shadow-[0_8px_20px_-5px_rgba(255,90,31,0.5)] whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{badge}</span>
        </div>
      </div>
    </div>
  );
}
