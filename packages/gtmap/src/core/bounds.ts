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
  imageSize?: { width: number; height: number },
  zMax?: number,
) {
  if (freePan) return centerWorld;
  // Derive level dimensions; fallback to square world if not provided
  let worldW = tileSize * (1 << zInt);
  let worldH = worldW;
  if (imageSize && typeof zMax === 'number') {
    const s = Math.pow(2, zMax - zInt);
    worldW = imageSize.width / s;
    worldH = imageSize.height / s;
  }
  const halfW = widthCSS / (2 * scale);
  const halfH = heightCSS / (2 * scale);
  let cx = centerWorld.x;
  let cy = centerWorld.y;
  if (!wrapX) {
    if (halfW >= worldW / 2) cx = worldW / 2;
    else cx = Math.max(halfW, Math.min(worldW - halfW, cx));
  }
  if (halfH >= worldH / 2) cy = worldH / 2;
  else cy = Math.max(halfH, Math.min(worldH - halfH, cy));
  return { x: cx, y: cy };
}
