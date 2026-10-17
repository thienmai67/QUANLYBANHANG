'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { init3DScene, project3DToScreen, SceneContext } from './xray/scene';
import { buildCable, buildCB, buildMeter, EXPLODE, LABELS } from './xray/models';
import { BannerProductConfig, ModelBuildResult, ProjectedLabel } from './xray/types';

const BANNER_PRODUCTS: BannerProductConfig[] = [
  {
    key: 'cable',
    productId: '52b7957a-8a01-4b4a-b491-245495d8547a',
    tabLabel: '🔌 Dây điện',
    defaultName: 'Dây điện Cadivi CV 2.5mm²',
    defaultCode: 'Mã CV-2.5 · 450/750V · TCVN 6610-3',
    defaultPrice: '16.330 ₫/m',
    build: buildCable,
  },
  {
    key: 'cb',
    productId: '306187f4-2aae-4f13-ad48-2001f7b7eb6d',
    tabLabel: '🔲 Aptomat',
    defaultName: 'Aptomat Schneider Easy9 1P 16A',
    defaultCode: 'Mã EZ9F34116 · 4.5kA · IEC 60898-1',
    defaultPrice: '185.000 ₫',
    build: buildCB,
  },
  {
    key: 'meter',
    productId: '79fea879-9e20-4cd2-9afb-a70be5ce0347',
    tabLabel: '💧 Đồng hồ nước',
    defaultName: 'Đồng hồ nước Zenner DN20',
    defaultCode: 'Mã ZN-DN20 · Cấp B · Ren 3/4"',
    defaultPrice: '450.000 ₫',
    build: buildMeter,
  },
];

