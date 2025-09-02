// Basic Web Mercator (EPSG:3857) helpers

const TILE_SIZE = 256;
const MAX_LAT = 85.05112878; // Web Mercator limit

export function clampLat(lat) {
  return Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
}

export function lngLatToWorld(lng, lat, z) {
  const scale = TILE_SIZE * Math.pow(2, z);
  const x = (lng + 180) / 360; // 0..1
  const clampedLat = clampLat(lat);
  const sinLat = Math.sin((clampedLat * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI); // 0..1
  return {
    x: x * scale,
    y: y * scale,
  };
}

export function worldToLngLat(x, y, z) {
  const scale = TILE_SIZE * Math.pow(2, z);
  const nx = x / scale; // 0..1
  const ny = y / scale; // 0..1
  const lng = nx * 360 - 180;
  const mercY = (0.5 - ny) * 2 * Math.PI;
  const lat = (180 / Math.PI) * (2 * Math.atan(Math.exp(mercY)) - Math.PI / 2);
  return { lng, lat };
}

export function tileXYZUrl(urlTemplate, z, x, y) {
  return urlTemplate.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
}

export { TILE_SIZE };
