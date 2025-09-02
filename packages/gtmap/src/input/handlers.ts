// Input handlers extracted from GTMap to keep mapgl.ts smaller.
// Internal module — expects a GTMap-like object; uses `any` for flexibility.

import { lngLatToWorld, worldToLngLat } from '../mercator';
import { normalizeWheel } from '../core/wheel';

export function attachHandlers(map: any): () => void {
  const canvas: HTMLCanvasElement = map.canvas;
  let dragging = false;
  let lastX = 0, lastY = 0;

  const onDown = (e: PointerEvent) => {
    dragging = true;
    map._movedSinceDown = false;
    lastX = e.clientX;
    lastY = e.clientY;
    try { canvas.setPointerCapture((e as any).pointerId); } catch {}
    const rect = map.container.getBoundingClientRect();
    const px = e.clientX - rect.left; const py = e.clientY - rect.top;
    map._events?.emit?.('pointerdown', { x: px, y: py, center: map.center, zoom: map.zoom });
  };

  const onMove = (e: PointerEvent) => {
    map._lastInteractAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const zInt = Math.floor(map.zoom);
    const rect = map.container.getBoundingClientRect();
    const scale = Math.pow(2, map.zoom - zInt);
    const widthCSS = rect.width, heightCSS = rect.height;
    const centerWorld = lngLatToWorld(map.center.lng, map.center.lat, zInt);
    const tl = { x: centerWorld.x - widthCSS / (2 * scale), y: centerWorld.y - heightCSS / (2 * scale) };
    // update pointerAbs always
    const px = e.clientX - rect.left; const py = e.clientY - rect.top;
    const wx = tl.x + px / scale; const wy = tl.y + py / scale; const zAbs = Math.floor(map.maxZoom);
    const factor = Math.pow(2, zAbs - zInt); map.pointerAbs = { x: wx * factor, y: wy * factor };
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
    const newTL = { x: tl.x - dx / scale, y: tl.y - dy / scale };
    let newCenter = { x: newTL.x + widthCSS / (2 * scale), y: newTL.y + heightCSS / (2 * scale) };
    newCenter = map._clampCenterWorld(newCenter, zInt, scale, widthCSS, heightCSS);
    const { lng, lat } = worldToLngLat(newCenter.x, newCenter.y, zInt);
    map.setCenter(lng, lat);
    map._movedSinceDown = true;
    map._events?.emit?.('move', { center: map.center, zoom: map.zoom });
  };

  const onUp = (e: PointerEvent) => {
    if (!dragging) return; dragging = false;
    const rect = map.container.getBoundingClientRect();
    const px = e.clientX - rect.left; const py = e.clientY - rect.top;
    map._events?.emit?.('pointerup', { x: px, y: py, center: map.center, zoom: map.zoom });
    if (map._movedSinceDown) map._events?.emit?.('moveend', { center: map.center, zoom: map.zoom });
    else map._events?.emit?.('click', { x: px, y: py, center: map.center, zoom: map.zoom });
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    map._lastInteractAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const lines = normalizeWheel(e, map.canvas.height);
    if (!Number.isFinite(lines)) return;
    const rect = map.container.getBoundingClientRect();
    const px = e.clientX - rect.left; const py = e.clientY - rect.top;
    const ctrl = !!(e as any).ctrlKey;
    const step = ctrl ? (map.wheelImmediateCtrl || map.wheelImmediate || 0.16) : (map.wheelImmediate || 0.16);
    let dz = -lines * step; dz = Math.max(-2.0, Math.min(2.0, dz));
    map._startZoomEase(dz, px, py, map.anchorMode);
    map._events?.emit?.('zoom', { center: map.center, zoom: map.zoom });
  };

  const onResize = () => map.resize();

  // Touch pinch & pan
  let touchState: null | { mode: 'pan' | 'pinch'; x?: number; y?: number; cx?: number; cy?: number; dist?: number } = null;
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      touchState = { mode: 'pan', x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const t0 = e.touches[0]; const t1 = e.touches[1];
      const dx = t1.clientX - t0.clientX; const dy = t1.clientY - t0.clientY;
      touchState = { mode: 'pinch', cx: (t0.clientX + t1.clientX) / 2, cy: (t0.clientY + t1.clientY) / 2, dist: Math.hypot(dx, dy) };
    }
  };
  const onTouchMove = (e: TouchEvent) => {
    if (!touchState) return;
    if (touchState.mode === 'pan' && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - (touchState.x || 0); const dy = t.clientY - (touchState.y || 0);
      touchState.x = t.clientX; touchState.y = t.clientY;
      const zInt = Math.floor(map.zoom);
      const rect = map.container.getBoundingClientRect();
      const scale = Math.pow(2, map.zoom - zInt);
      const widthCSS = rect.width, heightCSS = rect.height;
      const centerWorld = lngLatToWorld(map.center.lng, map.center.lat, zInt);
      const tl = { x: centerWorld.x - widthCSS / (2 * scale), y: centerWorld.y - heightCSS / (2 * scale) };
      let newCenter = { x: tl.x - dx / scale + widthCSS / (2 * scale), y: tl.y - dy / scale + heightCSS / (2 * scale) };
      newCenter = map._clampCenterWorld(newCenter, zInt, scale, widthCSS, heightCSS);
      const { lng, lat } = worldToLngLat(newCenter.x, newCenter.y, zInt);
      map.setCenter(lng, lat);
      map._events?.emit?.('move', { center: map.center, zoom: map.zoom });
    } else if (touchState.mode === 'pinch' && e.touches.length === 2) {
      const t0 = e.touches[0]; const t1 = e.touches[1];
      const dx = t1.clientX - t0.clientX; const dy = t1.clientY - t0.clientY;
      const dist = Math.hypot(dx, dy);
      const scaleDelta = Math.log2(dist / (touchState.dist || dist));
      const rect = map.container.getBoundingClientRect();
      const px = ((t0.clientX + t1.clientX) / 2) - rect.left;
      const py = ((t0.clientY + t1.clientY) / 2) - rect.top;
      map._zoomAnim = null;
      map._zoomToAnchored(map.zoom + scaleDelta, px, py, map.anchorMode);
      map._events?.emit?.('zoom', { center: map.center, zoom: map.zoom });
      touchState.dist = dist;
    }
    e.preventDefault();
  };
  const onTouchEnd = () => { touchState = null; map._events?.emit?.('moveend', { center: map.center, zoom: map.zoom }); };

  // Wire
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false } as any);
  canvas.addEventListener('touchstart', onTouchStart as any, { passive: false } as any);
  canvas.addEventListener('touchmove', onTouchMove as any, { passive: false } as any);
  canvas.addEventListener('touchend', onTouchEnd as any);
  window.addEventListener('resize', onResize);

  // Return cleanup
  return () => {
    canvas.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('wheel', onWheel as any);
    canvas.removeEventListener('touchstart', onTouchStart as any);
    canvas.removeEventListener('touchmove', onTouchMove as any);
    canvas.removeEventListener('touchend', onTouchEnd as any);
    window.removeEventListener('resize', onResize);
  };
}

