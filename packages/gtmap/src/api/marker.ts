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

  constructor(latlng: LeafletLatLng, options?: MarkerOptions) {
    super();
    this._latlng = toLngLat(latlng);
    this._icon = options?.icon || null;
  }

  onAdd(map: any): void { this._impl = (map as any).__impl ?? map; ensureIconDefs(this._impl as Impl, this._icon); flushMarkers(this._impl as Impl, this); }
  onRemove(_map: any): void { if (this._impl) { removeMarker(this._impl, this); this._impl = null; } }
  setLatLng(latlng: LeafletLatLng): this {
    this._latlng = toLngLat(latlng);
    if (this._impl) flushMarkers(this._impl, this);
    return this;
  }
  getLatLng(): [number, number] {
    return toLeafletLatLng(this._latlng.lng, this._latlng.lat);
  }
  setIcon(icon: LeafletIcon): this {
    this._icon = icon;
    if (this._impl) {
      ensureIconDefs(this._impl, this._icon);
      flushMarkers(this._impl, this);
    }
    return this;
  }
  // internal getters
  __getLngLat(): { lng: number; lat: number } { return this._latlng; }
  __getType(): string { return (this._icon && this._icon.__type) || 'default'; }
  __getSize(): number | undefined { return undefined; }
}

// Simple global registry per map instance
const markersByMap = new WeakMap<Impl, Set<LeafletMarkerFacade>>();

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

function flushMarkers(map: Impl, recent?: LeafletMarkerFacade) {
  const set = getSet(map);
  if (recent) set.add(recent);
  const arr: any[] = [];
  for (const m of set) arr.push({ lng: m.__getLngLat().lng, lat: m.__getLngLat().lat, type: m.__getType() });
  (map as any).setMarkers(arr);
}

function removeMarker(map: Impl, marker: LeafletMarkerFacade) {
  const set = getSet(map);
  set.delete(marker);
  flushMarkers(map);
}
