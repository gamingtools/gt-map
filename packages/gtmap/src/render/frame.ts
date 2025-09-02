import { lngLatToWorld } from '../mercator';

import { drawGrid } from './grid';

export function renderFrame(map: any, opts?: { stepAnimation?: () => boolean }) {
  const gl: WebGLRenderingContext = map.gl;
  gl.clear(gl.COLOR_BUFFER_BIT);
  if (!map._prog || !map._loc || !map._quad) return;
  map._wantedKeys.clear();
  if (opts?.stepAnimation) opts.stepAnimation();
  const zIntActual = Math.floor(map.zoom);
  const baseZ = map._renderBaseLockZInt ?? zIntActual;
  const rect = map.container.getBoundingClientRect();
  const widthCSS = rect.width;
  const heightCSS = rect.height;
  const scale = Math.pow(2, map.zoom - baseZ);
  const centerWorld = lngLatToWorld(map.center.lng, map.center.lat, baseZ);
  const tlWorld = { x: centerWorld.x - widthCSS / (2 * scale), y: centerWorld.y - heightCSS / (2 * scale) };

  // Setup program/state
  gl.useProgram(map._prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, map._quad);
  gl.enableVertexAttribArray(map._loc.a_pos);
  gl.vertexAttribPointer(map._loc.a_pos, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(map._loc.u_resolution, map.canvas.width, map.canvas.height);
  gl.uniform1i(map._loc.u_tex, 0);
  gl.uniform1f(map._loc.u_alpha, 1.0);
  gl.uniform2f(map._loc.u_uv0!, 0.0, 0.0);
  gl.uniform2f(map._loc.u_uv1!, 1.0, 1.0);

  // (velocity tail path)
  if (Math.abs(map._zoomVel) > 1e-4) {
    const dt = Math.max(0.0005, Math.min(0.1, map._dt || 1 / 60));
    const maxStep = Math.max(0.0001, map.maxZoomRate * dt);
    let step = map._zoomVel * dt; step = Math.max(-maxStep, Math.min(maxStep, step));
    const anchor = map._wheelAnchor?.mode || map.anchorMode; const px = map._wheelAnchor?.px ?? 0; const py = map._wheelAnchor?.py ?? 0;
    map._zoomToAnchored(map.zoom + step, px, py, anchor);
    const k = Math.exp(-dt / map.zoomDamping); map._zoomVel *= k; if (Math.abs(map._zoomVel) < 1e-3) map._zoomVel = 0;
  }

  if (map.useScreenCache && map._screenCache)
    map._screenCache.draw({ zInt: baseZ, scale, widthCSS, heightCSS, dpr: map._dpr, tlWorld }, map._loc!, map._prog!, map._quad!, map.canvas);
  const coverage = map._raster.coverage(map._tileCache as any, baseZ, tlWorld, scale, widthCSS, heightCSS, map.wrapX);
  const zIntPrev = Math.max(map.minZoom, baseZ - 1);
  if (coverage < 0.995 && zIntPrev >= map.minZoom) {
    for (let lvl = zIntPrev; lvl >= map.minZoom; lvl--) {
      const centerL = lngLatToWorld(map.center.lng, map.center.lat, lvl);
      const scaleL = Math.pow(2, map.zoom - lvl);
      const tlL = { x: centerL.x - widthCSS / (2 * scaleL), y: centerL.y - heightCSS / (2 * scaleL) };
      const covL = map._raster.coverage(map._tileCache as any, lvl, tlL, scaleL, widthCSS, heightCSS, map.wrapX);
      map._raster.drawTilesForLevel(map._loc! as any, map._tileCache as any, map._enqueueTile.bind(map), { zLevel: lvl, tlWorld: tlL, scale: scaleL, dpr: map._dpr, widthCSS, heightCSS, wrapX: map.wrapX });
      if (covL >= 0.995) break;
    }
  }
  map._raster.drawTilesForLevel(map._loc! as any, map._tileCache as any, map._enqueueTile.bind(map), { zLevel: baseZ, tlWorld, scale, dpr: map._dpr, widthCSS, heightCSS, wrapX: map.wrapX });

  // Prefetch neighbors around current view
  map._prefetchNeighbors(baseZ, tlWorld, scale, widthCSS, heightCSS);

  const zIntNext = Math.min(map.maxZoom, baseZ + 1); const frac = map.zoom - baseZ;
  if (zIntNext > baseZ && frac > 0) {
    const centerN = lngLatToWorld(map.center.lng, map.center.lat, zIntNext); const scaleN = Math.pow(2, map.zoom - zIntNext);
    const tlN = { x: centerN.x - widthCSS / (2 * scaleN), y: centerN.y - heightCSS / (2 * scaleN) };
    gl.uniform1f(map._loc.u_alpha!, Math.max(0, Math.min(1, frac)));
    map._raster.drawTilesForLevel(map._loc! as any, map._tileCache as any, map._enqueueTile.bind(map), { zLevel: zIntNext, tlWorld: tlN, scale: scaleN, dpr: map._dpr, widthCSS, heightCSS, wrapX: map.wrapX });
    gl.uniform1f(map._loc.u_alpha!, 1.0);
  }
  if (map.showGrid) drawGrid(map._gridCtx, map.gridCanvas, baseZ, scale, widthCSS, heightCSS, tlWorld, map._dpr, map.maxZoom);
  if (map.useScreenCache && map._screenCache)
    map._screenCache.update({ zInt: baseZ, scale, widthCSS, heightCSS, dpr: map._dpr, tlWorld }, map.canvas);
  map._cancelUnwantedLoads();
}
