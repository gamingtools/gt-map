import type LeafletMapFacade from './map';
import Layer from './layer';

export type TileLayerOptions = {
	minZoom?: number;
	maxZoom?: number;
	tileSize?: number;
	subdomains?: string | string[];
	errorTileUrl?: string;
	tms?: boolean;
	// Leaflet-like controls for wrap and bounds
	noWrap?: boolean;
	bounds?: [[number, number], [number, number]]; // [[south, west],[north, east]] in pixel CRS
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
		const inferredMapSize = (() => {
			const b = (this._options as any).bounds as any;
			if (b && Array.isArray(b[0]) && Array.isArray(b[1])) {
				const south = b[0][0];
				const west = b[0][1];
				const north = b[1][0];
				const east = b[1][1];
				const w = Math.max(1, Math.round(east - west));
				const h = Math.max(1, Math.round(north - south));
				return { width: w, height: h };
			}
			const ts = this._options.tileSize || 256;
			const zMax = this._options.maxZoom;
			if (typeof zMax === 'number') {
				const dim = ts * Math.pow(2, zMax);
				return { width: dim, height: dim };
			}
			return undefined;
		})();
		const wrapX = typeof this._options.wrapX === 'boolean' ? this._options.wrapX : (typeof (this._options as any).noWrap === 'boolean' ? !(this._options as any).noWrap : false);
		map.__impl.setTileSource({			url: this._url,
			sourceMinZoom: this._options.minZoom,
			sourceMaxZoom: this._options.maxZoom,
			tileSize: this._options.tileSize,
			mapSize: inferredMapSize,
			// Default: no wrap for pixel-CRS images unless explicitly enabled
			wrapX,
			clearCache: true,
		});
		try {
			map.__impl.setPrefetchOptions({ enabled: true, baselineLevel: 2 });
		} catch {}
		if (typeof this._options.opacity === 'number') {
			map.__impl.setRasterOpacity(Math.max(0, Math.min(1, this._options.opacity)));
		}
	}
	onRemove(_map: LeafletMapFacade) {
		/* no-op for now */
	}
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
