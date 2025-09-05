// Leaflet 2.0-like Rectangle (TypeScript stub)
import { Path, type LatLng, type PathStyle } from './Path';
import type { Bounds } from '../../geometry/Bounds';
import type { LayerOptions, InteractiveLayerOptions } from '../../shared/options';
import { setOptions } from '../../core/Util';

export class Rectangle extends Path {
  protected _bounds: Bounds;
  options!: LayerOptions & InteractiveLayerOptions & PathStyle;
  constructor(bounds: Bounds, options?: (LayerOptions & InteractiveLayerOptions & PathStyle)) {
    super(options);
    this._bounds = bounds;
    if (options) {
      setOptions(this, options);
      this._style = { ...(this._style || {}), ...(options || {}) };
    }
  }
}
