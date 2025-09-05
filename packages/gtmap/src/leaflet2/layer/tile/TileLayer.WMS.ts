// Leaflet 2.0-like TileLayer.WMS (TypeScript stub)
import { TileLayer, type TileLayerOptions } from './TileLayer';

export type WMSParams = Record<string, string | number | boolean | undefined>;

export class TileLayerWMS extends TileLayer {
  constructor(url: string, options?: TileLayerOptions & { layers?: string; styles?: string; format?: string }) {
    super(url, options);
  }
  setParams(_params: WMSParams, _noRedraw?: boolean): this { return this; }
}

