// Leaflet 2.0-like Popup (TypeScript stub)
import { DivOverlay, type DivOverlayOptions } from './DivOverlay';
import { setOptions } from '../core/Util';
import type { LatLng } from './Layer';
import type { Map } from '../map/Map';

export type PopupOptions = DivOverlayOptions & {
  maxWidth?: number;
  minWidth?: number;
  autoPan?: boolean;
  closeButton?: boolean;
};

export class Popup extends DivOverlay {
  options: PopupOptions;
  constructor(options?: PopupOptions, _source?: unknown) {
    super(options);
    const defaults: Partial<PopupOptions> = {
      autoPan: true,
      closeButton: true,
      maxWidth: 300,
    };
    setOptions(this, options, defaults);
    this.options = (this as any).options;
  }
  openOn(_map: Map): this { return this; }
  setLatLng(_latlng: LatLng): this { return this; }
}
