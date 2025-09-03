import type { LngLat } from '../src/mapgl';

export type ViewState = {
  center: LngLat;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  wrapX: boolean;
};

export type TileTask = {
  key: string;
  url: string;
  z: number;
  x: number;
  y: number;
  priority: number;
};

export interface TileDeps {
  hasTile(key: string): boolean;
  isPending(key: string): boolean;
  urlFor(z: number, x: number, y: number): string;
  hasCapacity(): boolean;
  now(): number;
  getInteractionIdleMs(): number;
  getLastInteractAt(): number;
  getZoom(): number;
  getMaxZoom(): number;
  getCenter(): LngLat;
  getTileSize(): number;
  startImageLoad(task: { key: string; url: string }): void;
  addPinned(key: string): void;
}

export interface RenderCtx {
  gl: WebGLRenderingContext;
  prog: WebGLProgram;
  loc: any;
  quad: WebGLBuffer;
  canvas: HTMLCanvasElement;
  dpr: number;
  container: HTMLElement;
  zoom: number;
  center: LngLat;
  minZoom: number;
  maxZoom: number;
  wrapX: boolean;
  useScreenCache: boolean;
  screenCache?: any;
  raster: any;
  icons?: any;
  tileCache: any;
  tileSize: number;
  enqueueTile(z: number, x: number, y: number, priority?: number): void;
}

export interface InputDeps {
  getContainer(): HTMLElement;
  getCanvas(): HTMLCanvasElement;
  getMaxZoom(): number;
  getView(): ViewState;
  getTileSize(): number;
  setCenter(lng: number, lat: number): void;
  clampCenterWorld(
    centerWorld: { x: number; y: number },
    zInt: number,
    scale: number,
    widthCSS: number,
    heightCSS: number,
    viscous?: boolean,
  ): { x: number; y: number };
  updatePointerAbs(x: number | null, y: number | null): void;
  emit(name: string, payload: any): void;
  setLastInteractAt(t: number): void;
  getAnchorMode(): 'pointer' | 'center';
  getWheelStep(ctrl: boolean): number;
  startEase(dz: number, px: number, py: number, anchor: 'pointer' | 'center'): void;
  cancelZoomAnim(): void;
  applyAnchoredZoom(targetZoom: number, px: number, py: number, anchor: 'pointer' | 'center'): void;
  // Leaflet-like inertia controls
  getInertia(): boolean;
  getInertiaDecel(): number; // px/s^2
  getInertiaMaxSpeed(): number; // px/s
  getEaseLinearity(): number;
  startPanBy(offsetXPx: number, offsetYPx: number, durationSec: number, ease: number): void;
  cancelPanAnim(): void;
}

export interface ZoomDeps {
  getZoom(): number;
  getMinZoom(): number;
  getMaxZoom(): number;
  getTileSize(): number;
  shouldAnchorCenterForZoom(targetZoom: number): boolean;
  getMap(): any;
  getOutCenterBias(): number;
  clampCenterWorld(
    centerWorld: { x: number; y: number },
    zInt: number,
    scale: number,
    widthCSS: number,
    heightCSS: number,
  ): { x: number; y: number };
  emit(name: string, payload: any): void;
  requestRender(): void;
  now(): number;
}
