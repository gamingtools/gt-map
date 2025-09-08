/**
 * Comprehensive type definitions for GTMap.
 *
 * @module
 * @remarks
 * This file contains all public-facing types and interfaces for consumers of the library.
 * Prefer these types over duplicating shapes in app code.
 */

/**
 * 2D point in world pixel coordinates.
 * @public
 */
export type Point = { x: number; y: number };

/**
 * Current map view state snapshot.
 * @public
 */
export interface ViewState {
	/** Center position in world pixels */
	center: Point;
	/** Current zoom level (fractional allowed) */
	zoom: number;
	/** Minimum allowed zoom level */
	minZoom: number;
	/** Maximum allowed zoom level */
	maxZoom: number;
	/** Whether horizontal wrapping is enabled */
	wrapX: boolean;
}

/**
 * Bounding box for tile coordinates.
 * @public
 */
export interface TileBounds {
	/** Minimum X tile coordinate */
	minX: number;
	/** Minimum Y tile coordinate */
	minY: number;
	/** Maximum X tile coordinate */
	maxX: number;
	/** Maximum Y tile coordinate */
	maxY: number;
}

export interface TileSourceOptions {
  /** URL template for tile loading. Use {z}, {x}, {y} placeholders. */
  url: string;
  /** Tile size in pixels (e.g., 256). */
  tileSize: number;
  /** Min level provided by the source (usually 0). */
  sourceMinZoom: number;
  /** Max level provided by the source (top of the image pyramid). */
  sourceMaxZoom: number;
  /** Base image size at native resolution. */
  mapSize: { width: number; height: number };
  /** Enable horizontal wrap for infinite panning. */
  wrapX?: boolean;
  /** Clear GPU/cache when switching sources. */
  clearCache?: boolean;
}

/**
 * Configuration options for creating a GTMap instance.
 * @public
 */
export interface MapOptions {
  /** 
   * Tile source configuration (URL template, pyramid, wrap).
   * Required for map initialization.
   */
  tileSource: TileSourceOptions;
  
  /** 
   * Minimum zoom level.
   * @defaultValue `0`
   */
	minZoom?: number;
	
	/** 
	 * Maximum zoom level.
	 * @defaultValue `sourceMaxZoom` from tile source
	 */
	maxZoom?: number;
	
	/** 
	 * Initial center position in world pixels.
	 * @defaultValue Center of the map
	 */
	center?: Point;
	
	/** 
	 * Initial zoom level.
	 * @defaultValue `0`
	 */
	zoom?: number;
	
	/**
	 * Automatically resize the map when the container size or window DPR changes.
	 * @defaultValue `true`
	 */
	autoResize?: boolean;
	
  /**
   * Viewport background: either 'transparent' or a solid color.
   * @defaultValue `'transparent'`
   * @remarks
   * Alpha on provided colors is ignored; pass a hex like '#0a0a0a' or RGB components.
   */
  backgroundColor?: string | { r: number; g: number; b: number; a?: number };
  
  /** 
   * Tile prefetching configuration.
   * @defaultValue `{ enabled: true, baselineLevel: 2, ring: 1 }`
   */
	prefetch?: { enabled?: boolean; baselineLevel?: number; ring?: number };
	
	/** 
	 * Enable screen caching optimization.
	 * @defaultValue `true`
	 */
	screenCache?: boolean;
	
	/** 
	 * Maximum frames per second.
	 * @defaultValue `60`
	 */
	fpsCap?: number;
}

/**
 * Marker definition for map display.
 * @public
 * @typeParam T - Type of custom data attached to the marker
 * @deprecated Use {@link GTMap.addMarker} with {@link MarkerOptions} instead
 */
export interface Marker<T = unknown> {
	/** X coordinate in world pixels */
	x: number;
	/** Y coordinate in world pixels */
	y: number;
	/** Icon type identifier */
	type?: string;
	/** Scale multiplier */
	size?: number;
	/** Rotation in degrees (clockwise) */
	rotation?: number;
	/** Unique marker ID */
	id?: string;
	/** Custom user data */
	data?: T | null;
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

/**
 * Style properties for vector shapes.
 * @public
 */
export interface VectorStyle {
	/** 
	 * Stroke color (CSS color string).
	 * @defaultValue `'#3388ff'`
	 */
	color?: string;
	
	/** 
	 * Stroke width in pixels.
	 * @defaultValue `3`
	 */
	weight?: number;
	
	/** 
	 * Stroke opacity (0-1).
	 * @defaultValue `1`
	 */
	opacity?: number;
	
	/** 
	 * Whether to fill the shape (polygon/circle only).
	 * @defaultValue `false`
	 */
	fill?: boolean;
	
	/** 
	 * Fill color (CSS color string).
	 * @defaultValue Same as `color`
	 */
	fillColor?: string;
	
