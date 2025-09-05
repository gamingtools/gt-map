import Impl from '../internal/mapgl';
import type { MapImpl } from '../internal/types';
import type { EventBus } from '../internal/events/stream';

// Re-export types from centralized types file
export type {
  Point,
  TileSourceOptions,
  MapOptions,
  Marker,
  IconDef,
  IconHandle,
  VectorStyle,
  Polyline,
  Polygon,
  Circle,
  Vector,
  ActiveOptions
} from './types';

import type {
  Point,
  TileSourceOptions,
  MapOptions,
  Marker,
  IconDef,
  IconHandle,
  Circle,
  Vector,
  ActiveOptions,
  IconDefInternal,
  MarkerInternal,
  VectorPrimitiveInternal
} from './types';

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
    this._impl = new Impl(container as HTMLDivElement, implOpts) as MapImpl;
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
    const o: TileSourceOptions = { ...opts };
    if (opts.mapSize) o.mapSize = { width: opts.mapSize.width, height: opts.mapSize.height };
    this._impl.setTileSource(o);
    return this;
  }

  // Grid + filtering
  setGridVisible(on: boolean): this { this._impl.setGridVisible?.(on); return this; }
  setUpscaleFilter(mode: 'auto' | 'linear' | 'bicubic'): this { this._impl.setUpscaleFilter?.(mode); return this; }

  // Lifecycle
  setActive(on: boolean, opts?: ActiveOptions): this { this._impl.setActive?.(on, opts); return this; }
  destroy(): void { this._impl.destroy?.(); }

  // Add content (batched internally)
  addIcon(def: IconDef, id?: string): IconHandle {
    const iconId = id || `icon_${Math.random().toString(36).slice(2, 10)}`;
    this._icons.set(iconId, def);
    // Push to impl immediately
    const iconDefInternal: IconDefInternal = {
      iconPath: def.iconPath,
      x2IconPath: def.x2IconPath,
      width: def.width,
      height: def.height
    };
    this._impl.setIconDefs(Object.fromEntries([[iconId, iconDefInternal]]));
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
    const internalVectors: VectorPrimitiveInternal[] = this._vectors.map(v => {
      if (v.type === 'polyline' || v.type === 'polygon') {
        return { type: v.type, points: v.points.map(p => ({ lng: p.x, lat: p.y })), style: v.style };
      }
      const circle = v as Circle;
      return { type: 'circle', center: { lng: circle.center.x, lat: circle.center.y }, radius: circle.radius, style: circle.style };
    });
    this._impl.setVectors?.(internalVectors);
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
  get events(): EventBus { return this._impl.events; }

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
      const defaultIcon: IconDefInternal = { iconPath: dataUrl, width: size, height: size };
      this._impl.setIconDefs?.({ default: defaultIcon });
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
      const internalMarkers: MarkerInternal[] = this._markers.map(mm => ({ 
        lng: mm.x, 
        lat: mm.y, 
        type: mm.type ?? 'default', 
        size: mm.size 
      }));
      this._impl.setMarkers(internalMarkers);
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(flush);
    else setTimeout(flush, 0);
  }
}
