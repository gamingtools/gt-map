// Bounds utilities using per-instance tile size

export function clampCenterWorld(
  centerWorld: { x: number; y: number },
  zInt: number,
  scale: number,
  widthCSS: number,
  heightCSS: number,
  wrapX: boolean,
  freePan: boolean,
  tileSize: number,
) {
  if (freePan) return centerWorld;
  const worldSize = tileSize * (1 << zInt);
  const halfW = widthCSS / (2 * scale);
  const halfH = heightCSS / (2 * scale);
  let cx = centerWorld.x;
  let cy = centerWorld.y;
  if (!wrapX) {
    if (halfW >= worldSize / 2) cx = worldSize / 2;
    else cx = Math.max(halfW, Math.min(worldSize - halfW, cx));
  }
  if (halfH >= worldSize / 2) cy = worldSize / 2;
  else cy = Math.max(halfH, Math.min(worldSize - halfH, cy));
  return { x: cx, y: cy };
}
