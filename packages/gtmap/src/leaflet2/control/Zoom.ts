// Leaflet 2.0-like Zoom control (TypeScript stub)
import { Control, type ControlOptions } from './Control';
import { setOptions } from '../core/Util';
import type { Map } from '../map/Map';

export type ZoomControlOptions = ControlOptions & {
  zoomInText?: string;
  zoomInTitle?: string;
  zoomOutText?: string;
  zoomOutTitle?: string;
};

export class Zoom extends Control {
  options: ZoomControlOptions;
  constructor(options?: ZoomControlOptions) {
    super(options);
    const defaults: Partial<ZoomControlOptions> = {
      position: 'topright',
      zoomInText: '+',
      zoomInTitle: 'Zoom in',
      zoomOutText: '−',
      zoomOutTitle: 'Zoom out',
    };
    setOptions(this, options, defaults);
    this.options = (this as any).options;
  }
  addTo(_map: Map): this { return this; }
}
