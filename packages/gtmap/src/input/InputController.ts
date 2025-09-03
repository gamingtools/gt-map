import type { InputDeps } from '../types';

export default class InputController {
  private deps: InputDeps;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private over = false;
  private _positions: Array<{ x: number; y: number }> = [];
  private _times: number[] = [];
  private touchState: null | {
    mode: 'pan' | 'pinch';
    x?: number;
    y?: number;
    cx?: number;
    cy?: number;
    dist?: number;
  } = null;
  private cleanup: (() => void) | null = null;
  private static normalizeWheel(e: WheelEvent, canvasHeight: number): number {
    const lineHeight = 16;
    if ((e as any).deltaMode === 1) return (e as any).deltaY;
    if ((e as any).deltaMode === 2) return ((e as any).deltaY * canvasHeight) / lineHeight;
    return (e as any).deltaY / lineHeight;
  }

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
      deps.cancelPanAnim();
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      // no-op: timestamp reserved for future averaging
      this._positions = []; this._times = []; deps.cancelPanAnim();
      try {
        canvas.setPointerCapture((e as any).pointerId);
      } catch {}
      const rect = deps.getContainer().getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      deps.emit('pointerdown', { x: px, y: py, view: deps.getView() });
    };

    const onMove = (e: PointerEvent) => {
      deps.setLastInteractAt(
        typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(),
      );
      const view = deps.getView();
      const zInt = Math.floor(view.zoom);
      const rect = deps.getContainer().getBoundingClientRect();
      const scale = Math.pow(2, view.zoom - zInt);
      // screen-locked panning while dragging (Leaflet-like)
      const widthCSS = rect.width,
        heightCSS = rect.height;
      const zMax = deps.getMaxZoom();
      const s0 = Math.pow(2, zMax - zInt);
      const centerWorld = { x: view.center.lng / s0, y: view.center.lat / s0 };
      // record position for inertia
      this._pushSample(e.clientX - rect.left, e.clientY - rect.top);
      // update pointerAbs always while dragging; while idle, only when inside container
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const tl = { x: centerWorld.x - widthCSS / (2 * scale), y: centerWorld.y - heightCSS / (2 * scale) };
      const wx = tl.x + px / scale;
      const wy = tl.y + py / scale;
      const zAbs = Math.floor(zMax);
      const factor = Math.pow(2, zAbs - zInt);
      const inside = px >= 0 && py >= 0 && px <= widthCSS && py <= heightCSS;
      if (this.dragging) {
        deps.updatePointerAbs(wx * factor, wy * factor);
        try { deps.emit('pointermove', { x: px, y: py, view: deps.getView() }); } catch {}
      } else {
        if (inside) {
          deps.updatePointerAbs(wx * factor, wy * factor);
          this.over = true;
          try { deps.emit('pointermove', { x: px, y: py, view: deps.getView() }); } catch {}
        } else if (this.over) {
          deps.updatePointerAbs(null, null);
          this.over = false;
          try { deps.emit('pointermove', { x: -1, y: -1, view: deps.getView() }); } catch {}
        }
      }
      if (!this.dragging) return;
      const dx = e.clientX - this.lastX,
        dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      // screen-locked pan while dragging: shift center by dx/scale
      let newCenter = { x: centerWorld.x - dx / scale, y: centerWorld.y - dy / scale };
      
      newCenter = deps.clampCenterWorld(newCenter, zInt, scale, widthCSS, heightCSS, true);
      const nx = newCenter.x * s0;
      const ny = newCenter.y * s0;
      deps.setCenter(nx, ny);
      deps.emit('move', { view: deps.getView() });
    };

    const onUp = (e: PointerEvent) => {
      if (!this.dragging) return;
      this.dragging = false;
      const rect = deps.getContainer().getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      deps.emit('pointerup', { x: px, y: py, view: deps.getView() });
      this._maybeStartInertia();
      deps.emit('moveend', { view: deps.getView() });
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      deps.setLastInteractAt(
        typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(),
      );
      const lines = InputController.normalizeWheel(e, deps.getCanvas().height);
      if (!Number.isFinite(lines)) return;
      const rect = deps.getContainer().getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const ctrl = !!(e as any).ctrlKey;
      const step = deps.getWheelStep(ctrl);
      let dz = -lines * step;
      dz = Math.max(-2.0, Math.min(2.0, dz));
      deps.cancelPanAnim();
      deps.startEase(dz, px, py, deps.getAnchorMode());
      deps.emit('zoom', { view: deps.getView() });
    };

    const onResize = () => {
      /* noop */
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        this.touchState = { mode: 'pan', x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const dx = t1.clientX - t0.clientX;
        const dy = t1.clientY - t0.clientY;
        this.touchState = {
          mode: 'pinch',
          cx: (t0.clientX + t1.clientX) / 2,
          cy: (t0.clientY + t1.clientY) / 2,
          dist: Math.hypot(dx, dy),
        };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      const touchState = this.touchState;
      if (!touchState) return;
      if (touchState.mode === 'pan' && e.touches.length === 1) {
        const t = e.touches[0];
        const dx = t.clientX - (touchState.x || 0);
        const dy = t.clientY - (touchState.y || 0);
        touchState.x = t.clientX;
        touchState.y = t.clientY;
        const view = deps.getView();
        const zInt = Math.floor(view.zoom);
        const rect = deps.getContainer().getBoundingClientRect();
        const scale = Math.pow(2, view.zoom - zInt);
        const widthCSS = rect.width,
          heightCSS = rect.height;
        const zMax = deps.getMaxZoom();
        const s0 = Math.pow(2, zMax - zInt);
        const centerWorld = { x: view.center.lng / s0, y: view.center.lat / s0 };
        this._pushSample(t.clientX - rect.left, t.clientY - rect.top);
        let newCenter = { x: centerWorld.x - dx / scale, y: centerWorld.y - dy / scale };
        
        newCenter = deps.clampCenterWorld(newCenter, zInt, scale, widthCSS, heightCSS, true);
        const nx = newCenter.x * s0;
        const ny = newCenter.y * s0;
        deps.setCenter(nx, ny);
        deps.emit('move', { view: deps.getView() });
      } else if (touchState.mode === 'pinch' && e.touches.length === 2) {
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const dx = t1.clientX - t0.clientX;
        const dy = t1.clientY - t0.clientY;
        const dist = Math.hypot(dx, dy);
        const scaleDelta = Math.log2(dist / (touchState.dist || dist));
        const rect = deps.getContainer().getBoundingClientRect();
        const px = (t0.clientX + t1.clientX) / 2 - rect.left;
        const py = (t0.clientY + t1.clientY) / 2 - rect.top;
        deps.cancelZoomAnim();
        const v3 = deps.getView();
        deps.applyAnchoredZoom(v3.zoom + scaleDelta, px, py, deps.getAnchorMode());
        deps.emit('zoom', { view: deps.getView() });
        touchState.dist = dist;
      }
      e.preventDefault();
    };
    const onTouchEnd = () => {
      if (this.touchState?.mode === 'pan') this._maybeStartInertia();
      this.touchState = null;
      deps.emit('moveend', { view: deps.getView() });
    };

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
    try {
      this.cleanup?.();
    } finally {
      this.cleanup = null;
      this.dragging = false;
      this.touchState = null;
    }
  }

  private _pushSample(x: number, y: number) {
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    this._positions.push({ x, y });
    this._times.push(now);
    // keep only last ~50ms
    while (this._positions.length > 1 && now - (this._times[0] || 0) > 50) {
      this._positions.shift(); this._times.shift();
    }
  }

  private _maybeStartInertia() {
    const deps = this.deps;
    if (!deps.getInertia() || this._times.length < 2) return;
    const ease = deps.getEaseLinearity();
    const maxSpeed = deps.getInertiaMaxSpeed();
    const decel = deps.getInertiaDecel();
    const lastIdx = this._positions.length - 1;
    const firstIdx = 0;
    const last = this._positions[lastIdx];
    const first = this._positions[firstIdx];
    const lastT = this._times[lastIdx];
    const firstT = this._times[firstIdx];
    const duration = Math.max(0.001, (lastT - firstT) / 1000);
    const dir = { x: last.x - first.x, y: last.y - first.y };
    const speedVec = { x: (dir.x * ease) / duration, y: (dir.y * ease) / duration };
    const speed = Math.hypot(speedVec.x, speedVec.y);
    const limited = Math.min(maxSpeed, speed);
    if (!isFinite(limited) || limited <= 0) return;
    const scale = (limited / speed) || 0;
    const limitedVec = { x: speedVec.x * scale, y: speedVec.y * scale };
    const decelDuration = limited / (decel * ease);
    // offset is negative half of deceleration impulse
    const offset = { x: Math.round(limitedVec.x * (-decelDuration / 2)), y: Math.round(limitedVec.y * (-decelDuration / 2)) };
    if (!offset.x && !offset.y) return;
    deps.startPanBy(offset.x, offset.y, decelDuration, ease);
    // reset samples
    this._positions = []; this._times = [];
  }
}
