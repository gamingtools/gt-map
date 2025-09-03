import type { RenderCtx } from '../types';
import { lngLatToWorld } from '../mercator';

export default class MapRenderer {
  private getCtx: () => RenderCtx;
  private hooks: {
    stepAnimation?: () => boolean;
    zoomVelocityTick?: () => void;
    prefetchNeighbors?: (
      z: number,
      tl: { x: number; y: number },
      scale: number,
      w: number,
      h: number,
    ) => void;
    cancelUnwanted?: () => void;
    clearWanted?: () => void;
  };

  constructor(getCtx: () => RenderCtx, hooks?: MapRenderer['hooks']) {
    this.getCtx = getCtx;
    this.hooks = hooks || {};
  }

  render() {
    const ctx: RenderCtx = this.getCtx();
    const opts = this.hooks;
    const gl: WebGLRenderingContext = ctx.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!(ctx.prog && ctx.loc && ctx.quad)) return;
    if (opts?.clearWanted) opts.clearWanted();
    if (opts?.stepAnimation) opts.stepAnimation();
    const zIntActual = Math.floor(ctx.zoom);
    const baseZ = zIntActual;
    const rect = ctx.container.getBoundingClientRect();
    const widthCSS = rect.width;
    const heightCSS = rect.height;
    const scale = Math.pow(2, ctx.zoom - baseZ);
    const centerWorld = lngLatToWorld(ctx.center.lng, ctx.center.lat, baseZ, ctx.tileSize);
    const tlWorld = {
      x: centerWorld.x - widthCSS / (2 * scale),
      y: centerWorld.y - heightCSS / (2 * scale),
    };
    gl.useProgram(ctx.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, ctx.quad);
    gl.enableVertexAttribArray((ctx.loc as any).a_pos);
    gl.vertexAttribPointer((ctx.loc as any).a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(
      (ctx.loc as any).u_resolution,
      (ctx.canvas as any).width,
      (ctx.canvas as any).height,
    );
    gl.uniform1i((ctx.loc as any).u_tex, 0);
    gl.uniform1f((ctx.loc as any).u_alpha, 1.0);
    gl.uniform2f((ctx.loc as any).u_uv0, 0.0, 0.0);
    gl.uniform2f((ctx.loc as any).u_uv1, 1.0, 1.0);
    if (opts?.zoomVelocityTick) opts.zoomVelocityTick();
    if (ctx.useScreenCache && ctx.screenCache)
      (ctx.screenCache as any).draw(
        { zInt: baseZ, scale, widthCSS, heightCSS, dpr: ctx.dpr, tlWorld },
        ctx.loc!,
        ctx.prog!,
        ctx.quad!,
        ctx.canvas,
      );
    const coverage = (ctx.raster as any).coverage(
      ctx.tileCache as any,
      baseZ,
      tlWorld,
      scale,
      widthCSS,
      heightCSS,
      ctx.wrapX,
      ctx.tileSize,
    );
    const zIntPrev = Math.max(ctx.minZoom, baseZ - 1);
    if (coverage < 0.995 && zIntPrev >= ctx.minZoom) {
      for (let lvl = zIntPrev; lvl >= ctx.minZoom; lvl--) {
        const centerL = lngLatToWorld(ctx.center.lng, ctx.center.lat, lvl, ctx.tileSize);
        const scaleL = Math.pow(2, ctx.zoom - lvl);
        const tlL = {
          x: centerL.x - widthCSS / (2 * scaleL),
          y: centerL.y - heightCSS / (2 * scaleL),
        };
        const covL = (ctx.raster as any).coverage(
          ctx.tileCache as any,
          lvl,
          tlL,
          scaleL,
          widthCSS,
          heightCSS,
          ctx.wrapX,
          ctx.tileSize,
        );
        (ctx.raster as any).drawTilesForLevel(
          ctx.loc! as any,
          ctx.tileCache as any,
          ctx.enqueueTile,
          {
            zLevel: lvl,
            tlWorld: tlL,
            scale: scaleL,
            dpr: ctx.dpr,
            widthCSS,
            heightCSS,
            wrapX: ctx.wrapX,
            tileSize: ctx.tileSize,
          },
        );
        if (covL >= 0.995) break;
      }
    }
    (ctx.raster as any).drawTilesForLevel(ctx.loc! as any, ctx.tileCache as any, ctx.enqueueTile, {
      zLevel: baseZ,
      tlWorld,
      scale,
      dpr: ctx.dpr,
      widthCSS,
      heightCSS,
      wrapX: ctx.wrapX,
      tileSize: ctx.tileSize,
    });
    if (opts?.prefetchNeighbors) opts.prefetchNeighbors(baseZ, tlWorld, scale, widthCSS, heightCSS);
    const zIntNext = Math.min(ctx.maxZoom, baseZ + 1);
    const frac = ctx.zoom - baseZ;
    if (zIntNext > baseZ && frac > 0) {
      const centerN = lngLatToWorld(ctx.center.lng, ctx.center.lat, zIntNext, ctx.tileSize);
      const scaleN = Math.pow(2, ctx.zoom - zIntNext);
      const tlN = {
        x: centerN.x - widthCSS / (2 * scaleN),
        y: centerN.y - heightCSS / (2 * scaleN),
      };
      gl.uniform1f((ctx.loc as any).u_alpha, Math.max(0, Math.min(1, frac)));
      (ctx.raster as any).drawTilesForLevel(
        ctx.loc! as any,
        ctx.tileCache as any,
        ctx.enqueueTile,
        {
          zLevel: zIntNext,
          tlWorld: tlN,
          scale: scaleN,
          dpr: ctx.dpr,
          widthCSS,
          heightCSS,
          wrapX: ctx.wrapX,
          tileSize: ctx.tileSize,
        },
      );
      gl.uniform1f((ctx.loc as any).u_alpha, 1.0);
    }
    if (ctx.useScreenCache && ctx.screenCache)
      (ctx.screenCache as any).update(
        { zInt: baseZ, scale, widthCSS, heightCSS, dpr: ctx.dpr, tlWorld },
        ctx.canvas,
      );
    if (opts?.cancelUnwanted) opts.cancelUnwanted();
  }
  dispose() {}
}
