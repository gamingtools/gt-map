import type { RenderCtx } from '../types';
import * as Coords from '../coords';

export default class MapRenderer {
  private getCtx: () => RenderCtx;
  private hooks: {
    stepAnimation?: () => boolean;
    zoomVelocityTick?: () => void;
    panVelocityTick?: () => void;
    prefetchNeighbors?: (z: number, tl: { x: number; y: number }, scale: number, w: number, h: number) => void;
    cancelUnwanted?: () => void;
    clearWanted?: () => void;
  };
  private iconsUnlocked = false;
  // Hysteresis for level-wide filter decisions to prevent flicker near scale ~= 1
  private static readonly FILTER_ENTER = 1.02;
  private static readonly FILTER_EXIT = 0.99;

  constructor(
    getCtx: () => RenderCtx,
    hooks?: {
      stepAnimation?: () => boolean;
      zoomVelocityTick?: () => void;
      panVelocityTick?: () => void;
      prefetchNeighbors?: (z: number, tl: { x: number; y: number }, scale: number, w: number, h: number) => void;
      cancelUnwanted?: () => void;
      clearWanted?: () => void;
    },
  ) {
    this.getCtx = getCtx;
    this.hooks = hooks || {};
  }

  render() {
    const ctx = this.getCtx();
    const gl = ctx.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!(ctx.prog && ctx.loc && ctx.quad)) return;

    if (this.hooks.clearWanted) this.hooks.clearWanted();
    this.hooks.stepAnimation?.();
    this.hooks.zoomVelocityTick?.();
    this.hooks.panVelocityTick?.();

    gl.useProgram(ctx.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, ctx.quad);
    gl.enableVertexAttribArray(ctx.loc.a_pos);
    gl.vertexAttribPointer(ctx.loc.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(ctx.loc.u_resolution!, ctx.canvas.width, ctx.canvas.height);
    gl.uniform1i(ctx.loc.u_tex!, 0);
    gl.uniform1f(ctx.loc.u_alpha!, 1.0);

    const rect = ctx.container.getBoundingClientRect();
    const widthCSS = rect.width;
    const heightCSS = rect.height;
    const { zInt: baseZ, scale: levelScale } = Coords.zParts(ctx.zoom);
    const centerLevel = ctx.project(ctx.center.lng, ctx.center.lat, baseZ);
    let tlLevel = Coords.tlLevelFor(centerLevel, ctx.zoom, { x: widthCSS, y: heightCSS });
    const snap = (v: number) => Coords.snapLevelToDevice(v, levelScale, ctx.dpr);
    tlLevel = { x: snap(tlLevel.x), y: snap(tlLevel.y) };

    // Branch: tile mode vs single-image mode
    if (ctx.tileCache && ctx.tileSize != null && ctx.sourceMaxZoom != null && ctx.enqueueTile) {
      this.renderTiles(ctx, gl, baseZ, levelScale, widthCSS, heightCSS, tlLevel);
    } else {
      this.renderImage(ctx, gl, baseZ, levelScale, widthCSS, heightCSS, tlLevel);
    }

    // Draw vectors and markers with z-ordering
    const hasVectors = ctx.vectorZIndices && ctx.vectorZIndices.length > 0 && ctx.drawVectorOverlay;
    const hasIcons = ctx.icons && this.iconsUnlocked;

    if (hasIcons) {
      gl.uniform1f(ctx.loc.u_alpha!, 1.0);
      if (ctx.loc.u_filterMode) gl.uniform1i(ctx.loc.u_filterMode, 0);
      ctx.icons!.draw({
        gl: ctx.gl,
        prog: ctx.prog,
        loc: ctx.loc,
        quad: ctx.quad,
        canvas: ctx.canvas,
        dpr: ctx.dpr,
        zoom: ctx.zoom,
        center: ctx.center,
        minZoom: ctx.minZoom,
        maxZoom: ctx.maxZoom,
        container: ctx.container,
        viewport: { width: widthCSS, height: heightCSS },
        project: (x: number, y: number, z: number) => ctx.project(x, y, z),
        wrapX: ctx.wrapX,
        iconScaleFunction: ctx.iconScaleFunction ?? undefined,
        drawOverlayAtZ: ctx.drawVectorOverlay ? () => ctx.drawVectorOverlay!() : undefined,
        overlayZIndices: ctx.vectorZIndices,
      });
    } else if (hasVectors) {
      ctx.drawVectorOverlay!();
    }

    if (ctx.useScreenCache && ctx.screenCache) {
      ctx.screenCache.update({ zInt: baseZ, scale: levelScale, tlWorld: tlLevel, widthCSS, heightCSS, dpr: ctx.dpr }, ctx.canvas);
    }
    if (this.hooks.cancelUnwanted) this.hooks.cancelUnwanted();
  }

