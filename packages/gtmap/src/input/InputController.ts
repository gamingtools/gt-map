import type { InputDeps } from '../types';
import { DEBUG } from '../debug';

export default class InputController {
  private deps: InputDeps;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private over = false;
  private inertiaActive = false;
  private static readonly DEBUG = false;
  private _positions: Array<{ x: number; y: number }> = [];
  private _times: number[] = [];
  private lastTouchAt = 0;
  private touchState: null | {
    mode: 'pan' | 'pinch';
    x?: number;
    y?: number;
    cx?: number;
    cy?: number;
    dist?: number;
    startDist?: number;
    startZoom?: number;
    startCenter?: { x: number; y: number };
    // Leaflet-like pinch tracking
    centerPointCSS?: { x: number; y: number };
    pinchStartNative?: { x: number; y: number };
  } = null;
  private cleanup: (() => void) | null = null;
  private suppressInertiaUntil = 0;
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
      const zImg = deps.getImageMaxZoom();
      const s0 = Math.pow(2, zImg - zInt);
      const centerWorld = { x: view.center.lng / s0, y: view.center.lat / s0 };
      // record position for inertia
      this._pushSample(e.clientX - rect.left, e.clientY - rect.top);
      // update pointerAbs always while dragging; while idle, only when inside container
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const tl = { x: centerWorld.x - widthCSS / (2 * scale), y: centerWorld.y - heightCSS / (2 * scale) };
      const wx = tl.x + px / scale;
      const wy = tl.y + py / scale;
      const zAbs = Math.floor(zImg);
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
      if (DEBUG) try { console.debug('[center] drag', { lng: nx, lat: ny, z: view.zoom }); } catch {}
      deps.emit('move', { view: deps.getView() });
    };

    const onUp = (e: PointerEvent) => {
      if (!this.dragging) return;
      this.dragging = false;
      const rect = deps.getContainer().getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      deps.emit('pointerup', { x: px, y: py, view: deps.getView() });
      if (DEBUG) console.debug('[inertia] pointerup');
      this.inertiaActive = false;
      this._maybeStartInertia();
      if (this.inertiaActive) {
        if (DEBUG) console.debug('[inertia] started');
      } else {
        if (DEBUG) console.debug('[inertia] none; emitting moveend');
        deps.emit('moveend', { view: deps.getView() });
      }
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
      this.lastTouchAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      if (e.touches.length === 1) {
        this.touchState = { mode: 'pan', x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        this.lastTouchAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const dx = t1.clientX - t0.clientX;
        const dy = t1.clientY - t0.clientY;
        // Record starting zoom and center (keep center fixed during pinch like Leaflet 'center')
        const view = deps.getView();
        const startCenter = { x: view.center.lng, y: view.center.lat };
        const rect = deps.getContainer().getBoundingClientRect();
        const midPx = (t0.clientX + t1.clientX) / 2 - rect.left;
        const midPy = (t0.clientY + t1.clientY) / 2 - rect.top;
        // Compute the native-pixel latlng under the initial pinch midpoint
        const zInt = Math.floor(view.zoom);
        const scale = Math.pow(2, view.zoom - zInt);
        const widthCSS = rect.width, heightCSS = rect.height;
        const zImg = deps.getImageMaxZoom();
        const s0 = Math.pow(2, zImg - zInt);
        const centerWorld = { x: view.center.lng / s0, y: view.center.lat / s0 };
        const tlWorld = { x: centerWorld.x - widthCSS / (2 * scale), y: centerWorld.y - heightCSS / (2 * scale) };
        const midWorld = { x: tlWorld.x + midPx / scale, y: tlWorld.y + midPy / scale };
        const pinchStartNative = { x: midWorld.x * s0, y: midWorld.y * s0 };
        this.touchState = {
          mode: 'pinch',
          cx: (t0.clientX + t1.clientX) / 2,
          cy: (t0.clientY + t1.clientY) / 2,
          dist: Math.hypot(dx, dy),
          startDist: Math.hypot(dx, dy),
          startZoom: view.zoom,
          startCenter: startCenter,
          centerPointCSS: { x: widthCSS / 2, y: heightCSS / 2 },
          pinchStartNative,
        };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      this.lastTouchAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const touchState = this.touchState;
      if (!touchState) return;
      // If pinch transitioned to one finger, switch to pan smoothly
      if (touchState.mode === 'pinch' && e.touches.length === 1) {
        const t = e.touches[0];
        touchState.mode = 'pan';
        touchState.x = t.clientX;
        touchState.y = t.clientY;
        // Reset inertia samples to avoid a large throw from stale data
        this._positions = [];
        this._times = [];
        // Suppress inertia briefly after pinch
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        this.suppressInertiaUntil = now + 250;
        // Do not process as pan in the same frame
        e.preventDefault();
        return;
      }
      if (touchState.mode === 'pan' && e.touches.length === 1) {
        const t = e.touches[0];
        // Initialize baseline if missing (first pan frame)
        if (touchState.x == null || touchState.y == null) {
          touchState.x = t.clientX;
          touchState.y = t.clientY;
        }
        const dx = t.clientX - touchState.x;
        const dy = t.clientY - touchState.y;
        touchState.x = t.clientX;
        touchState.y = t.clientY;
        const view = deps.getView();
        const zInt = Math.floor(view.zoom);
        const rect = deps.getContainer().getBoundingClientRect();
        const scale = Math.pow(2, view.zoom - zInt);
        const widthCSS = rect.width,
          heightCSS = rect.height;
      const zImg = deps.getImageMaxZoom();
      const s0 = Math.pow(2, zImg - zInt);
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
        // Compute zoom relative to the starting pinch distance like Leaflet
        const startDist = touchState.startDist || dist;
        const startZoom = touchState.startZoom || deps.getView().zoom;
        const scale = Math.max(1e-6, dist / Math.max(1e-6, startDist));
        const nextZoom = startZoom + Math.log2(scale);
        deps.cancelZoomAnim();
        // Compute center similar to Leaflet's delta-from-center approach
        const rect = deps.getContainer().getBoundingClientRect();
        const widthCSS = rect.width, heightCSS = rect.height;
        const midPx = (t0.clientX + t1.clientX) / 2 - rect.left;
        const midPy = (t0.clientY + t1.clientY) / 2 - rect.top;
        const cp = touchState.centerPointCSS || { x: widthCSS / 2, y: heightCSS / 2 };
        const deltaCSS = { x: midPx - cp.x, y: midPy - cp.y };
        const zInt2 = Math.floor(nextZoom);
        const s2 = Math.pow(2, nextZoom - zInt2);
        const zImg = deps.getImageMaxZoom();
        const s2f = Math.pow(2, zImg - zInt2);
        const pinchStartNative = touchState.pinchStartNative || { x: deps.getView().center.lng, y: deps.getView().center.lat };
        const pinchStartWorld2 = { x: pinchStartNative.x / s2f, y: pinchStartNative.y / s2f };
        // Desired center in world coords at zInt2
        let centerWorld2 = { x: pinchStartWorld2.x - deltaCSS.x / s2, y: pinchStartWorld2.y - deltaCSS.y / s2 };
        // Clamp against bounds/finite world
        centerWorld2 = deps.clampCenterWorld(centerWorld2, zInt2, s2, widthCSS, heightCSS, true);
        const centerNative = { x: centerWorld2.x * s2f, y: centerWorld2.y * s2f };
        deps.setZoom(nextZoom);
        deps.setCenter(centerNative.x, centerNative.y);
        deps.emit('zoom', { view: deps.getView() });
        deps.emit('move', { view: deps.getView() });
        touchState.dist = dist;
      }
      e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      this.lastTouchAt = now;
      // If pinch was active or just ended, suppress inertia longer
      if (this.touchState?.mode === 'pinch' || (e.touches && e.touches.length === 0)) {
        this.suppressInertiaUntil = Math.max(this.suppressInertiaUntil, now + 300);
      }
      if (this.touchState?.mode === 'pan') this._maybeStartInertia();
      this.touchState = null;
      deps.emit('moveend', { view: deps.getView() });
      deps.emit('zoomend', { view: deps.getView() });
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
    // keep only last ~120ms (gives touch enough history to estimate velocity)
    while (this._positions.length > 1 && now - (this._times[0] || 0) > 120) {
      this._positions.shift(); this._times.shift();
    }
  }

  private _maybeStartInertia() {
    const deps = this.deps;
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (now < this.suppressInertiaUntil) return;
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
    const duration = Math.max(0.008, (lastT - firstT) / 1000);
    // very small windows produce noisy velocity; skip
    if (duration < 0.02) return;
    const dir = { x: last.x - first.x, y: last.y - first.y };
    // Require a small displacement minimum to avoid accidental throws
    const disp = Math.hypot(dir.x, dir.y);
    if (disp < 10) return;
    const speedVec = { x: (dir.x * ease) / duration, y: (dir.y * ease) / duration };
    const speed = Math.hypot(speedVec.x, speedVec.y);
    // On recent touch, cap inertia speed to a lower value for comfort
    const touchRecent = (now - this.lastTouchAt) < 250;
    // Allow a bit higher cap for deliberate touch flicks
    const localMax = touchRecent ? Math.min(maxSpeed, 1400) : maxSpeed;
    const limited = Math.min(localMax, speed);
    if (DEBUG) console.debug('[inertia] speed', { speed, limited, ease, decel, duration, samples: this._positions.length });
    if (!isFinite(limited) || limited <= 0) return;
    const scale = (limited / speed) || 0;
    const limitedVec = { x: speedVec.x * scale, y: speedVec.y * scale };
    let decelDuration = limited / (decel * ease);
    // Ensure touch throws are not too short
    if (touchRecent) decelDuration = Math.max(0.45, decelDuration);
    decelDuration = Math.min(1.5, decelDuration);
    // offset is negative half of deceleration impulse
    const offset = { x: Math.round(limitedVec.x * (-decelDuration / 2)), y: Math.round(limitedVec.y * (-decelDuration / 2)) };
    if (DEBUG) console.debug('[inertia] offset', { offset, decelDuration });
    if (!offset.x && !offset.y) return;
    this.inertiaActive = true;
    deps.startPanBy(offset.x, offset.y, decelDuration, ease);
    // reset samples
    this._positions = []; this._times = [];
  }
}
