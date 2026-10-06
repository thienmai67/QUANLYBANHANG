import React from "react";
import Image from "next/image";

export interface AuthHeroWaveProps {
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
}

export default function AuthHeroWave({
  imageSrc = "/images/auth/materials-hero.jpg",
  imageAlt = "Tổng kho vật tư thép xây dựng & M&E TDT",
  className = "",
}: AuthHeroWaveProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      {/* SVG Clip Path & Dashed Trace System */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
        viewBox="0 0 500 700"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          {/* Organic S-Curve clip path for hero image: extends to 3000px so it always reaches the right border on any screen resolution */}
          <clipPath id="auth-wave-clip" clipPathUnits="userSpaceOnUse">
            <path d="M 210 0 C 170 80, 50 140, 70 240 C 90 340, 220 400, 190 520 C 160 610, 60 660, 0 800 L 3000 3000 L 3000 0 Z" />
          </clipPath>
        </defs>

        {/* Parallel decorative dashed trace line */}
        <path
          d="M 175 0 C 135 80, 15 140, 35 240 C 55 340, 185 400, 155 520 C 125 610, 25 660, -35 700"
          stroke="#CBD5E1"
          strokeWidth="1.75"
          strokeDasharray="5 7"
          fill="none"
          opacity="0.6"
        />
      </svg>

      {/* Hero Image masked by organic S-curve */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ clipPath: "url(#auth-wave-clip)" }}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover object-[75%_center] scale-[1.08] transition-transform duration-700 hover:scale-110"
        />

        {/* Ambient depth gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-black/10 pointer-events-none" />
        <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay pointer-events-none" />

        {/* Stylized TDT Brand Watermark at bottom right */}
        <div className="absolute bottom-6 right-8 z-30 flex items-center gap-2 select-none pointer-events-none">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center p-1.5 shadow-lg relative">
            <Image
              src="/images/auth/tdt-symbol.jpg"
              alt="TDT Monogram"
              width={36}
              height={36}
              className="w-full h-full object-contain rounded-lg filter brightness-200 invert"
            />
          </div>
          <span className="text-white/80 font-black tracking-widest text-sm drop-shadow">
            TDT<span className="text-blue-400">.</span>
          </span>
        </div>
      </div>
    </div>
  );
}
