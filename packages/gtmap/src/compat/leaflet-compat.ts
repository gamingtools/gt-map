import { GTMap } from '../api/map';
import type { ApplyResult, Point, VectorStyle, EventMap as GTEventMap, IconHandle } from '../api/types';
import type { Unsubscribe } from '../api/events/public';
import type { Marker as GTMarker } from '../entities/marker';

// Internal access to private helpers for better fidelity (no `any`/`unknown`).
interface FitBoundsHost {
  _fitBounds: (b: { minX: number; minY: number; maxX: number; maxY: number }, p: { top: number; right: number; bottom: number; left: number }) => { center: Point; zoom: number };
}

// Minimal Leaflet-like types for pixel CRS usage
// Leaflet CRS.Simple semantics: lat increases upwards, lng increases to the right.
export type LatLngLike = [lat: number, lng: number] | { lat: number; lng: number };

export type LeafletPadding = number | [number, number] | { top: number; right: number; bottom: number; left: number };

export interface LeafletIconOptions {
  iconUrl: string;
  iconRetinaUrl?: string;
  iconSize: [number, number];
  iconAnchor?: [number, number];
}

function toPoint(ll: LatLngLike): Point {
  const lat = Array.isArray(ll) ? ll[0] : ll.lat;
  const lng = Array.isArray(ll) ? ll[1] : ll.lng;
  // Invert Y to match Leaflet CRS.Simple (lat up -> world y down)
  return { x: lng, y: -lat };
}

function toPadding(p?: LeafletPadding): { top: number; right: number; bottom: number; left: number } {
  if (!p) return { top: 0, right: 0, bottom: 0, left: 0 };
  if (typeof p === 'number') return { top: p, right: p, bottom: p, left: p };
  if (Array.isArray(p)) return { top: p[0], right: p[1], bottom: p[0], left: p[1] };
  return p;
}

export class LeafletCompat<TMarkerData = unknown> {
  constructor(private readonly map: GTMap<TMarkerData>) {}

  // View controls
  async setView(latlng: LatLngLike, zoom: number): Promise<ApplyResult> {
    const p = toPoint(latlng);
    return this.map.transition().center(p).zoom(zoom).apply();
  }

  async panTo(latlng: LatLngLike): Promise<ApplyResult> {
    const p = toPoint(latlng);
    return this.map.transition().center(p).apply();
  }

  async flyTo(latlng: LatLngLike, zoom: number, opts?: { duration?: number }): Promise<ApplyResult> {
    const p = toPoint(latlng);
    const durationMs = Math.max(0, Math.round((opts?.duration ?? 0.5) * 1000));
    return this.map
      .transition()
      .center(p)
      .zoom(zoom)
      .apply({ animate: { durationMs } });
  }

  async fitBounds(
    bounds: [LatLngLike, LatLngLike] | LatLngBoundsCompat,
    opts?: { padding?: LeafletPadding; animate?: boolean; maxZoom?: number }
  ): Promise<ApplyResult> {
    const pad = toPadding(opts?.padding);
    const getBB = (b: [LatLngLike, LatLngLike] | LatLngBoundsCompat) => {
      const swne = Array.isArray(b) ? b : [b.getSouthWest(), b.getNorthEast()];
      const a = toPoint(swne[0]);
      const c = toPoint(swne[1]);
      return { minX: Math.min(a.x, c.x), minY: Math.min(a.y, c.y), maxX: Math.max(a.x, c.x), maxY: Math.max(a.y, c.y) };
    };
    const bb = getBB(bounds);
    if (opts?.maxZoom != null) {
      // Precompute target and clamp zoom
      const host = this.map as FitBoundsHost;
      try {
        const fit = host._fitBounds(bb, pad);
        const z = Math.min(fit.zoom, opts.maxZoom);
        return this.map.transition().center(fit.center).zoom(z).apply({ animate: opts.animate ? { durationMs: 400 } : undefined });
      } catch {}
    }
    return this.map.transition().bounds(bb, pad).apply({ animate: opts?.animate ? { durationMs: 400 } : undefined });
  }

