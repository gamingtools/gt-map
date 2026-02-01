/**
 * VectorManager -- vector layer lifecycle management.
 */
import type { VectorPrimitive } from '../types';
import { VectorLayer } from '../layers/vector-layer';

export interface VectorManagerDeps {
  getContainer(): HTMLDivElement;
  getGL(): WebGLRenderingContext;
  getDpr(): number;
  getZoom(): number;
  getCenter(): { x: number; y: number };
  getImageMaxZoom(): number;
  requestRender(): void;
  debugWarn(msg: string, err?: unknown): void;
}

export class VectorManager {
  private deps: VectorManagerDeps;
  private _vectorLayer: VectorLayer | null = null;
  private _pendingVectors: VectorPrimitive[] | null = null;

  constructor(deps: VectorManagerDeps) {
    this.deps = deps;
  }

  // -- Init --

  init(): void {
    const d = this.deps;
    this._vectorLayer = new VectorLayer({
      getContainer: () => d.getContainer(),
      getGL: () => d.getGL(),
      getDpr: () => d.getDpr(),
      getZoom: () => d.getZoom(),
      getCenter: () => d.getCenter(),
      getImageMaxZoom: () => d.getImageMaxZoom(),
    });
    this._vectorLayer.init();
    if (this._pendingVectors && this._pendingVectors.length) {
      const v = this._pendingVectors.slice();
      this._pendingVectors = null;
      this._vectorLayer.setVectors(v);
    }
  }

  // -- Vectors --

  setVectors(vectors: VectorPrimitive[]): void {
    if (!this._vectorLayer) {
      this._pendingVectors = vectors.slice();
      return;
    }
    this._vectorLayer.setVectors(vectors);
    this.deps.requestRender();
  }

  // -- Render helpers --

  getVectorZIndices(): number[] {
    if (!this._vectorLayer) return [];
    return this._vectorLayer.hasVectors() ? [0] : [];
  }

  drawVectors(): void {
    this._vectorLayer?.draw();
  }

  drawVectorOverlay(): void {
    this._vectorLayer?.drawOverlay();
  }

  resizeVectorLayer(w: number, h: number): void {
    this._vectorLayer?.resize(w, h);
  }

  // -- GL resume --

  rebuild(): void {
    const d = this.deps;
    try {
      const currentVectors = this._vectorLayer?.getVectors() ?? [];
      this._vectorLayer?.dispose();
      this._vectorLayer = new VectorLayer({
        getContainer: () => d.getContainer(),
        getGL: () => d.getGL(),
        getDpr: () => d.getDpr(),
        getZoom: () => d.getZoom(),
        getCenter: () => d.getCenter(),
        getImageMaxZoom: () => d.getImageMaxZoom(),
      });
      this._vectorLayer.init();
      if (currentVectors.length) {
        this._vectorLayer.setVectors(currentVectors);
      }
    } catch (e) {
      d.debugWarn('GL reinit vectors', e);
    }
  }

  // -- Lifecycle --

  dispose(): void {
    this._vectorLayer?.dispose();
    this._vectorLayer = null;
  }
}
