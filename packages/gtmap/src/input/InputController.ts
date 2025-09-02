import { lngLatToWorld, worldToLngLat } from '../mercator';
import { normalizeWheel } from '../core/wheel';
import type { InputDeps } from '../types';

export default class InputController {
  private deps: InputDeps;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private touchState: null | { mode: 'pan' | 'pinch'; x?: number; y?: number; cx?: number; cy?: number; dist?: number } = null;
  private cleanup: (() => void) | null = null;

  constructor(deps: InputDeps) {
    this.deps = deps;
  }

  attach() {
    if (this.cleanup) return this.cleanup;
    const deps = this.deps;
    const canvas: HTMLCanvasElement = deps.getCanvas();

    const onDown = (e: PointerEvent) => {
      this.dragging = true;
      deps.cancelZoomAnim();
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      try { canvas.setPointerCapture((e as any).pointerId); } catch {}
      const rect = deps.getContainer().getBoundingClientRect();
      const px = e.clientX - rect.left; const py = e.clientY - rect.top;
      deps.emit('pointerdown', { x: px, y: py, view: deps.getView() });
    };

    const onMove = (e: PointerEvent) => {
      deps.setLastInteractAt((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());
      const view = deps.getView(); const zInt = Math.floor(view.zoom);
      const rect = deps.getContainer().getBoundingClientRect();
      const scale = Math.pow(2, view.zoom - zInt);
      const widthCSS = rect.width, heightCSS = rect.height;
      const centerWorld = lngLatToWorld(view.center.lng, view.center.lat, zInt);
      const tl = { x: centerWorld.x - widthCSS / (2 * scale), y: centerWorld.y - heightCSS / (2 * scale) };
      // update pointerAbs always
      const px = e.clientX - rect.left; const py = e.clientY - rect.top;
      const wx = tl.x + px / scale; const wy = tl.y + py / scale; const zAbs = Math.floor(deps.getMaxZoom());
      const factor = Math.pow(2, zAbs - zInt); deps.updatePointerAbs(wx * factor, wy * factor);
      if (!this.dragging) return;
      const dx = e.clientX - this.lastX, dy = e.clientY - this.lastY; this.lastX = e.clientX; this.lastY = e.clientY;
      const newTL = { x: tl.x - dx / scale, y: tl.y - dy / scale };
      let newCenter = { x: newTL.x + widthCSS / (2 * scale), y: newTL.y + heightCSS / (2 * scale) };
      newCenter = deps.clampCenterWorld(newCenter, zInt, scale, widthCSS, heightCSS);
      const { lng, lat } = worldToLngLat(newCenter.x, newCenter.y, zInt);
      deps.setCenter(lng, lat);
      deps.emit('move', { view: deps.getView() });
    };

    const onUp = (e: PointerEvent) => {
      if (!this.dragging) return; this.dragging = false;
      const rect = deps.getContainer().getBoundingClientRect();
      const px = e.clientX - rect.left; const py = e.clientY - rect.top;
      deps.emit('pointerup', { x: px, y: py, view: deps.getView() });
      deps.emit('moveend', { view: deps.getView() });
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      deps.setLastInteractAt((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());
      const lines = normalizeWheel(e, deps.getCanvas().height);
      if (!Number.isFinite(lines)) return;
      const rect = deps.getContainer().getBoundingClientRect();
      const px = e.clientX - rect.left; const py = e.clientY - rect.top;
      const ctrl = !!(e as any).ctrlKey;
      const step = deps.getWheelStep(ctrl);
      let dz = -lines * step; dz = Math.max(-2.0, Math.min(2.0, dz));
      deps.startEase(dz, px, py, deps.getAnchorMode());
      deps.emit('zoom', { view: deps.getView() });
    };

    const onResize = () => { /* noop */ };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        this.touchState = { mode: 'pan', x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const t0 = e.touches[0]; const t1 = e.touches[1];
        const dx = t1.clientX - t0.clientX; const dy = t1.clientY - t0.clientY;
        this.touchState = { mode: 'pinch', cx: (t0.clientX + t1.clientX) / 2, cy: (t0.clientY + t1.clientY) / 2, dist: Math.hypot(dx, dy) };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      const touchState = this.touchState; if (!touchState) return;
      if (touchState.mode === 'pan' && e.touches.length === 1) {
        const t = e.touches[0];
        const dx = t.clientX - (touchState.x || 0); const dy = t.clientY - (touchState.y || 0);
        touchState.x = t.clientX; touchState.y = t.clientY;
        const view = deps.getView(); const zInt = Math.floor(view.zoom);
        const rect = deps.getContainer().getBoundingClientRect();
        const scale = Math.pow(2, view.zoom - zInt);
        const widthCSS = rect.width, heightCSS = rect.height;
        const centerWorld = lngLatToWorld(view.center.lng, view.center.lat, zInt);
        const tl = { x: centerWorld.x - widthCSS / (2 * scale), y: centerWorld.y - heightCSS / (2 * scale) };
        let newCenter = { x: tl.x - dx / scale + widthCSS / (2 * scale), y: tl.y - dy / scale + heightCSS / (2 * scale) };
        newCenter = deps.clampCenterWorld(newCenter, zInt, scale, widthCSS, heightCSS);
        const { lng, lat } = worldToLngLat(newCenter.x, newCenter.y, zInt);
        deps.setCenter(lng, lat);
        deps.emit('move', { view: deps.getView() });
      } else if (touchState.mode === 'pinch' && e.touches.length === 2) {
        const t0 = e.touches[0]; const t1 = e.touches[1];
        const dx = t1.clientX - t0.clientX; const dy = t1.clientY - t0.clientY;
        const dist = Math.hypot(dx, dy);
        const scaleDelta = Math.log2(dist / (touchState.dist || dist));
        const rect = deps.getContainer().getBoundingClientRect();
        const px = ((t0.clientX + t1.clientX) / 2) - rect.left;
        const py = ((t0.clientY + t1.clientY) / 2) - rect.top;
        deps.cancelZoomAnim();
        const v3 = deps.getView(); deps.applyAnchoredZoom(v3.zoom + scaleDelta, px, py, deps.getAnchorMode());
        deps.emit('zoom', { view: deps.getView() });
        touchState.dist = dist;
      }
      e.preventDefault();
    };
    const onTouchEnd = () => { this.touchState = null; deps.emit('moveend', { view: deps.getView() }); };

    // Wire listeners
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false } as any);
    canvas.addEventListener('touchstart', onTouchStart as any, { passive: false } as any);
    canvas.addEventListener('touchmove', onTouchMove as any, { passive: false } as any);
    canvas.addEventListener('touchend', onTouchEnd as any);
    window.addEventListener('resize', onResize);

    this.cleanup = () => {
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('wheel', onWheel as any);
      canvas.removeEventListener('touchstart', onTouchStart as any);
      canvas.removeEventListener('touchmove', onTouchMove as any);
      canvas.removeEventListener('touchend', onTouchEnd as any);
      window.removeEventListener('resize', onResize);
    };
    return this.cleanup;
  }

  dispose() {
    try { this.cleanup?.(); } finally { this.cleanup = null; this.dragging = false; this.touchState = null; }
  }
}
