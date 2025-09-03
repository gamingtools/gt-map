import type { ProgramLocs } from '../render/screenCache';
// per-level tile size provided via params
import { tileKey as tileKeyOf, wrapX as wrapXTile } from '../tiles/source';

type TileCacheLike = {
  get(key: string): { status: 'ready' | 'loading' | 'error'; tex?: WebGLTexture } | undefined;
  has(key: string): boolean;
};

export class RasterRenderer {
  private gl: WebGLRenderingContext;
  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }

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
    },
  ) {
    const gl = this.gl;
    const { zLevel, tlWorld, scale, dpr, widthCSS, heightCSS, wrapX, tileSize, mapSize: imageSize, zMax, sourceMaxZoom } = params as any;
    const TS = tileSize;
    const startX = Math.floor(tlWorld.x / TS);
    const startY = Math.floor(tlWorld.y / TS);
    const endX = Math.floor((tlWorld.x + widthCSS / scale) / TS) + 1;
    const endY = Math.floor((tlWorld.y + heightCSS / scale) / TS) + 1;
    const tilePixelSizeCSS = TS * scale;
    const tilePixelSize = tilePixelSizeCSS * dpr;

    // Limit tile ranges for finite, possibly non-square images
    let tilesX = Infinity;
    let tilesY = Infinity;
    if (imageSize && typeof zMax === 'number') {
      const s = Math.pow(2, zMax - zLevel);
      const levelW = Math.ceil(imageSize.width / s);
      const levelH = Math.ceil(imageSize.height / s);
      tilesX = Math.ceil(levelW / TS);
      tilesY = Math.ceil(levelH / TS);
    }

    for (let ty = startY; ty <= endY; ty++) {
      if (!Number.isFinite(tilesY)) { if (ty < 0 || ty >= 1 << zLevel) continue; } else { if (ty < 0 || ty >= tilesY) continue; }
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
        const rec = tileCache.get(key);
        if (!rec) enqueueTile(zLevel, tileX, ty, 0);
        if (rec?.status === 'ready' && rec.tex) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, rec.tex);
          // Compute edges in device pixels, then derive integer-aligned width/height.
          // This prevents 1px gaps during zoom from per-tile rounding error.
          const leftPx = Math.round(sxCSS * dpr);
          const topPx = Math.round(syCSS * dpr);
          const rightPx = Math.round((sxCSS + TS * scale) * dpr);
          const bottomPx = Math.round((syCSS + TS * scale) * dpr);
          const wPx = Math.max(1, rightPx - leftPx);
          const hPx = Math.max(1, bottomPx - topPx);
          gl.uniform2f(loc.u_translate!, leftPx, topPx);
          gl.uniform2f(loc.u_size!, wPx, hPx);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }
    }
  }

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
    const imageSize = mapSize as any;
    if (imageSize && typeof zMax === 'number') {
      const s = Math.pow(2, zMax - zLevel);
      const levelW = Math.ceil(imageSize.width / s);
      const levelH = Math.ceil(imageSize.height / s);
      tilesX = Math.ceil(levelW / TS);
      tilesY = Math.ceil(levelH / TS);
    }
    for (let ty = startY; ty <= endY; ty++) {
      if (!Number.isFinite(tilesY)) { if (ty < 0 || ty >= 1 << zLevel) continue; } else { if (ty < 0 || ty >= tilesY) continue; }
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
