// Leaflet 2.0-like GridLayer (TypeScript stub)
import { Layer } from '../../layer/Layer';
import type { Point } from '../../geometry/Point';
import type { LayerOptions } from '../../shared/options';
import { setOptions } from '../../core/Util';

export type GridLayerOptions = LayerOptions & {
  tileSize?: number | Point;
  opacity?: number;
  zIndex?: number;
  updateWhenIdle?: boolean;
  noWrap?: boolean;
};

export class GridLayer extends Layer {
  options: GridLayerOptions;
  constructor(options?: GridLayerOptions) {
    super(options);
    const defaults: Partial<GridLayerOptions> = {
      tileSize: 256,
      opacity: 1,
      updateWhenIdle: true,
    };
    setOptions(this, options, defaults);
    this.options = (this as any).options;
  }

  setOpacity(_opacity: number): this { return this; }
  setZIndex(_z: number): this { return this; }
  bringToFront(): this { return this; }
  bringToBack(): this { return this; }
}
