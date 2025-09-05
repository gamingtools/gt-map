// Leaflet 2.0-like Polygon (TypeScript stub)
import { Polyline, type LatLng, type PathStyle } from './Polyline';
import type { LayerOptions, InteractiveLayerOptions } from '../../shared/options';

export class Polygon extends Polyline {
  constructor(latlngs: LatLng[], options?: (LayerOptions & InteractiveLayerOptions & PathStyle)) {
    super(latlngs, options);
  }
}
