import * as THREE from 'three';

export type ProductModelKey = 'cable' | 'cb' | 'meter';

export interface LayerUserData {
  title?: string;
  sub?: string;
  detail?: string;
  fade?: number;
  baseO?: number;
  [key: string]: any;
}

export type XRayMesh = THREE.Mesh & {
  _bp?: [number, number, number];
  _ex?: [number, number, number];
};

export interface ModelBuildResult {
  group: THREE.Group;
  layers: XRayMesh[];
  camDist: number;
  setXray: (progress: number) => void;
}

export interface LabelSpec {
  t: string; // Title
  s: string; // Subtitle
  at: number; // Threshold (0..1)
  mesh: number; // Layer index
  p: [number, number, number]; // Offset position
}

export interface BannerProductConfig {
  key: ProductModelKey;
  productId: string;
  tabLabel: string;
  defaultName: string;
  defaultCode: string;
  defaultPrice: string;
  build: () => ModelBuildResult;
}

export interface ProjectedLabel {
  el: HTMLDivElement;
  mesh: XRayMesh;
  p: [number, number, number];
  at: number;
}
