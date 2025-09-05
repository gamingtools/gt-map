// Leaflet 2.0-like GeoJSON (TypeScript stub)
import { Layer } from './Layer';
import type { LayerOptions } from '../shared/options';
import { setOptions } from '../core/Util';

export type GeoJSONOptions = LayerOptions & {
  style?: (feature: any) => any | any;
  pointToLayer?: (feature: any, latlng: [number, number]) => Layer;
  onEachFeature?: (feature: any, layer: Layer) => void;
};

export class GeoJSON extends Layer {
  options!: GeoJSONOptions;
  constructor(_geojson?: any, options?: GeoJSONOptions) {
    super(options);
    setOptions(this, options, {});
    this.options = (this as any).options;
  }
  addData(_data: any): this { return this; }
  resetStyle(_layer?: Layer): this { return this; }
}
