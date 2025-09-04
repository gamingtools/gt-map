import type Impl from '../mapgl';
import Layer from './layer';
import { toLngLat, toLeafletLatLng, type LeafletLatLng } from './util';

export type LeafletIcon = { __type: string; __def?: any };
export type IconOptions = { iconUrl: string; iconRetinaUrl?: string; iconSize?: [number, number]; iconAnchor?: [number, number] };
export type MarkerOptions = {
  icon?: LeafletIcon;
  title?: string;
  alt?: string;
  zIndexOffset?: number;
  draggable?: boolean;
  opacity?: number;
};

export function createIcon(opts: IconOptions): LeafletIcon {
  const type = `icon_${Math.random().toString(36).slice(2, 10)}`;
  const width = (opts.iconSize && opts.iconSize[0]) || 32;
  const height = (opts.iconSize && opts.iconSize[1]) || 32;
  const def = { iconPath: opts.iconUrl, x2IconPath: opts.iconRetinaUrl, width, height };
  return { __type: type, __def: def };
}

export class LeafletMarkerFacade extends Layer {
  private _latlng: { lng: number; lat: number };
  private _icon: LeafletIcon | null;
  private _impl: Impl | null = null;
  private _hitW = 32;
  private _hitH = 32;
  private _listeners = new Map<string, Set<(e: any) => void>>();

  constructor(latlng: LeafletLatLng, options?: MarkerOptions) {
    super();
    this._latlng = toLngLat(latlng);
    this._icon = options?.icon || null;
    // Seed hit size from icon if available
    const def = (this._icon as any)?.__def as any | undefined;
    if (def && Number.isFinite(def.width) && Number.isFinite(def.height)) {
      this._hitW = def.width | 0;
      this._hitH = def.height | 0;
    }
  }

  onAdd(map: any): void { this._impl = (map as any).__impl ?? map; ensureIconDefs(this._impl as Impl, this._icon); scheduleFlush(this._impl as Impl, this); }
  onRemove(_map: any): void { if (this._impl) { removeMarker(this._impl, this); this._impl = null; } }
  setLatLng(latlng: LeafletLatLng): this {
    this._latlng = toLngLat(latlng);
    if (this._impl) scheduleFlush(this._impl, this);
    return this;
  }
  getLatLng(): [number, number] {
    return toLeafletLatLng(this._latlng.lng, this._latlng.lat);
  }
  setIcon(icon: LeafletIcon): this {
    this._icon = icon;
    if (this._impl) {
      ensureIconDefs(this._impl, this._icon);
      scheduleFlush(this._impl, this);
    }
    const def = (icon as any)?.__def as any | undefined;
    if (def && Number.isFinite(def.width) && Number.isFinite(def.height)) {
      this._hitW = def.width | 0;
      this._hitH = def.height | 0;
    }
    return this;
  }
  // internal getters
  __getLngLat(): { lng: number; lat: number } { return this._latlng; }
  __getType(): string { return (this._icon && this._icon.__type) || 'default'; }
  __getSize(): { w: number; h: number } { return { w: this._hitW, h: this._hitH }; }

  // Leaflet-like events API
  on(name: string, fn: (e: any) => void): this {
    if (!this._listeners.has(name)) this._listeners.set(name, new Set());
    this._listeners.get(name)!.add(fn);
    return this;
  }
  off(name: string, fn?: (e: any) => void): this {
    const s = this._listeners.get(name);
    if (!s) return this;
    if (!fn) { this._listeners.delete(name); return this; }
    s.delete(fn);
    return this;
  }
  __fire(name: string, payload: any): void {
    const s = this._listeners.get(name);
    if (!s || s.size === 0) return;
    for (const cb of Array.from(s)) {
      try { cb(payload); } catch {}
    }
  }
}

