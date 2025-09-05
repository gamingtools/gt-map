// Leaflet 2.0-like TileLayer (TypeScript stub)
import { GridLayer, type GridLayerOptions } from './GridLayer';
import type { Bounds } from '../../geometry/Bounds';
import { setOptions } from '../../core/Util';

export type TileLayerOptions = GridLayerOptions & {
  minZoom?: number;
  maxZoom?: number;
  bounds?: Bounds;
  tms?: boolean;
  noWrap?: boolean;
};

export class TileLayer extends GridLayer {
  _url: string;
  options: TileLayerOptions;
  constructor(url: string, options?: TileLayerOptions) {
    super(options);
    this._url = url;
    const defaults: Partial<TileLayerOptions> = {};
    setOptions(this, options, defaults);
    this.options = (this as any).options;
  }

  setUrl(_url: string, _noRedraw?: boolean): this { return this; }
}
