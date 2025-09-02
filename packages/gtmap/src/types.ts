import type { LngLat } from '../src/mapgl';

export type ViewState = {
  center: LngLat;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  wrapX: boolean;
};

export type TileTask = { key: string; url: string; z: number; x: number; y: number; priority: number };

export interface TileDeps {
  hasTile(key: string): boolean;
  isPending(key: string): boolean;
  urlFor(z: number, x: number, y: number): string;
  hasCapacity(): boolean;
  now(): number;
  getInteractionIdleMs(): number;
  getLastInteractAt(): number;
  getZoom(): number;
  getCenter(): LngLat;
  startImageLoad(task: { key: string; url: string }): void;
  addPinned(key: string): void;
}


export interface InputDeps {
  getContainer(): HTMLElement;
  getCanvas(): HTMLCanvasElement;
  getMaxZoom(): number;
  getView(): ViewState;
  setCenter(lng: number, lat: number): void;
  clampCenterWorld(centerWorld: { x: number; y: number }, zInt: number, scale: number, widthCSS: number, heightCSS: number): { x: number; y: number };
  updatePointerAbs(x: number, y: number): void;
  emit(name: string, payload: any): void;
  setLastInteractAt(t: number): void;
  getAnchorMode(): 'pointer' | 'center';
  startEase(dz: number, px: number, py: number, anchor: 'pointer' | 'center'): void;
  cancelZoomAnim(): void;
  applyAnchoredZoom(targetZoom: number, px: number, py: number, anchor: 'pointer' | 'center'): void;
}
