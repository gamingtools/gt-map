/**
 * Comprehensive type definitions for GTMap.
 *
 * @remarks
 * This file contains all public‑facing types and interfaces for consumers of the library.
 * Prefer these types over duplicating shapes in app code.
 */

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

// Single-image source (pixel CRS)
export interface ImageSourceOptions {
	/** URL or data URL for the image. */
	url: string;
	/** Native width in pixels. */
	width: number;
	/** Native height in pixels. */
	height: number;
}

// Map configuration
export interface MapOptions {
  /** Single raster image to display. */
  image: ImageSourceOptions;
	minZoom?: number;
	maxZoom?: number;
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
	screenCache?: boolean;
	fpsCap?: number;
	wrapX?: boolean;
	freePan?: boolean;
	maxBoundsPx?: { minX: number; minY: number; maxX: number; maxY: number } | null;
	maxBoundsViscosity?: number;
  /**
   * When true, allow a small elastic bounce at zoom limits (visual easing only).
   * Defaults to false.
  */
  bounceAtZoomLimits?: boolean;
}

// Content types
export interface Marker {
	x: number;
	y: number;
	type?: string;
	size?: number;
	rotation?: number; // degrees clockwise (optional)
	id?: string;
	data?: unknown | null;
}

/**
 * Icon bitmap metadata for registering marker icons.
 *
 * @public
 * @remarks
 * Provide intrinsic pixel dimensions for the source image and optional 2x asset and anchor.
 */
export interface IconDef {
	/** URL or data URL for the 1x icon bitmap. */
	iconPath: string;
	/** Optional URL or data URL for a 2x (retina) icon bitmap. */
	x2IconPath?: string;
	/** Intrinsic width of the icon in pixels (1x asset). */
	width: number;
	/** Intrinsic height of the icon in pixels (1x asset). */
	height: number;
	/** Optional anchor X in pixels from the left (defaults to width/2). */
	anchorX?: number;
	/** Optional anchor Y in pixels from the top (defaults to height/2). */
	anchorY?: number;
}

/**
 * Opaque handle returned by GTMap.addIcon for use in GTMap.addMarker.
 * @public
 */
