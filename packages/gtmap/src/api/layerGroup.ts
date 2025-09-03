import type LeafletMapFacade from './map';
import Layer from './layer';

export class LeafletLayerGroupFacade extends Layer {
  private _layers = new Set<Layer>();

  constructor(layers?: Layer[]) {
    super();
    if (layers) for (const l of layers) this._layers.add(l);
  }

  addLayer(layer: Layer): this { this._layers.add(layer); if (this._map) layer.addTo(this._map); return this; }
  removeLayer(layer: Layer): this { this._layers.delete(layer); if (this._map) layer.remove(); return this; }
  clearLayers(): this { if (this._map) for (const l of this._layers) l.remove(); this._layers.clear(); return this; }
  eachLayer(fn: (layer: Layer) => void): this { for (const l of this._layers) fn(l); return this; }

  onAdd(map: LeafletMapFacade): void { for (const l of this._layers) l.addTo(map); }
  onRemove(_map: LeafletMapFacade): void { for (const l of this._layers) l.remove(); }
}

export function createLayerGroup(layers?: Layer[]): LeafletLayerGroupFacade {
  return new LeafletLayerGroupFacade(layers);
}

export class LeafletFeatureGroupFacade extends LeafletLayerGroupFacade {}

export function createFeatureGroup(layers?: Layer[]): LeafletFeatureGroupFacade {
  return new LeafletFeatureGroupFacade(layers);
}
