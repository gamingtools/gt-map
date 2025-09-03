import type LeafletMapFacade from './map';
import Layer from './layer';

export type TileLayerOptions = {
  minZoom?: number;
  maxZoom?: number;
  tileSize?: number;
  subdomains?: string | string[];
  errorTileUrl?: string;
  tms?: boolean;
  opacity?: number;
  updateWhenIdle?: boolean;
};

export class LeafletTileLayerFacade extends Layer {
  private _url: string;
  private _options: TileLayerOptions;
  
  constructor(url: string, options?: TileLayerOptions) {
    super();
    super();
    this._url = url;
    this._options = options || {};
  }
  onAdd(map: LeafletMapFacade) {
    (map.__impl as any).setTileSource({
      url: this._url,
      minZoom: this._options.minZoom,
      maxZoom: this._options.maxZoom,
      tileSize: this._options.tileSize,
      wrapX: this._options.tms ? false : true,
      clearCache: true,
    });
    try { (map.__impl as any).setPrefetchOptions?.({ enabled: true, baselineLevel: 2 }); } catch {}
    if (typeof this._options.opacity === 'number') {
      (map.__impl as any).setRasterOpacity(Math.max(0, Math.min(1, this._options.opacity)));
    }
  }
  onRemove(_map: LeafletMapFacade) { /* no-op for now */ }
  setUrl(url: string, _noRedraw?: boolean): this {
    this._url = url;
    if (this._map) (this._map.__impl as any).setTileSource({ url: this._url, clearCache: true });
    return this;
  }
  setOpacity(_opacity: number): this {
    if (this._map) (this._map.__impl as any).setRasterOpacity(Math.max(0, Math.min(1, _opacity)));
    return this;
  }
  setZIndex(_z: number): this {
    // Single-canvas renderer; zIndex is a no-op for now.
    return this;
  }
  remove(): this {
    // noop for now; an app can switch layers by calling addTo on another
    this._map = null;
    return this;
  }
}