export default function Banner3DXray() {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelsContainerRef = useRef<HTMLDivElement>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const [productData, setProductData] = useState<
    Record<string, { name: string; code: string; price: string }>
  >({});
  const [selectedDetail, setSelectedDetail] = useState<{
    title: string;
    sub?: string;
    detail?: string;
  } | null>(null);
  const [webGLError, setWebGLError] = useState(false);

  // References for Three.js instance and model state
  const sceneRef = useRef<SceneContext | null>(null);
  const currentModelRef = useRef<ModelBuildResult | null>(null);
  const projectedLabelsRef = useRef<ProjectedLabel[]>([]);
  const progressRef = useRef(0);
  progressRef.current = progress;

  const isVisibleRef = useRef(true);
  const animFrameRef = useRef<number | null>(null);

  // 1. Fetch real API data for 3 products
  useEffect(() => {
    BANNER_PRODUCTS.forEach(async (p) => {
      try {
        const res = await fetch(`/api/v1/products/${p.productId}`);
        if (!res.ok) return;
        const data = await res.json();
        const basePrice = data.basePrice ?? data.price ?? 0;
        const formattedPrice =
          typeof basePrice === 'number'
            ? `${basePrice.toLocaleString('vi-VN')} ₫`
            : p.defaultPrice;

        const specsText =
          data.sku && data.specifications?.description
            ? `Mã ${data.sku} · ${data.specifications.description.slice(0, 32)}...`
            : p.defaultCode;

        setProductData((prev) => ({
          ...prev,
          [p.productId]: {
            name: data.name || p.defaultName,
            code: specsText,
            price: formattedPrice,
          },
        }));
      } catch {
        // Fallback already in place
      }
    });
  }, []);

  // 2. Setup Explode logic
  const applyExplode = useCallback((s: number) => {
    const model = currentModelRef.current;
    const sceneCtx = sceneRef.current;
    if (!model || !sceneCtx) return;

    model.setXray(s);

    // Position each mesh based on its stored base position & offset
    for (let k = 0; k < model.layers.length; k++) {
      const m = model.layers[k];
      const bp = m._bp;
      const ex = m._ex;
      if (bp && ex) {
        m.position.set(bp[0] + ex[0] * s, bp[1] + ex[1] * s, bp[2] + ex[2] * s);
      }
    }

    // Camera framing adjustments
    const container = containerRef.current;
    const isNarrow = (container?.clientWidth || window.innerWidth) < 700;
    const zf = isNarrow ? 1.0 : 0.6;
    const targetDist = model.camDist * (1 + s * zf);
    const dir = sceneCtx.camera.position.clone().sub(sceneCtx.controls.target).normalize();
    sceneCtx.camera.position.copy(sceneCtx.controls.target).addScaledVector(dir, targetDist);
  }, []);

  // 3. Setup labels for current product
  const setupLabelsForProduct = useCallback((key: string, model: ModelBuildResult) => {
    const box = labelsContainerRef.current;
    if (!box) return;
    box.innerHTML = '';
    projectedLabelsRef.current = [];

    const specs = LABELS[key] || [];
    specs.forEach((sp) => {
      const mesh = model.layers[sp.mesh];
      if (!mesh) return;

      const el = document.createElement('div');
      el.className = 'xray-label';
      el.innerHTML = `<div class="lt">${sp.t}</div><div class="ls">${sp.s}</div>`;

      el.onclick = () => {
        setSelectedDetail({
          title: mesh.userData.title,
          sub: mesh.userData.sub,
          detail: mesh.userData.detail,
        });

        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && mat.emissive) {
          const original = mat.emissive.getHex();
          mat.emissive.setHex(0xe8a33d);
          setTimeout(() => {
            mat.emissive.setHex(original);
          }, 450);
        }
      };

      box.appendChild(el);
      projectedLabelsRef.current.push({
        el,
        mesh,
        p: sp.p,
        at: sp.at,
      });
    });

    const exList = EXPLODE[key] || [];
    model.layers.forEach((m, idx) => {
      m._bp = [m.position.x, m.position.y, m.position.z];
      m._ex = exList[idx] || [0, 0, 0];
    });
  }, []);

  // 4. Update 3D projected label screen coordinates on animation frame
  const updateLabelPositions = useCallback(() => {
    const sceneCtx = sceneRef.current;
    const container = containerRef.current;
    if (!sceneCtx || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const curP = progressRef.current;

    for (let k = 0; k < projectedLabelsRef.current.length; k++) {
      const item = projectedLabelsRef.current[k];
      const pos = project3DToScreen(
        item.mesh,
        item.p[0],
        item.p[1],
        item.p[2],
        sceneCtx.camera,
        width,
        height
      );

      if (!pos) {
        item.el.classList.remove('on');
        continue;
      }

      item.el.style.left = `${pos.x}px`;
      item.el.style.top = `${pos.y}px`;

      if (curP >= item.at - 0.001) {
        item.el.classList.add('on');
      } else {
        item.el.classList.remove('on');
      }
    }
  }, []);

  // 5. Change product model
  const switchProduct = useCallback(
    (index: number) => {
      const sceneCtx = sceneRef.current;
      if (!sceneCtx) return;

      const normalizedIdx = (index + BANNER_PRODUCTS.length) % BANNER_PRODUCTS.length;
      setCurrentIndex(normalizedIdx);
      setProgress(0);
      setIsExploding(false);
      setSelectedDetail(null);

      // Remove previous model group
      if (currentModelRef.current) {
        sceneCtx.scene.remove(currentModelRef.current.group);
      }

      // Build new model
      const prodConfig = BANNER_PRODUCTS[normalizedIdx];
      const newModel = prodConfig.build();
      currentModelRef.current = newModel;

      setupLabelsForProduct(prodConfig.key, newModel);

      newModel.group.rotation.y = -0.5;
      newModel.group.scale.setScalar(0.85);
      sceneCtx.scene.add(newModel.group);

      // Pop-in scale animation (0.85 -> 1.0)
      const startTime = performance.now();
      const animateScale = (now: number) => {
        const factor = Math.min(1, (now - startTime) / 450);
        const ease = 1 - Math.pow(1 - factor, 3);
        newModel.group.scale.setScalar(0.85 + 0.15 * ease);
        if (factor < 1) requestAnimationFrame(animateScale);
      };
      requestAnimationFrame(animateScale);

      // Frame camera
      const dir = sceneCtx.camera.position.clone().sub(sceneCtx.controls.target).normalize();
      sceneCtx.camera.position.copy(sceneCtx.controls.target).addScaledVector(dir, newModel.camDist);

      applyExplode(0);
    },
    [applyExplode, setupLabelsForProduct]
  );

  // 6. Smooth button toggle for X-ray explode
  const toggleXray = () => {
    const startP = progressRef.current;
    const targetP = startP > 0.02 ? 0 : 1;
    const startTime = performance.now();

    setIsExploding(true);
    const animateExplode = (now: number) => {
      const factor = Math.min(1, (now - startTime) / 650);
      const ease = 1 - Math.pow(1 - factor, 3);
      const val = startP + (targetP - startP) * ease;
      setProgress(val);
      applyExplode(val);

      if (factor < 1) {
        requestAnimationFrame(animateExplode);
      } else {
        setIsExploding(false);
      }
    };
    requestAnimationFrame(animateExplode);
  };

  // 7. Initialize Three.js scene on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let sceneCtx: SceneContext;
    try {
      sceneCtx = init3DScene(container);
      sceneRef.current = sceneCtx;
    } catch (err) {
      console.warn('WebGL init failed, displaying fallback:', err);
      setWebGLError(true);
      return;
    }

    switchProduct(0);

    // Animation Loop
    const renderLoop = () => {
      animFrameRef.current = requestAnimationFrame(renderLoop);
      if (isVisibleRef.current) {
        sceneCtx.controls.update();
        sceneCtx.renderer.render(sceneCtx.scene, sceneCtx.camera);
        updateLabelPositions();
      }
    };
    renderLoop();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      sceneCtx.resize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Raycast click detection (< 6px movement)
    let downX = 0;
    let downY = 0;
    const handlePointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6 || !currentModelRef.current) {
        return;
      }
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, sceneCtx.camera);

      const visibleLayers = currentModelRef.current.layers.filter(
        (m) => (m.material as THREE.MeshStandardMaterial).opacity > 0.25
      );
      const hits = raycaster.intersectObjects(visibleLayers, false);

      if (hits.length > 0) {
        const hitObj = hits[0].object as THREE.Mesh;
        const u = hitObj.userData;
        setSelectedDetail({
          title: u.title,
          sub: u.sub,
          detail: u.detail,
        });

        const mat = hitObj.material as THREE.MeshStandardMaterial;
        if (mat && mat.emissive) {
          const original = mat.emissive.getHex();
          mat.emissive.setHex(0xe8a33d);
          setTimeout(() => mat.emissive.setHex(original), 450);
        }
      }
    };

    const domElement = sceneCtx.renderer.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointerup', handlePointerUp);

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') switchProduct(currentIndex - 1);
      if (e.key === 'ArrowRight') switchProduct(currentIndex + 1);
    };
    window.addEventListener('keydown', handleKeyDown);

    // Visibility & Intersection Observers
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const observer = new IntersectionObserver((entries) => {
      isVisibleRef.current = entries[0].isIntersecting;
    });
    observer.observe(container);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();

      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointerup', handlePointerUp);

      sceneCtx.destroy();
      sceneRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeConfig = BANNER_PRODUCTS[currentIndex];
  const activeProduct = productData[activeConfig.productId] || {
    name: activeConfig.defaultName,
    code: activeConfig.defaultCode,
    price: activeConfig.defaultPrice,
  };

  return (
    <section className="relative w-full h-[580px] sm:h-[620px] rounded-3xl overflow-hidden shadow-2xl border border-[#35322b] select-none bg-[radial-gradient(1200px_700px_at_50%_30%,#23211b_0%,#141311_60%,#0e0d0b_100%)] text-[#ede8dc]">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Fallback when WebGL is unavailable */}
      {webGLError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
          <div className="text-4xl mb-3">⚡</div>
          <div className="text-sm font-bold text-[#e8a33d] uppercase tracking-wider mb-1">
            Chế độ hiển thị tĩnh (WebGL không khả dụng)
          </div>
          <div className="text-xs text-[#9a958a] max-w-sm">
            Trình duyệt của bạn đang tắt tăng tốc phần cứng WebGL. Quý khách vẫn có thể xem thông tin sản phẩm và đặt hàng đầy đủ bên dưới.
          </div>
        </div>
      )}

      {/* 3D Projected Labels Overlay */}
      <div ref={labelsContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-20" />

      {/* Top Bar: Brand, Category Tabs, Counter */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-30">
        {/* Brand Badge */}
        <div className="flex flex-col">
          <span className="text-[11px] sm:text-xs font-bold tracking-[3px] text-[#e8a33d] uppercase">
            TDT M&amp;E
          </span>
          <h2 className="text-base sm:text-xl font-extrabold uppercase tracking-tight text-white">
            Banner <span className="text-[#e8a33d]">3D X-Ray</span>
          </h2>
        </div>

        {/* Product Category Tabs */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 bg-[#1d1b17]/80 border border-[#35322b] rounded-2xl p-1.5 backdrop-blur-md shadow-xl">
          {BANNER_PRODUCTS.map((prod, idx) => (
            <button
              key={prod.key}
              onClick={() => switchProduct(idx)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 ${
                idx === currentIndex
                  ? 'border-2 border-[#e8a33d] text-[#e8a33d] bg-[#e8a33d]/10 shadow-sm'
                  : 'text-[#9a958a] hover:text-[#ede8dc] border-2 border-transparent'
              }`}
            >
              {prod.tabLabel}
            </button>
          ))}
        </div>

        {/* Product Counter */}
        <div className="hidden sm:block text-xs font-mono font-bold text-[#9a958a] bg-[#1d1b17]/80 border border-[#35322b] px-3 py-1.5 rounded-xl backdrop-blur-sm">
          <span className="text-[#e8a33d] text-sm">0{currentIndex + 1}</span> / 03
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => switchProduct(currentIndex - 1)}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1d1b17]/80 border border-[#35322b] text-[#ede8dc] hover:text-[#e8a33d] hover:border-[#e8a33d] flex items-center justify-center text-xl font-black backdrop-blur-md transition-all shadow-lg z-30"
        aria-label="Sản phẩm trước"
      >
        ‹
      </button>

      <button
        onClick={() => switchProduct(currentIndex + 1)}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1d1b17]/80 border border-[#35322b] text-[#ede8dc] hover:text-[#e8a33d] hover:border-[#e8a33d] flex items-center justify-center text-xl font-black backdrop-blur-md transition-all shadow-lg z-30"
        aria-label="Sản phẩm tiếp theo"
      >
        ›
      </button>

      {/* Left Info Card (Real Data + CTA link) */}
      <div className="absolute left-4 sm:left-8 bottom-24 sm:bottom-28 max-w-[280px] sm:max-w-[320px] bg-[#1d1b17]/85 border border-[#35322b] rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-2xl z-30 space-y-2">
        <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug line-clamp-2">
          {activeProduct.name}
        </h3>
        <p className="text-[11px] sm:text-xs text-[#9a958a] font-mono leading-tight">
          {activeProduct.code}
        </p>
        <div className="text-lg sm:text-xl font-black text-[#e8a33d] font-mono pt-1">
          {activeProduct.price}
        </div>
        <Link
          href={`/product/${activeConfig.productId}`}
          className="inline-flex items-center justify-center w-full mt-2 py-2.5 px-4 rounded-xl bg-[#e8a33d] hover:bg-[#f0b355] active:scale-[0.98] text-[#141311] font-black text-xs sm:text-sm tracking-wide shadow-md transition-all"
        >
          Xem chi tiết →
        </Link>
      </div>

      {/* Center Bottom: X-ray Slider & Action Button */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 min-w-[290px] sm:min-w-[350px] bg-[#1d1b17]/85 border border-[#35322b] rounded-2xl p-3 sm:p-3.5 backdrop-blur-md shadow-2xl flex flex-col items-center gap-2.5 z-30">
        <div className="flex items-center gap-3 w-full">
          <label htmlFor="xray-slider" className="text-xs sm:text-sm text-[#9a958a] font-bold whitespace-nowrap">
            🔬 X-ray
          </label>
          <input
            id="xray-slider"
            type="range"
            min="0"
            max="100"
            value={Math.round(progress * 100)}
            onChange={(e) => {
              const val = Number(e.target.value) / 100;
              setProgress(val);
              applyExplode(val);
            }}
            className="flex-1 accent-[#e8a33d] cursor-pointer h-1.5 bg-[#35322b] rounded-lg"
          />
          <span className="text-xs sm:text-sm font-black font-mono text-[#e8a33d] min-w-[42px] text-right">
            {Math.round(progress * 100)}%
          </span>
        </div>

        <button
          onClick={toggleXray}
          disabled={isExploding}
          className={`py-1.5 px-6 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 active:scale-95 ${
            progress > 0.02
              ? 'bg-[#e8a33d] text-[#141311] shadow-md shadow-[#e8a33d]/20'
              : 'bg-[#35322b] text-[#9a958a] hover:text-[#ede8dc]'
          }`}
        >
          {progress > 0.02 ? 'Gộp lại' : 'Bóc tách X-ray'}
        </button>
      </div>

      {/* Right Side: Detail Card */}
      <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 w-[280px] bg-[#1d1b17]/90 border border-[#35322b] rounded-2xl p-5 backdrop-blur-md shadow-2xl z-30 transition-all duration-300">
        {selectedDetail ? (
          <div className="space-y-2">
            <h4 className="text-sm font-black text-[#e8a33d] flex items-center gap-2">
              <span>📌</span> {selectedDetail.title}
            </h4>
            {selectedDetail.sub && (
              <div className="text-[11px] font-mono font-semibold text-[#9a958a] pb-1 border-b border-[#35322b]">
                {selectedDetail.sub}
              </div>
            )}
            <p className="text-xs text-[#ede8dc]/90 leading-relaxed pt-1">
              {selectedDetail.detail}
            </p>
          </div>
        ) : (
          <div className="text-xs text-[#9a958a] leading-relaxed">
            <div className="font-bold text-[#ede8dc] mb-1">🖱️ Kéo để xoay · Cuộn để zoom</div>
            Bấm vào từng lớp của sản phẩm hoặc các chấm nhãn 3D để xem chi tiết kỹ thuật.
          </div>
        )}
      </div>

      {/* Floating Interaction Hint */}
      <div className="hidden sm:block absolute right-8 bottom-6 text-[10px] text-[#9a958a]/60 text-right font-mono pointer-events-none">
        Kéo để xoay 360°<br />Cuộn để phóng to
      </div>

      {/* Embedded CSS for 3D tracking labels */}
      <style jsx global>{`
        .xray-label {
          position: absolute;
          transform: translate(-50%, -50%) scale(0.65);
          opacity: 0;
          pointer-events: none;
          transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
          background: rgba(20, 19, 17, 0.92);
          border: 1px solid #e8a33d;
          border-radius: 9px;
          padding: 5px 9px;
          white-space: nowrap;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
          z-index: 25;
        }
        .xray-label.on {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
          pointer-events: auto;
        }
        .xray-label:hover {
          border-color: #ffd074;
          background: rgba(43, 40, 32, 0.95);
        }
        .xray-label .lt {
          font-size: 11px;
          font-weight: 800;
          color: #ede8dc;
          line-height: 1.2;
        }
        .xray-label .ls {
          font-size: 9px;
          color: #e8a33d;
          margin-top: 1px;
          line-height: 1.2;
        }
      `}</style>
    </section>
  );
}
