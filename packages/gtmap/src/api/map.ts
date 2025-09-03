import Impl from '../mapgl';
import { toLngLat, toLeafletLatLng, type LeafletLatLng } from './util';

type FitBoundsPadding = number | [number, number];
type FitBoundsOptions = { padding?: FitBoundsPadding; paddingTopLeft?: [number, number]; paddingBottomRight?: [number, number]; maxZoom?: number };
type LeafletBoundsArray = [[number, number], [number, number]];
type LeafletBoundsLike = LeafletBoundsArray | { getSouthWest: () => { lat: number; lng: number }; getNorthEast: () => { lat: number; lng: number } };
export type LeafletMapOptions = {
  center?: LeafletLatLng;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  mapSize?: { width: number; height: number };
  // Commonly used Leaflet flags we may accept and map later
  zoomAnimation?: boolean;
  zoomAnimationThreshold?: number;
  fadeAnimation?: boolean;
  markerZoomAnimation?: boolean;
  // GT-specific options supported by the impl
  tileUrl?: string;
  tileSize?: number;
  wrapX?: boolean;
  freePan?: boolean;
};

type Listener = (...args: any[]) => void;

export default class LeafletMapFacade {
  private _map: Impl;
  private _listeners = new Map<string, Set<Listener>>();

  constructor(container: HTMLElement | string, options?: LeafletMapOptions) {
    const el = typeof container === 'string' ? document.getElementById(container)! : (container as HTMLElement);
    const init: any = {};
    if (options?.center) { const c = toLngLat(options.center); init.center = c; }
    if (typeof options?.zoom === 'number') init.zoom = options.zoom;
    if (typeof options?.minZoom === 'number') init.minZoom = options.minZoom;
    if (typeof options?.maxZoom === 'number') init.maxZoom = options.maxZoom;
    if (options?.tileUrl) init.tileUrl = options.tileUrl;
    if (typeof options?.tileSize === 'number') init.tileSize = options.tileSize;
    if (options?.mapSize) init.mapSize = options.mapSize;
    if (typeof options?.wrapX === 'boolean') init.wrapX = options.wrapX;
    if (typeof options?.freePan === 'boolean') init.freePan = options.freePan;
    this._map = new Impl(el as HTMLDivElement, init);
    // Wire core events
    this._map.events.on('move').each((e: any) => this._emit('move', e));
    this._map.events.on('moveend').each((e: any) => this._emit('moveend', e));
    this._map.events.on('zoom').each((e: any) => this._emit('zoom', e));
    this._map.events.on('zoomend').each((e: any) => this._emit('zoomend', e));
  }

  // API
  setView(latlng: LeafletLatLng, zoom?: number, _opts?: { animate?: boolean }): this {
    const p = toLngLat(latlng);
    this._map.setCenter(p.lng, p.lat);
    if (typeof zoom === 'number') this._map.setZoom(zoom);
    return this;
  }
  getCenter(): [number, number] { return toLeafletLatLng(this._map.center.lng, this._map.center.lat); }
  getZoom(): number { return this._map.zoom; }
  getMinZoom(): number { return (this._map as any).minZoom; }
  getMaxZoom(): number { return (this._map as any).maxZoom; }
  get pointerAbs(): { x: number; y: number } | null { return (this._map as any).pointerAbs ?? null; }

  // Common convenience methods (bridge to impl)
  panTo(latlng: LeafletLatLng, _opts?: any): this { const p = toLngLat(latlng); this._map.setCenter(p.lng, p.lat); return this; }
  flyTo(latlng: LeafletLatLng, zoom?: number, _opts?: any): this { const p = toLngLat(latlng); this._map.setCenter(p.lng, p.lat); if (typeof zoom === 'number') this._map.setZoom(zoom); return this; }
  fitBounds(bounds: LeafletBoundsLike, opts?: FitBoundsOptions): this {
    const sw = Array.isArray(bounds) ? { lat: bounds[0][0], lng: bounds[0][1] } : toLngLat(bounds.getSouthWest());
    const ne = Array.isArray(bounds) ? { lat: bounds[1][0], lng: bounds[1][1] } : toLngLat(bounds.getNorthEast());
    const el = (this._map as any).container as HTMLDivElement;
    const w = Math.max(1, el.clientWidth || el.getBoundingClientRect().width || 1);
    const h = Math.max(1, el.clientHeight || el.getBoundingClientRect().height || 1);
    const padTL = opts?.paddingTopLeft || (typeof opts?.padding === 'number' ? [opts.padding, opts.padding] : (opts?.padding as any)) || [0, 0];
    const padBR = opts?.paddingBottomRight || (typeof opts?.padding === 'number' ? [opts.padding, opts.padding] : (opts?.padding as any)) || [0, 0];
    const availW = Math.max(1, w - (padTL[0] + padBR[0]));
    const availH = Math.max(1, h - (padTL[1] + padBR[1]));
    const spanX = Math.abs(ne.lng - sw.lng);
    const spanY = Math.abs(ne.lat - sw.lat);
    const zMax = (this._map as any).maxZoom as number;
    const scale = Math.min(availW / Math.max(1, spanX), availH / Math.max(1, spanY));
    const z = Math.max((this._map as any).minZoom ?? 0, Math.min(typeof opts?.maxZoom === 'number' ? opts.maxZoom : zMax, zMax + Math.log2(Math.max(1e-6, scale))));
    const cx = (sw.lng + ne.lng) * 0.5;
    const cy = (sw.lat + ne.lat) * 0.5;
    this._map.setCenter(cx, cy);
    this._map.setZoom(z);
    return this;
  }
  getBounds(): LeafletBoundsArray {
    const el = (this._map as any).container as HTMLDivElement;
    const w = Math.max(1, el.clientWidth || el.getBoundingClientRect().width || 1);
    const h = Math.max(1, el.clientHeight || el.getBoundingClientRect().height || 1);
    const z = this._map.zoom;
    const c = this._map.center as { lng: number; lat: number };
    const zMax = (this._map as any).maxZoom as number;
    const scale = Math.pow(2, z - zMax);
    const halfW = w / (2 * scale);
    const halfH = h / (2 * scale);
    const sw = { lat: c.lat + halfH, lng: c.lng - halfW };
    const ne = { lat: c.lat - halfH, lng: c.lng + halfW };
    return [[sw.lat, sw.lng], [ne.lat, ne.lng]];
  }

