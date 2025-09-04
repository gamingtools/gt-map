import Layer from '../../../internal/adapters/layer';
import type Impl from '../../../internal/mapgl';

type LatLng = [number, number] | { lat: number; lng: number };
type Style = {
  color?: string;
  weight?: number;
  opacity?: number;
  fill?: boolean;
  fillColor?: string;
  fillOpacity?: number;
};

export abstract class Path extends Layer {
  protected _impl: Impl | null = null;
  protected _style: Style = {};

  setStyle(style?: Style): this {
    this._style = { ...(this._style || {}), ...(style || {}) };
    scheduleVectorFlush(this._impl);
    return this;
  }
  bringToFront(): this { return this; }
  bringToBack(): this { return this; }
  getBounds(): any { return null; }

  // Internals
  onAdd(map: any): void {
    this._impl = (map as any).__impl ?? map;
    vectorSetFor(this._impl).add(this as any);
    scheduleVectorFlush(this._impl);
  }
  onRemove(map: any): void {
    const impl: Impl = (map as any).__impl ?? map;
    vectorSetFor(impl).delete(this as any);
    scheduleVectorFlush(impl);
    this._impl = null;
  }

  protected toLngLat(ll: LatLng): { lng: number; lat: number } {
    if (Array.isArray(ll)) return { lat: ll[0], lng: ll[1] } as any;
    return { lng: (ll as any).lng, lat: (ll as any).lat };
  }
  abstract __toPrimitive(): { type: string; [k: string]: any };
}

// Registry and flush
const vectorsByMap = new WeakMap<Impl, Set<Path>>();
const pendingByMap = new WeakMap<Impl, any>();

function vectorSetFor(map: Impl): Set<Path> {
  let s = vectorsByMap.get(map);
  if (!s) { s = new Set(); vectorsByMap.set(map, s); }
  return s;
}

function scheduleVectorFlush(map: Impl | null) {
  if (!map) return;
  if (pendingByMap.get(map)) return;
  const t = setTimeout(() => {
    pendingByMap.delete(map);
    flushVectors(map as Impl);
  }, 0);
  pendingByMap.set(map, t);
}

function flushVectors(map: Impl) {
  const set = vectorsByMap.get(map);
  const arr: any[] = [];
  if (set) for (const p of set) arr.push((p as any).__toPrimitive());
  (map as any).setVectors?.(arr);
}
