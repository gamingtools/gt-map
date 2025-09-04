// Coordinate helpers for fixed internal world space (native pixels at imageMaxZ)
// World space: origin top-left, x→right (lng), y→down (lat)

export type XY = { x: number; y: number };

export function zIntOf(z: number): number {
  return Math.floor(z);
}

export function sFor(imageMaxZ: number, zInt: number): number {
  return Math.pow(2, imageMaxZ - zInt);
}

export function scaleFor(z: number): number {
  return Math.pow(2, z - Math.floor(z));
}

export function worldToLevel(world: XY, imageMaxZ: number, zInt: number): XY {
  const s = sFor(imageMaxZ, zInt);
  return { x: world.x / s, y: world.y / s };
}

export function levelToWorld(level: XY, imageMaxZ: number, zInt: number): XY {
  const s = sFor(imageMaxZ, zInt);
  return { x: level.x * s, y: level.y * s };
}

export function levelSize(mapW: number, mapH: number, imageMaxZ: number, zInt: number): XY {
  const s = sFor(imageMaxZ, zInt);
  return { x: mapW / s, y: mapH / s };
}

export function tlWorldFor(centerWorld: XY, z: number, viewportCSS: XY, imageMaxZ: number): XY {
  const zInt = zIntOf(z);
  const scale = scaleFor(z);
  const levelCenter = worldToLevel(centerWorld, imageMaxZ, zInt);
  return { x: levelCenter.x - viewportCSS.x / (2 * scale), y: levelCenter.y - viewportCSS.y / (2 * scale) };
}

export function worldToCSS(world: XY, z: number, centerWorld: XY, viewportCSS: XY, imageMaxZ: number): XY {
  const zInt = zIntOf(z);
  const scale = scaleFor(z);
  const tl = tlWorldFor(centerWorld, z, viewportCSS, imageMaxZ);
  const lvl = worldToLevel(world, imageMaxZ, zInt);
  return { x: (lvl.x - tl.x) * scale, y: (lvl.y - tl.y) * scale };
}

export function cssToWorld(css: XY, z: number, centerWorld: XY, viewportCSS: XY, imageMaxZ: number): XY {
  const zInt = zIntOf(z);
  const scale = scaleFor(z);
  const tl = tlWorldFor(centerWorld, z, viewportCSS, imageMaxZ);
  const lvl = { x: css.x / scale + tl.x, y: css.y / scale + tl.y };
  return levelToWorld(lvl, imageMaxZ, zInt);
}

export function snapLevelToDevice(levelCoord: number, scale: number, dpr: number): number {
  return Math.round(levelCoord * scale * dpr) / (scale * dpr);
}

export function tileCounts(mapW: number, mapH: number, tileSize: number, imageMaxZ: number, zInt: number): { NX: number; NY: number } {
  const lvl = levelSize(mapW, mapH, imageMaxZ, zInt);
  return { NX: Math.ceil(lvl.x / tileSize), NY: Math.ceil(lvl.y / tileSize) };
}

export function tileIndex(world: XY, mapW: number, mapH: number, tileSize: number, imageMaxZ: number, zInt: number, wrapX: boolean): { x: number; y: number; NX: number; NY: number } {
  const s = sFor(imageMaxZ, zInt);
  const lvl = { x: world.x / s, y: world.y / s };
  const { NX, NY } = tileCounts(mapW, mapH, tileSize, imageMaxZ, zInt);
  let tx = Math.floor(lvl.x / tileSize);
  let ty = Math.floor(lvl.y / tileSize);
  if (wrapX && NX > 0) {
    tx = ((tx % NX) + NX) % NX;
  } else {
    tx = Math.max(0, Math.min(NX - 1, tx));
  }
  ty = Math.max(0, Math.min(NY - 1, ty));
  return { x: tx, y: ty, NX, NY };
}

