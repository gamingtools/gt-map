import Impl from '../internal/mapgl';
import type { MapImpl } from '../internal/types';

export type Point = { x: number; y: number };

export type TileSourceOptions = {
  url?: string;
  tileSize?: number;
  sourceMinZoom?: number;
  sourceMaxZoom?: number;
  mapSize?: { width: number; height: number };
  wrapX?: boolean;
  clearCache?: boolean;
};

export type MapOptions = {
  tileUrl?: string;
  tileSize?: number;
  mapSize?: { width: number; height: number };
  minZoom?: number;
  maxZoom?: number;
  wrapX?: boolean;
  center?: Point;
  zoom?: number;
  prefetch?: { enabled?: boolean; baselineLevel?: number; ring?: number };
  screenCache?: boolean;
  fpsCap?: number;
};

export type Marker = { x: number; y: number; type?: string; size?: number };
export type IconDef = { iconPath: string; x2IconPath?: string; width: number; height: number };
export type IconHandle = { id: string };

export type VectorStyle = {
  color?: string;
  weight?: number;
  opacity?: number;
  fill?: boolean;
  fillColor?: string;
  fillOpacity?: number;
};

export type Polyline = { type: 'polyline'; points: Point[]; style?: VectorStyle };
export type Polygon = { type: 'polygon'; points: Point[]; style?: VectorStyle };
export type Circle = { type: 'circle'; center: Point; radius: number; style?: VectorStyle };
export type Vector = Polyline | Polygon | Circle;

export class GTMap {
  private _impl: MapImpl;
  private _markers: Marker[] = [];
  private _vectors: Vector[] = [];
  private _defaultIconReady = false;
  private _icons: Map<string, IconDef> = new Map<string, IconDef>();
  private _markersDirty = false;
  private _markersFlushScheduled = false;

  constructor(container: HTMLElement, options: MapOptions = {}) {
    const implOpts: any = {
      tileUrl: options.tileUrl,
      tileSize: options.tileSize,
      minZoom: options.minZoom,
      maxZoom: options.maxZoom,
      mapSize: options.mapSize,
      wrapX: options.wrapX,
      center: options.center ? { lng: options.center.x, lat: options.center.y } : undefined,
      zoom: options.zoom,
      prefetch: options.prefetch,
      screenCache: options.screenCache,
      fpsCap: options.fpsCap,
    };
    this._impl = new Impl(container as HTMLDivElement, implOpts) as unknown as MapImpl;
    this._ensureDefaultIcon();
  }

  // View controls
  setCenter(p: Point): this {
    this._impl.setCenter(p.x, p.y);
    return this;
  }
  setZoom(z: number): this {
    this._impl.setZoom(z);
    return this;
  }
  setView(view: { center: Point; zoom: number }): this {
    this._impl.setCenter(view.center.x, view.center.y);
    this._impl.setZoom(view.zoom);
    return this;
  }

  // Tile source
  setTileSource(opts: TileSourceOptions): this {
    const o: any = { ...opts };
    if (opts.mapSize) o.mapSize = { width: opts.mapSize.width, height: opts.mapSize.height };
    this._impl.setTileSource(o);
    return this;
  }

  // Grid + filtering
  setGridVisible(on: boolean): this { (this._impl as any).setGridVisible?.(on); return this; }
  setUpscaleFilter(mode: 'auto' | 'linear' | 'bicubic'): this { (this._impl as any).setUpscaleFilter?.(mode); return this; }

  // Lifecycle
  setActive(on: boolean, opts?: { releaseGL?: boolean }): this { (this._impl as any).setActive?.(on, opts); return this; }
  destroy(): void { (this._impl as any).destroy?.(); }

  // Add content (batched internally)
  addIcon(def: IconDef, id?: string): IconHandle {
    const iconId = id || `icon_${Math.random().toString(36).slice(2, 10)}`;
    this._icons.set(iconId, def);
    // Push to impl immediately
    this._impl.setIconDefs(Object.fromEntries([[iconId, def]]));
    return { id: iconId };
  }
  addMarker(x: number, y: number, opts?: { icon?: IconHandle; size?: number }): { x: number; y: number; type?: string; size?: number } {
    const m: Marker = { x, y, type: opts?.icon?.id ?? 'default', size: opts?.size };
    this._markers.push(m);
    this._markMarkersDirtyAndSchedule();
    return m;
  }
  addMarkers(markers: Marker[]): this {
    if (markers && markers.length) {
      this._markers.push(...markers.map(m => ({ x: m.x, y: m.y, type: m.type ?? 'default', size: m.size })));
      this._markMarkersDirtyAndSchedule();
    }
    return this;
  }
  addVectors(vectors: Vector[]): this {
    if (vectors && vectors.length) this._vectors.push(...vectors);
    this._impl.setVectors?.(this._vectors.map(v => {
      if (v.type === 'polyline' || v.type === 'polygon') {
        return { type: v.type, points: v.points.map(p => ({ lng: p.x, lat: p.y })), style: v.style };
      }
      return { type: 'circle', center: { lng: (v as Circle).center.x, lat: (v as Circle).center.y }, radius: (v as Circle).radius, style: (v as Circle).style };
    }));
    return this;
  }

  clearMarkers(): this {
    this._markers = [];
    this._markMarkersDirtyAndSchedule();
    return this;
  }
  clearVectors(): this {
    this._vectors = [];
    this._impl.setVectors?.([]);
    return this;
  }

  // Compatibility getters used by HUD
  getCenter(): [number, number] {
    const c = this._impl.center as { lng: number; lat: number };
    return [c.lat, c.lng];
  }
  getZoom(): number { return this._impl.zoom; }
  get pointerAbs(): { x: number; y: number } | null { return this._impl.pointerAbs ?? null; }
  setWheelSpeed(v: number): this { this._impl.setWheelSpeed?.(v); return this; }
  setFpsCap(v: number): this { this._impl.setFpsCap(v); return this; }
  invalidateSize(): this { this._impl.resize?.(); return this; }

  // Events proxy
  get events() { return (this._impl as any).events; }

  // Ensure a default icon is available so markers are visible without explicit icon defs
  private _ensureDefaultIcon() {
    if (this._defaultIconReady) return;
    try {
      const size = 16;
      const r = 7;
      const cnv = document.createElement('canvas');
      cnv.width = size;
      cnv.height = size;
      const ctx = cnv.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = '#2563eb'; // blue
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      const dataUrl = cnv.toDataURL('image/png');
      (this._impl as any).setIconDefs?.({ default: { iconPath: dataUrl, width: size, height: size } });
      this._defaultIconReady = true;
    } catch {}
  }

  private _markMarkersDirtyAndSchedule() {
    this._markersDirty = true;
    if (this._markersFlushScheduled) return;
    this._markersFlushScheduled = true;
    const flush = () => {
      this._markersFlushScheduled = false;
      if (!this._markersDirty) return;
      this._markersDirty = false;
      // Commit full marker list in one go
      this._impl.setMarkers(this._markers.map(mm => ({ lng: mm.x, lat: mm.y, type: mm.type ?? 'default', size: mm.size })));
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(flush);
    else setTimeout(flush, 0);
  }
}
