// Comprehensive type definitions for GTMap
// This file contains all public-facing types and interfaces

// Core geometric types
export type Point = { x: number; y: number };

// View and state types
export interface ViewState {
	center: Point;
	zoom: number;
	minZoom: number;
	maxZoom: number;
	wrapX: boolean;
}

// Tile system types
export interface TileBounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

export interface TileSourceOptions {
	url?: string;
	tileSize?: number;
	sourceMinZoom?: number;
	sourceMaxZoom?: number;
	mapSize?: { width: number; height: number };
	wrapX?: boolean;
	clearCache?: boolean;
}

// Map configuration
export interface MapOptions {
	tileUrl?: string;
	tileSize?: number;
	mapSize?: { width: number; height: number };
	minZoom?: number;
	maxZoom?: number;
	wrapX?: boolean;
	center?: Point;
	zoom?: number;
	/**
	 * Automatically resize the map when the container size or window DPR changes.
	 * Enabled by default.
	 */
	autoResize?: boolean;
  /**
   * Viewport background: either 'transparent' (default when omitted) or a solid color.
   * Alpha on provided colors is ignored; pass a hex like '#0a0a0a' or RGB components.
   */
  backgroundColor?: string | { r: number; g: number; b: number; a?: number };
	prefetch?: { enabled?: boolean; baselineLevel?: number; ring?: number };
	screenCache?: boolean;
	fpsCap?: number;
}

// Content types
export interface Marker {
	x: number;
	y: number;
	type?: string;
	size?: number;
	rotation?: number; // degrees clockwise (optional)
	id?: string;
	data?: any | null;
}

export interface IconDef {
	iconPath: string;
	x2IconPath?: string;
	width: number;
	height: number;
	anchorX?: number;
	anchorY?: number;
}

export interface IconHandle {
	id: string;
}

// Vector styling
export interface VectorStyle {
	color?: string;
	weight?: number;
	opacity?: number;
	fill?: boolean;
	fillColor?: string;
	fillOpacity?: number;
}

// Vector primitives with discriminated unions
export type Polyline = {
	type: 'polyline';
	points: Point[];
	style?: VectorStyle;
};

export type Polygon = {
	type: 'polygon';
	points: Point[];
	style?: VectorStyle;
};

export type Circle = {
	type: 'circle';
	center: Point;
	radius: number;
	style?: VectorStyle;
};

export type Vector = Polyline | Polygon | Circle;

// Type guards for vector types
export function isPolyline(v: Vector): v is Polyline {
	return v.type === 'polyline';
}

export function isPolygon(v: Vector): v is Polygon {
	return v.type === 'polygon';
}

export function isCircle(v: Vector): v is Circle {
	return v.type === 'circle';
}

// Event data types
export interface PointerEventData {
	x: number;
	y: number;
	world: Point | null;
	view: ViewState;
	originalEvent: PointerEvent;
}

export interface MouseEventData {
	x: number;
	y: number;
	world: Point | null;
	view: ViewState;
	originalEvent: MouseEvent;
	markers?: MarkerHit[];
}

export interface MarkerHit {
	marker: { id: string; index: number; world: Point; size: { w: number; h: number }; rotation?: number; data?: any | null };
	icon: { id: string; iconPath: string; x2IconPath?: string; width: number; height: number; anchorX: number; anchorY: number };
}

export interface MoveEventData {
	view: ViewState;
}

export interface ZoomEventData {
	view: ViewState;
}

export interface FrameEventData {
	now: number;
	stats?: RenderStats;
}

// Lifecycle event payloads
export interface LoadEventData {
	view: ViewState;
	size: { width: number; height: number; dpr: number };
}

export interface ResizeEventData {
	view: ViewState;
	size: { width: number; height: number; dpr: number };
}

// Base event (shared fields for richer payloads)
export interface BaseEvent {
	now: number;
	view: ViewState;
	screen?: { x: number; y: number };
	world?: Point | null;
}

// Event map for type-safe event handling
export interface EventMap {
	[k: string]: unknown;
	load: LoadEventData;
	resize: ResizeEventData;
	move: MoveEventData;
	moveend: MoveEventData;
	zoom: ZoomEventData;
	zoomend: ZoomEventData;
	pointerdown: PointerEventData;
	pointermove: PointerEventData;
	pointerup: PointerEventData;
	frame: FrameEventData;
	markerenter: MarkerEventData;
	markerleave: MarkerEventData;
	markerclick: MarkerEventData;
	markerdown: MarkerEventData;
	markerup: MarkerEventData;
	markerlongpress: MarkerEventData;
	mousedown: MouseEventData;
	mousemove: MouseEventData;
	mouseup: MouseEventData;
	click: MouseEventData;
	dblclick: MouseEventData;
	contextmenu: MouseEventData;
}

