import type LeafletMapFacade from './map';

export class LeafletTileLayerFacade {
  private _url: string;
  private _options: any;
  // private _map: LeafletMapFacade | null = null; // reserved, may be used later
  constructor(url: string, options?: any) {
    this._url = url;
    this._options = options || {};
  }
  addTo(map: LeafletMapFacade) {
    // this._map = map;
    (map.__impl as any).setTileSource({
      url: this._url,
      minZoom: this._options.minZoom,
      maxZoom: this._options.maxZoom,
      tileSize: this._options.tileSize,
      wrapX: this._options.tms ? false : true,
      clearCache: true,
    });
    return this;
  }
  remove() {
    // noop for now; an app can switch layers by calling addTo on another
    return this;
  }
}
