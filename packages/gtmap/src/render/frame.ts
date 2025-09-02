import { lngLatToWorld } from '../mercator';
import type { RenderCtx } from '../types';
// import { drawGrid } from './grid';

export function renderFrame(
  ctx: RenderCtx,
  opts?: {
    stepAnimation?: () => boolean;
    zoomVelocityTick?: () => void;
    prefetchNeighbors?: (zLevel: number, tlWorld: { x: number; y: number }, scale: number, widthCSS: number, heightCSS: number) => void;
    cancelUnwanted?: () => void;
    clearWanted?: () => void;
  },
) {
  const gl: WebGLRenderingContext = ctx.gl;
  gl.clear(gl.COLOR_BUFFER_BIT);
  if (!ctx.prog || !ctx.loc || !ctx.quad) return;
  if (opts?.clearWanted) opts.clearWanted();
  if (opts?.stepAnimation) opts.stepAnimation();
  const zIntActual = Math.floor(ctx.zoom);
  const baseZ = zIntActual; // base lock handled upstream during easing
  const rect = ctx.container.getBoundingClientRect();
  const widthCSS = rect.width;
  const heightCSS = rect.height;
  const scale = Math.pow(2, ctx.zoom - baseZ);
  const centerWorld = lngLatToWorld(ctx.center.lng, ctx.center.lat, baseZ);
  const tlWorld = { x: centerWorld.x - widthCSS / (2 * scale), y: centerWorld.y - heightCSS / (2 * scale) };

  // Setup program/state
  gl.useProgram(ctx.prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, ctx.quad);
  gl.enableVertexAttribArray(ctx.loc.a_pos);
  gl.vertexAttribPointer(ctx.loc.a_pos, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(ctx.loc.u_resolution, ctx.canvas.width, ctx.canvas.height);
  gl.uniform1i(ctx.loc.u_tex, 0);
  gl.uniform1f(ctx.loc.u_alpha, 1.0);
  gl.uniform2f(ctx.loc.u_uv0!, 0.0, 0.0);
  gl.uniform2f(ctx.loc.u_uv1!, 1.0, 1.0);

  // (velocity tail path)
  if (opts?.zoomVelocityTick) opts.zoomVelocityTick();

  if (ctx.useScreenCache && ctx.screenCache)
    ctx.screenCache.draw({ zInt: baseZ, scale, widthCSS, heightCSS, dpr: ctx.dpr, tlWorld }, ctx.loc!, ctx.prog!, ctx.quad!, ctx.canvas);
  const coverage = ctx.raster.coverage(ctx.tileCache as any, baseZ, tlWorld, scale, widthCSS, heightCSS, ctx.wrapX);
  const zIntPrev = Math.max(ctx.minZoom, baseZ - 1);
  if (coverage < 0.995 && zIntPrev >= ctx.minZoom) {
    for (let lvl = zIntPrev; lvl >= ctx.minZoom; lvl--) {
      const centerL = lngLatToWorld(ctx.center.lng, ctx.center.lat, lvl);
      const scaleL = Math.pow(2, ctx.zoom - lvl);
      const tlL = { x: centerL.x - widthCSS / (2 * scaleL), y: centerL.y - heightCSS / (2 * scaleL) };
      const covL = ctx.raster.coverage(ctx.tileCache as any, lvl, tlL, scaleL, widthCSS, heightCSS, ctx.wrapX);
      ctx.raster.drawTilesForLevel(ctx.loc! as any, ctx.tileCache as any, ctx.enqueueTile, { zLevel: lvl, tlWorld: tlL, scale: scaleL, dpr: ctx.dpr, widthCSS, heightCSS, wrapX: ctx.wrapX });
      if (covL >= 0.995) break;
    }
  }
  ctx.raster.drawTilesForLevel(ctx.loc! as any, ctx.tileCache as any, ctx.enqueueTile, { zLevel: baseZ, tlWorld, scale, dpr: ctx.dpr, widthCSS, heightCSS, wrapX: ctx.wrapX });

  // Prefetch neighbors around current view
  if (opts?.prefetchNeighbors) opts.prefetchNeighbors(baseZ, tlWorld, scale, widthCSS, heightCSS);

  const zIntNext = Math.min(ctx.maxZoom, baseZ + 1); const frac = ctx.zoom - baseZ;
  if (zIntNext > baseZ && frac > 0) {
    const centerN = lngLatToWorld(ctx.center.lng, ctx.center.lat, zIntNext); const scaleN = Math.pow(2, ctx.zoom - zIntNext);
    const tlN = { x: centerN.x - widthCSS / (2 * scaleN), y: centerN.y - heightCSS / (2 * scaleN) };
    gl.uniform1f(ctx.loc.u_alpha!, Math.max(0, Math.min(1, frac)));
    ctx.raster.drawTilesForLevel(ctx.loc! as any, ctx.tileCache as any, ctx.enqueueTile, { zLevel: zIntNext, tlWorld: tlN, scale: scaleN, dpr: ctx.dpr, widthCSS, heightCSS, wrapX: ctx.wrapX });
    gl.uniform1f(ctx.loc.u_alpha!, 1.0);
  }
  // Grid overlay (optional): context provides canvas/container if needed
  // drawGrid(map._gridCtx, map.gridCanvas, baseZ, scale, widthCSS, heightCSS, tlWorld, ctx.dpr, ctx.maxZoom);
  if (ctx.useScreenCache && ctx.screenCache)
    ctx.screenCache.update({ zInt: baseZ, scale, widthCSS, heightCSS, dpr: ctx.dpr, tlWorld }, ctx.canvas);
  if (opts?.cancelUnwanted) opts.cancelUnwanted();
}
