'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

export type BrandId = 'binhminh' | 'cadivi' | 'schneider';

type ProductModelsProps = {
  selected: BrandId | null;
  onSelect: (id: BrandId | null) => void;
};

type Vec3 = [number, number, number];

// ─── Part (geometry + toon material + wireframe edges) ────────────────────────

type PartProps = {
  geometry: THREE.BufferGeometry;
  color: string;
  position?: Vec3;
  rotation?: Vec3;
};

function Part({ geometry, color, position, rotation }: PartProps) {
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);
  return (
    <mesh geometry={geometry} position={position} rotation={rotation}>
      <meshToonMaterial color={color} transparent />
      <lineSegments geometry={edges} raycast={() => null}>
        <lineBasicMaterial color="#0891B2" transparent opacity={0.3} />
      </lineSegments>
    </mesh>
  );
}

// ─── Shared Geometries ────────────────────────────────────────────────────────

const torusGeo          = new THREE.TorusGeometry(0.8, 0.2, 6, 10);
const cylHGeo           = new THREE.CylinderGeometry(0.15, 0.15, 1.6, 6);
const cylVGeo           = new THREE.CylinderGeometry(0.15, 0.15, 0.9, 6);
const cylJointGeo       = new THREE.CylinderGeometry(0.22, 0.22, 0.4, 6);
const cylCapGeo         = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 6);
const boxBodyGeo        = new THREE.BoxGeometry(1.0, 1.4, 0.3);
const boxDoorGeo        = new THREE.BoxGeometry(0.85, 1.2, 0.05);
const boxBreakerGeo     = new THREE.BoxGeometry(0.12, 0.3, 0.05);

// ─── 3D Shapes ────────────────────────────────────────────────────────────────

function CadviShape() {
  return (
    <group rotation={[0.5, -0.5, 0]}>
      <Part geometry={torusGeo} color="#DC2626" position={[0, 0, -0.35]} />
      <Part geometry={torusGeo} color="#CA8A04" position={[0, 0, 0]} />
      <Part geometry={torusGeo} color="#DC2626" position={[0, 0, 0.35]} />
    </group>
  );
}

function BinhMinhShape() {
  return (
    <group position={[0, -0.4, 0]}>
      <Part geometry={cylHGeo}     color="#1D4ED8" rotation={[0, 0, Math.PI / 2]} />
      <Part geometry={cylVGeo}     color="#3B82F6" position={[0, 0.45, 0]} />
      <Part geometry={cylJointGeo} color="#1E3A8A" rotation={[0, 0, Math.PI / 2]} />
      <Part geometry={cylCapGeo}   color="#1E3A8A" rotation={[0, 0, Math.PI / 2]} position={[-0.85, 0, 0]} />
      <Part geometry={cylCapGeo}   color="#1E3A8A" rotation={[0, 0, Math.PI / 2]} position={[0.85, 0, 0]} />
      <Part geometry={cylCapGeo}   color="#1E3A8A" position={[0, 0.95, 0]} />
    </group>
  );
}

function SchneiderShape() {
  const breakers: Array<{ x: number; y: number }> = [
    { x: -0.2, y: 0.25 }, { x: 0, y: 0.25 }, { x: 0.2, y: 0.25 },
    { x: -0.2, y: -0.15 }, { x: 0, y: -0.15 }, { x: 0.2, y: -0.15 },
  ];
  return (
    <group>
      <Part geometry={boxBodyGeo} color="#166534" />
      <Part geometry={boxDoorGeo} color="#15803D" position={[0, 0, 0.18]} />
      {breakers.map((b, i) => (
        <Part key={i} geometry={boxBreakerGeo} color="#0891B2" position={[b.x, b.y, 0.22]} />
      ))}
    </group>
  );
}

// ─── Brand Configs ────────────────────────────────────────────────────────────

const BRANDS: Array<{
  id: BrandId;
  slot: number;          // 0=Bình Minh, 1=Cadivi, 2=Schneider
  baseScale: number;
  labelY: number;
  title: string;
  line2: string;
  line3: string;
}> = [
  { id: 'binhminh',  slot: 0, baseScale: 1.0, labelY: 2.2, title: 'Bình Minh',  line2: 'Ống & Phụ kiện nhựa',          line3: 'Chính hãng 100%' },
  { id: 'cadivi',    slot: 1, baseScale: 1.2, labelY: 2.4, title: 'Cadivi',      line2: 'Dây & Cáp điện',               line3: 'Chính hãng 100%' },
  { id: 'schneider', slot: 2, baseScale: 1.0, labelY: 2.2, title: 'Schneider',   line2: 'Tủ điện & Thiết bị đóng cắt', line3: 'Chính hãng 100%' },
];

// Standby row positions — wider spacing (distance = 3.0 units)
const STANDBY_POS: Vec3[] = [
  [0.2, 0, 0],   // slot 0 (Bình Minh - left edge of right area)
  [3.2, 0, 0],   // slot 1 (Cadivi - Center)
  [6.2, 0, 0],   // slot 2 (Schneider - right edge)
];