  zoomIn(delta?: number): this { const d = typeof delta === 'number' ? delta : 1; this._map.setZoom(this._map.zoom + d); return this; }
  zoomOut(delta?: number): this { const d = typeof delta === 'number' ? delta : 1; this._map.setZoom(this._map.zoom - d); return this; }
  panBy(offset: { x: number; y: number } | [number, number], _opts?: any): this {
    const el = (this._map as any).container as HTMLDivElement;
    const rect = el.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    void w; void h;
    const z = this._map.zoom;
    const baseZ = Math.floor(z);
    const scale = Math.pow(2, z - baseZ);
    const dx = Array.isArray(offset) ? offset[0] : offset.x;
    const dy = Array.isArray(offset) ? offset[1] : offset.y;
    const zMax = (this._map as any).maxZoom as number;
    const s = Math.pow(2, zMax - baseZ);
    const c = this._map.center as { lng: number; lat: number };
    const cw = { x: c.lng / s, y: c.lat / s };
    const nx = cw.x + dx / scale;
    const ny = cw.y + dy / scale;
    const px = nx * s;
    const py = ny * s;
    this._map.setCenter(px, py);
    return this;
  }
  stop(): this { /* no animation queue to stop yet */ return this; }
  invalidateSize(_options?: any): this { (this._map as any).resize?.(); return this; }
  getSize(): { x: number; y: number } {
    const el = (this._map as any).container as HTMLDivElement;
    const r = el.getBoundingClientRect();
    return { x: Math.max(1, r.width), y: Math.max(1, r.height) };
  }
  getPixelBounds(): { min: { x: number; y: number }; max: { x: number; y: number } } {
    const s = this.getSize();
    return { min: { x: 0, y: 0 }, max: { x: s.x, y: s.y } };
    }
  getPixelOrigin(): { x: number; y: number } { return { x: 0, y: 0 }; }

  // Native marker helpers (GT extensions for performance/testing)
  async setIconDefs(defs: Record<string, { iconPath: string; x2IconPath?: string; width: number; height: number }>): Promise<void> {
    await (this._map as any).setIconDefs(defs);
  }
  setMarkers(markers: Array<{ lng: number; lat: number; type: string; size?: number }>): this {
    (this._map as any).setMarkers(markers);
    return this;
  }
  remove() { this._listeners.clear(); (this._map as any).destroy?.(); return this; }

  // Demo helpers passthrough (temporary until full options/events plumbed)
  recenter() { (this._map as any).recenter?.(); return this; }
  setWheelSpeed(v: number) { (this._map as any).setWheelSpeed?.(v); return this; }
  setWheelCtrlSpeed(v: number) { (this._map as any).setWheelCtrlSpeed?.(v); return this; }
  setAnchorMode(m: 'pointer' | 'center') { (this._map as any).setAnchorMode?.(m); return this; }
  setGridVisible(on: boolean) { (this._map as any).setGridVisible?.(on); return this; }

  on(name: string, fn: Listener): this { if (!this._listeners.has(name)) this._listeners.set(name, new Set()); this._listeners.get(name)!.add(fn); return this; }
  off(name: string, fn?: Listener): this {
    if (!fn) { this._listeners.delete(name); return this; }
    const s = this._listeners.get(name); if (s) s.delete(fn);
    return this;
  }
  private _emit(name: string, payload?: any): void {
    const s = this._listeners.get(name); if (!s) return;
    for (const fn of Array.from(s)) { try { fn(payload); } catch {} }
  }

  addLayer(layer: any): this { if (layer?.addTo) layer.addTo(this); return this; }
  removeLayer(layer: any): this { if (layer?.remove) layer.remove(); return this; }

  // Feature facades
  get __impl(): Impl { return this._map; }
}
