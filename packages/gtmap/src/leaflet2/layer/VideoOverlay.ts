// Leaflet 2.0-like VideoOverlay (TypeScript stub)
import { Layer } from './Layer';
import type { Bounds } from '../geometry/Bounds';
import type { LayerOptions } from '../shared/options';
import { setOptions } from '../core/Util';

export type VideoOverlayOptions = LayerOptions & {
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
};

export class VideoOverlay extends Layer {
  options!: VideoOverlayOptions;
  constructor(_url: string | string[] | HTMLVideoElement, _bounds: Bounds, options?: VideoOverlayOptions) {
    super(options);
    setOptions(this, options, {});
  }
  setUrl(_url: string | string[]): this { return this; }
}