  /** Current zoom (fractional allowed). */
  getZoom(): number { return this.map.getZoom(); }

  /** Scale factor from `fromZoom` → `toZoom` (2^(to-from)). */
  getZoomScale(toZoom: number, fromZoom: number): number { return Math.pow(2, toZoom - fromZoom); }

  /** Compute the zoom that fits given bounds; approximates Leaflet's getBoundsZoom. */
  getBoundsZoom(bounds: [LatLngLike, LatLngLike], _inside?: boolean): number {
    const a = toPoint(bounds[0]);
    const b = toPoint(bounds[1]);
    const bb = { minX: Math.min(a.x, b.x), minY: Math.min(a.y, b.y), maxX: Math.max(a.x, b.x), maxY: Math.max(a.y, b.y) };
    const host = this.map as FitBoundsHost;
    try {
      const { zoom } = host._fitBounds(bb, { top: 0, right: 0, bottom: 0, left: 0 });
      return zoom;
    } catch {
      // Fallback: return current zoom when internals are unavailable
      return this.map.getZoom();
    }
  }

  // Events
  on<K extends keyof GTEventMap<TMarkerData> & string>(name: K, handler: (e: GTEventMap<TMarkerData>[K]) => void): Unsubscribe {
    return this.map.events.on(name).each(handler);
  }

  once<K extends keyof GTEventMap<TMarkerData> & string>(name: K): Promise<GTEventMap<TMarkerData>[K]> {
    return this.map.events.once(name);
  }

  // Content helpers
  /** Create an icon handle (Leaflet-like). */
  icon(opts: LeafletIconOptions): IconHandle {
    const [w, h] = opts.iconSize;
    const [ax, ay] = opts.iconAnchor ?? [Math.round(w / 2), Math.round(h / 2)];
    return this.map.addIcon({ iconPath: opts.iconUrl, x2IconPath: opts.iconRetinaUrl, width: w, height: h, anchorX: ax, anchorY: ay });
  }

  /** Alias to `icon()` for symmetry with Leaflet. */
  addIcon(opts: LeafletIconOptions): IconHandle { return this.icon(opts); }

  /** Create a marker wrapper with Leaflet-like API. */
  marker(latlng: LatLngLike, opts?: { icon?: IconHandle; size?: number; rotation?: number; data?: TMarkerData }): CompatMarker<TMarkerData> {
    const p = toPoint(latlng);
    const inner = this.map.addMarker(p.x, p.y, opts);
    return new CompatMarker(this, inner);
  }

  /** Convenience: create and return a marker wrapper (alias of `marker`). */
  addMarker(latlng: LatLngLike, opts?: { icon?: IconHandle; size?: number; rotation?: number; data?: TMarkerData }): CompatMarker<TMarkerData> {
    return this.marker(latlng, opts);
  }

  addPolyline(latlngs: LatLngLike[], style?: VectorStyle) {
    const pts = latlngs.map(toPoint);
    return this.map.addVector({ type: 'polyline', points: pts, style });
  }

  addPolygon(latlngs: LatLngLike[], style?: VectorStyle) {
    const pts = latlngs.map(toPoint);
    return this.map.addVector({ type: 'polygon', points: pts, style });
  }

  addCircle(latlng: LatLngLike, radius: number, style?: VectorStyle) {
    const c = toPoint(latlng);
    return this.map.addVector({ type: 'circle', center: c, radius, style });
  }

  clearMarkers(): void { this.map.clearMarkers(); }
  clearVectors(): void { this.map.clearVectors(); }

  // Minimal layer-style API for toggling marker presence
  private _present = new Set<string>();
  hasLayer(marker: CompatMarker<TMarkerData>): boolean { return this._present.has(marker.id); }
  addLayer(marker: CompatMarker<TMarkerData>): void {
    if (this._present.has(marker.id)) return;
    this.map.markers.add(marker.inner);
    this._present.add(marker.id);
  }
  removeLayer(marker: CompatMarker<TMarkerData>): void {
    if (!this._present.has(marker.id)) return;
    this.map.markers.remove(marker.inner.id);
    this._present.delete(marker.id);
  }

