import type { Point } from '../types';

/**
 * Lightweight snapshot of a marker used in event payloads.
 */
export interface MarkerData {
  id: string;
  x: number;
  y: number;
  data?: unknown;
}

// Vector geometry
export type Polyline = { type: 'polyline'; points: Point[] };
export type Polygon = { type: 'polygon'; points: Point[] };
export type Circle = { type: 'circle'; center: Point; radius: number };
/** Union of supported vector geometries. */
export type VectorGeometry = Polyline | Polygon | Circle;

/**
 * Lightweight snapshot of a vector used in event payloads.
 */
export interface VectorData {
  id: string;
  geometry: VectorGeometry;
}

// Pointer metadata for device-specific behavior
export type InputDevice = 'mouse' | 'touch' | 'pen';

export interface PointerModifiers { alt: boolean; ctrl: boolean; meta: boolean; shift: boolean }

export interface PointerMeta {
  device: InputDevice;
  isPrimary: boolean;
  buttons: number;
  pointerId: number;
  pressure?: number;
  width?: number;
  height?: number;
  tiltX?: number;
  tiltY?: number;
  twist?: number;
  modifiers: PointerModifiers;
}

// Per-entity event maps
/** Events emitted by a Marker instance. */
export interface MarkerEventMap {
  [k: string]: unknown;
  click: { x: number; y: number; marker: MarkerData; pointer?: PointerMeta };
  pointerenter: { x: number; y: number; marker: MarkerData; pointer?: PointerMeta };
  pointerleave: { x: number; y: number; marker: MarkerData; pointer?: PointerMeta };
  positionchange: { x: number; y: number; dx: number; dy: number; marker: MarkerData };
  remove: { marker: MarkerData };
}

/** Events emitted by a Vector instance. */
export interface VectorEventMap {
  [k: string]: unknown;
  // Reserved for future: hover/click/edit
  remove: { vector: VectorData };
}

/** Events emitted by a Layer for entity management and visibility. */
export interface LayerEventMap<T> {
  [k: string]: unknown;
  entityadd: { entity: T };
  entityremove: { entity: T };
  clear: {};
  visibilitychange: { visible: boolean };
}