// Simple global registry per map instance
const markersByMap = new WeakMap<Impl, Set<LeafletMarkerFacade>>();
type GridIndex = { cell: number; grid: Map<string, LeafletMarkerFacade[]> };
const gridByMap = new WeakMap<Impl, GridIndex>();
const pendingFlushByMap = new WeakMap<Impl, any>();
const eventsHooked = new WeakSet<Impl>();
const hoverByMap = new WeakMap<Impl, LeafletMarkerFacade | null>();
const lastClickByMap = new WeakMap<Impl, { t: number; m: LeafletMarkerFacade | null; x: number; y: number }>();

function getSet(map: Impl): Set<LeafletMarkerFacade> {
  let s = markersByMap.get(map);
  if (!s) { s = new Set(); markersByMap.set(map, s); }
  return s;
}

function ensureIconDefs(map: Impl, icon: LeafletIcon | null) {
  if (icon && icon.__def) {
    const defs: any = {}; defs[icon.__type] = icon.__def;
    (map as any).setIconDefs(defs);
    // mark as loaded
    (icon as any).__def = null;
  }
}

function scheduleFlush(map: Impl, recent?: LeafletMarkerFacade) {
  const set = getSet(map);
  if (recent) set.add(recent);
  hookMapPointerEvents(map);
  if (pendingFlushByMap.get(map)) return;
  const timer = setTimeout(() => { pendingFlushByMap.delete(map); flushNow(map); }, 0);
  pendingFlushByMap.set(map, timer);
}

function removeMarker(map: Impl, marker: LeafletMarkerFacade) {
  const set = getSet(map);
  set.delete(marker);
  scheduleFlush(map);
}

function flushNow(map: Impl) {
  const set = getSet(map);
  const arr: any[] = [];
  for (const m of set) arr.push({ lng: m.__getLngLat().lng, lat: m.__getLngLat().lat, type: m.__getType() });
  (map as any).setMarkers(arr);
  rebuildIndex(map);
}

function hookMapPointerEvents(map: Impl) {
  if (eventsHooked.has(map)) return;
  eventsHooked.add(map);
  try {
    (map as any).events.on('pointermove').each((e: any) => handlePointerMove(map, e));
    (map as any).events.on('pointerdown').each((e: any) => handlePointerDown(map, e));
    (map as any).events.on('pointerup').each((e: any) => handlePointerUp(map, e));
    // Context menu from DOM (right click / long press)
    const container: HTMLElement | null = (map as any).container as HTMLElement;
    if (container && container.addEventListener) {
      const onCtx = (ev: MouseEvent) => {
        try { ev.preventDefault(); } catch {}
        const rect = container.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        handleContextMenu(map, { x, y, view: (map as any)._view?.() || {}, originalEvent: ev } as any);
      };
      container.addEventListener('contextmenu', onCtx as any);
    }
  } catch {}
}

type MapPointerEvent = { x: number; y: number; view: any; originalEvent?: any };

function buildMouseEvent(m: LeafletMarkerFacade, type: string, e: MapPointerEvent) {
  const latlngObj = { lat: m.__getLngLat().lat, lng: m.__getLngLat().lng };
  const containerPoint = { x: e.x, y: e.y };
  const layerPoint = { x: e.x, y: e.y };
  return {
    type,
    target: m,
    sourceTarget: m,
    propagatedFrom: undefined,
    layer: undefined,
    latlng: latlngObj,
    layerPoint,
    containerPoint,
    originalEvent: e.originalEvent,
  };
}

function handlePointerMove(map: Impl, e: MapPointerEvent) {
  const over = hitTest(map, e.x, e.y);
  const prev = hoverByMap.get(map) || null;
  if (over !== prev) {
    if (prev) prev.__fire('mouseout', buildMouseEvent(prev, 'mouseout', e));
    if (over) over.__fire('mouseover', buildMouseEvent(over, 'mouseover', e));
    hoverByMap.set(map, over || null);
  }
  if (over) over.__fire('mousemove', buildMouseEvent(over, 'mousemove', e));
}

