// Leaflet 2.0-like Path base (TypeScript stub)
import { Layer } from '../../layer/Layer';
import type { LayerOptions, InteractiveLayerOptions } from '../../shared/options';
import { setOptions } from '../../core/Util';

export type LatLng = { lat: number; lng: number } | [number, number];

export type PathStyle = {
  color?: string;
  weight?: number;
  opacity?: number;
  fill?: boolean;
  fillColor?: string;
  fillOpacity?: number;
};

export class Path extends Layer {
  protected _style: PathStyle = {};
  options!: LayerOptions & InteractiveLayerOptions & PathStyle;

  constructor(options?: (LayerOptions & InteractiveLayerOptions & PathStyle)) {
    super(options);
    const defaults: Partial<InteractiveLayerOptions & PathStyle> = {
      keyboard: true,
      bubblingPointerEvents: false,
      autoPanOnFocus: false,
      color: '#3388ff',
      weight: 3,
      opacity: 1,
      fill: false,
      fillColor: '#3388ff',
      fillOpacity: 0.2,
    };
    setOptions(this, options, defaults);
    this._style = {
      color: (this as any).options.color,
      weight: (this as any).options.weight,
      opacity: (this as any).options.opacity,
      fill: (this as any).options.fill,
      fillColor: (this as any).options.fillColor,
      fillOpacity: (this as any).options.fillOpacity,
    };
  }

  setStyle(style?: PathStyle): this {
    this._style = { ...(this._style || {}), ...(style || {}) };
    return this;
  }
  bringToFront(): this { return this; }
  bringToBack(): this { return this; }
  getBounds(): unknown { return null; }
}
