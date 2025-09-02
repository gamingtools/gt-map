import type { LngLat } from '../src/mapgl';

export type ViewState = {
  center: LngLat;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  wrapX: boolean;
};

export type TileTask = { key: string; url: string; z: number; x: number; y: number; priority: number };

export interface TileDeps {
  hasTile(key: string): boolean;
  isPending(key: string): boolean;
  urlFor(z: number, x: number, y: number): string;
  hasCapacity(): boolean;
  now(): number;
  getInteractionIdleMs(): number;
  getLastInteractAt(): number;
  getZoom(): number;
  getCenter(): LngLat;
  startImageLoad(task: { key: string; url: string }): void;
  addPinned(key: string): void;
}
