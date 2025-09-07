export function calculateTileBounds(params: {
  tlWorld: { x: number; y: number };
  widthCSS: number;
  heightCSS: number;
  scale: number;
  tileSize: number;
  pad?: number;
}): { startX: number; startY: number; endX: number; endY: number } {
  const { tlWorld, widthCSS, heightCSS, scale, tileSize } = params;
  const pad = Math.max(0, Math.floor(params.pad || 0));
  let startX = Math.floor(tlWorld.x / tileSize) - pad;
  let startY = Math.floor(tlWorld.y / tileSize) - pad;
  let endX = Math.floor((tlWorld.x + widthCSS / scale) / tileSize) + 1 + pad;
  let endY = Math.floor((tlWorld.y + heightCSS / scale) / tileSize) + 1 + pad;
  return { startX, startY, endX, endY };
}