// Performance stats
export interface RenderStats {
	fps?: number;
	tilesLoaded?: number;
	tilesVisible?: number;
	cacheSize?: number;
	inflight?: number;
	pending?: number;
	frame?: number;
}

// WebGL types
export type GLContext = WebGLRenderingContext | WebGL2RenderingContext;

export interface ShaderLocations {
	a_pos: number;
	u_translate: WebGLUniformLocation | null;
	u_size: WebGLUniformLocation | null;
	u_resolution: WebGLUniformLocation | null;
	u_tex: WebGLUniformLocation | null;
	u_alpha: WebGLUniformLocation | null;
	u_uv0: WebGLUniformLocation | null;
	u_uv1: WebGLUniformLocation | null;
	u_texel?: WebGLUniformLocation | null;
	u_filterMode?: WebGLUniformLocation | null;
}

// WebGL extension interfaces
export interface ANGLEInstancedArrays {
	vertexAttribDivisorANGLE(index: number, divisor: number): void;
	drawArraysInstancedANGLE(mode: number, first: number, count: number, primcount: number): void;
	drawElementsInstancedANGLE(mode: number, count: number, type: number, offset: number, primcount: number): void;
}

export interface WebGLLoseContext {
	loseContext(): void;
	restoreContext(): void;
}

// Branded types for type safety
export type TileKey = string & { __brand: 'TileKey' };
export type TileURL = string & { __brand: 'TileURL' };
export type IconID = string & { __brand: 'IconID' };

// Helper functions to create branded types
export function tileKey(z: number, x: number, y: number): TileKey {
	return `${z}/${x}/${y}` as TileKey;
}

export function tileURL(template: string, z: number, x: number, y: number): TileURL {
	return template.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y)) as TileURL;
}

export function iconID(id: string): IconID {
	return id as IconID;
}

// Lifecycle options
export interface ActiveOptions {
	releaseGL?: boolean;
}

// Internal vector primitive (with lng/lat)
export type VectorPrimitiveInternal =
	| { type: 'polyline'; points: { lng: number; lat: number }[]; style?: VectorStyle }
	| { type: 'polygon'; points: { lng: number; lat: number }[]; style?: VectorStyle }
	| { type: 'circle'; center: { lng: number; lat: number }; radius: number; style?: VectorStyle };

// Marker internal representation
export interface MarkerInternal {
	lng: number;
	lat: number;
	type: string;
	size?: number;
	rotation?: number;
	id: string;
}

// Icon definition internal
export interface IconDefInternal {
	iconPath: string;
	x2IconPath?: string;
	width: number;
	height: number;
	anchorX?: number;
	anchorY?: number;
}

export interface MarkerEventData {
	now: number;
	view: ViewState;
	screen: { x: number; y: number };
	marker: { id: string; index: number; world: Point; size: { w: number; h: number }; rotation?: number; data?: any | null };
	icon: { id: string; iconPath: string; x2IconPath?: string; width: number; height: number; anchorX: number; anchorY: number };
	originalEvent?: PointerEvent | MouseEvent;
}

// Inertia options
export interface InertiaOptions {
	inertia?: boolean;
	inertiaDeceleration?: number;
	inertiaMaxSpeed?: number;
	easeLinearity?: number;
}

// Prefetch options
export interface PrefetchOptions {
	enabled?: boolean;
	baselineLevel?: number;
	ring?: number;
}

// Max bounds (pixel coordinates)
export interface MaxBoundsPx {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

// Filter modes
export type UpscaleFilterMode = 'auto' | 'linear' | 'bicubic';

// Icon scaling function
// Returns a scale multiplier where 1.0 = original size
export type IconScaleFunction = (zoom: number, minZoom: number, maxZoom: number) => number;

// Public event surface: exported via api/events/public

// Transitions (builder) types
export type Easing = (t: number) => number;

export interface AnimateOptions {
  durationMs: number;
  easing?: Easing;
  delayMs?: number;
  interrupt?: 'cancel' | 'join' | 'enqueue';
}

export interface ApplyOptions {
  animate?: AnimateOptions;
}

export type ApplyStatus = 'instant' | 'animated' | 'canceled';

export interface ApplyResult {
  status: ApplyStatus;
}
