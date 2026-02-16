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

/**
 * Tile pyramid source options (GTPK pack only).
 *
 * @remarks
 * Tiles must be square (tileSize x tileSize), but the overall map may be non-square.
 */
export interface TileSourceOptions {
	/** URL to a `.gtpk` tile pack (single binary containing the full tile pyramid). */
	packUrl: string;
	/** Tile size in pixels (tiles are always square). */
	tileSize: number;
	/** Minimum zoom level available in the tile set. */
	sourceMinZoom: number;
	/** Maximum zoom level available in the tile set. */
	sourceMaxZoom: number;
}

// Map configuration
export interface MapOptions {
	/** Map bounds in pixels (defines the coordinate space). */
	mapSize: { width: number; height: number };
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
	 * When true, clip all rendering (raster, markers, vectors) to the map image bounds.
	 * Useful to prevent content from appearing outside the actual map area.
	 * Defaults to false.
	 */
	clipToBounds?: boolean;
	/**
	 * When true, allow a small elastic bounce at zoom limits (visual easing only).
	 * Defaults to false.
	 */
	bounceAtZoomLimits?: boolean;
	/**
	 * Spinner appearance while loading tiles.
	 *
	 * - size: outer diameter in CSS pixels (default 32)
	 * - thickness: ring thickness in CSS pixels (default 3)
	 * - color: active arc color (default 'rgba(0,0,0,0.6)')
	 * - trackColor: background ring color (default 'rgba(0,0,0,0.2)')
	 * - speedMs: rotation period in milliseconds (default 1000)
	 */
	spinner?: SpinnerOptions;
	/**
	 * Fractional zoom threshold at which the renderer snaps to the next tile zoom level.
	 *
	 * At zoom 3.4 with threshold 0.4, the renderer uses z=4 tiles (scaled down ~0.66x)
	 * instead of z=3 tiles (scaled up ~1.32x). Lower values bias toward sharper tiles
	 * at the cost of loading more tiles; higher values keep using lower-z tiles longer.
	 *
	 * Range: 0 to 1. Default: 0.4.
	 * - 0 = always use ceil (sharpest, most tiles)
	 * - 0.5 = equivalent to Math.round
	 * - 1 = equivalent to Math.floor (current blurriest, fewest tiles)
	 */
	zoomSnapThreshold?: number;
	/**
	 * Enable debug logging to console for this map instance.
	 * When true, logs initialization timing, image uploads, and internal events.
	 * Default: false.
	 */
	debug?: boolean;
}

