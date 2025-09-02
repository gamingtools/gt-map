export const TILE_SIZE = 256;

export function clampLat(lat: number): number {
  return Math.max(-85.05112878, Math.min(85.05112878, lat));
}

export function lngLatToWorld(lng: number, lat: number, z: number) {
  const tileCount = 1 << z;
  const x = ((lng + 180) / 360) * tileCount * TILE_SIZE;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * tileCount * TILE_SIZE;
  return { x, y };
}

export function worldToLngLat(x: number, y: number, z: number) {
  const tileCount = 1 << z;
  const lng = (x / (TILE_SIZE * tileCount)) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / (TILE_SIZE * tileCount);
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lng, lat };
}

export function tileXYZUrl(urlTemplate: string, z: number, x: number, y: number) {
  return urlTemplate.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
}
