export type LeafletLatLng = [number, number] | { lat: number; lng: number };

export function toLngLat(ll: LeafletLatLng): { lng: number; lat: number } {
  if (Array.isArray(ll)) return { lat: ll[0], lng: ll[1] } as any;
  return { lng: (ll as any).lng, lat: (ll as any).lat };
}

export function toLeafletLatLng(lng: number, lat: number): [number, number] {
  return [lat, lng];
}
