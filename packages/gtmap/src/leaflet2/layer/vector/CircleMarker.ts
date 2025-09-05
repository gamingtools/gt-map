// Leaflet 2.0-like CircleMarker (TypeScript stub)
import { Path, type LatLng, type PathStyle } from './Path';
import type { LayerOptions, InteractiveLayerOptions } from '../../shared/options';
import { setOptions } from '../../core/Util';

export class CircleMarker extends Path {
  protected _center: LatLng;
  protected _radius: number;
  options!: LayerOptions & InteractiveLayerOptions & (PathStyle & { radius?: number });
  constructor(latlng: LatLng, options?: (LayerOptions & InteractiveLayerOptions & (PathStyle & { radius?: number }))) {
    super(options);
    this._center = latlng;
    this._radius = (options?.radius as number) ?? 10;
    if (options) {
      setOptions(this, options);
      this._style = { ...(this._style || {}), ...(options || {}) };
    }
  }
  setRadius(r: number): this { this._radius = r; return this; }
  getRadius(): number { return this._radius; }
}