const CENTER_TARGET: Vec3 = [3.2, 0, 0];
const SIDE_POSITIONS: Vec3[] = [[0.0, 0, 0], [6.4, 0, 0]];

// ─── ModelShell ───────────────────────────────────────────────────────────────

type ModelShellProps = {
  id: BrandId;
  slot: number;
  baseScale: number;
  labelY: number;
  title: string;
  line2: string;
  line3: string;
  selected: BrandId | null;
  onSelect: (id: BrandId | null) => void;
  children: React.ReactNode;
};

function ModelShell({
  id,
  slot,
  baseScale,
  labelY,
  title,
  line2,
  line3,
  selected,
  onSelect,
  children,
}: ModelShellProps) {
  const outerRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const fade = useRef(1);

  // Compute target world position
  const targetPos = useMemo<Vec3>(() => {
    if (!selected) return STANDBY_POS[slot];
    if (selected === id) return CENTER_TARGET;
    const others = BRANDS.filter((b) => b.id !== selected).sort((a, b) => a.slot - b.slot);
    const myIndex = others.findIndex((b) => b.id === id);
    return SIDE_POSITIONS[myIndex] ?? STANDBY_POS[slot];
  }, [selected, id, slot]);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  useFrame((state, delta) => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const isSelected = selected === id;

    // 1. Position lerp
    outer.position.x = THREE.MathUtils.lerp(outer.position.x, targetPos[0], 0.08);
    outer.position.z = THREE.MathUtils.lerp(outer.position.z, targetPos[2], 0.08);

    if (isSelected) {
      outer.position.y = THREE.MathUtils.lerp(outer.position.y, 0, 0.08);
    } else {
      const floatY = Math.sin(state.clock.elapsedTime * 0.8 + slot * 1.5) * 0.1;
      outer.position.y = THREE.MathUtils.lerp(outer.position.y, targetPos[1] + floatY, 0.08);
    }

    // 2. Scale lerp
    const targetScale = baseScale * (isSelected ? 1.4 : selected !== null ? 0.65 : 1.0);
    inner.scale.setScalar(THREE.MathUtils.lerp(inner.scale.x, targetScale, 0.08));

    // 3. Rotation logic: ONLY selected model rotates Y axis
    if (isSelected) {
      inner.rotation.y += delta * 1.2;
    } else {
      inner.rotation.y = THREE.MathUtils.lerp(inner.rotation.y, 0, 0.1);
    }

    // 4. Fade opacity lerp
    const targetFade = selected === null || isSelected ? 1.0 : 0.35;
    fade.current = THREE.MathUtils.lerp(fade.current, targetFade, 0.1);
    inner.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
        const mat = obj.material;
        if (Array.isArray(mat)) return;
        if (mat.userData.baseOpacity === undefined) {
          mat.userData.baseOpacity = (mat as THREE.Material & { opacity?: number }).opacity ?? 1;
        }
        (mat as THREE.Material & { opacity: number }).opacity =
          (mat.userData.baseOpacity as number) * fade.current;
      }
    });
  });

  const isSelected = selected === id;

  return (
    <group ref={outerRef} position={STANDBY_POS[slot]}>
      {/* 3D Model group */}
      <group
        ref={innerRef}
        scale={baseScale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(isSelected ? null : id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {children}
      </group>

      {/* Selected Detail Glassmorphism Card */}
      {isSelected && (
        <Html position={[0, labelY, 0]} center zIndexRange={[10, 0]}>
          <div className="pointer-events-none select-none whitespace-nowrap bg-white/90 backdrop-blur-md text-cyan-700 font-bold px-4 py-3 rounded-xl shadow-xl border border-cyan-200 text-center min-w-32">
            <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider">{title}</p>
            <p className="text-xs text-slate-600 font-normal mt-1">{line2}</p>
            <p className="text-xs text-slate-400 font-normal">{line3}</p>
          </div>
        </Html>
      )}

      {/* Always-visible Name Tag */}
      <Html position={[0, -1.8, 0]} center zIndexRange={[5, 0]}>
        <div
          className={`pointer-events-none select-none whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            isSelected
              ? 'bg-cyan-100 text-cyan-700 border-cyan-300 shadow-md scale-105'
              : 'bg-white/80 text-slate-700 border-slate-200 shadow-sm'
          }`}
        >
          {title}
        </div>
      </Html>
    </group>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function ProductModels({ selected, onSelect }: ProductModelsProps) {
  return (
    <>
      {BRANDS.map((brand) => (
        <ModelShell key={brand.id} {...brand} selected={selected} onSelect={onSelect}>
          {brand.id === 'cadivi'    && <CadviShape />}
          {brand.id === 'binhminh' && <BinhMinhShape />}
          {brand.id === 'schneider' && <SchneiderShape />}
        </ModelShell>
      ))}
    </>
  );
}
