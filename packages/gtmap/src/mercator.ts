export const TILE_SIZE = 256;

/** Clamp latitude to Web Mercator's valid range. */
export function clampLat(lat: number): number {
  const MAX = 85.05112878;
  if (!Number.isFinite(lat)) return 0;
  return Math.max(-MAX, Math.min(MAX, lat));
}

/**
 * Convert lng/lat (degrees) to "world" pixel coordinates at zoom z,
 * where the world size is TILE_SIZE * 2^z.
 */
export function lngLatToWorld(lng: number, lat: number, z: number): { x: number; y: number } {
  const s = TILE_SIZE * Math.pow(2, z);
  const x = (lng + 180) / 360;
  const sinLat = Math.sin((clampLat(lat) * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);
  return { x: x * s, y: y * s };
}

/** Inverse of lngLatToWorld. */
export function worldToLngLat(x: number, y: number, z: number): { lng: number; lat: number } {
  const s = TILE_SIZE * Math.pow(2, z);
  const lng = (x / s) * 360 - 180;
  const n = Math.PI - 2 * Math.PI * (y / s);
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lng, lat };
}

export function tileXYZUrl(urlTemplate: string, z: number, x: number, y: number) {
  return urlTemplate.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
}