	/** 
	 * Fill opacity (0-1).
	 * @defaultValue `0.2`
	 */
	fillOpacity?: number;
}

/**
 * Polyline vector shape.
 * @public
 */
export type Polyline = {
	/** Shape type discriminator */
	type: 'polyline';
	/** Array of points defining the line */
	points: Point[];
	/** Optional style properties */
	style?: VectorStyle;
};

/**
 * Polygon vector shape.
 * @public
 */
export type Polygon = {
	/** Shape type discriminator */
	type: 'polygon';
	/** Array of points defining the polygon (auto-closed) */
	points: Point[];
	/** Optional style properties */
	style?: VectorStyle;
};

/**
 * Circle vector shape.
 * @public
 */
export type Circle = {
	/** Shape type discriminator */
	type: 'circle';
	/** Center position in world pixels */
	center: Point;
	/** Radius in pixels at native zoom */
	radius: number;
	/** Optional style properties */
	style?: VectorStyle;
};

/**
 * Union type for all vector shapes.
 * @public
 */
export type Vector = Polyline | Polygon | Circle;

/**
 * Type guard to check if a vector is a polyline.
 * @public
 * @param v - Vector to check
 * @returns `true` if the vector is a polyline
 */
export function isPolyline(v: Vector): v is Polyline {
	return v.type === 'polyline';
}

/**
 * Type guard to check if a vector is a polygon.
 * @public
 * @param v - Vector to check
 * @returns `true` if the vector is a polygon
 */
export function isPolygon(v: Vector): v is Polygon {
	return v.type === 'polygon';
}

/**
 * Type guard to check if a vector is a circle.
 * @public
 * @param v - Vector to check
 * @returns `true` if the vector is a circle
 */
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
export interface MouseEventData<T = unknown> {
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
    markers?: MarkerHit<T>[];
}

/**
 * Marker hit information for hover/interaction.
 * @public
 * @typeParam T - Type of custom data attached to the marker
 */
export interface MarkerHit<T = unknown> {
    /** Lightweight marker snapshot for hover purposes */
    marker: { 
        /** Unique marker ID */
        id: string; 
        /** Marker index in render batch */
        index: number; 
        /** World position */
        world: Point; 
        /** Icon dimensions */
        size: { w: number; h: number }; 
        /** Rotation in degrees */
        rotation?: number; 
        /** Custom user data */
        data?: T | null;
    };
    /** Icon metadata associated with the hit marker */
    icon: { 
        /** Icon type ID */
        id: string; 
        /** Icon image URL */
        iconPath: string; 
        /** 2x resolution URL */
        x2IconPath?: string; 
        /** Icon width */
        width: number; 
        /** Icon height */
        height: number; 
        /** Anchor X offset */
        anchorX: number; 
        /** Anchor Y offset */
        anchorY: number;
    };
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
    /** Optional renderer stats if enabled. */
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
    mousedown: MouseEventData<TMarkerData>;
	/** Mouse move (derived from pointer); may include `markers?` hover hits. */
    mousemove: MouseEventData<TMarkerData>;
	/** Mouse up (derived from pointer). */
    mouseup: MouseEventData<TMarkerData>;
	/** Mouse click (derived from pointer). */
    click: MouseEventData<TMarkerData>;
	/** Double‑click (derived). */
    dblclick: MouseEventData<TMarkerData>;
	/** Context menu (derived). */
    contextmenu: MouseEventData<TMarkerData>;
}

/**
 * Rendering performance statistics.
 * @public
 */
export interface RenderStats {
	/** Current frames per second */
	fps?: number;
	/** Total tiles loaded in cache */
	tilesLoaded?: number;
	/** Tiles currently visible */
	tilesVisible?: number;
	/** Number of tiles in cache */
	cacheSize?: number;
	/** Tiles currently loading */
	inflight?: number;
	/** Tiles waiting to load */
	pending?: number;
	/** Current frame number */
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
  // Map rotation (for generic quad program)
  u_centerPx?: WebGLUniformLocation | null;
  u_rotSinCos?: WebGLUniformLocation | null; // (sin, cos)
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

/**
 * Options for map activation/deactivation.
 * @public
 */
export interface ActiveOptions {
	/** 
	 * Release WebGL resources when deactivating.
	 * @defaultValue `false`
	 */
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

// Prefetch options
export interface PrefetchOptions {
	enabled?: boolean;
	baselineLevel?: number;
	ring?: number;
}

/**
 * Maximum bounds constraint in world pixel coordinates.
 * @public
 */
export interface MaxBoundsPx {
	/** Minimum X coordinate */
	minX: number;
	/** Minimum Y coordinate */
	minY: number;
	/** Maximum X coordinate */
	maxX: number;
	/** Maximum Y coordinate */
	maxY: number;
}

/**
 * Upscaling filter mode for tile rendering.
 * @public
 */
export type UpscaleFilterMode = 'auto' | 'linear' | 'bicubic';

/**
 * Function to calculate icon scale based on zoom level.
 * @public
 * @param zoom - Current zoom level
 * @param minZoom - Minimum zoom level
 * @param maxZoom - Maximum zoom level
 * @returns Scale multiplier where 1.0 = original size
 */
export type IconScaleFunction = (zoom: number, minZoom: number, maxZoom: number) => number;

/**
 * Marker behavior during map rotation.
 * @public
 * - `'rotate'` - Markers rotate with the map
 * - `'keep'` - Markers maintain screen orientation
 */
export type MarkerRotationMode = 'rotate' | 'keep';

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
export type ApplyStatus = 'instant' | 'animated' | 'canceled';

/** Result returned by {@link ApplyOptions | apply} Promises. */
export interface ApplyResult {
  /** Completion status of the transition. */
  status: ApplyStatus;
}
