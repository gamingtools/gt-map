import { Path } from './Path';

export class Polyline extends Path {
  private _latlngs: Array<[number, number] | { lat: number; lng: number }>;
  constructor(latlngs: any, options?: any) {
    super();
    this._latlngs = Array.isArray(latlngs) ? latlngs : [];
    if (options) this.setStyle(options);
  }
  __toPrimitive() {
    const pts = this._latlngs.map((ll) => this.toLngLat(ll));
    return { type: 'polyline', points: pts, style: this._style };
  }
}
