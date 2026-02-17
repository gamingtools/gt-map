/**
 * LayersFacade -- map.layers sub-object.
 *
 * Layer creation, attachment, removal, and per-layer display properties.
 */
import type { TileLayerOptions, AddLayerOptions, ClusteredLayerOptions } from '../layers/types';
import type { TileLayer } from '../layers/tile-layer';
import type { InteractiveLayer } from '../layers/interactive-layer';
import type { StaticLayer } from '../layers/static-layer';
import type { ClusteredLayer } from '../layers/clustered-layer';
import type { AnyLayer } from '../../internal/layers/layer-registry';

export interface LayersFacadeDeps {
	createTileLayer(opts: TileLayerOptions): TileLayer;
	createInteractiveLayer(): InteractiveLayer;
	createStaticLayer(): StaticLayer;
	createClusteredLayer(opts?: ClusteredLayerOptions): ClusteredLayer;
	addLayer(layer: AnyLayer, opts: AddLayerOptions): void;
	removeLayer(layer: AnyLayer): void;
	setLayerOpacity(layer: AnyLayer, opacity: number): void;
	setLayerVisible(layer: AnyLayer, visible: boolean): void;
	setLayerZ(layer: AnyLayer, z: number): void;
}

export class LayersFacade {
	private _deps: LayersFacadeDeps;

	/** @internal */
	constructor(deps: LayersFacadeDeps) {
		this._deps = deps;
	}

	/**
	 * Create a tile layer backed by a GTPK tile pyramid (not yet added to the map).
	 */
	createTileLayer(opts: TileLayerOptions): TileLayer {
		return this._deps.createTileLayer(opts);
	}

	/**
	 * Create an interactive layer for markers with hit-testing (not yet added to the map).
	 */
	createInteractiveLayer(): InteractiveLayer {
		return this._deps.createInteractiveLayer();
	}

	/**
	 * Create a static layer for vector shapes (not yet added to the map).
	 */
	createStaticLayer(): StaticLayer {
		return this._deps.createStaticLayer();
	}

	/**
	 * Create a clustered layer that groups nearby markers into clusters (not yet added to the map).
	 */
	createClusteredLayer(opts?: ClusteredLayerOptions): ClusteredLayer {
		return this._deps.createClusteredLayer(opts);
	}

	/**
	 * Add a layer to the map at a given z-order.
	 */
	addLayer(layer: AnyLayer, opts: AddLayerOptions): void {
		this._deps.addLayer(layer, opts);
	}

	/**
	 * Remove a layer from the map (data is preserved).
	 */
	removeLayer(layer: AnyLayer): void {
		this._deps.removeLayer(layer);
	}

	/**
	 * Set opacity for an attached layer (0 to 1).
	 */
	setLayerOpacity(layer: AnyLayer, opacity: number): void {
		this._deps.setLayerOpacity(layer, opacity);
	}

	/**
	 * Set visibility for an attached layer.
	 */
	setLayerVisible(layer: AnyLayer, visible: boolean): void {
		this._deps.setLayerVisible(layer, visible);
	}

	/**
	 * Set z-order for an attached layer.
	 */
	setLayerZ(layer: AnyLayer, z: number): void {
		this._deps.setLayerZ(layer, z);
	}
}
