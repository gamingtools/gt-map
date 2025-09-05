// Leaflet 2.0-like DivOverlay (TypeScript stub)
import { Layer } from './Layer';
import type { Point } from '../geometry/Point';
import type { LayerOptions } from '../shared/options';
import { setOptions } from '../core/Util';

export type DivOverlayOptions = LayerOptions & {
  offset?: Point | [number, number];
  className?: string;
  pane?: string;
  interactive?: boolean;
};

export class DivOverlay extends Layer {
  options: DivOverlayOptions;
  constructor(options?: DivOverlayOptions) {
    super(options);
    const defaults: Partial<DivOverlayOptions> = {};
    setOptions(this, options, defaults);
    this.options = (this as any).options;
  }
  setContent(_html: string | HTMLElement): this { return this; }
  getContent(): string | HTMLElement | undefined { return undefined; }
  update(): this { return this; }
}
