import type { ProgramLocs } from '../render/screen-cache';
import type { UpscaleFilterMode } from '../../api/types';
import { tileKey as tileKeyOf, wrapX as wrapXTile } from '../tiles/source';
import * as Coords from '../coords';

type TileCacheLike = {
  get(key: string): { status: 'ready' | 'loading' | 'error'; tex?: WebGLTexture; width?: number; height?: number } | undefined;
  has(key: string): boolean;
};

export class RasterRenderer {
  private gl: WebGLRenderingContext;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }

  /** Draw a single full-image texture (single-image mode). */
  drawImage(
    loc: ProgramLocs,
    params: {
      texture: WebGLTexture;
      translateCss: { x: number; y: number };
      sizeCss: { width: number; height: number };
      dpr: number;
      imageWidth: number;
      imageHeight: number;
      filterMode?: UpscaleFilterMode;
    },
  ) {
    const { gl } = this;
    const { texture, translateCss, sizeCss, dpr, imageWidth, imageHeight, filterMode } = params;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const translatePx = { x: translateCss.x * dpr, y: translateCss.y * dpr };
    const sizePx = { width: sizeCss.width * dpr, height: sizeCss.height * dpr };

    gl.uniform2f(loc.u_translate!, translatePx.x, translatePx.y);
    gl.uniform2f(loc.u_size!, Math.max(1, sizePx.width), Math.max(1, sizePx.height));
    gl.uniform2f(loc.u_uv0!, 0, 0);
    gl.uniform2f(loc.u_uv1!, 1, 1);
    gl.uniform1i(loc.u_tex!, 0);

    if (loc.u_texel) gl.uniform2f(loc.u_texel, 1 / Math.max(1, imageWidth), 1 / Math.max(1, imageHeight));

    let mode = 0;
    if (filterMode === 'bicubic') mode = 1;
    else if (filterMode === 'auto') {
      const upscaleX = sizeCss.width / Math.max(1, imageWidth);
      const upscaleY = sizeCss.height / Math.max(1, imageHeight);
      if (upscaleX > 1.01 || upscaleY > 1.01) mode = 1;
    }
    if (loc.u_filterMode) gl.uniform1i(loc.u_filterMode, mode);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** Draw tiles for a single zoom level (tile pyramid mode). */
  drawTilesForLevel(
    loc: ProgramLocs,
    tileCache: TileCacheLike,
    enqueueTile: (z: number, x: number, y: number, priority?: number) => void,
    params: {
      zLevel: number;
      tlWorld: { x: number; y: number };
      scale: number;
      dpr: number;
      widthCSS: number;
      heightCSS: number;
      wrapX: boolean;
      tileSize: number;
      mapSize?: { width: number; height: number };
      zMax?: number;
      sourceMaxZoom?: number;
      filterMode?: 'auto' | 'linear' | 'bicubic';
      wantTileKey?: (key: string) => void;
    },
  ) {
    const gl = this.gl;
    const { zLevel, tlWorld, scale, dpr, widthCSS, heightCSS, wrapX, tileSize, mapSize: imageSize, zMax, sourceMaxZoom, filterMode } = params;
    const TS = tileSize;
    const startX = Math.floor(tlWorld.x / TS);
    const startY = Math.floor(tlWorld.y / TS);
    const endX = Math.floor((tlWorld.x + widthCSS / scale) / TS) + 1;
    const endY = Math.floor((tlWorld.y + heightCSS / scale) / TS) + 1;

    let tilesX = Infinity;
    let tilesY = Infinity;
    const imgMax = (typeof sourceMaxZoom === 'number' ? sourceMaxZoom : zMax) as number | undefined;
    if (imageSize && typeof imgMax === 'number') {
      const s = Coords.sFor(imgMax, zLevel);
      const levelW = Math.ceil(imageSize.width / s);
      const levelH = Math.ceil(imageSize.height / s);
      tilesX = Math.ceil(levelW / TS);
      tilesY = Math.ceil(levelH / TS);
    }

    for (let ty = startY; ty <= endY; ty++) {
      if (!Number.isFinite(tilesY)) {
        if (ty < 0 || ty >= 1 << zLevel) continue;
      } else {
        if (ty < 0 || ty >= tilesY) continue;
      }
      for (let tx = startX; tx <= endX; tx++) {
        if (!Number.isFinite(tilesX)) {
          if (!wrapX && (tx < 0 || tx >= 1 << zLevel)) continue;
        } else {
          if (tx < 0 || tx >= tilesX) continue;
        }
        const tileX = wrapX && !Number.isFinite(tilesX) ? wrapXTile(tx, zLevel) : tx;
        const wx = tx * TS;
        const wy = ty * TS;
        let sxCSS = (wx - tlWorld.x) * scale;
        const syCSS = (wy - tlWorld.y) * scale;
        if (wrapX && !Number.isFinite(tilesX) && tileX !== tx) {
          const dxTiles = tx - tileX;
          sxCSS -= dxTiles * TS * scale;
        }
        if (typeof sourceMaxZoom === 'number' && zLevel > sourceMaxZoom) continue;
        const key = tileKeyOf(zLevel, tileX, ty);
        try {
          params.wantTileKey?.(key);
        } catch {}
        const rec = tileCache.get(key);
        if (!rec) enqueueTile(zLevel, tileX, ty, 0);
        if (rec?.status === 'ready' && rec.tex) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, rec.tex);
          const leftPx = Math.round(sxCSS * dpr);
          const topPx = Math.round(syCSS * dpr);
          const rightPx = Math.round((sxCSS + TS * scale) * dpr);
          const bottomPx = Math.round((syCSS + TS * scale) * dpr);
          const wPx = Math.max(1, rightPx - leftPx);
          const hPx = Math.max(1, bottomPx - topPx);
          gl.uniform2f(loc.u_translate!, leftPx, topPx);
          gl.uniform2f(loc.u_size!, wPx, hPx);
          const texW = Math.max(1, rec.width || TS);
          const texH = Math.max(1, rec.height || TS);
          const upscaleX = wPx / dpr / texW;
          const upscaleY = hPx / dpr / texH;
          let modeInt = 0;
          if (filterMode === 'bicubic') modeInt = 1;
          else if (filterMode === 'auto') {
            const isUpscale = upscaleX > 1.01 || upscaleY > 1.01;
            modeInt = isUpscale ? 1 : 0;
          } else {
            modeInt = 0;
          }
          if (loc.u_texel) gl.uniform2f(loc.u_texel, 1.0 / texW, 1.0 / texH);
          if (loc.u_filterMode) gl.uniform1i(loc.u_filterMode, modeInt);
          gl.uniform2f(loc.u_uv0!, 0.0, 0.0);
          gl.uniform2f(loc.u_uv1!, 1.0, 1.0);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }
    }
  }

  /** Compute tile coverage ratio for a zoom level in the current viewport. */
  coverage(
    tileCache: TileCacheLike,
    zLevel: number,
    tlWorld: { x: number; y: number },
    scale: number,
    widthCSS: number,
    heightCSS: number,
    wrapX: boolean,
    tileSize: number,
    mapSize?: { width: number; height: number },
    zMax?: number,
    sourceMaxZoom?: number,
  ): number {
    const TS = tileSize;
    const startX = Math.floor(tlWorld.x / TS);
    const startY = Math.floor(tlWorld.y / TS);
    const endX = Math.floor((tlWorld.x + widthCSS / scale) / TS) + 1;
    const endY = Math.floor((tlWorld.y + heightCSS / scale) / TS) + 1;
    let total = 0;
    let ready = 0;
    let tilesX = Infinity;
    let tilesY = Infinity;
    const imageSize = mapSize;
    const imgMax = (typeof sourceMaxZoom === 'number' ? sourceMaxZoom : zMax) as number | undefined;
    if (imageSize && typeof imgMax === 'number') {
      const s = Coords.sFor(imgMax, zLevel);
      const levelW = Math.ceil(imageSize.width / s);
      const levelH = Math.ceil(imageSize.height / s);
      tilesX = Math.ceil(levelW / TS);
      tilesY = Math.ceil(levelH / TS);
    }
    for (let ty = startY; ty <= endY; ty++) {
      if (!Number.isFinite(tilesY)) {
        if (ty < 0 || ty >= 1 << zLevel) continue;
      } else {
        if (ty < 0 || ty >= tilesY) continue;
      }
      for (let tx = startX; tx <= endX; tx++) {
        let tileX = tx;
        if (!Number.isFinite(tilesX)) {
          if (wrapX) tileX = wrapXTile(tx, zLevel);
          else if (tx < 0 || tx >= 1 << zLevel) continue;
        } else {
          if (tx < 0 || tx >= tilesX) continue;
        }
        total++;
        const key = tileKeyOf(zLevel, tileX, ty);
        const rec = tileCache.get(key);
        if (rec?.status === 'ready') ready++;
      }
    }
    if (total === 0) return 1;
    return ready / total;
  }
}
