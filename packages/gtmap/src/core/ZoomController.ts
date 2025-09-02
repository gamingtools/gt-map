import type { ZoomDeps } from '../types';

import { zoomToAnchored as coreZoomToAnchored } from './zoom';

export default class ZoomController {
  private deps: ZoomDeps;
  private easeBaseMs = 150;
  private easePerUnitMs = 240;
  private easeMinMs = 120;
  private easeMaxMs = 420;
  private zoomAnim: null | { from: number; to: number; px: number; py: number; start: number; dur: number; anchor: 'pointer' | 'center' } = null;

  constructor(deps: ZoomDeps) { this.deps = deps; }
  isAnimating(): boolean { return !!this.zoomAnim; }
  cancel() { this.zoomAnim = null; }
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
    if (t >= 1) { this.zoomAnim = null; this.deps.emit('zoomend', {}); }
    return true;
  }

  applyAnchoredZoom(targetZoom: number, px: number, py: number, anchor: 'pointer' | 'center') {
    const anchorEff: 'pointer' | 'center' = (!this.deps.getMap().wrapX && this.deps.shouldAnchorCenterForZoom(targetZoom)) ? 'center' : anchor;
    coreZoomToAnchored(
      this.deps.getMap(),
      targetZoom,
      px,
      py,
      anchorEff,
      this.deps.getOutCenterBias(),
      (cw, zInt, s, w, h) => this.deps.clampCenterWorld(cw, zInt, s, w, h),
      () => this.deps.requestRender(),
      this.deps.getTileSize(),
    );
  }

  setOptions(opts: { easeBaseMs?: number; easePerUnitMs?: number; easeMinMs?: number; easeMaxMs?: number }) {
    if (Number.isFinite(opts.easeBaseMs as number)) this.easeBaseMs = Math.max(40, Math.min(600, opts.easeBaseMs as number));
    if (Number.isFinite(opts.easePerUnitMs as number)) this.easePerUnitMs = Math.max(0, Math.min(600, opts.easePerUnitMs as number));
    if (Number.isFinite(opts.easeMinMs as number)) this.easeMinMs = Math.max(20, Math.min(600, opts.easeMinMs as number));
    if (Number.isFinite(opts.easeMaxMs as number)) this.easeMaxMs = Math.max(40, Math.min(1200, opts.easeMaxMs as number));
  }
}
