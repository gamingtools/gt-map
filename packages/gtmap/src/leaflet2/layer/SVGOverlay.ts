// Leaflet 2.0-like SVGOverlay (TypeScript stub)
import { Layer } from './Layer';
import type { Bounds } from '../geometry/Bounds';
import type { LayerOptions } from '../shared/options';
import { setOptions } from '../core/Util';

export type SVGOverlayOptions = LayerOptions & { interactive?: boolean };

export class SVGOverlay extends Layer {
  options!: SVGOverlayOptions;
  constructor(_svg: string | SVGElement, _bounds: Bounds, options?: SVGOverlayOptions) {
    super(options);
    setOptions(this, options, { interactive: false });
  }
}
