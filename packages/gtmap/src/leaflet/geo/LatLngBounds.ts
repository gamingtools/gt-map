import { LatLng, toLatLng } from './LatLng';

export class LatLngBounds {
  constructor(public southWest: LatLng, public northEast: LatLng) {}
}
export function toLatLngBounds(a: any, b?: any): LatLngBounds {
  const sw = Array.isArray(a) ? new LatLng(a[0][0], a[0][1]) : toLatLng(a);
  const ne = Array.isArray(a) ? new LatLng(a[1][0], a[1][1]) : toLatLng(b);
  return new LatLngBounds(sw, ne);
}