  /** Convert pixel coords (world) to LatLng (CRS.Simple): returns { lat: -y, lng: x }. */
  unproject(px: [number, number], _zoomRef: number): { lat: number; lng: number } {
    const [x, y] = px;
    return { lat: -y, lng: x };
  }

  /** Convert LatLng (CRS.Simple) to pixel coords (world): returns [x, y] = [lng, -lat]. */
  project(ll: LatLngLike, _zoomRef: number): [number, number] {
    const p = toPoint(ll);
    return [p.x, p.y];
  }

  /** Get center as LatLng (CRS.Simple). */
  getCenter(): { lat: number; lng: number } {
    const c = this.map.getCenter();
    return { lat: -c.y, lng: c.x };
  }
}

  /** Convenience function to wrap a GTMap with Leaflet-like helpers. */
export function leafletCompat<TMarkerData = unknown>(map: GTMap<TMarkerData>): LeafletCompat<TMarkerData> {
  return new LeafletCompat(map);
}

// Leaflet-like marker wrapper
export class CompatMarker<T = unknown> {
  readonly inner: GTMarker<T>;
  constructor(private compat: LeafletCompat<T>, inner: GTMarker<T>) { this.inner = inner; }
  get id(): string { return this.inner.id; }
  // Leaflet-style `feature` passthrough to marker data.
  get feature(): T | undefined { return this.inner.data as T | undefined; }
  set feature(v: T | undefined) { if (v !== undefined) this.inner.setData(v); }
  addTo(_map?: unknown): this { this.compat.addLayer(this); return this; }
  setIcon(icon: IconHandle): this { this.inner.setStyle({ iconType: icon.id }); return this; }
  remove(): this { this.compat.removeLayer(this); return this; }
  setLatLng(ll: LatLngLike): this { const p = (this.compat as any as { project: (ll: LatLngLike, z: number) => [number, number] }).project(ll, 0); this.inner.moveTo(p[0], p[1]); return this; }
  getLatLng(): { lat: number; lng: number } { return { lat: -this.inner.y, lng: this.inner.x }; }
  on(name: 'mouseover' | 'mouseout' | 'click', handler: (e: unknown) => void): this {
    if (name === 'mouseover') this.inner.events.on('pointerenter').each((e) => handler(e));
    else if (name === 'mouseout') this.inner.events.on('pointerleave').each((e) => handler(e));
    else if (name === 'click') this.inner.events.on('click').each((e) => handler(e));
    return this;
  }
}

// Minimal Leaflet-like LatLng and LatLngBounds helpers for migration
export function latLng(lat: number, lng: number): { lat: number; lng: number } { return { lat, lng }; }

export class LatLngBoundsCompat {
  private sw: { lat: number; lng: number };
  private ne: { lat: number; lng: number };
  constructor(a: LatLngLike, b: LatLngLike) {
    const A = Array.isArray(a) ? { lat: a[0], lng: a[1] } : a;
    const B = Array.isArray(b) ? { lat: b[0], lng: b[1] } : b;
    this.sw = { lat: Math.min(A.lat, B.lat), lng: Math.min(A.lng, B.lng) };
    this.ne = { lat: Math.max(A.lat, B.lat), lng: Math.max(A.lng, B.lng) };
  }
  getSouthWest(): { lat: number; lng: number } { return this.sw; }
  getNorthEast(): { lat: number; lng: number } { return this.ne; }
  getCenter(): { lat: number; lng: number } { return { lat: (this.sw.lat + this.ne.lat) / 2, lng: (this.sw.lng + this.ne.lng) / 2 }; }
}

export function latLngBounds(a: LatLngLike, b: LatLngLike): LatLngBoundsCompat { return new LatLngBoundsCompat(a, b); }
