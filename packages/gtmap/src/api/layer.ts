import type LeafletMapFacade from './map';

export default class Layer {
  protected _map: LeafletMapFacade | null = null;
  // marker flag for duck typing
  public readonly __isLayer = true;

  addTo(map: LeafletMapFacade): this {
    this._map = map;
    // Map tracks layers and calls onAdd
    (map as any).__addLayer(this);
    return this;
  }

  remove(): this {
    if (this._map) {
      const m = this._map;
      this._map = null;
      (m as any).__removeLayer(this);
    }
    return this;
  }

  // Override points for concrete layers
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAdd(_map: LeafletMapFacade): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRemove(_map: LeafletMapFacade): void {}
}

