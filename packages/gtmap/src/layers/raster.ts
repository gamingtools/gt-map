import type { ProgramLocs } from '../render/screenCache';
import { TILE_SIZE } from '../mercator';
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
    },
  ) {
    const gl = this.gl;
    const { zLevel, tlWorld, scale, dpr, widthCSS, heightCSS, wrapX } = params;
    const startX = Math.floor(tlWorld.x / TILE_SIZE);
    const startY = Math.floor(tlWorld.y / TILE_SIZE);
    const endX = Math.floor((tlWorld.x + widthCSS / scale) / TILE_SIZE) + 1;
    const endY = Math.floor((tlWorld.y + heightCSS / scale) / TILE_SIZE) + 1;
    const tilePixelSizeCSS = TILE_SIZE * scale;
    const tilePixelSize = tilePixelSizeCSS * dpr;

    for (let ty = startY; ty <= endY; ty++) {
      if (ty < 0 || ty >= (1 << zLevel)) continue;
      for (let tx = startX; tx <= endX; tx++) {
        if (!wrapX && (tx < 0 || tx >= (1 << zLevel))) continue;
        const tileX = wrapX ? wrapXTile(tx, zLevel) : tx;
        const wx = tx * TILE_SIZE;
        const wy = ty * TILE_SIZE;
        let sxCSS = (wx - tlWorld.x) * scale;
        const syCSS = (wy - tlWorld.y) * scale;
        if (wrapX && tileX !== tx) {
          const dxTiles = tx - tileX;
          sxCSS -= dxTiles * TILE_SIZE * scale;
        }
        const key = tileKeyOf(zLevel, tileX, ty);
        const rec = tileCache.get(key);
        if (!rec) enqueueTile(zLevel, tileX, ty, 0);
        if (rec?.status === 'ready' && rec.tex) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, rec.tex);
          gl.uniform2f(loc.u_translate!, sxCSS * dpr, syCSS * dpr);
          gl.uniform2f(loc.u_size!, tilePixelSize, tilePixelSize);
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
  ): number {
    const startX = Math.floor(tlWorld.x / TILE_SIZE);
    const startY = Math.floor(tlWorld.y / TILE_SIZE);
    const endX = Math.floor((tlWorld.x + widthCSS / scale) / TILE_SIZE) + 1;
    const endY = Math.floor((tlWorld.y + heightCSS / scale) / TILE_SIZE) + 1;
    let total = 0;
    let ready = 0;
    for (let ty = startY; ty <= endY; ty++) {
      if (ty < 0 || ty >= (1 << zLevel)) continue;
      for (let tx = startX; tx <= endX; tx++) {
        let tileX = tx;
        if (wrapX) tileX = wrapXTile(tx, zLevel);
        else if (tx < 0 || tx >= (1 << zLevel)) continue;
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

