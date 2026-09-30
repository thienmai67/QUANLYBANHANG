'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import type { BrandId } from './ProductModels';
import { ProductModels } from './ProductModels';

type SceneProps = {
  selected: BrandId | null;
  onSelect: (id: BrandId | null) => void;
};

// ─── Particles ───────────────────────────────────────────────────────────────

function Particles() {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(50 * 3);
    for (let i = 0; i < 50; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = Math.random() * 5 - 4;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.01;
    }
  });

  return (
    <points ref={pointsRef} raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#94A3B8"
        size={0.06}
        transparent
        opacity={0.25}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ─── Subtle background decorative shapes ──────────────────────────────────────

function BackgroundDeco() {
  const groupRef = useRef<THREE.Group>(null);

  const rings = useMemo(() => [
    { pos: [-4.5, 2.2, -5] as [number, number, number], r: 0.7, color: '#BAE6FD' },
    { pos: [6.0, -1.8, -5] as [number, number, number], r: 0.6, color: '#CFFAFE' },
    { pos: [-2.0, -2.8, -6] as [number, number, number], r: 0.9, color: '#E0F2FE' },
  ], []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {rings.map((ring, i) => (
        <Float key={i} speed={0.4} floatIntensity={0.3} rotationIntensity={0.2}>
          <mesh position={ring.pos}>
            <torusGeometry args={[ring.r, 0.04, 6, 12]} />
            <meshToonMaterial color={ring.color} transparent opacity={0.4} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// ─── Main Scene ──────────────────────────────────────────────────────────────

export function Scene({ selected, onSelect }: SceneProps) {
  return (
    <>
      {/* Clear, stable lighting for light theme */}
      <ambientLight intensity={2.2} color="#FFFFFF" />
      <directionalLight position={[5, 8, 5]} intensity={2.2} color="#FFFFFF" />
      <directionalLight position={[-4, 3, -3]} intensity={0.8} color="#BAE6FD" />
      <directionalLight position={[0, -4, 3]} intensity={0.6} color="#FFFFFF" />
      <pointLight position={[3, 4, 2]} intensity={1.0} color="#0891B2" />

      {/* Background elements */}
      <Particles />
      <BackgroundDeco />

      {/* Product Models in horizontal alignment */}
      <ProductModels selected={selected} onSelect={onSelect} />
    </>
  );
}
