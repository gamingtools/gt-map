import type { ZoomDeps } from '../types';
import { lngLatToWorld, worldToLngLat, clampLat } from '../mercator';

export default class ZoomController {
  private deps: ZoomDeps;
  private easeBaseMs = 150;
  private easePerUnitMs = 240;
  private easeMinMs = 120;
  private easeMaxMs = 420;
  private zoomAnim: null | {
    from: number;
    to: number;
    px: number;
    py: number;
    start: number;
    dur: number;
    anchor: 'pointer' | 'center';
  } = null;

  constructor(deps: ZoomDeps) {
    this.deps = deps;
  }
  isAnimating(): boolean {
    return !!this.zoomAnim;
  }
  cancel() {
    this.zoomAnim = null;
  }
  startEase(dz: number, px: number, py: number, anchor: 'pointer' | 'center') {
    const now = this.deps.now();
    let current = this.deps.getZoom();
    if (this.zoomAnim) {
      const a = this.zoomAnim;
      const t = Math.min(1, (now - a.start) / a.dur);
      const ease = 1 - Math.pow(1 - t, 3);
      current = a.from + (a.to - a.from) * ease;
    }
    const to = Math.max(this.deps.getMinZoom(), Math.min(this.deps.getMaxZoom(), current + dz));
    const dist = Math.abs(to - current);
    const raw = this.easeBaseMs + this.easePerUnitMs * dist;
    const dur = Math.max(this.easeMinMs, Math.min(this.easeMaxMs, raw));
    this.zoomAnim = { from: current, to, px, py, start: now, dur, anchor };
    this.deps.requestRender();
  }
  step(): boolean {
    if (!this.zoomAnim) return false;
    const now = this.deps.now();
    const a = this.zoomAnim;
    const t = Math.min(1, (now - a.start) / a.dur);
    const ease = 1 - Math.pow(1 - t, 3);
    const z = a.from + (a.to - a.from) * ease;
    this.applyAnchoredZoom(z, a.px, a.py, a.anchor);
    if (t >= 1) {
      this.zoomAnim = null;
      this.deps.emit('zoomend', {});
    }
    return true;
  }

  applyAnchoredZoom(targetZoom: number, px: number, py: number, anchor: 'pointer' | 'center') {
    const map = this.deps.getMap();
    const tileSize = this.deps.getTileSize();
    const anchorEff: 'pointer' | 'center' =
      !map.wrapX && this.deps.shouldAnchorCenterForZoom(targetZoom) ? 'center' : anchor;
    const zInt = Math.floor(map.zoom);
    const scale = Math.pow(2, map.zoom - zInt);
    const rect = map.container.getBoundingClientRect();
    const widthCSS = rect.width;
    const heightCSS = rect.height;
    const centerNow = lngLatToWorld(map.center.lng, map.center.lat, zInt, tileSize);
    const tlWorld = {
      x: centerNow.x - widthCSS / (2 * scale),
      y: centerNow.y - heightCSS / (2 * scale),
    };
    const zClamped = Math.max(this.deps.getMinZoom(), Math.min(this.deps.getMaxZoom(), targetZoom));
    const zInt2 = Math.floor(zClamped);
    const s2 = Math.pow(2, zClamped - zInt2);
    let center2: { x: number; y: number };
    if (anchorEff === 'center') {
      const factor = Math.pow(2, zInt2 - zInt);
      center2 = { x: centerNow.x * factor, y: centerNow.y * factor };
    } else {
      const worldBefore = { x: tlWorld.x + px / scale, y: tlWorld.y + py / scale };
      const factor = Math.pow(2, zInt2 - zInt);
      const worldBefore2 = { x: worldBefore.x * factor, y: worldBefore.y * factor };
      const tl2 = { x: worldBefore2.x - px / s2, y: worldBefore2.y - py / s2 };
      const pointerCenter = { x: tl2.x + widthCSS / (2 * s2), y: tl2.y + heightCSS / (2 * s2) };
      if (zClamped < map.zoom) {
        const centerScaled = { x: centerNow.x * factor, y: centerNow.y * factor };
        const dz = Math.max(0, map.zoom - zClamped);
        const bias = Math.max(0, Math.min(0.6, (this.deps.getOutCenterBias() ?? 0.15) * dz));
        center2 = {
          x: pointerCenter.x * (1 - bias) + centerScaled.x * bias,
          y: pointerCenter.y * (1 - bias) + centerScaled.y * bias,
        };
      } else {
        center2 = pointerCenter;
      }
    }
    center2 = this.deps.clampCenterWorld(center2, zInt2, s2, widthCSS, heightCSS);
    const { lng, lat } = worldToLngLat(center2.x, center2.y, zInt2, tileSize);
    map.center = { lng, lat: clampLat(lat) };
    map.zoom = zClamped;
    this.deps.requestRender();
  }

  setOptions(opts: {
    easeBaseMs?: number;
    easePerUnitMs?: number;
    easeMinMs?: number;
    easeMaxMs?: number;
  }) {
    if (Number.isFinite(opts.easeBaseMs as number))
      this.easeBaseMs = Math.max(40, Math.min(600, opts.easeBaseMs as number));
    if (Number.isFinite(opts.easePerUnitMs as number))
      this.easePerUnitMs = Math.max(0, Math.min(600, opts.easePerUnitMs as number));
    if (Number.isFinite(opts.easeMinMs as number))
      this.easeMinMs = Math.max(20, Math.min(600, opts.easeMinMs as number));
    if (Number.isFinite(opts.easeMaxMs as number))
      this.easeMaxMs = Math.max(40, Math.min(1200, opts.easeMaxMs as number));
  }
}