  /** Single-image rendering path (existing behavior). */
  private renderImage(
    ctx: RenderCtx,
    gl: WebGLRenderingContext,
    baseZ: number,
    levelScale: number,
    widthCSS: number,
    heightCSS: number,
    tlLevel: { x: number; y: number },
  ) {
    if (ctx.useScreenCache && ctx.screenCache) {
      ctx.screenCache.draw({ zInt: baseZ, scale: levelScale, tlWorld: tlLevel, widthCSS, heightCSS, dpr: ctx.dpr }, ctx.loc, ctx.prog, ctx.quad, ctx.canvas);
    }

    const imageReady = ctx.image.ready && !!ctx.image.texture;
    if (imageReady) {
      const tlWorld = Coords.levelToWorld(tlLevel, ctx.imageMaxZoom, baseZ);
      const scaleWorldToCss = Math.pow(2, ctx.zoom - ctx.imageMaxZoom);
      const translateCssBase = {
        x: -tlWorld.x * scaleWorldToCss,
        y: -tlWorld.y * scaleWorldToCss,
      };
      const sizeCss = {
        width: ctx.mapSize.width * scaleWorldToCss,
        height: ctx.mapSize.height * scaleWorldToCss,
      };
      const alpha = Math.max(0, Math.min(1, ctx.rasterOpacity ?? 1));
      gl.uniform1f(ctx.loc.u_alpha!, alpha);
      const draw = (offsetX: number) => {
        ctx.raster.drawImage(ctx.loc, {
          texture: ctx.image.texture!,
          translateCss: { x: translateCssBase.x + offsetX, y: translateCssBase.y },
          sizeCss,
          dpr: ctx.dpr,
          imageWidth: ctx.image.width,
          imageHeight: ctx.image.height,
          filterMode: ctx.upscaleFilter,
        });
      };
      if (ctx.wrapX) {
        const worldWidthCss = ctx.mapSize.width * scaleWorldToCss;
        const viewportWorldWidth = widthCSS / Math.max(1e-6, scaleWorldToCss);
        const start = Math.floor(Coords.levelToWorld(tlLevel, ctx.imageMaxZoom, baseZ).x / ctx.mapSize.width) - 1;
        const end = Math.floor((Coords.levelToWorld(tlLevel, ctx.imageMaxZoom, baseZ).x + viewportWorldWidth) / ctx.mapSize.width) + 1;
        for (let i = start; i <= end; i++) {
          draw(i * worldWidthCss);
        }
      } else {
        draw(0);
      }
      this.iconsUnlocked = true;
    }
  }

