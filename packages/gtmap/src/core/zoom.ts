// Zoom easing and anchored zoom helpers extracted from GTMap
import { lngLatToWorld, worldToLngLat, clampLat } from '../mercator';

// startZoomEase moved to ZoomController where easing options live

export function zoomToAnchored(
  map: any,
  targetZoom: number,
  pxCSS: number,
  pyCSS: number,
  anchorEff: 'pointer' | 'center',
  outCenterBias: number,
  clampCenterWorld: (centerWorld: { x: number; y: number }, zInt: number, scale: number, widthCSS: number, heightCSS: number) => { x: number; y: number },
  requestRender: () => void,
  tileSize: number,
) {
  const zInt = Math.floor(map.zoom);
  const scale = Math.pow(2, map.zoom - zInt);
  const rect = map.container.getBoundingClientRect();
  const widthCSS = rect.width; const heightCSS = rect.height;
  const centerNow = lngLatToWorld(map.center.lng, map.center.lat, zInt, tileSize);
  const tlWorld = { x: centerNow.x - widthCSS / (2 * scale), y: centerNow.y - heightCSS / (2 * scale) };
  const zClamped = Math.max(map.minZoom, Math.min(map.maxZoom, targetZoom));
  const zInt2 = Math.floor(zClamped); const s2 = Math.pow(2, zClamped - zInt2);
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
      const bias = Math.max(0, Math.min(0.6, (outCenterBias ?? 0.15) * dz));
      center2 = { x: pointerCenter.x * (1 - bias) + centerScaled.x * bias, y: pointerCenter.y * (1 - bias) + centerScaled.y * bias };
    } else {
      center2 = pointerCenter;
    }
  }
  // Clamp center in world bounds (respect wrapX and freePan)
  center2 = clampCenterWorld(center2, zInt2, s2, widthCSS, heightCSS);
  const { lng, lat } = worldToLngLat(center2.x, center2.y, zInt2, tileSize);
  map.center = { lng, lat: clampLat(lat) };
  map.zoom = zClamped;
  requestRender();
}
