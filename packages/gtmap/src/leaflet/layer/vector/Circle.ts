import { Path } from './Path';

export class Circle extends Path {
  private _center: { lat: number; lng: number };
  private _radius: number;
  constructor(latlng: any, options?: any) {
    super();
    this._center = this.toLngLat(latlng);
    this._radius = (options?.radius as number) ?? 10;
    if (options) this.setStyle(options);
  }
  __toPrimitive() {
    return { type: 'circle', center: this._center, radius: this._radius, style: this._style };
  }
}

export class CircleMarker extends Circle {}
