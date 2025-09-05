// Leaflet 2.0-like Layer base (TypeScript stub)
import { Evented } from '../core/Evented';
import type { Map } from '../map/Map';
import type { LayerOptions } from '../shared/options';
import { setOptions } from '../core/Util';

export class Layer extends Evented {
  options: LayerOptions;

  constructor(options?: LayerOptions) {
    super();
    // No class defaults for base Layer; just store provided options
    setOptions(this, options);
    this.options = (this as any).options;
  }

  // Lifecycle (public API)
  addTo(map: Map): this {
    return this;
  }
  remove(): this {
    return this;
  }

  // Popup / Tooltip bindings (stubs)
  bindPopup(_content: string | HTMLElement | unknown, _options?: unknown): this { return this; }
  openPopup(_latlng?: LatLng): this { return this; }
  closePopup(): this { return this; }
  togglePopup(): this { return this; }
  unbindPopup(): this { return this; }

  bindTooltip(_content: string | HTMLElement | unknown, _options?: unknown): this { return this; }
  openTooltip(_latlng?: LatLng): this { return this; }
  closeTooltip(): this { return this; }
  toggleTooltip(): this { return this; }
  unbindTooltip(): this { return this; }

  // Hooks invoked by Map
  onAdd(_map: Map): void {}
  onRemove(_map: Map): void {}
}
