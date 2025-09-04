import type LeafletMapFacade from './map';
import Layer from './layer';

export type GridLayerOptions = { visible?: boolean };

export class LeafletGridLayerFacade extends Layer {
	private _visible = true;

	constructor(options?: GridLayerOptions) {
		super();
		if (typeof options?.visible === 'boolean') this._visible = options.visible;
	}

	onAdd(map: LeafletMapFacade): void {
		this._map = map;
		(map.__impl as any).setGridVisible(this._visible);
	}

	onRemove(map: LeafletMapFacade): void {
		// Use the provided map instance because Layer.remove() nulls this._map before calling onRemove
		map.__impl.setGridVisible(false);
		this._map = null;
	}

	setVisible(on: boolean): this {
		this._visible = !!on;
		if (this._map) this._map.__impl.setGridVisible(this._visible);
		return this;
	}
}

export function createGridLayer(options?: GridLayerOptions): LeafletGridLayerFacade {
	return new LeafletGridLayerFacade(options);
}
