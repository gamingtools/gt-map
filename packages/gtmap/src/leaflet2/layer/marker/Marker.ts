// Leaflet 2.0-like Marker (TypeScript stub)
import { Layer } from '../../layer/Layer';
import { setOptions } from '../../core/Util';
import type { LayerOptions, InteractiveLayerOptions } from '../../shared/options';
import type { Icon } from './Icon';

export type LatLng = { lat: number; lng: number } | [number, number];

type MarkerSpecificOptions = {
  icon?: Icon;
  interactive?: boolean;
  keyboard?: boolean;
  title?: string;
  alt?: string;
  zIndexOffset?: number;
  opacity?: number;
  riseOnHover?: boolean;
  riseOffset?: number;
  pane?: string;
  shadowPane?: string;
  bubblingPointerEvents?: boolean;
  autoPanOnFocus?: boolean;
  draggable?: boolean;
  autoPan?: boolean;
  autoPanPadding?: [number, number];
  autoPanSpeed?: number;
};

export type MarkerOptions = LayerOptions & InteractiveLayerOptions & MarkerSpecificOptions;

// Minimal icon surface placeholder to avoid any
export interface IconLike { /* shape defined later */ }

export class Marker extends Layer {
  options: MarkerOptions;
  constructor(_latlng: LatLng, options?: MarkerOptions) {
    super();
    // Defaults loosely matching Leaflet docs
    const defaults: Partial<MarkerOptions> = {
      interactive: true,
      keyboard: true,
      title: '',
      alt: 'Marker',
      zIndexOffset: 0,
      opacity: 1,
      riseOnHover: false,
      riseOffset: 250,
      pane: 'markerPane',
      shadowPane: 'shadowPane',
      bubblingPointerEvents: false,
      autoPanOnFocus: true,
      draggable: false,
      autoPan: false,
      autoPanPadding: [50, 50],
      autoPanSpeed: 10,
    };
    setOptions(this, options, defaults);
    this.options = (this as any).options;
  }

  setLatLng(_latlng: LatLng): this { return this; }
  getLatLng(): [number, number] { return [0, 0]; }
  setIcon(_icon: Icon): this { return this; }
  setOpacity(_opacity: number): this { return this; }
  setZIndexOffset(_offset: number): this { return this; }

  // Popup / Tooltip convenience (stubs)
  bindPopup(_content: string | HTMLElement | unknown, _options?: unknown): this { return this; }
  openPopup(): this { return this; }
  unbindPopup(): this { return this; }
  bindTooltip(_content: string | HTMLElement | unknown, _options?: unknown): this { return this; }
  openTooltip(): this { return this; }
  unbindTooltip(): this { return this; }
}
