import type LeafletMapFacade from './map';

export type GridLayerOptions = { visible?: boolean };

export class LeafletGridLayerFacade {
  private _map: LeafletMapFacade | null = null;
  private _visible = true;

  constructor(options?: GridLayerOptions) {
    if (typeof options?.visible === 'boolean') this._visible = options.visible;
  }

  addTo(map: LeafletMapFacade): this {
    this._map = map;
    (map.__impl as any).setGridVisible(this._visible);
    return this;
  }

  remove(): this {
    if (this._map) {
      (this._map.__impl as any).setGridVisible(false);
      this._map = null;
    }
    return this;
  }

  setVisible(on: boolean): this {
    this._visible = !!on;
    if (this._map) (this._map.__impl as any).setGridVisible(this._visible);
    return this;
  }
}

export function createGridLayer(options?: GridLayerOptions): LeafletGridLayerFacade {
  return new LeafletGridLayerFacade(options);
}
