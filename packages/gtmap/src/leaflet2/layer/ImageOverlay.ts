// Leaflet 2.0-like ImageOverlay (TypeScript stub)
import { Layer } from './Layer';
import type { Bounds } from '../geometry/Bounds';
import type { LayerOptions } from '../shared/options';
import { setOptions } from '../core/Util';

export type ImageOverlayOptions = LayerOptions & {
  opacity?: number;
  alt?: string;
  interactive?: boolean;
  crossOrigin?: boolean | string;
};

export class ImageOverlay extends Layer {
  options!: ImageOverlayOptions;
  constructor(_url: string, _bounds: Bounds, options?: ImageOverlayOptions) {
    super(options);
    const defaults: Partial<ImageOverlayOptions> = {
      opacity: 1,
      interactive: false,
    };
    setOptions(this, options, defaults);
  }
  setUrl(_url: string): this { return this; }
  setOpacity(_opacity: number): this { return this; }
}
