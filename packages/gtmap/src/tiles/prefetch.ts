import { TILE_SIZE } from '../mercator';

import { tileKey as tileKeyOf } from './source';

export function prefetchNeighbors(
  map: any,
  zLevel: number,
  tlWorld: { x: number; y: number },
  scale: number,
  widthCSS: number,
  heightCSS: number,
) {
  const startX = Math.floor(tlWorld.x / TILE_SIZE) - 1;
  const startY = Math.floor(tlWorld.y / TILE_SIZE) - 1;
  const endX = Math.floor((tlWorld.x + widthCSS / scale) / TILE_SIZE) + 1;
  const endY = Math.floor((tlWorld.y + heightCSS / scale) / TILE_SIZE) + 1;
  for (let ty = startY; ty <= endY; ty++) {
    if (ty < 0 || ty >= (1 << zLevel)) continue;
    for (let tx = startX; tx <= endX; tx++) {
      let tileX = tx;
      if (map.wrapX) tileX = map._wrapX(tx, zLevel); else if (tx < 0 || tx >= (1 << zLevel)) continue;
      const key = tileKeyOf(zLevel, tileX, ty);
      if (!map._tileCache.has(key)) map._enqueueTile(zLevel, tileX, ty, 1);
    }
  }
}