  /** Tile pyramid rendering path. */
  private renderTiles(
    ctx: RenderCtx,
    gl: WebGLRenderingContext,
    baseZ: number,
    scale: number,
    widthCSS: number,
    heightCSS: number,
    tlWorld: { x: number; y: number },
  ) {
    const loc = ctx.loc;
    const tileCache = ctx.tileCache!;
    const tileSize = ctx.tileSize!;
    const sourceMaxZoom = ctx.sourceMaxZoom!;
    const enqueueTile = ctx.enqueueTile!;
    // idle state is handled by the tile pipeline's process() method

    // Screen cache with scissor clipping to map extent
    if (ctx.useScreenCache && ctx.screenCache) {
      const imgMax = sourceMaxZoom;
      const sLvl = Coords.sFor(imgMax, baseZ);
      const levelW = ctx.mapSize.width / sLvl;
      const levelH = ctx.mapSize.height / sLvl;
      const mapLeftCSS = -tlWorld.x * scale;
      const mapTopCSS = -tlWorld.y * scale;
      const mapRightCSS = (levelW - tlWorld.x) * scale;
      const mapBottomCSS = (levelH - tlWorld.y) * scale;
      const cutLeft = Math.max(0, mapLeftCSS);
      const cutTop = Math.max(0, mapTopCSS);
      const cutRight = Math.min(widthCSS, mapRightCSS);
      const cutBottom = Math.min(heightCSS, mapBottomCSS);
      if (cutRight > cutLeft && cutBottom > cutTop) {
        const scX = Math.max(0, Math.round(cutLeft * ctx.dpr));
        const scY = Math.max(0, Math.round((heightCSS - cutBottom) * ctx.dpr));
        const scW = Math.max(0, Math.round((cutRight - cutLeft) * ctx.dpr));
        const scH = Math.max(0, Math.round((cutBottom - cutTop) * ctx.dpr));
        const prevScissor = gl.isEnabled ? gl.isEnabled(gl.SCISSOR_TEST) : false;
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(scX, scY, scW, scH);
        ctx.screenCache.draw({ zInt: baseZ, scale, widthCSS, heightCSS, dpr: ctx.dpr, tlWorld }, loc, ctx.prog, ctx.quad, ctx.canvas);
        if (!prevScissor) gl.disable(gl.SCISSOR_TEST);
      }
    }

    const coverage = ctx.raster.coverage(tileCache, baseZ, tlWorld, scale, widthCSS, heightCSS, ctx.wrapX, tileSize, ctx.mapSize, ctx.maxZoom, sourceMaxZoom);
    if (!this.iconsUnlocked && coverage >= 0.5) this.iconsUnlocked = true;

    const frac = ctx.zoom - baseZ;
    const zIntPrev = Math.max(ctx.minZoom, baseZ - 1);
    const zIntNext = Math.min(ctx.maxZoom, baseZ + 1);

    // Backfill lower LODs if coverage is insufficient
    if (coverage < 0.995 && zIntPrev >= ctx.minZoom) {
      for (let lvl = zIntPrev; lvl >= ctx.minZoom; lvl--) {
        const centerL = ctx.project(ctx.center.lng, ctx.center.lat, lvl);
        const scaleL = Coords.scaleAtLevel(ctx.zoom, lvl);
        let tlL = Coords.tlLevelForWithScale(centerL, scaleL, { x: widthCSS, y: heightCSS });
        const snapL = (v: number) => Coords.snapLevelToDevice(v, scaleL, ctx.dpr);
        tlL = { x: snapL(tlL.x), y: snapL(tlL.y) };
        const covL = ctx.raster.coverage(tileCache, lvl, tlL, scaleL, widthCSS, heightCSS, ctx.wrapX, tileSize, ctx.mapSize, ctx.maxZoom, sourceMaxZoom);
        gl.uniform1f(loc.u_alpha!, Math.max(0, Math.min(1, ctx.rasterOpacity ?? 1.0)));
        ctx.raster.drawTilesForLevel(loc, tileCache, enqueueTile, {
          zLevel: lvl,
          tlWorld: tlL,
          scale: scaleL,
          dpr: ctx.dpr,
          widthCSS,
          heightCSS,
          wrapX: ctx.wrapX,
          tileSize,
          mapSize: ctx.mapSize,
          zMax: ctx.maxZoom,
          sourceMaxZoom,
          filterMode: this.levelFilter(scaleL),
          wantTileKey: ctx.wantTileKey,
        });
        if (covL >= 0.995) break;
      }
    }

    // Draw base level
    const layerAlpha = Math.max(0, Math.min(1, ctx.rasterOpacity ?? 1.0));
    gl.uniform1f(loc.u_alpha!, layerAlpha);
    ctx.raster.drawTilesForLevel(loc, tileCache, enqueueTile, {
      zLevel: baseZ,
      tlWorld,
      scale,
      dpr: ctx.dpr,
      widthCSS,
      heightCSS,
      wrapX: ctx.wrapX,
      tileSize,
      mapSize: ctx.mapSize,
      zMax: ctx.maxZoom,
      sourceMaxZoom,
      filterMode: this.levelFilter(scale),
      wantTileKey: ctx.wantTileKey,
    });

    // Prefetch neighbors
    if (this.hooks.prefetchNeighbors) this.hooks.prefetchNeighbors(baseZ, tlWorld, scale, widthCSS, heightCSS);

    // z+1 overlay blending during fractional zoom
    if (zIntNext > baseZ && frac > 0) {
      const centerN = ctx.project(ctx.center.lng, ctx.center.lat, zIntNext);
      const scaleN = Coords.scaleAtLevel(ctx.zoom, zIntNext);
      let tlN = Coords.tlLevelForWithScale(centerN, scaleN, { x: widthCSS, y: heightCSS });
      const snapN = (v: number) => Coords.snapLevelToDevice(v, scaleN, ctx.dpr);
      tlN = { x: snapN(tlN.x), y: snapN(tlN.y) };
      const nextCoverage = ctx.raster.coverage(tileCache, zIntNext, tlN, scaleN, widthCSS, heightCSS, ctx.wrapX, tileSize, ctx.mapSize, ctx.maxZoom, sourceMaxZoom);
      if (nextCoverage > 0.35) {
        gl.uniform1f(loc.u_alpha!, layerAlpha);
        ctx.raster.drawTilesForLevel(loc, tileCache, enqueueTile, {
          zLevel: zIntNext,
          tlWorld: tlN,
          scale: scaleN,
          dpr: ctx.dpr,
          widthCSS,
          heightCSS,
          wrapX: ctx.wrapX,
          tileSize,
          mapSize: ctx.mapSize,
          zMax: ctx.maxZoom,
          sourceMaxZoom,
          filterMode: this.levelFilter(scaleN),
          wantTileKey: ctx.wantTileKey,
        });
        gl.uniform1f(loc.u_alpha!, 1.0);
      }
    }
  }

  private levelFilter(scale: number): 'linear' | 'bicubic' {
    const enter = MapRenderer.FILTER_ENTER;
    const exit = MapRenderer.FILTER_EXIT;
    if (scale > enter) return 'bicubic';
    if (scale < exit) return 'linear';
    return 'bicubic';
  }

  dispose() {}
}