export interface IconHandle {
	/** Stable icon id. */
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
/**
 * Map‑level pointer event payload.
 *
 * @public
 * @remarks
 * Includes screen coordinates (CSS pixels), best‑effort world position, and the current view.
 */
export interface PointerEventData {
	/** Screen X in CSS pixels relative to the container. */
	x: number;
	/** Screen Y in CSS pixels relative to the container. */
	y: number;
	/** World position in pixels at current zoom, or `null` if the pointer is outside. */
	world: Point | null;
	/** Current view state snapshot. */
	view: ViewState;
	/** Original DOM pointer event. */
	originalEvent: PointerEvent;
}

/**
 * Map‑level mouse event payload (derived from pointer events).
 *
 * @public
 * @remarks
 * May include `markers?` hover hits for convenience when idle.
 */
export interface MouseEventData {
	/** Screen X in CSS pixels relative to the container. */
	x: number;
	/** Screen Y in CSS pixels relative to the container. */
	y: number;
	/** World position in pixels at current zoom, or `null` if the pointer is outside. */
	world: Point | null;
	/** Current view state snapshot. */
	view: ViewState;
	/** Original DOM mouse event. */
	originalEvent: MouseEvent;
	/** Optional hover hits under the cursor (when enabled). */
	markers?: MarkerHit[];
}

/** Marker hover hit on the map surface (mouse only, when enabled). */
export interface MarkerHit {
	/** Lightweight marker snapshot for hover purposes. */
	marker: { id: string; index: number; world: Point; size: { w: number; h: number }; rotation?: number; data?: unknown | null };
	/** Icon metadata associated with the hit marker. */
	icon: { id: string; iconPath: string; x2IconPath?: string; width: number; height: number; anchorX: number; anchorY: number };
}

/** Movement event payload: center changed. */
export interface MoveEventData {
	/** Current view state snapshot. */
	view: ViewState;
}

/** Zoom event payload: zoom changed. */
export interface ZoomEventData {
	/** Current view state snapshot. */
	view: ViewState;
}

/** Per‑frame payload for diagnostics/HUD. */
export interface FrameEventData {
    /** High‑resolution timestamp for the frame. */
    now: number;
    /**
     * Optional renderer stats if enabled.
     *
     * Note: At present only `frame` is populated by the engine. Other fields are reserved for
     * future diagnostics and may remain `undefined` in current builds.
     */
    stats?: RenderStats;
}

// Lifecycle event payloads
/** Load event payload: fired once after the first frame is scheduled. */
export interface LoadEventData {
	/** Current view state snapshot. */
	view: ViewState;
	/** Final container size and device pixel ratio. */
	size: { width: number; height: number; dpr: number };
}

/** Resize event payload: fired after a debounced resize completes. */
export interface ResizeEventData {
	/** Current view state snapshot. */
	view: ViewState;
	/** Final container size and device pixel ratio. */
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
export interface EventMap<TMarkerData = unknown> {
	/** Fired once after the first frame is scheduled. */
	load: LoadEventData;
	/** Fired after a debounced resize completes with final size + DPR. */
	resize: ResizeEventData;
	/** Continuous movement (center changed). */
	move: MoveEventData;
	/** Movement ended (center settled). */
	moveend: MoveEventData;
	/** Continuous zoom changes. */
	zoom: ZoomEventData;
	/** Zoom ended (zoom settled). */
	zoomend: ZoomEventData;
	/** Pointer pressed on the map. */
	pointerdown: PointerEventData;
	/** Pointer moved over the map. */
	pointermove: PointerEventData;
	/** Pointer released on the map. */
	pointerup: PointerEventData;
	/** Per‑frame hook with optional stats (HUD/diagnostics). */
	frame: FrameEventData;
	/** Marker hover enter (top‑most). */
	markerenter: MarkerEventData<TMarkerData>;
	/** Marker hover leave. */
	markerleave: MarkerEventData<TMarkerData>;
	/** Marker click (device‑agnostic). */
	markerclick: MarkerEventData<TMarkerData>;
	/** Marker pointer down. */
	markerdown: MarkerEventData<TMarkerData>;
	/** Marker pointer up. */
	markerup: MarkerEventData<TMarkerData>;
	/** Marker long‑press (~500ms). */
	markerlongpress: MarkerEventData<TMarkerData>;
	/** Mouse down (derived from pointer). */
	mousedown: MouseEventData;
	/** Mouse move (derived from pointer); may include `markers?` hover hits. */
	mousemove: MouseEventData;
	/** Mouse up (derived from pointer). */
	mouseup: MouseEventData;
	/** Mouse click (derived from pointer). */
	click: MouseEventData;
	/** Double‑click (derived). */
	dblclick: MouseEventData;
	/** Context menu (derived). */
	contextmenu: MouseEventData;
}

// Performance stats (optional fields for diagnostics)
export interface RenderStats {
    fps?: number;
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
export type IconID = string & { __brand: 'IconID' };

// Helper functions to create branded types
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

export interface MarkerEventData<T = unknown> {
	now: number;
	view: ViewState;
	screen: { x: number; y: number };
	marker: { id: string; index: number; world: Point; size: { w: number; h: number }; rotation?: number; data?: T | null };
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

// Max bounds (pixel coordinates)
export interface MaxBoundsPx {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

// Filter modes
export type UpscaleFilterMode = 'auto' | 'linear' | 'bicubic';

/**
 * Icon scaling policy.
 *
 * @public
 * @param zoom - Current map zoom (fractional allowed)
 * @param minZoom - Effective minimum zoom for the current image/view
 * @param maxZoom - Effective maximum zoom for the current image/view
 * @returns A scale multiplier where `1.0` means screen‑fixed size.
 *
 * @remarks
 * The return value multiplies each icon's intrinsic width/height and its anchor.
 * Use `() => 1` to keep icons screen‑fixed; use a zoom‑based curve (e.g., `Math.pow(2, zoom - 3)`) to
 * make icons appear to scale with the world.
 *
 * The function is evaluated per frame for the current zoom. For stability, prefer continuous curves
 * or clamp the output to a sensible range.
 */
export type IconScaleFunction = (zoom: number, minZoom: number, maxZoom: number) => number;

// Public event surface: exported via api/events/public

// Transitions (builder) types
/**
 * Easing function type.
 *
 * @public
 * @param t - Normalized time in the range [0, 1]
 * @returns Normalized progress in the range [0, 1]
 */
export type Easing = (t: number) => number;

/**
 * Options for animating a transition.
 *
 * @public
 */
export interface AnimateOptions {
	/** Total animation time in milliseconds. */
	durationMs: number;
	/** Optional easing function; defaults to a built‑in ease curve. */
	easing?: Easing;
	/** Optional delay before starting, in milliseconds. */
	delayMs?: number;
	/**
	 * Policy when another transition targets the same object.
	 *
	 * - `cancel` (default): stop the previous transition
	 * - `join`: retarget the current transition to the new end state
	 * - `enqueue`: start after the current one finishes
	 */
	interrupt?: 'cancel' | 'join' | 'enqueue';
}

/**
 * Options for committing a transition.
 *
 * @public
 */
export interface ApplyOptions {
	/** Optional animation parameters; omit for an instant apply. */
	animate?: AnimateOptions;
}

/** Status describing how a transition completed. */
export type ApplyStatus = 'instant' | 'animated' | 'canceled' | 'complete' | 'error';

/** Result returned by {@link ApplyOptions | apply} Promises. */
export interface ApplyResult {
	/** Completion status of the transition. */
	status: ApplyStatus;
	/** Error details if status is 'error' */
	error?: Error | unknown;
}
