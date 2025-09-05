// Leaflet 2.0-like Tooltip (TypeScript stub)
import { DivOverlay, type DivOverlayOptions } from './DivOverlay';
import { setOptions } from '../core/Util';
import type { LatLng } from './Layer';

export type TooltipOptions = DivOverlayOptions & {
  direction?: 'top' | 'bottom' | 'left' | 'right' | 'auto' | 'center';
  permanent?: boolean;
  sticky?: boolean;
};

export class Tooltip extends DivOverlay {
  options: TooltipOptions;
  constructor(options?: TooltipOptions, _source?: unknown) {
    super(options);
    const defaults: Partial<TooltipOptions> = {
      direction: 'auto',
      permanent: false,
      sticky: false,
    };
    setOptions(this, options, defaults);
    this.options = (this as any).options;
  }
  setLatLng(_latlng: LatLng): this { return this; }
}
