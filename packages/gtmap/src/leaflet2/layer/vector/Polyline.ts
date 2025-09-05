// Leaflet 2.0-like Polyline (TypeScript stub)
import { Path, type LatLng, type PathStyle } from './Path';
import type { LayerOptions, InteractiveLayerOptions } from '../../shared/options';
import { setOptions } from '../../core/Util';

export class Polyline extends Path {
  protected _latlngs: LatLng[] = [];
  options!: LayerOptions & InteractiveLayerOptions & PathStyle;

  constructor(latlngs: LatLng[], options?: (LayerOptions & InteractiveLayerOptions & PathStyle)) {
    super(options);
    this._latlngs = Array.isArray(latlngs) ? latlngs : [];
    if (options) {
      setOptions(this, options);
      this._style = { ...(this._style || {}), ...(options || {}) };
    }
  }
}
