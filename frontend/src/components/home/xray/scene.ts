import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface SceneContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  pmremGenerator: THREE.PMREMGenerator;
  destroy: () => void;
  resize: (width: number, height: number) => void;
}

export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export function init3DScene(container: HTMLElement): SceneContext {
  if (!isWebGLAvailable()) {
    throw new Error('WebGL is not supported or disabled in this browser.');
  }

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || 560;

  // 1. Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  const isMobile = window.innerWidth < 768;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  container.appendChild(renderer.domElement);

  // 2. Scene & Fog & Environment
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x141311, 18, 34);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

  // 3. Camera
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(6.4, 3.4, 8.2);

  // 4. OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.4, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = 4.5;
  controls.maxDistance = 16;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = 1.5;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.1;

  let idleTimer: NodeJS.Timeout | null = null;
  const handleStart = () => {
    controls.autoRotate = false;
    if (idleTimer) clearTimeout(idleTimer);
  };
  const handleEnd = () => {
    idleTimer = setTimeout(() => {
      controls.autoRotate = true;
    }, 2800);
  };
  controls.addEventListener('start', handleStart);
  controls.addEventListener('end', handleEnd);

  // 5. Lighting
  const hemiLight = new THREE.HemisphereLight(0xfff6dd, 0x1a1815, 0.55);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfff2d6, 2.6);
  keyLight.position.set(6, 9, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -8;
  keyLight.shadow.camera.right = 8;
  keyLight.shadow.camera.top = 8;
  keyLight.shadow.camera.bottom = -8;
  keyLight.shadow.bias = -0.0004;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xe8a33d, 0.9);
  rimLight.position.set(-7, 4, -6);
  scene.add(rimLight);

  const fillLight = new THREE.DirectionalLight(0x88a0df, 0.35);
  fillLight.position.set(-4, 2, 7);
  scene.add(fillLight);

  // 6. Platter / Pedestal & Shadow Plane
  const shadowPlane = new THREE.Mesh(
    new THREE.CircleGeometry(14, 64),
    new THREE.ShadowMaterial({ opacity: 0.42 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -1.65;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(4.6, 4.9, 0.22, 72),
    new THREE.MeshStandardMaterial({ color: 0x201d18, roughness: 0.55, metalness: 0.25 })
  );
  pedestal.position.y = -1.76;
  pedestal.receiveShadow = true;
  scene.add(pedestal);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(4.62, 0.035, 12, 120),
    new THREE.MeshBasicMaterial({ color: 0xe8a33d })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -1.64;
  scene.add(ring);

  const resize = (newWidth: number, newHeight: number) => {
    if (!renderer || !camera) return;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
    const mobileNow = newWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobileNow ? 1.5 : 2));
  };

  const destroy = () => {
    if (idleTimer) clearTimeout(idleTimer);
    controls.removeEventListener('start', handleStart);
    controls.removeEventListener('end', handleEnd);
    controls.dispose();

    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });

    pmremGenerator.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer.dispose();
  };

  return {
    renderer,
    scene,
    camera,
    controls,
    pmremGenerator,
    destroy,
    resize,
  };
}

export function project3DToScreen(
  mesh: THREE.Mesh,
  x: number,
  y: number,
  z: number,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number
): { x: number; y: number } | null {
  const e = mesh.matrixWorld.elements;
  const wx = x * e[0] + y * e[4] + z * e[8] + e[12];
  const wy = x * e[1] + y * e[5] + z * e[9] + e[13];
  const wz = x * e[2] + y * e[6] + z * e[10] + e[14];

  const c = camera.matrixWorldInverse.elements;
  const p = camera.projectionMatrix.elements;

  const vx = wx * c[0] + wy * c[4] + wz * c[8] + c[12];
  const vy = wx * c[1] + wy * c[5] + wz * c[9] + c[13];
  const vz = wx * c[2] + wy * c[6] + wz * c[10] + c[14];

  const cw = -vz; // perspective division
  if (cw <= 0) return null;

  const cx = vx * p[0] + vy * p[4] + vz * p[8];
  const cy = vx * p[1] + vy * p[5] + vz * p[9];

  return {
    x: ((cx / cw) * 0.5 + 0.5) * width,
    y: ((-cy / cw) * 0.5 + 0.5) * height,
  };
}
