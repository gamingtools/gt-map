import { LeafletTileLayerFacade as BaseTileLayer, type TileLayerOptions } from '../../../api/tileLayer';
import { notImplemented } from '../../../leaflet/util';

export class TileLayer extends BaseTileLayer {}

export class TileLayerWMS extends BaseTileLayer {
	constructor(url: string, options?: any) {
		super(url, options as TileLayerOptions);
	}
	onAdd(): void {
		notImplemented('TileLayer.WMS.onAdd');
	}
}

// Attach WMS to match Leaflet API shape
(TileLayer as any).WMS = TileLayerWMS;

export function tileLayer(url: string, options?: TileLayerOptions): TileLayer {
	return new TileLayer(url, options);
}

export function tileLayerWMS(url: string, options?: any): TileLayerWMS {
	return new TileLayerWMS(url, options);
}

// Public types
export type { TileLayerOptions };
