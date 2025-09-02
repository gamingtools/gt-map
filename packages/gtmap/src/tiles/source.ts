// URL templating and addressing helpers for tile sources.

export function urlFromTemplate(template: string, z: number, x: number, y: number): string {
  return template.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
}

export function wrapX(x: number, z: number): number {
  const n = 1 << z;
  return ((x % n) + n) % n;
}

export function tileKey(z: number, x: number, y: number): string {
  return `${z}/${x}/${y}`;
}

