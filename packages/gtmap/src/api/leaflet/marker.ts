import type GTMap from '../GTMap';
import type { IconsApi } from '../IconsApi';
import { toLngLat, toLeafletLatLng, type LeafletLatLng } from './util';

export type LeafletIcon = { __type: string; __def?: any };

export function createIcon(opts: { iconUrl: string; iconRetinaUrl?: string; iconSize?: [number, number]; iconAnchor?: [number, number] }): LeafletIcon {
  const type = `icon_${Math.random().toString(36).slice(2, 10)}`;
  const width = (opts.iconSize && opts.iconSize[0]) || 32;
  const height = (opts.iconSize && opts.iconSize[1]) || 32;
  const def = { iconPath: opts.iconUrl, x2IconPath: opts.iconRetinaUrl, width, height };
  return { __type: type, __def: def };
}

export class LeafletMarkerFacade {
  private _latlng: { lng: number; lat: number };
  private _icon: LeafletIcon | null;
  private _map: GTMap | null = null;

  constructor(latlng: LeafletLatLng, options?: { icon?: LeafletIcon }) {
    this._latlng = toLngLat(latlng);
    this._icon = options?.icon || null;
  }

  addTo(map: GTMap) {
    this._map = map;
    ensureIconDefs(map.icons, this._icon);
    flushMarkers(map, this);
    return this;
  }
  remove() {
    if (!this._map) return this;
    removeMarker(this._map, this);
    this._map = null;
    return this;
  }
  setLatLng(latlng: LeafletLatLng) {
    this._latlng = toLngLat(latlng);
    if (this._map) flushMarkers(this._map, this);
    return this;
  }
  getLatLng(): [number, number] {
    return toLeafletLatLng(this._latlng.lng, this._latlng.lat);
  }
  setIcon(icon: LeafletIcon) {
    this._icon = icon;
    if (this._map) {
      ensureIconDefs(this._map.icons, this._icon);
      flushMarkers(this._map, this);
    }
    return this;
  }
  // internal getters
  __getLngLat() { return this._latlng; }
  __getType() { return (this._icon && this._icon.__type) || 'default'; }
  __getSize(): number | undefined { return undefined; }
}

// Simple global registry per GTMap instance
const markersByMap = new WeakMap<GTMap, Set<LeafletMarkerFacade>>();

function getSet(map: GTMap): Set<LeafletMarkerFacade> {
  let s = markersByMap.get(map);
  if (!s) { s = new Set(); markersByMap.set(map, s); }
  return s;
}

function ensureIconDefs(icons: IconsApi, icon: LeafletIcon | null) {
  if (icon && icon.__def) {
    const defs: any = {}; defs[icon.__type] = icon.__def;
    icons.setDefs(defs);
    // mark as loaded
    (icon as any).__def = null;
  }
}

function flushMarkers(map: GTMap, recent?: LeafletMarkerFacade) {
  const set = getSet(map);
  if (recent) set.add(recent);
  const arr: any[] = [];
  for (const m of set) arr.push({ lng: m.__getLngLat().lng, lat: m.__getLngLat().lat, type: m.__getType() });
  map.icons.setMarkers(arr);
}

function removeMarker(map: GTMap, marker: LeafletMarkerFacade) {
  const set = getSet(map);
  set.delete(marker);
  flushMarkers(map);
}

