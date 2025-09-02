// Zoom easing and anchored zoom helpers extracted from GTMap
import { lngLatToWorld, worldToLngLat, clampLat } from '../mercator';

export function startZoomEase(
  map: any,
  dz: number,
  px: number,
  py: number,
  anchor: 'pointer' | 'center',
) {
  const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  let current = map.zoom;
  if (map._zoomAnim) {
    const a = map._zoomAnim;
    const t = Math.min(1, (now - a.start) / a.dur);
    const ease = 1 - Math.pow(1 - t, 3);
    current = a.from + (a.to - a.from) * ease;
  }
  const to = Math.max(map.minZoom, Math.min(map.maxZoom, current + dz));
  const dist = Math.abs(to - current);
  const base = map.easeBaseMs; const per = map.easePerUnitMs; const raw = base + per * dist;
  const dur = Math.max(map.easeMinMs, Math.min(map.easeMaxMs, raw));
  map._zoomAnim = { from: current, to, px, py, start: now, dur, anchor };
  map._renderBaseLockZInt = Math.floor(current);
  map._needsRender = true;
}

export function zoomToAnchored(
  map: any,
  targetZoom: number,
  pxCSS: number,
  pyCSS: number,
  anchor: 'pointer' | 'center',
) {
  const zInt = Math.floor(map.zoom);
  const scale = Math.pow(2, map.zoom - zInt);
  const rect = map.container.getBoundingClientRect();
  const widthCSS = rect.width; const heightCSS = rect.height;
  const centerNow = lngLatToWorld(map.center.lng, map.center.lat, zInt);
  const tlWorld = { x: centerNow.x - widthCSS / (2 * scale), y: centerNow.y - heightCSS / (2 * scale) };
  const zClamped = Math.max(map.minZoom, Math.min(map.maxZoom, targetZoom));
  const zInt2 = Math.floor(zClamped); const s2 = Math.pow(2, zClamped - zInt2);
  // Override to center anchor when viewport would be larger than world (finite worlds)
  let anchorEff: 'pointer' | 'center' = anchor;
  if (!map.wrapX && map._shouldAnchorCenterForZoom?.(zClamped)) anchorEff = 'center';
  let center2;
  if (anchorEff === 'center') {
    const factor = Math.pow(2, zInt2 - zInt);
    center2 = { x: centerNow.x * factor, y: centerNow.y * factor };
  } else {
    const worldBefore = { x: tlWorld.x + pxCSS / scale, y: tlWorld.y + pyCSS / scale };
    const factor = Math.pow(2, zInt2 - zInt);
    const worldBefore2 = { x: worldBefore.x * factor, y: worldBefore.y * factor };
    const tl2 = { x: worldBefore2.x - pxCSS / s2, y: worldBefore2.y - pyCSS / s2 };
    const pointerCenter = { x: tl2.x + widthCSS / (2 * s2), y: tl2.y + heightCSS / (2 * s2) };
    // When zooming out, bias slightly toward keeping the visual center stable
    if (zClamped < map.zoom) {
      const centerScaled = { x: centerNow.x * factor, y: centerNow.y * factor };
      const dz = Math.max(0, map.zoom - zClamped);
      const bias = Math.max(0, Math.min(0.6, (map.outCenterBias ?? 0.15) * dz));
      center2 = { x: pointerCenter.x * (1 - bias) + centerScaled.x * bias, y: pointerCenter.y * (1 - bias) + centerScaled.y * bias };
    } else {
      center2 = pointerCenter;
    }
  }
  // Clamp center in world bounds (respect wrapX and freePan)
  center2 = map._clampCenterWorld(center2, zInt2, s2, widthCSS, heightCSS);
  const { lng, lat } = worldToLngLat(center2.x, center2.y, zInt2);
  map.center = { lng, lat: clampLat(lat) };
  map.zoom = zClamped;
  map._needsRender = true;
}

