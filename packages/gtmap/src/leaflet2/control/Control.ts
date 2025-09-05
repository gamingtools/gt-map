// Leaflet 2.0-like Control base (TypeScript stub)
import type { Map } from '../map/Map';
import type { ControlOptions } from '../shared/options';
export type ControlPosition = NonNullable<ControlOptions['position']>;

export class Control {
  options: ControlOptions;
  constructor(options?: ControlOptions) { this.options = { ...(options || {}) }; }
  addTo(_map: Map): this { return this; }
  remove(): this { return this; }
  setPosition(_pos: ControlPosition): this { return this; }
  getPosition(): ControlPosition { return this.options.position || 'topright'; }
}
