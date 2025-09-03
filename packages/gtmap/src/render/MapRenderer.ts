import type { RenderCtx } from '../types';

export default class MapRenderer {
  private getCtx: () => RenderCtx;
  private hooks: {
    stepAnimation?: () => boolean;
    zoomVelocityTick?: () => void;
    panVelocityTick?: () => void;
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
    const centerWorld = (ctx as any).project(ctx.center.lng, ctx.center.lat, baseZ);
    let tlWorld = {
      x: centerWorld.x - widthCSS / (2 * scale),
      y: centerWorld.y - heightCSS / (2 * scale),
    };
    // Snap tlWorld to device pixel grid to stabilize sampling during pan
    const snap = (v: number) => Math.round(v * scale * ctx.dpr) / (scale * ctx.dpr);
    tlWorld = { x: snap(tlWorld.x), y: snap(tlWorld.y) };
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
    if (opts?.panVelocityTick) opts.panVelocityTick();
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
      (ctx as any).mapSize,
      ctx.maxZoom,
    );
    const zIntPrev = Math.max(ctx.minZoom, baseZ - 1);
    if (coverage < 0.995 && zIntPrev >= ctx.minZoom) {
      for (let lvl = zIntPrev; lvl >= ctx.minZoom; lvl--) {
        const centerL = (ctx as any).project(ctx.center.lng, ctx.center.lat, lvl);
        const scaleL = Math.pow(2, ctx.zoom - lvl);
        let tlL = {
          x: centerL.x - widthCSS / (2 * scaleL),
          y: centerL.y - heightCSS / (2 * scaleL),
        };
        const snapL = (v: number) => Math.round(v * scaleL * ctx.dpr) / (scaleL * ctx.dpr);
        tlL = { x: snapL(tlL.x), y: snapL(tlL.y) };
        const covL = (ctx.raster as any).coverage(
          ctx.tileCache as any,
          lvl,
          tlL,
          scaleL,
          widthCSS,
          heightCSS,
          ctx.wrapX,
          ctx.tileSize,
          (ctx as any).mapSize,
          ctx.maxZoom,
        );
        // Backfill lower levels at full raster opacity
        gl.uniform1f((ctx.loc as any).u_alpha, Math.max(0, Math.min(1, (ctx as any).rasterOpacity ?? 1.0)));
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
            mapSize: (ctx as any).mapSize,
            zMax: ctx.maxZoom,
            sourceMaxZoom: (ctx as any).sourceMaxZoom,
          },
        );
        if (covL >= 0.995) break;
      }
    }
    // Base level draw at raster opacity
    gl.uniform1f((ctx.loc as any).u_alpha, Math.max(0, Math.min(1, (ctx as any).rasterOpacity ?? 1.0)));
    (ctx.raster as any).drawTilesForLevel(ctx.loc! as any, ctx.tileCache as any, ctx.enqueueTile, {
      zLevel: baseZ,
      tlWorld,
      scale,
      dpr: ctx.dpr,
      widthCSS,
      heightCSS,
      wrapX: ctx.wrapX,
      tileSize: ctx.tileSize,
      mapSize: (ctx as any).mapSize,
      zMax: ctx.maxZoom,
      sourceMaxZoom: (ctx as any).sourceMaxZoom,
      filterMode: (ctx as any).upscaleFilter || 'auto',
    });
    if (opts?.prefetchNeighbors) opts.prefetchNeighbors(baseZ, tlWorld, scale, widthCSS, heightCSS);
    const zIntNext = Math.min(ctx.maxZoom, baseZ + 1);
    const frac = ctx.zoom - baseZ;
    if (zIntNext > baseZ && frac > 0) {
      const centerN = (ctx as any).project(ctx.center.lng, ctx.center.lat, zIntNext);
      const scaleN = Math.pow(2, ctx.zoom - zIntNext);
      let tlN = {
        x: centerN.x - widthCSS / (2 * scaleN),
        y: centerN.y - heightCSS / (2 * scaleN),
      };
      const snapN = (v: number) => Math.round(v * scaleN * ctx.dpr) / (scaleN * ctx.dpr);
      tlN = { x: snapN(tlN.x), y: snapN(tlN.y) };
      const baseAlpha = Math.max(0, Math.min(1, frac));
      const layerAlpha = Math.max(0, Math.min(1, (ctx as any).rasterOpacity ?? 1.0));
      gl.uniform1f((ctx.loc as any).u_alpha, baseAlpha * layerAlpha);
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
          mapSize: (ctx as any).mapSize,
          zMax: ctx.maxZoom,
          sourceMaxZoom: (ctx as any).sourceMaxZoom,
          filterMode: (ctx as any).upscaleFilter || 'auto',
        },
      );
      gl.uniform1f((ctx.loc as any).u_alpha, 1.0);
    }

    // Draw icon markers after all tile layers so they are not faded by blended tiles
    if ((ctx as any).icons) {
      // Ensure alpha is 1 for icons
      gl.uniform1f((ctx.loc as any).u_alpha, 1.0);
      // Icons use native texture filtering
      if ((ctx.loc as any).u_filterMode) gl.uniform1i((ctx.loc as any).u_filterMode, 0);
      (ctx as any).icons.draw({
        gl: ctx.gl,
        prog: ctx.prog,
        loc: ctx.loc,
        quad: ctx.quad,
        canvas: ctx.canvas,
        dpr: ctx.dpr,
        tileSize: ctx.tileSize,
        zoom: ctx.zoom,
        center: ctx.center,
        container: ctx.container,
        project: (x: number, y: number, z: number) => (ctx as any).project(x, y, z),
        wrapX: ctx.wrapX,
      });
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