export interface SpinnerOptions {
	size?: number;
	thickness?: number;
	color?: string;
	trackColor?: string;
	speedMs?: number;
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

// Type guards for vector geometry
export function isPolyline(v: Polyline | Polygon | Circle): v is Polyline {
	return v.type === 'polyline';
}

export function isPolygon(v: Polyline | Polygon | Circle): v is Polygon {
	return v.type === 'polygon';
}

export function isCircle(v: Polyline | Polygon | Circle): v is Circle {
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
	/** Original DOM pointer/mouse event. */
	originalEvent: PointerEvent | MouseEvent;
	/** Optional hover hits under the cursor (when enabled). */
	markers?: MarkerHit[];
}

/** Marker hover hit on the map surface (mouse only, when enabled). */
export interface MarkerHit {
	/** Lightweight marker snapshot for hover purposes. */
	marker: { id: string; index: number; world: Point; size: { width: number; height: number }; rotation?: number; data?: unknown | null };
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

// Event map for type-safe event handling
export interface EventMap {
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
	markerenter: MarkerEventData;
	/** Marker hover leave. */
	markerleave: MarkerEventData;
	/** Marker click (device‑agnostic). */
	markerclick: MarkerEventData;
	/** Marker pointer down. */
	markerdown: MarkerEventData;
	/** Marker pointer up. */
	markerup: MarkerEventData;
	/** Marker long‑press (~500ms). */
	markerlongpress: MarkerEventData;
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

// Sprite atlas types

/** A single sprite entry within a sprite atlas descriptor. */
export interface SpriteAtlasEntry {
	/** X offset in the atlas image (pixels). */
	x: number;
	/** Y offset in the atlas image (pixels). */
	y: number;
	/** Sprite width in the atlas image (pixels). */
	width: number;
	/** Sprite height in the atlas image (pixels). */
	height: number;
	/** Anchor X in pixels from the left (defaults to width/2). */
	anchorX?: number;
	/** Anchor Y in pixels from the top (defaults to height/2). */
	anchorY?: number;
	/** Optional tags for user extensibility (ignored by library). */
	tags?: string[];
	/** Optional metadata for user extensibility (ignored by library). */
	metadata?: Record<string, unknown>;
}

/** Informational metadata about a sprite atlas. */
export interface SpriteAtlasMeta {
	/** Filename of the atlas image (informational). */
	image?: string;
	/** Total atlas image dimensions (required for UV computation). */
	size: { width: number; height: number };
	/** Pixel format (informational, e.g. 'RGBA8888'). */
	format?: string;
	/** Generator tool name (informational). */
	generator?: string;
	/** ISO timestamp of generation (informational). */
	generatedAt?: string;
}

/** Full sprite atlas JSON descriptor. */
export interface SpriteAtlasDescriptor {
	/** Format version (currently 1). */
	version: 1;
	/** Atlas metadata. */
	meta: SpriteAtlasMeta;
	/** Map of sprite name to its atlas entry. */
	sprites: Record<string, SpriteAtlasEntry>;
}

/** Opaque handle returned after loading a sprite atlas. */
export interface SpriteAtlasHandle {
	/** Stable atlas identifier. */
	atlasId: string;
	/** Map of sprite name to its resolved icon ID. */
	spriteIds: Record<string, string>;
}

// Lifecycle options
export interface SuspendOptions {
	/** If true, release WebGL context and textures to free VRAM */
	releaseGL?: boolean;
}

// Internal vector primitive (pixel coordinates)
// Vectors always render at z=0. Markers default to z=1.
export type VectorPrimitiveInternal =
	| { type: 'polyline'; points: { x: number; y: number }[]; style?: VectorStyle }
	| { type: 'polygon'; points: { x: number; y: number }[]; style?: VectorStyle }
	| { type: 'circle'; center: { x: number; y: number }; radius: number; style?: VectorStyle };

// Marker internal representation
export interface MarkerInternal {
	x: number;
	y: number;
	type: string;
	size?: number;
	rotation?: number;
	id: string;
	/** Per-marker icon scale function override (undefined = use map's, null = no scaling) */
	iconScaleFunction?: IconScaleFunction | null;
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
	marker: { id: string; index: number; world: Point; size: { width: number; height: number }; rotation?: number; data?: unknown | null };
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

/**
 * Padding specification for view fitting operations.
 *
 * @public
 * @remarks
 * When a `number` is provided it is applied uniformly to all four sides.
 * Pass an object with `top`, `right`, `bottom`, `left` for per-side control.
 * Negative values are clamped to zero.
 *
 * @example
 * ```ts
 * // Uniform 50 px padding on every side
 * const pad: PaddingInput = 50;
 *
 * // Asymmetric padding (e.g. to avoid a sidebar)
 * const pad: PaddingInput = { top: 20, right: 300, bottom: 20, left: 20 };
 * ```
 */
export type PaddingInput = number | { top: number; right: number; bottom: number; left: number };

/**
 * Options for {@link ViewFacade.setView}.
 *
 * @public
 * @remarks
 * All fields are optional. Omitting every field is a no-op that resolves with
 * `{ status: 'complete' }`.
 *
 * **Resolution order:**
 * 1. `bounds` or `points` are converted to a center + zoom via fit logic.
 * 2. An explicit `center` overrides the center derived from bounds/points.
 * 3. An explicit `zoom` overrides the zoom derived from bounds/points.
 * 4. `offset` is added to whichever center was resolved (or the current center).
 * 5. `padding` is applied only when `bounds` or `points` are used.
 *
 * When `animate` is provided the view animates; otherwise the change is instant.
 *
 * @example
 * ```ts
 * // Instant jump to a position
 * await map.view.setView({ center: { x: 4096, y: 4096 }, zoom: 3 });
 *
 * // Animated fly-to
 * await map.view.setView({ center: HOME, animate: { durationMs: 800 } });
 *
 * // Fit bounds with padding
 * await map.view.setView({
 *   bounds: { minX: 100, minY: 100, maxX: 7000, maxY: 7000 },
 *   padding: 40,
 *   animate: { durationMs: 600 },
 * });
 *
 * // Fit a set of points
 * await map.view.setView({
 *   points: [{ x: 500, y: 500 }, { x: 6000, y: 6000 }],
 *   padding: { top: 20, right: 20, bottom: 20, left: 200 },
 * });
 *
 * // Offset the current view
 * await map.view.setView({ offset: { dx: 100, dy: -50 } });
 * ```
 */
export interface SetViewOptions {
	/**
	 * Target center position in world pixels.
	 *
	 * When combined with `bounds` or `points`, this value takes precedence
	 * for the center while the fitted zoom is kept.
	 */
	center?: Point;

	/**
	 * Target zoom level (fractional values allowed).
	 *
	 * When combined with `bounds` or `points`, this value takes precedence
	 * for the zoom while the fitted center is kept.
	 */
	zoom?: number;

	/**
	 * Pixel offset added to the resolved center.
	 *
	 * Applied after `center`, `bounds`, or `points` resolution, making it
	 * useful for nudging the view relative to its computed position.
	 */
	offset?: { dx: number; dy: number };

	/**
	 * Bounding box in world pixels to fit the viewport to.
	 *
	 * The view is centered and zoomed so the entire box is visible.
	 * Mutually exclusive intent with `points` (if both are set, `bounds` wins).
	 */
	bounds?: { minX: number; minY: number; maxX: number; maxY: number };

	/**
	 * Array of world-pixel points to fit the viewport around.
	 *
	 * Internally converted to a bounding box and then fitted.
	 * Ignored when `bounds` is also provided.
	 */
	points?: Point[];

	/**
	 * Padding applied when fitting `bounds` or `points`.
	 *
	 * Has no effect when neither `bounds` nor `points` is specified.
	 * Accepts a uniform number or a per-side object.
	 *
	 * @see {@link PaddingInput}
	 */
	padding?: PaddingInput;

	/**
	 * Animation parameters. When omitted the view change is applied instantly.
	 *
	 * @see {@link AnimateOptions}
	 */
	animate?: AnimateOptions;
}

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
