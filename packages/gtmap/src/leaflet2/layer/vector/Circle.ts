// Leaflet 2.0-like Circle (TypeScript stub)
import { Path, type LatLng, type PathStyle } from './Path';
import type { LayerOptions, InteractiveLayerOptions } from '../../shared/options';
import { setOptions } from '../../core/Util';

export class Circle extends Path {
  protected _center: LatLng;
  protected _radius: number;
  options!: LayerOptions & InteractiveLayerOptions & PathStyle;

  constructor(latlng: LatLng, radius: number, options?: (LayerOptions & InteractiveLayerOptions & PathStyle)) {
    super(options);
    this._center = latlng;
    this._radius = radius;
    if (options) {
      setOptions(this, options);
      this._style = { ...(this._style || {}), ...(options || {}) };
    }
  }

  setRadius(r: number): this { this._radius = r; return this; }
  getRadius(): number { return this._radius; }
}
