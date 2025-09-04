export class LatLng {
  constructor(public lat: number, public lng: number) {}
}
export function toLatLng(a: any, b?: any): LatLng {
  if (Array.isArray(a)) return new LatLng(a[0], a[1]);
  if (typeof a === 'object' && a) return new LatLng(a.lat, a.lng);
  return new LatLng(a as number, b as number);
}
