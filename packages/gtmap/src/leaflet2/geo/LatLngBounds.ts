// Minimal LatLngBounds class
import { LatLng } from './LatLng';

export class LatLngBounds {
  southWest: LatLng;
  northEast: LatLng;
  constructor(sw: LatLng, ne: LatLng) { this.southWest = sw; this.northEast = ne; }
  contains(p: LatLng): boolean {
    return p.lat >= this.southWest.lat && p.lat <= this.northEast.lat && p.lng >= this.southWest.lng && p.lng <= this.northEast.lng;
  }
  extend(p: LatLng): this {
    this.southWest.lat = Math.min(this.southWest.lat, p.lat);
    this.southWest.lng = Math.min(this.southWest.lng, p.lng);
    this.northEast.lat = Math.max(this.northEast.lat, p.lat);
    this.northEast.lng = Math.max(this.northEast.lng, p.lng);
    return this;
  }
  getCenter(): LatLng {
    return new LatLng((this.southWest.lat + this.northEast.lat) / 2, (this.southWest.lng + this.northEast.lng) / 2);
  }
}

