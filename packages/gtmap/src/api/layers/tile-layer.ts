/**
 * TileLayer -- a layer backed by a GTPK tile pyramid.
 */
import type { TileLayerOptions } from './types';

let _tileLayerIdSeq = 0;

/**
 * A layer backed by a GTPK tile pyramid.
 *
 * @public
 * @remarks
 * Create via `map.layers.createTileLayer(options)`, then attach
 * with `map.layers.addLayer(layer, { z })`.
 */
export class TileLayer {
	readonly type = 'tile' as const;
	readonly id: string;
	readonly options: Readonly<TileLayerOptions>;

	/** @internal */
	_attached = false;
	/** @internal */
	_destroyed = false;

	constructor(options: TileLayerOptions) {
		_tileLayerIdSeq = (_tileLayerIdSeq + 1) % Number.MAX_SAFE_INTEGER;
		this.id = `tl_${_tileLayerIdSeq.toString(36)}`;
		this.options = Object.freeze({ ...options });
	}
}
