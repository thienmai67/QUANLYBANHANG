"use client";

import React, { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Text, Html, Float } from "@react-three/drei";
import { Group } from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ProductModels } from "./ProductModels";

gsap.registerPlugin(ScrollTrigger);

// Floating Particles
const Particles = () => {
  const ref = useRef<Group>(new Group());
  const { viewport } = useThree();
  React.useEffect(() => {
    for (let i = 0; i < 30; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshBasicMaterial({ color: "#2563EB", transparent: true, opacity: 0.4 })
      );
      particle.position.set(
        (Math.random() - 0.5) * viewport.width * 2,
        (Math.random() - 0.5) * viewport.height * 2,
        (Math.random() - 0.5) * 10
      );
      ref.current.add(particle);
    }
  }, [viewport]);

  useFrame((state) => {
    ref.current.children.forEach((p, i) => {
      p.position.y += Math.sin(state.clock.elapsedTime + i) * 0.002;
    });
  });
  return <group ref={ref} />;
};

// Orbiting Pipes Group
const OrbitingPipes = () => {
  const groupRef = useRef<Group>(new Group());
  const pipeData = [
    { color: "#06B6D4", position: [3, 0, 0] as [number, number, number] },
    { color: "#38BDF8", position: [-3, 0, 0] as [number, number, number] },
    { color: "#7DD3FC", position: [0, 3, 0] as [number, number, number] },
    { color: "#0EA5E9", position: [0, -3, 0] as [number, number, number] },
  ];

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
      groupRef.current.rotation.x += 0.001;
      groupRef.current.children.forEach((child, i) => {
        child.rotation.y = state.clock.elapsedTime * (0.5 + i * 0.2);
      });
    }
  });

  return (
    <group ref={groupRef}>
      {pipeData.map((p, i) => (
        <Float key={i} speed={1 + i * 0.5} rotation-intensity={0.5} float-intensity={0.2}>
          <mesh position={p.position}>
            <cylinderGeometry args={[0.25, 0.25, 2.5, 16]} />
            <meshStandardMaterial color={p.color} metalness={0.7} roughness={0.2} />
          </mesh>
        </Float>
      ))}
    </group>
  );
};

// LED Strip with Interactive Control
const LEDStrip = ({ selectedColor = "#FFFFFF" }) => {
  const stripRef = useRef<Group>(new Group());
  const [ledCount] = useState(16);

  useFrame((state) => {
    if (stripRef.current) {
      stripRef.current.children.forEach((child, i) => {
        const intensity = Math.abs(Math.sin(state.clock.elapsedTime + i * 0.2)) * 0.5 + 0.5;
        (child.material as THREE.MeshStandardMaterial).emissive.setHSL(
          0.6 + Math.sin(i) * 0.1,
          0.9,
          intensity
        );
        (child.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
      });
    }
  });

  return (
    <group ref={stripRef} position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
      {Array.from({ length: ledCount }).map((_, i) => (
        <mesh key={i} position={[(i - ledCount / 2) * 0.3, 0, 0]}>
          <boxGeometry args={[0.2, 0.1, 0.5]} />
          <meshStandardMaterial
            color={selectedColor}
            emissive={selectedColor}
            emissiveIntensity={0.6}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
};

// Main Scene Component
export const Scene = ({ activeProduct, onProductSelect }: any) => {
  const { viewport } = useThree();
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow color="#FFFFFF" />
      <directionalLight position={[-10, -10, -5]} intensity={0.6} color="#2563EB" />
      <pointLight position={[0, 0, 8]} intensity={0.8} color="#06B6D4" />

      {/* Background Grid */}
      <gridHelper args={[20, 20, "#0F1E3D", "#0F1E3D", 1, 1]} position={[0, -3, 0]} />

      {/* Particles */}
      <Particles />

      {/* Orbiting Pipes */}
      <OrbitingPipes />

      {/* LED Strip */}
      <LEDStrip selectedColor={activeProduct === "led" ? "#fbbf24" : "#FFFFFF"} />

      {/* Product Models */}
      <Suspense fallback={null}>
        <ProductModels activeProduct={activeProduct} onProductSelect={onProductSelect} />
      </Suspense>

      {/* Floating Text Overlay */}
      <Text
        position={[-viewport.width / 2 + 1, viewport.height / 2 - 1, 0]}
        fontSize={0.35}
        position-z={-2}
        color="#FFFFFF"
        anchorX="left"
        anchorY="top"
      >
        {"The future of M&E Supply"}
      </Text>

      {/* Orbit Controls (subtle, locked mostly) */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
        enableDamping
        dampingFactor={0.1}
      />
    </>
  );
};
