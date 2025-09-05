// Minimal LatLng class (pixel CRS semantics in this project)

export class LatLng {
  lat: number;
  lng: number;
  constructor(lat: number, lng: number) { this.lat = lat; this.lng = lng; }
  equals(other: LatLng): boolean { return this.lat === other.lat && this.lng === other.lng; }
  clone(): LatLng { return new LatLng(this.lat, this.lng); }
}

export function latLng(lat: number, lng: number): LatLng { return new LatLng(lat, lng); }

