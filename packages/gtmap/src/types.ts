import type { LngLat } from '../src/mapgl';

export type ViewState = {
  center: LngLat;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  wrapX: boolean;
};

