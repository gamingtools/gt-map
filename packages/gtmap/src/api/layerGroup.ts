import type LeafletMapFacade from './map';
import Layer from './layer';

export class LeafletLayerGroupFacade extends Layer {
	private _layers = new Set<Layer>();
	private _raf: number | null = null;
	private _chunkIdx = 0;
	private _chunkArr: Layer[] | null = null;
	private _chunkSize = 2000; // add up to N layers per frame
	private _chunkThreshold = 3000; // start chunking if above this many layers

	constructor(layers?: Layer[]) {
		super();
		if (layers) for (const l of layers) this._layers.add(l);
	}

	addLayer(layer: Layer): this {
		this._layers.add(layer);
		if (this._map) layer.addTo(this._map);
		return this;
	}
	removeLayer(layer: Layer): this {
		this._layers.delete(layer);
		if (this._map) layer.remove();
		return this;
	}
	clearLayers(): this {
		if (this._map) for (const l of this._layers) l.remove();
		this._layers.clear();
		return this;
	}
	eachLayer(fn: (layer: Layer) => void): this {
		for (const l of this._layers) fn(l);
		return this;
	}

	onAdd(map: LeafletMapFacade): void {
		const total = this._layers.size;
		if (total === 0) return;
		if (total <= this._chunkThreshold) {
			for (const l of this._layers) l.addTo(map);
			return;
		}
		// Chunked add over multiple frames for large groups
		this._chunkArr = Array.from(this._layers);
		this._chunkIdx = 0;
		const step = () => {
			if (!this._chunkArr || !this._map) {
				this._raf = null;
				return;
			}
			const end = Math.min(this._chunkArr.length, this._chunkIdx + this._chunkSize);
			for (let i = this._chunkIdx; i < end; i++) {
				try {
					this._chunkArr[i].addTo(map);
				} catch {}
			}
			this._chunkIdx = end;
			if (this._chunkIdx < (this._chunkArr?.length || 0)) {
				this._raf = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame(step) : (setTimeout(step, 0) as any);
			} else {
				this._raf = null;
				this._chunkArr = null;
			}
		};
		// kick off
		step();
	}
	onRemove(_map: LeafletMapFacade): void {
		// Cancel any in-flight chunking
		if (this._raf != null) {
			try {
				typeof cancelAnimationFrame !== 'undefined' ? cancelAnimationFrame(this._raf as any) : clearTimeout(this._raf as any);
			} catch {}
			this._raf = null;
			this._chunkArr = null;
		}
		for (const l of this._layers) {
			try {
				l.remove();
			} catch {}
		}
	}
}

export function createLayerGroup(layers?: Layer[]): LeafletLayerGroupFacade {
	return new LeafletLayerGroupFacade(layers);
}

export class LeafletFeatureGroupFacade extends LeafletLayerGroupFacade {}

export function createFeatureGroup(layers?: Layer[]): LeafletFeatureGroupFacade {
	return new LeafletFeatureGroupFacade(layers);
}
