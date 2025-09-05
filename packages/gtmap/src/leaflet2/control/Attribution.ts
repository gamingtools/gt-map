// Leaflet 2.0-like Attribution control (TypeScript stub)
import { Control, type ControlOptions } from './Control';
import { setOptions } from '../core/Util';
import type { Map } from '../map/Map';

export type AttributionControlOptions = ControlOptions & {
  prefix?: string | false;
};

export class Attribution extends Control {
  options: AttributionControlOptions;
  constructor(options?: AttributionControlOptions) {
    super(options);
    setOptions(this, options, { position: 'bottomright', prefix: 'Leaflet' });
    this.options = (this as any).options;
  }
  addTo(_map: Map): this { return this; }
  setPrefix(_p: string | false): this { return this; }
  addAttribution(_text: string): this { return this; }
  removeAttribution(_text: string): this { return this; }
}
