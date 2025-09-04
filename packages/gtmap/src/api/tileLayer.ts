import type LeafletMapFacade from './map';
import Layer from './layer';

export type TileLayerOptions = {
  minZoom?: number;
  maxZoom?: number;
  tileSize?: number;
  subdomains?: string | string[];
  errorTileUrl?: string;
  tms?: boolean;
  wrapX?: boolean; // horizontal world wrap
  opacity?: number;
  updateWhenIdle?: boolean;
};

export class LeafletTileLayerFacade extends Layer {
  private _url: string;
  private _options: TileLayerOptions;
  
  constructor(url: string, options?: TileLayerOptions) {
    super();
    this._url = url;
    this._options = options || {};
  }
  onAdd(map: LeafletMapFacade) {
    map.__impl.setTileSource({
      url: this._url,
      sourceMinZoom: this._options.minZoom,
      sourceMaxZoom: this._options.maxZoom,
      tileSize: this._options.tileSize,
      // Default: no wrap for pixel-CRS images; allow explicit opt-in via wrapX option
      wrapX: typeof this._options.wrapX === 'boolean' ? this._options.wrapX : false,
      clearCache: true,
    });
    try { map.__impl.setPrefetchOptions({ enabled: true, baselineLevel: 2 }); } catch {}
    if (typeof this._options.opacity === 'number') {
      map.__impl.setRasterOpacity(Math.max(0, Math.min(1, this._options.opacity)));
    }
  }
  onRemove(_map: LeafletMapFacade) { /* no-op for now */ }
  setUrl(url: string, _noRedraw?: boolean): this {
    this._url = url;
    if (this._map) this._map.__impl.setTileSource({ url: this._url, clearCache: true });
    return this;
  }
  setOpacity(_opacity: number): this {
    if (this._map) this._map.__impl.setRasterOpacity(Math.max(0, Math.min(1, _opacity)));
    return this;
  }
  setZIndex(_z: number): this {
    // Single-canvas renderer; zIndex is a no-op for now.
    return this;
  }
  // rely on Layer.remove() + onRemove
}
