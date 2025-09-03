import GTMap from '../GTMap';
import type { MapOptions } from '../../mapgl';
import { toLngLat, toLeafletLatLng, type LeafletLatLng } from './util';

type Listener = (...args: any[]) => void;

export default class LeafletMapFacade {
  private _map: GTMap;
  private _listeners = new Map<string, Set<Listener>>();

  constructor(container: HTMLElement | string, options?: MapOptions) {
    const el = typeof container === 'string' ? document.getElementById(container)! : (container as HTMLElement);
    this._map = new GTMap(el as HTMLDivElement, options || {});
    // Wire core events
    this._map.events.on('move').each((e: any) => this._emit('move', e));
    this._map.events.on('moveend').each((e: any) => this._emit('moveend', e));
    this._map.events.on('zoom').each((e: any) => this._emit('zoom', e));
    this._map.events.on('zoomend').each((e: any) => this._emit('zoomend', e));
  }

  // API
  setView(latlng: LeafletLatLng, zoom?: number, _opts?: { animate?: boolean }) {
    const p = toLngLat(latlng);
    this._map.setCenter(p.lng, p.lat);
    if (typeof zoom === 'number') this._map.setZoom(zoom);
    return this;
  }
  getCenter(): [number, number] { return toLeafletLatLng(this._map.center.lng, this._map.center.lat); }
  getZoom(): number { return this._map.zoom; }

  on(name: string, fn: Listener) { if (!this._listeners.has(name)) this._listeners.set(name, new Set()); this._listeners.get(name)!.add(fn); return this; }
  off(name: string, fn?: Listener) {
    if (!fn) { this._listeners.delete(name); return this; }
    const s = this._listeners.get(name); if (s) s.delete(fn);
    return this;
  }
  private _emit(name: string, payload?: any) {
    const s = this._listeners.get(name); if (!s) return;
    for (const fn of Array.from(s)) { try { fn(payload); } catch {} }
  }

  addLayer(layer: any) { if (layer?.addTo) layer.addTo(this); return this; }
  removeLayer(layer: any) { if (layer?.remove) layer.remove(); return this; }

  // Feature facades
  get __impl(): GTMap { return this._map; }
}
