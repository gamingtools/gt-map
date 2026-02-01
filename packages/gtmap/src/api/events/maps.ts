import type { Polyline as PolylineT, Polygon as PolygonT, Circle as CircleT } from '../types';

/**
 * Lightweight snapshot of a marker used in event payloads.
 */
export interface MarkerData<T = unknown> {
	id: string;
	x: number;
	y: number;
	data?: T;
}

// Vector geometry (reuse public shapes without style fields)
/** Union of supported vector geometries. */
export type VectorGeometry = PolylineT | PolygonT | CircleT;

/**
 * Lightweight snapshot of a vector used in event payloads.
 */
export interface VectorData<T = unknown> {
	id: string;
	geometry: VectorGeometry;
	data?: T;
}

// Pointer metadata for device-specific behavior
export type InputDevice = 'mouse' | 'touch' | 'pen';

export interface PointerModifiers {
	alt: boolean;
	ctrl: boolean;
	meta: boolean;
	shift: boolean;
}

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
export interface MarkerEventMap<T = unknown> {
	/** Device‑agnostic activate (mouse click or touch tap). */
	click: { x: number; y: number; marker: MarkerData<T>; pointer?: PointerMeta };
	/** Touch alias for click (emitted only on touch). */
	tap: { x: number; y: number; marker: MarkerData<T>; pointer?: PointerMeta };
	/** Touch long‑press (~500ms) on the marker. */
	longpress: { x: number; y: number; marker: MarkerData<T>; pointer?: PointerMeta };
	/** Pointer pressed on the marker. */
	pointerdown: { x: number; y: number; marker: MarkerData<T>; pointer?: PointerMeta };
	/** Pointer released on the marker. */
	pointerup: { x: number; y: number; marker: MarkerData<T>; pointer?: PointerMeta };
	/** Hover enter on the top‑most marker under the pointer. */
	pointerenter: { x: number; y: number; marker: MarkerData<T>; pointer?: PointerMeta };
	/** Hover leave for the previously hovered marker. */
	pointerleave: { x: number; y: number; marker: MarkerData<T>; pointer?: PointerMeta };
	/** Position changed via Marker.moveTo; includes deltas. */
	positionchange: { x: number; y: number; dx: number; dy: number; marker: MarkerData<T> };
	/** Marker was removed. */
	remove: { marker: MarkerData<T> };
}

/** Events emitted by a Vector instance. */
export interface VectorEventMap<T = unknown> {
	/** Vector was removed. */
	remove: { vector: VectorData<T> };
}

/** Events emitted by an EntityCollection for entity management and visibility. */
export interface EntityCollectionEventMap<T> {
	/** A new entity was added to the collection. */
	entityadd: { entity: T };
	/** An entity was removed from the collection. */
	entityremove: { entity: T };
	/** All entities were removed. */
	clear: {};
	/** Visibility of the collection changed. */
	visibilitychange: { visible: boolean };
}