function handlePointerDown(map: Impl, e: MapPointerEvent) {
  const over = hitTest(map, e.x, e.y);
  if (over) over.__fire('mousedown', buildMouseEvent(over, 'mousedown', e));
}
function handlePointerUp(map: Impl, e: MapPointerEvent) {
  const over = hitTest(map, e.x, e.y);
  if (over) {
    over.__fire('mouseup', buildMouseEvent(over, 'mouseup', e));
    over.__fire('click', buildMouseEvent(over, 'click', e));
    // dblclick detection
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const last = lastClickByMap.get(map);
    if (last && last.m === over && (now - last.t) <= 320) {
      // within time window; also ensure within small radius (6px)
      const dx = (e.x - last.x);
      const dy = (e.y - last.y);
      if (dx * dx + dy * dy <= 36) {
        over.__fire('dblclick', buildMouseEvent(over, 'dblclick', e));
      }
    }
    lastClickByMap.set(map, { t: now, m: over, x: e.x, y: e.y });
  }
}

function handleContextMenu(map: Impl, e: MapPointerEvent) {
  const over = hitTest(map, e.x, e.y);
  if (over) over.__fire('contextmenu', buildMouseEvent(over, 'contextmenu', e));
}

function rebuildIndex(map: Impl) {
  const set = markersByMap.get(map);
  if (!set || set.size === 0) { gridByMap.delete(map); return; }
  const ms = (map as any).mapSize as { width: number; height: number } | undefined;
  const cell = 256; // native px
  const grid = new Map<string, LeafletMarkerFacade[]>();
  for (const m of Array.from(set)) {
    const p = m.__getLngLat();
    const cx = Math.floor((p.lng as number) / cell);
    const cy = Math.floor((p.lat as number) / cell);
    const key = `${cx},${cy}`;
    let arr = grid.get(key);
    if (!arr) { arr = []; grid.set(key, arr); }
    arr.push(m);
  }
  gridByMap.set(map, { cell, grid });
}

function hitTest(map: Impl, xCSS: number, yCSS: number): LeafletMarkerFacade | null {
  const idx = gridByMap.get(map);
  const rect = (map as any).container.getBoundingClientRect();
  const widthCSS = rect.width;
  const heightCSS = rect.height;
  const z = (map as any).zoom as number;
  const zInt = Math.floor(z);
  const scale = Math.pow(2, z - zInt);
  const imageMaxZ = (map as any)._sourceMaxZoom || (map as any).maxZoom;
  const s = Math.pow(2, imageMaxZ - zInt);
  const center = (map as any).center as { lng: number; lat: number };
  const centerWorld = { x: center.lng / s, y: center.lat / s };
  const tlWorld = { x: centerWorld.x - widthCSS / (2 * scale), y: centerWorld.y - heightCSS / (2 * scale) };
  // Convert pointer CSS -> native
  const pointerWorld = { x: tlWorld.x + xCSS / scale, y: tlWorld.y + yCSS / scale };
  const pointerNative = { x: pointerWorld.x * s, y: pointerWorld.y * s };
  let candidates: LeafletMarkerFacade[] = [];
  if (idx) {
    const cell = idx.cell;
    const cx = Math.floor(pointerNative.x / cell);
    const cy = Math.floor(pointerNative.y / cell);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const key = `${cx + dx},${cy + dy}`;
        const arr = idx.grid.get(key);
        if (arr && arr.length) candidates = candidates.concat(arr);
      }
    }
  } else {
    // Fallback: linear scan if no index
    const set = getSet(map);
    candidates = Array.from(set);
  }
  let hit: LeafletMarkerFacade | null = null;
  for (const m of candidates) {
    const p = m.__getLngLat();
    const w = m.__getSize().w || 32;
    const h = m.__getSize().h || 32;
    const mw = { x: p.lng / s, y: p.lat / s };
    const xCSSm = (mw.x - tlWorld.x) * scale;
    const yCSSm = (mw.y - tlWorld.y) * scale;
    const left = xCSSm - w / 2;
    const top = yCSSm - h / 2;
    if (xCSS >= left && xCSS <= left + w && yCSS >= top && yCSS <= top + h) hit = m;
  }
  return hit;
}
