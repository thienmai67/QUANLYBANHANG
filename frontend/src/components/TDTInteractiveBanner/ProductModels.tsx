"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Float, Html } from "@react-three/drei";
import { Group } from "three";

// Cadivi Cable Coil Model
const CadviCableCoil = ({ active = false }: { active?: boolean }) => {
  const groupRef = useRef<Group>(new Group());
  const coilRef = useRef<THREE.Mesh>(new THREE.Mesh());

  useFrame((state) => {
    if (groupRef.current && coilRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      coilRef.current.rotation.z = state.clock.elapsedTime * 1.5 + (active ? 2 : 0);
    }
  });

  // Coiled cable using torus geometry
  return (
    <group ref={groupRef} position={[-4, -1, 0]}>
      <mesh ref={coilRef} position={[0, 0, 0]}>
        <torusGeometry args={[1.2, 0.35, 12, 60, Math.PI * 2]} />
        <meshStandardMaterial color={active ? "#FCD34D" : "#1e3a8a"} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Cable end wire */}
      <mesh position={[1.2, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
        <meshStandardMaterial color="#FEF3C7" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[-1.2, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
        <meshStandardMaterial color="#FEF3C7" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
};

// Bình Minh Pipe Model (orbiting)
const BinhMinhPipes = () => {
  const groupRef = useRef<Group>(new Group());

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      groupRef.current.children.forEach((child, i) => {
        child.rotation.y = state.clock.elapsedTime * (1 + i * 0.5);
      });
    }
  });

  const pipes = [
    { color: "#06B6D4", length: 3, pos: [0, 0, 0] as [number, number, number] },
    { color: "#38BDF8", length: 2.5, pos: [0, 0.5, 2] as [number, number, number] },
    { color: "#7DD3FC", length: 2, pos: [0, -0.5, -2] as [number, number, number] },
    { color: "#0EA5E9", length: 2.8, pos: [0, 1, -1] as [number, number, number] },
  ];

  return (
    <group ref={groupRef} position={[4, 0, 0]}>
      {pipes.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <cylinderGeometry args={[0.3, 0.3, p.length, 16]} />
          <meshStandardMaterial color={p.color} metalness={0.7} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
};

// Schneider/Panasonic Panel Model
const SchneiderPanel = ({ active = false }: { active?: boolean }) => {
  const groupRef = useRef<Group>(new Group());

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, -3]}>
      {/* Panel housing */}
      <mesh>
        <boxGeometry args={[3, 2, 0.5]} />
        <meshStandardMaterial color={active ? "#38BDF8" : "#1e293b"} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Door handle */}
      <mesh position={[1.2, 0.5, 0.35]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.6, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} />
      </mesh>
      {/* LED indicators */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.8 + i * 0.6, 0.6, 0.31]}>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 8]} />
          <meshStandardMaterial
            color={i === (active ? 1 : 0) ? "#10B981" : "#1e293b"}
            emissive={i === (active ? 1 : 0) ? "#10B981" : "#000000"}
            emissiveIntensity={i === (active ? 1 : 0) ? 1 : 0}
          />
        </mesh>
      ))}
      {/* Label */}
      <mesh position={[0, -0.6, 0.31]}>
        <planeGeometry args={[1.5, 0.3]} />
        <meshBasicMaterial color="#0F1E3D" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

// Minh Hòa Valve Model
const MinhHoaValve = ({ active = false }: { active?: boolean }) => {
  const groupRef = useRef<Group>(new Group());
  const wheelRef = useRef<THREE.Mesh>(new THREE.Mesh());

  useFrame((state) => {
    if (groupRef.current && wheelRef.current) {
      wheelRef.current.rotation.z = state.clock.elapsedTime * (active ? 2 : 0.5);
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 1, -4]}>
      {/* Valve body */}
      <mesh>
        <cylinderGeometry args={[0.5, 0.6, 1.2, 16]} />
        <meshStandardMaterial color="#B45309" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Valve wheel */}
      <mesh ref={wheelRef} position={[0, 0.8, 0]}>
        <torusGeometry args={[0.4, 0.1, 8, 16]} />
        <meshStandardMaterial color={active ? "#FCD34D" : "#92400E"} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Outflow pipe */}
      <mesh position={[0, -0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 1, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
};

// Label Hover Component
const ProductLabel = ({ name, position, active }: any) => {
  return (
    <Html position={position} distanceFactor={10} style={{ pointerEvents: "none" }}>
      <div
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
          active
            ? "bg-blue-500 text-white scale-105 shadow-lg shadow-blue-500/30"
            : "bg-slate-800/80 text-slate-300 backdrop-blur-sm border border-slate-700"
        }`}
      >
        {name}
      </div>
    </Html>
  );
};

export const ProductModels = ({ activeProduct, onProductSelect }: any) => {
  return (
    <>
      <CadviCableCoil active={activeProduct === "cable"} />
      <BinhMinhPipes />
      <SchneiderPanel active={activeProduct === "panel"} />
      <MinhHoaValve active={activeProduct === "valve"} />
    </>
  );
};

export const ProductLabels = ({ activeProduct, onProductSelect }: any) => {
  const labels = [
    { name: "Cáp Cadivi", product: "cable", position: [-4, -1.8, 0] as [number, number, number] },
    { name: "Ống Bình Minh", product: "pipe", position: [4, -1.2, 0] as [number, number, number] },
    { name: "Thiết bị Schneider", product: "panel", position: [0, -2.8, -3] as [number, number, number] },
    { name: "Van Minh Hòa", product: "valve", position: [0, 0.5, -4] as [number, number, number] },
  ];

  return (
    <>
      {labels.map((label) => (
        <ProductLabel
          key={label.product}
          name={label.name}
          position={label.position}
          active={activeProduct === label.product}
        />
      ))}
    </>
  );
};
