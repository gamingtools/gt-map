// Prefetch helpers rely on per-instance tile size passed via cfg

import { tileKey as tileKeyOf, wrapX as wrapXTile } from './source';

export function prefetchNeighbors(
  map: any,
  zLevel: number,
  tlWorld: { x: number; y: number },
  scale: number,
  widthCSS: number,
  heightCSS: number,
  tileSize: number,
) {
  const TS = tileSize;
  const startX = Math.floor(tlWorld.x / TS) - 1;
  const startY = Math.floor(tlWorld.y / TS) - 1;
  const endX = Math.floor((tlWorld.x + widthCSS / scale) / TS) + 1;
  const endY = Math.floor((tlWorld.y + heightCSS / scale) / TS) + 1;
  for (let ty = startY; ty <= endY; ty++) {
    if (ty < 0 || ty >= (1 << zLevel)) continue;
    for (let tx = startX; tx <= endX; tx++) {
      let tileX = tx;
      if (map.wrapX) tileX = wrapXTile(tx, zLevel); else if (tx < 0 || tx >= (1 << zLevel)) continue;
      const key = tileKeyOf(zLevel, tileX, ty);
      if (!map._tileCache.has(key)) map._enqueueTile(zLevel, tileX, ty, 1);
    }
  }
}


export function prefetchNeighborsCtx(
  cfg: { wrapX: boolean; tileSize: number; hasTile: (key: string) => boolean; enqueueTile: (z: number, x: number, y: number, p?: number) => void },
  zLevel: number,
  tlWorld: { x: number; y: number },
  scale: number,
  widthCSS: number,
  heightCSS: number,
) {
  const TS = cfg.tileSize;
  const startX = Math.floor(tlWorld.x / TS) - 1;
  const startY = Math.floor(tlWorld.y / TS) - 1;
  const endX = Math.floor((tlWorld.x + widthCSS / scale) / TS) + 1;
  const endY = Math.floor((tlWorld.y + heightCSS / scale) / TS) + 1;
  for (let ty = startY; ty <= endY; ty++) {
    if (ty < 0 || ty >= (1 << zLevel)) continue;
    for (let tx = startX; tx <= endX; tx++) {
      let tileX = tx;
      if (cfg.wrapX) tileX = wrapXTile(tx, zLevel); else if (tx < 0 || tx >= (1 << zLevel)) continue;
      const key = tileKeyOf(zLevel, tileX, ty);
      if (!cfg.hasTile(key)) cfg.enqueueTile(zLevel, tileX, ty, 1);
    }
  }
}
