// Leaflet 2.0-like LayerGroup (TypeScript stub)
import { Layer } from './Layer';
import type { Map } from '../map/Map';

export class LayerGroup extends Layer {
  protected _layers: Set<Layer> = new Set();

  addLayer(layer: Layer): this {
    this._layers.add(layer);
    return this;
  }
  removeLayer(layer: Layer): this {
    this._layers.delete(layer);
    return this;
  }
  clearLayers(): this {
    this._layers.clear();
    return this;
  }
  hasLayer(layer: Layer): boolean {
    return this._layers.has(layer);
  }

  onAdd(map: Map): void {
    for (const l of this._layers) l.onAdd(map);
  }
  onRemove(map: Map): void {
    for (const l of this._layers) l.onRemove(map);
  }
}

