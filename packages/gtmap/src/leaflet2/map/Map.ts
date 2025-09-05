// Leaflet 2.0-like Map (TypeScript stub)
import { Evented } from '../core/Evented';
import type { Layer } from '../layer/Layer';
import type { Point } from '../geometry/Point';
import type { Bounds } from '../geometry/Bounds';

export type Size = Point;
export type LatLng = { lat: number; lng: number } | [number, number];
// import Bounds from geometry

export type MapOptions = {
  center?: LatLng;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  inertia?: boolean;
  zoomAnimation?: boolean;
  markerZoomAnimation?: boolean;
};

export class Map extends Evented {
  options: MapOptions;
  constructor(_container: HTMLElement | string, options?: MapOptions) {
    super();
    this.options = { ...(options || {}) };
  }

  // Public API (stubs)
  setView(_center: LatLng, _zoom?: number): this { return this; }
  getCenter(): [number, number] { return [0, 0]; }
  getZoom(): number { return this.options.zoom ?? 0; }
  setZoom(_zoom: number): this { return this; }
  panTo(_center: LatLng): this { return this; }
  flyTo(_center: LatLng, _zoom?: number): this { return this; }
  fitBounds(_bounds: Bounds, _opts?: Record<string, unknown>): this { return this; }
  addLayer(_layer: Layer): this { return this; }
  removeLayer(_layer: Layer): this { return this; }
  hasLayer(_layer: Layer): boolean { return false; }
  invalidateSize(_opts?: Record<string, unknown>): this { return this; }
  getSize(): Size { return { x: 0, y: 0 }; }
}
