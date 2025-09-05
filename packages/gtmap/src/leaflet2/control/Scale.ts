// Leaflet 2.0-like Scale control (TypeScript stub)
import { Control, type ControlOptions } from './Control';
import { setOptions } from '../core/Util';
import type { Map } from '../map/Map';

export type ScaleControlOptions = ControlOptions & {
  maxWidth?: number;
  metric?: boolean;
  imperial?: boolean;
  updateWhenIdle?: boolean;
};

export class Scale extends Control {
  options: ScaleControlOptions;
  constructor(options?: ScaleControlOptions) {
    super(options);
    setOptions(this, options, { position: 'bottomleft', metric: true, imperial: false, maxWidth: 100 });
    this.options = (this as any).options;
  }
  addTo(_map: Map): this { return this; }
}
