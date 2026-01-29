export function wrapX(x: number, z: number): number {
  const n = 1 << z;
  return ((x % n) + n) % n;
}

export function tileKey(z: number, x: number, y: number): string {
  return `${z}/${x}/${y}`;
}
