// Leaflet 2.0-like Layers control (TypeScript stub)
import { Control, type ControlOptions } from './Control';
import { setOptions } from '../core/Util';
import type { Layer } from '../layer/Layer';

export type LayersObject = { [name: string]: Layer };

export type LayersControlOptions = ControlOptions & {
  collapsed?: boolean;
  autoZIndex?: boolean;
  hideSingleBase?: boolean;
  sortLayers?: boolean;
};

export class Layers extends Control {
  options!: LayersControlOptions;
  constructor(_baseLayers?: LayersObject, _overlays?: LayersObject, options?: LayersControlOptions) {
    super(options);
    setOptions(this, options, { collapsed: true, autoZIndex: true, hideSingleBase: false, sortLayers: false });
    this.options = (this as any).options;
  }
  addBaseLayer(_layer: Layer, _name: string): this { return this; }
  addOverlay(_layer: Layer, _name: string): this { return this; }
  removeLayer(_layer: Layer): this { return this; }
}
